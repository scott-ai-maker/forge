export default function DashboardLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading Member Dashboard"
      className="forge-obsidian-canvas min-h-screen-dvh pb-24"
    >
      {/* SiteHeader dimension match */}
      <div className="h-[64px] w-full border-b border-white/[0.06] bg-[#090A0D]/90" />

      <div className="mx-auto flex max-w-[1440px] flex-col gap-3.5 px-3 pt-3.5 pb-24 sm:px-5 sm:pt-5">
        {/* Tier 1: Today's Workout Hero Card Skeleton (zero layout shift) */}
        <div className="rounded-2xl border border-white/[0.07] bg-[#111318] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <div className="forge-shimmer h-5 w-32 rounded-full" />
            <div className="flex items-center gap-2">
              <div className="forge-shimmer h-8 w-24 rounded-full" />
              <div className="forge-shimmer h-8 w-24 rounded-full" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-3">
            <div className="forge-shimmer h-7 w-3/5 rounded-lg" />
            <div className="forge-shimmer h-5 w-20 rounded-md" />
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="forge-shimmer h-4 w-44 rounded-md" />
            <div className="forge-shimmer h-4 w-28 rounded-md" />
          </div>
          <div className="forge-shimmer mt-3.5 h-11 w-full rounded-xl" />
        </div>

        {/* Joint Comfort Score Strip Skeleton */}
        <div className="flex h-[52px] items-center justify-between rounded-2xl border border-white/[0.07] bg-[#111318] px-4">
          <div className="flex items-center gap-2.5">
            <div className="forge-shimmer h-5 w-36 rounded-md" />
            <div className="forge-shimmer h-5 w-14 rounded-full" />
          </div>
          <div className="forge-shimmer h-4 w-16 rounded-md" />
        </div>

        {/* Tier 2: Posture Comparison Preview Skeleton */}
        <div className="rounded-2xl border border-white/[0.07] bg-[#111318] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="forge-shimmer h-3.5 w-36 rounded" />
              <div className="forge-shimmer h-5 w-52 rounded-md" />
            </div>
            <div className="forge-shimmer h-7 w-24 rounded-full" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[190px_1fr]">
            <div className="forge-shimmer h-32 w-full rounded-xl" />
            <div className="flex flex-col justify-between gap-2">
              <div className="grid grid-cols-3 gap-2">
                <div className="forge-shimmer h-14 rounded-xl" />
                <div className="forge-shimmer h-14 rounded-xl" />
                <div className="forge-shimmer h-14 rounded-xl" />
              </div>
              <div className="flex gap-2">
                <div className="forge-shimmer h-11 w-40 rounded-xl" />
                <div className="forge-shimmer h-11 w-36 rounded-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Tier 3: 5-Phase OPT Roadmap Nodes Skeleton */}
        <div className="rounded-2xl border border-white/[0.07] bg-[#111318] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="forge-shimmer h-4 w-56 rounded" />
            <div className="forge-shimmer h-6 w-28 rounded-full" />
          </div>
          <div className="flex gap-2.5 overflow-hidden">
            {[1, 2, 3, 4, 5].map(node => (
              <div key={node} className="forge-shimmer h-[76px] min-w-[132px] flex-1 rounded-xl" />
            ))}
          </div>
          <div className="forge-shimmer mt-3 h-16 w-full rounded-xl" />
        </div>

        {/* Tier 4: Quick Tools 2x2 Grid Skeleton */}
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(tile => (
            <div
              key={tile}
              className="forge-shimmer h-[88px] rounded-2xl"
            />
          ))}
        </div>
      </div>
    </main>
  )
}
