/** Skeleton in the shape of the booking page: photos, business header, service list, summary. */
export default function BusinessPageLoading() {
  const block = "animate-pulse rounded-lg bg-surface-muted";
  return (
    <div className="min-h-dvh bg-canvas" aria-busy="true" aria-label="Sayfa yükleniyor">
      <div className="h-14 border-b border-line bg-surface" />

      <div className="mx-auto max-w-6xl sm:px-6 sm:pt-6">
        <div className="aspect-[4/3] animate-pulse bg-surface-muted sm:aspect-auto sm:h-[360px] sm:rounded-xl" />
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        <div className="flex items-start gap-4">
          <div className={`h-14 w-14 shrink-0 ${block}`} />
          <div className="flex-1 space-y-2">
            <div className={`h-7 w-64 max-w-full ${block}`} />
            <div className={`h-4 w-40 ${block}`} />
          </div>
        </div>
        <div className={`mt-4 h-4 w-80 max-w-full ${block}`} />
      </div>

      <div className="mx-auto mt-10 grid max-w-6xl grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-2">
          <div className={`mb-4 h-6 w-32 ${block}`} />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`h-20 ${block}`} />
          ))}
        </div>
        <div className={`hidden h-64 lg:block ${block}`} />
      </div>
    </div>
  );
}
