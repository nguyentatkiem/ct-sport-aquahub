import { ShieldX } from "lucide-react";
import { LinkButton } from "./ui";

export function KhongCoQuyen({ thongDiep }: { thongDiep?: string }) {
  return (
    <div className="mx-auto mt-16 max-w-md text-center">
      <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-bad-soft text-bad">
        <ShieldX className="size-8" />
      </div>
      <h1 className="text-xl font-extrabold">Không có quyền truy cập</h1>
      <p className="mt-2 text-ink-2">{thongDiep ?? "Bạn không có quyền xem nội dung này."}</p>
      <LinkButton href="/admin" variant="secondary" className="mt-5">
        Về trang tổng quan
      </LinkButton>
    </div>
  );
}
