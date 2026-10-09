"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Alert, Button, Card, CardHeader, Field, Input, Textarea } from "@/components/ui";
import { fmtNgay } from "@/lib/time";
import type { KetQuaAction } from "@/server/action";

const cong = (d: string, n: number) => {
  const x = new Date(d + "T00:00:00Z");
  x.setUTCDate(x.getUTCDate() + n);
  return x.toISOString().slice(0, 10);
};
const giua = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

export function BaoLuuForm({
  action,
  khachId,
  d,
  homNay,
}: {
  action: (s: KetQuaAction, fd: FormData) => Promise<KetQuaAction>;
  khachId: number;
  d: { loai: "the" | "gd"; id: number; choPhep: boolean; toiDa: number; daDung: number; het: string | null };
  homNay: string;
}) {
  const [st, act, pending] = useActionState(action, { ok: true });
  const [tu, setTu] = useState(homNay);
  const [den, setDen] = useState(cong(homNay, 6));
  const soNgay = tu && den && den >= tu ? giua(tu, den) + 1 : 0;
  const conDuoc = d.toiDa - d.daDung;
  if (!d.choPhep) return <Alert tone="warn">Sản phẩm này không cho phép bảo lưu (BR-26).</Alert>;
  return (
    <form action={act} className="grid max-w-2xl gap-4">
      <input type="hidden" name={d.loai === "gd" ? "ghiDanhId" : "theVeId"} value={d.id} />
      {!st.ok && st.loi && <Alert tone="bad">{st.loi}</Alert>}
      <Card>
        <CardHeader title="Thời gian bảo lưu" sub={`Tối đa ${d.toiDa} ngày${d.loai === "the" ? `, đã dùng ${d.daDung} ngày` : ""}. Trong thời gian bảo lưu không check-in được.`} />
        <div className="grid gap-3 p-4 md:grid-cols-2">
          <Field label="Từ ngày" required>
            <Input type="date" name="tu" min={homNay} value={tu} onChange={(e) => setTu(e.target.value)} required />
          </Field>
          <Field label="Đến ngày" required hint={`${soNgay} ngày`}>
            <Input type="date" name="den" min={tu} value={den} onChange={(e) => setDen(e.target.value)} required />
          </Field>
          <Field label="Lý do" required className="md:col-span-2">
            <Textarea name="lyDo" required placeholder="VD: Ốm, đi du lịch" />
          </Field>
          {d.loai === "the" && d.het && (
            <div className="rounded-xl bg-brand-soft p-3 text-sm md:col-span-2">
              Hạn hiện tại {fmtNgay(d.het)} → hạn mới <b>{fmtNgay(cong(d.het, soNgay))}</b>
            </div>
          )}
          {soNgay > conDuoc && <Alert tone="bad" className="md:col-span-2">Vượt số ngày bảo lưu còn được ({conDuoc} ngày).</Alert>}
        </div>
      </Card>
      <div className="flex gap-2">
        <Button disabled={pending || soNgay <= 0 || soNgay > conDuoc}>
          {pending && <Loader2 className="size-4 animate-spin" />} Xác nhận bảo lưu
        </Button>
        <Link href={`/admin/khach/${khachId}`} className="flex items-center px-3 font-semibold text-ink-2">
          Huỷ
        </Link>
      </div>
    </form>
  );
}
