import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CV Supreme | Ping Pong Analytics",
  description: "Computer-vision powered ping pong analytics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-50 text-zinc-800`}>
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-orange-200 bg-white/80 backdrop-blur-sm">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2 font-bold tracking-tight text-orange-600 transition-colors hover:text-orange-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png.png" alt="" className="h-8 w-8 object-contain" />
              CV Supreme
            </Link>
            <nav className="flex items-center gap-2">
              <Link
                href="/training"
                className="rounded-full border border-zinc-300 bg-zinc-100 px-5 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-orange-400 hover:bg-orange-100 hover:text-orange-700"
              >
                Training Mode
              </Link>
              <Link
                href="/competition"
                className="rounded-full border border-zinc-300 bg-zinc-100 px-5 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-orange-400 hover:bg-orange-100 hover:text-orange-700"
              >
                Competition Mode
              </Link>
              <Link
                href="/leaderboard"
                className="rounded-full border border-zinc-300 bg-zinc-100 px-5 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-orange-400 hover:bg-orange-100 hover:text-orange-700"
              >
                Past Rounds
              </Link>
            </nav>
          </div>
        </header>
        <main className="pt-14 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
