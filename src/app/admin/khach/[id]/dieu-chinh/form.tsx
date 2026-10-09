"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Loader2 } from "lucide-react";
import { Alert, Button, Card, CardHeader, Field, Input, Select, Textarea } from "@/components/ui";
import { fmtNgay } from "@/lib/time";
import type { KetQuaAction } from "@/server/action";

type C = { id: number; ma: string; ten: string; conLai: number | null; het: string | null; trangThai: string; huy: boolean; baoLuu: boolean };
const LOAI = [
  { k: "CONG_LUOT", t: "Cộng lượt" },
  { k: "TRU_LUOT", t: "Trừ lượt" },
  { k: "CHUYEN_LUOT", t: "Chuyển lượt" },
  { k: "GIA_HAN_NGAY", t: "Gia hạn ngày" },
  { k: "MO_KHOA", t: "Mở khoá" },
  { k: "HUY_THE", t: "Huỷ thẻ" },
];

export function DieuChinhForm({ action, khachId, cards, chon }: { action: (s: KetQuaAction, fd: FormData) => Promise<KetQuaAction>; khachId: number; cards: C[]; chon?: number }) {
  const [st, act, pending] = useActionState(action, { ok: true });
  const [theId, setTheId] = useState(chon);
  const [loai, setLoai] = useState("CONG_LUOT");
  const [n, setN] = useState("1");
  const t = cards.find((c) => c.id === theId);
  const sl = Number(n) || 0;
  const sau =
    !t || t.conLai == null
      ? null
      : loai === "CONG_LUOT"
        ? t.conLai + sl
        : loai === "TRU_LUOT" || loai === "CHUYEN_LUOT"
          ? t.conLai - sl
          : t.conLai;
  if (!cards.length) return <Alert tone="warn">Khách chưa có thẻ vé.</Alert>;
  return (
    <form action={act} className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <input type="hidden" name="theVeId" value={theId} />
      <input type="hidden" name="loai" value={loai} />
      <div className="grid gap-4">
        {!st.ok && st.loi && <Alert tone="bad">{st.loi}</Alert>}
        <Card>
          <CardHeader title="Thẻ cần điều chỉnh" />
          <div className="grid gap-2 p-4 md:grid-cols-2">
            {cards.map((c) => (
              <button type="button" key={c.id} onClick={() => setTheId(c.id)} className={clsx("rounded-xl p-3 text-left ring-2", c.id === theId ? "bg-brand-soft ring-brand" : "ring-line")}>
                <div className="font-bold">
                  {c.ma} · {c.ten}
                </div>
                <div className="text-sm text-ink-2">
                  Còn {c.conLai ?? "∞"} lượt · {c.het ? `hạn ${fmtNgay(c.het)}` : "không hạn"} · {c.trangThai}
                </div>
              </button>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="Loại điều chỉnh" />
          <div className="grid grid-cols-2 gap-2 p-4 md:grid-cols-3">
            {LOAI.map((l) => (
              <button type="button" key={l.k} onClick={() => setLoai(l.k)} className={clsx("h-12 rounded-xl font-semibold ring-2", l.k === loai ? "bg-brand text-white ring-brand" : "ring-line")}>
                {l.t}
              </button>
            ))}
          </div>
          <div className="grid gap-3 px-4 pb-4 md:grid-cols-2">
            {["CONG_LUOT", "TRU_LUOT", "CHUYEN_LUOT", "GIA_HAN_NGAY"].includes(loai) && (
              <Field label={loai === "GIA_HAN_NGAY" ? "Số ngày gia hạn" : "Số lượt"} required>
                <Input name="soLuong" type="number" min={1} value={n} onChange={(e) => setN(e.target.value)} required />
              </Field>
            )}
            {loai === "CHUYEN_LUOT" && (
              <Field label="Chuyển sang thẻ" required>
                <Select name="theDichId" required>
                  <option value="">Chọn thẻ nhận</option>
                  {cards
                    .filter((c) => c.id !== theId && c.conLai != null)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.ma} · {c.ten} (còn {c.conLai})
                      </option>
                    ))}
                </Select>
              </Field>
            )}
            {loai === "MO_KHOA" && <p className="text-sm text-ink-2 md:col-span-2">Mở khoá: khôi phục thẻ đã huỷ, hoặc kết thúc bảo lưu sớm (trả lại số ngày bảo lưu chưa dùng).</p>}
            {loai === "HUY_THE" && <p className="text-sm text-bad md:col-span-2">Huỷ thẻ: thẻ không check-in được nữa. Hoàn tiền (nếu có) ghi ở tab Thanh toán.</p>}
            <Field label="Lý do" required className="md:col-span-2">
              <Textarea name="lyDo" required minLength={3} placeholder="VD: Bù lượt do hồ bảo trì ngày 05/10" />
            </Field>
          </div>
        </Card>
      </div>
      <Card className="h-fit">
        <CardHeader title="Xem trước" />
        <div className="grid gap-2 p-4 text-sm">
          <div className="flex justify-between">
            <span>Lượt hiện tại</span>
            <b>{t?.conLai ?? "∞"}</b>
          </div>
          <div className="flex justify-between">
            <span>Lượt sau điều chỉnh</span>
            <b className="text-brand">{sau ?? "∞"}</b>
          </div>
          <Button size="lg" className="mt-3" disabled={pending || !theId}>
            {pending && <Loader2 className="size-5 animate-spin" />} Xác nhận điều chỉnh
          </Button>
          <Link href={`/admin/khach/${khachId}?tab=the`} className="text-center font-semibold text-ink-2">
            Huỷ
          </Link>
        </div>
      </Card>
    </form>
  );
}
