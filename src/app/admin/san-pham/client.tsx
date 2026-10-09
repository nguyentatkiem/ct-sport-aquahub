"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { doiTrangThaiSanPhamAction, nhanBanSanPhamAction } from "../_actions/quan-ly";

export function SpActions({ id, trangThai, chuyenDoi }: { id: number; trangThai: string; chuyenDoi: boolean }) {
  const [p, start] = useTransition();
  const router = useRouter();
  return (
    <div className="flex gap-1">
      {!chuyenDoi && (
        <Button size="sm" variant="ghost" disabled={p} onClick={() => start(async () => void (await nhanBanSanPhamAction(id)))}>
          Nhân bản
        </Button>
      )}
      <Button
        size="sm"
        variant="secondary"
        disabled={p}
        onClick={() =>
          start(async () => {
            const r = await doiTrangThaiSanPhamAction(id, trangThai === "DANG_BAN" ? "NGUNG_BAN" : "DANG_BAN");
            if (!r.ok) alert(r.loi);
            router.refresh();
          })
        }
      >
        {trangThai === "DANG_BAN" ? "Ngừng bán" : "Mở bán"}
      </Button>
    </div>
  );
}
