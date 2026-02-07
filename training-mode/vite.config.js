/** Vite config for Training Mode. Self-contained; no dependency on comp-mode. */
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  // Load .env from repo root so one API key works for comp_mode and training-mode
  envDir: '..',
});
