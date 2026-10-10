import Link from "next/link";

export default function NotFound() {
  return (
    <main className="waves grid min-h-dvh place-items-center p-6 text-center">
      <div>
        <h1 className="text-2xl font-extrabold">Không tìm thấy trang</h1>
        <p className="mt-2 text-ink-2">Đường dẫn không đúng hoặc nội dung đã bị xoá.</p>
        <Link href="/admin" className="mt-4 inline-block font-semibold text-brand">
          Về trang chính →
        </Link>
      </div>
    </main>
  );
}
