"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { duyetAction } from "../_actions/khach";

export function DuyetNhanh({ id }: { id: number }) {
  const [p, start] = useTransition();
  const router = useRouter();
  return (
    <div className="flex gap-1">
      <Button
        size="sm"
        variant="ok"
        disabled={p}
        onClick={() =>
          start(async () => {
            const r = await duyetAction(id);
            if (!r.ok) alert(r.loi);
            router.refresh();
          })
        }
      >
        Duyệt
      </Button>
      <Button size="sm" variant="secondary" onClick={() => router.push(`/admin/khach/${id}`)}>
        Xem
      </Button>
    </div>
  );
}
