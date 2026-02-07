export default function LeaderboardPage() {
  return (
    <div className="mosaic-bg min-h-screen px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-zinc-800">Leaderboard</h1>
        <p className="mt-2 text-zinc-600">
          Top players and match rankings.
        </p>

        {/* Leaderboard placeholder */}
        <div className="mt-10 rounded-xl border border-orange-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
              <svg
                className="h-8 w-8 text-orange-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-zinc-500">
              Leaderboard coming soon
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Rankings will appear here as matches are played
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
