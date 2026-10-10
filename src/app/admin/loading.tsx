/** Hiện ngay khi chuyển trang trong khu quản trị để thao tác có cảm giác tức thì. */
export default function Loading() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Đang tải">
      <div className="mb-2 h-8 w-64 rounded-lg bg-line/70" />
      <div className="mb-5 h-4 w-96 max-w-full rounded bg-line/50" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-24 rounded-[var(--radius)] bg-white ring-1 ring-line" />
        ))}
      </div>
      <div className="mt-4 h-80 rounded-[var(--radius)] bg-white ring-1 ring-line" />
    </div>
  );
}
