"use client";
import { useTransition } from "react";
import { Building2 } from "lucide-react";
import { chonCoSoAction } from "./_actions/chung";

export function CoSoPicker({ ds, chon }: { ds: { id: number; ten: string }[]; chon: number | null }) {
  const [pending, start] = useTransition();
  return (
    <label className="flex items-center gap-2 rounded-xl bg-white px-2 ring-1 ring-line">
      <Building2 className="size-4 text-brand" />
      <select
        aria-label="Chọn cơ sở"
        disabled={pending}
        className="h-10 bg-transparent pr-2 text-sm font-semibold outline-none"
        value={chon ?? 0}
        onChange={(e) => start(() => chonCoSoAction(Number(e.target.value)))}
      >
        <option value={0}>Tất cả cơ sở</option>
        {ds.map((c) => (
          <option key={c.id} value={c.id}>
            {c.ten}
          </option>
        ))}
      </select>
    </label>
  );
}
