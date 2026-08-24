export default function AppLoading() {
  return (
    <div role="status" aria-label="Carregando página" className="animate-pulse space-y-5 motion-reduce:animate-none">
      <div className="space-y-2">
        <div className="h-3 w-24 bg-border2" />
        <div className="h-10 w-3/5 bg-surface2" />
        <div className="h-4 w-2/5 bg-surface2" />
      </div>

      <div className="border-y border-border py-5">
        <div className="mb-3 h-3 w-28 bg-border2" />
        <div className="h-14 w-2/3 bg-surface2" />
      </div>

      {[0, 1, 2].map((item) => (
        <div key={item} className="border-b border-border pb-5">
          <div className="mb-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-surface2" />
            <div className="space-y-2">
              <div className="h-3 w-28 bg-surface2" />
              <div className="h-2.5 w-20 bg-border" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full bg-surface2" />
            <div className="h-3 w-5/6 bg-surface2" />
            <div className="h-3 w-3/5 bg-surface2" />
          </div>
        </div>
      ))}
      <span className="sr-only">Carregando…</span>
    </div>
  );
}
