#!/usr/bin/env node
/**
 * CLI: run Gemini analysis on one or more metadata export JSON files.
 *
 * Usage:
 *   node run.js <path>           — analyze one file (e.g. backChop.json or session_*.json)
 *   node run.js <dir>            — analyze all .json files in directory (skips .gemini.json)
 *   node run.js --watch [dir]    — watch dir (default: comp_mode/metadata_exports) and run on new/modified .json
 *
 * Env: GEMINI_API_KEY or GOOGLE_API_KEY required.
 * Output: prints JSON to stdout; with --out-dir writes <basename>.gemini.json alongside each file.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, watch, statSync, mkdirSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { analyzeSessionWithGemini } from './client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = join(process.cwd(), '.env');
  if (!existsSync(envPath)) return;
  const raw = readFileSync(envPath, 'utf8');
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
}
loadEnv();

function getApiKey() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
}

function usage() {
  console.error('Usage: node run.js <file|dir> [--out-dir <dir>]');
  console.error('       node run.js --watch [dir] [--out-dir <dir>]');
  console.error('Env:   GEMINI_API_KEY or GOOGLE_API_KEY');
  process.exit(1);
}

async function processFile(filePath, writeOutputPath = null) {
  const absPath = join(process.cwd(), filePath);
  if (!existsSync(absPath)) {
    console.error('File not found:', absPath);
    return null;
  }
  const raw = readFileSync(absPath, 'utf8');
  let session;
  try {
    session = JSON.parse(raw);
  } catch (e) {
    console.error('Invalid JSON:', absPath, e.message);
    return null;
  }
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error('Set GEMINI_API_KEY or GOOGLE_API_KEY in .env or environment');
    process.exit(1);
  }
  const result = await analyzeSessionWithGemini(apiKey, session);
  const output = {
    sourceFile: basename(filePath),
    sessionId: session.sessionId,
    analyzedAt: new Date().toISOString(),
    ...result,
  };
  const outPath = writeOutputPath ?? defaultOutPath(basename(filePath).replace(/\.json$/i, ''));
  const outDirPath = dirname(outPath);
  if (!existsSync(outDirPath)) mkdirSync(outDirPath, { recursive: true });
  writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8');
  console.error('Wrote', outPath);
  if (!writeOutputPath) console.log(JSON.stringify(output, null, 2));
  return output;
}

function getJsonFiles(dirPath) {
  const abs = join(process.cwd(), dirPath);
  if (!existsSync(abs)) return [];
  return readdirSync(abs)
    .filter((f) => f.endsWith('.json') && !f.endsWith('.gemini.json'))
    .map((f) => join(dirPath, f));
}

function parseArgs() {
  const args = process.argv.slice(2);
  let target = null;
  let watchMode = false;
  let outDir = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--watch') watchMode = true;
    else if (args[i] === '--out-dir') outDir = args[++i];
    else if (!target) target = args[i];
  }
  return { target, watchMode, outDir };
}

const defaultExportsDir = join(__dirname, '..', 'metadata_exports');
/** Gemini results go here (not in metadata_exports). */
const DEFAULT_GEMINI_OUT_DIR = join(process.cwd(), 'comp_mode', 'gemini_outputs');

function ensureGeminiOutDir() {
  if (!existsSync(DEFAULT_GEMINI_OUT_DIR)) mkdirSync(DEFAULT_GEMINI_OUT_DIR, { recursive: true });
}

function defaultOutPath(basenameNoExt) {
  ensureGeminiOutDir();
  return join(DEFAULT_GEMINI_OUT_DIR, basenameNoExt + '.gemini.json');
}

async function main() {
  const { target, watchMode, outDir } = parseArgs();

  if (watchMode) {
    const dir = target || defaultExportsDir;
    const resolvedDir = join(process.cwd(), dir);
    if (!existsSync(resolvedDir)) {
      console.error('Directory not found:', resolvedDir);
      process.exit(1);
    }
    console.error('Watching', resolvedDir, 'for new/modified .json files…');
    const resolvedOutDir = outDir ? join(process.cwd(), outDir) : DEFAULT_GEMINI_OUT_DIR;
    const runOne = async (filePath) => {
      const rel = join(dir, basename(filePath));
      const outPath = join(resolvedOutDir, basename(filePath).replace(/\.json$/i, '.gemini.json'));
      try {
        await processFile(rel, outPath);
      } catch (e) {
        console.error('Error processing', rel, e.message);
      }
    };
    watch(resolvedDir, { persistent: true }, (event, filename) => {
      if (filename && filename.endsWith('.json') && !filename.endsWith('.gemini.json')) {
        console.error('Detected', event, filename);
        runOne(join(resolvedDir, filename));
      }
    });
    ensureGeminiOutDir();
    const files = getJsonFiles(dir);
    for (const f of files) {
      const outPath = join(resolvedOutDir, basename(f).replace(/\.json$/i, '.gemini.json'));
      try {
        await processFile(f, outPath);
      } catch (e) {
        console.error('Error', f, e.message);
      }
    }
    return;
  }

  if (!target) usage();

  const absTarget = join(process.cwd(), target);
  const resolvedOutDir = outDir ? join(process.cwd(), outDir) : DEFAULT_GEMINI_OUT_DIR;
  const outPathForFile = target.endsWith('.json') ? join(resolvedOutDir, basename(target).replace(/\.json$/i, '.gemini.json')) : null;

  if (existsSync(absTarget)) {
    const st = statSync(absTarget);
    if (st.isFile()) {
      ensureGeminiOutDir();
      await processFile(target, outPathForFile);
      return;
    }
    if (st.isDirectory()) {
      const files = getJsonFiles(target);
      for (const f of files) {
        const out = join(resolvedOutDir, basename(f).replace(/\.json$/i, '.gemini.json'));
        try {
          await processFile(f, out);
        } catch (e) {
          console.error('Error', f, e.message);
        }
      }
      return;
    }
  }

  console.error('Not found:', target);
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
