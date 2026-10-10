"use client";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button, LinkButton } from "@/components/ui";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="mx-auto mt-16 max-w-md text-center">
      <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-warn-soft text-warn">
        <AlertTriangle className="size-8" />
      </div>
      <h1 className="text-xl font-extrabold">Không tải được trang</h1>
      <p className="mt-2 text-ink-2">Có lỗi hệ thống hoặc mất kết nối. Thử lại; nếu vẫn lỗi, báo quản trị kèm mã: {error.digest ?? "—"}</p>
      <div className="mt-5 flex justify-center gap-2">
        <Button onClick={reset}>Thử lại</Button>
        <LinkButton href="/admin" variant="secondary">
          Về tổng quan
        </LinkButton>
      </div>
    </div>
  );
}
