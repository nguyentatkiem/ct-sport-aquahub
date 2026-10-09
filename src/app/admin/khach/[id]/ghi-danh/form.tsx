"use client";
import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Loader2, GraduationCap, Ticket } from "lucide-react";
import { Alert, Button, Card, CardHeader, Field, Input, Select, Textarea } from "@/components/ui";
import { fmtTien } from "@/lib/text";
import type { KetQuaAction } from "@/server/action";

const so = (s: string) => Number(s.replace(/\D/g, "")) || 0;

export function GhiDanhForm({
  action,
  khachId,
  coTheVe,
  khoa,
  ve,
  lops,
  gvs,
}: {
  action: (s: KetQuaAction, fd: FormData) => Promise<KetQuaAction>;
  khachId: number;
  coTheVe: boolean;
  khoa: { id: number; ten: string; gia: number; luat: string; kemId: number | null }[];
  ve: { id: number; ten: string; gia: number }[];
  lops: { id: number; ten: string; spId: number; gvId: number | null; lich: string | null }[];
  gvs: { id: number; ten: string }[];
}) {
  const [st, act, pending] = useActionState(action, { ok: true });
  const [spId, setSpId] = useState(khoa[0]?.id);
  const sp = khoa.find((k) => k.id === spId);
  const lopCua = lops.filter((l) => l.spId === spId);
  const [lopId, setLopId] = useState<number | undefined>(lopCua[0]?.id);
  const lop = lops.find((l) => l.id === lopId);
  const [gvId, setGvId] = useState<string>(String(lop?.gvId ?? ""));
  const [gia, setGia] = useState(String(sp?.gia ?? 0));
  const [thu, setThu] = useState("0");
  const [kem, setKem] = useState<string>(!coTheVe && sp?.kemId ? String(sp.kemId) : "");
  const veKem = ve.find((v) => String(v.id) === kem);
  const [kemGia, setKemGia] = useState(String(veKem?.gia ?? 0));
  const [kemThu, setKemThu] = useState(String(veKem?.gia ?? 0));

  useEffect(() => {
    const l = lops.filter((x) => x.spId === spId)[0];
    setLopId(l?.id);
    setGvId(String(l?.gvId ?? ""));
    const s = khoa.find((k) => k.id === spId);
    setGia(String(s?.gia ?? 0));
    if (!coTheVe && s?.kemId) setKem(String(s.kemId));
  }, [spId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    setGvId(String(lop?.gvId ?? ""));
  }, [lopId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    setKemGia(String(veKem?.gia ?? 0));
    setKemThu(String(veKem?.gia ?? 0));
  }, [kem]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!khoa.length) return <Alert tone="warn">Cơ sở chưa có khoá học đang bán. Vào Sản phẩm để tạo khoá học.</Alert>;
  const giamKhoa = (sp?.gia ?? 0) - so(gia);
  const giamKem = (veKem?.gia ?? 0) - so(kemGia);
  const tong = so(gia) + (veKem ? so(kemGia) : 0);
  const tongThu = Math.min(so(thu), so(gia)) + (veKem ? Math.min(so(kemThu), so(kemGia)) : 0);
  return (
    <form action={act} className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <input type="hidden" name="sanPhamId" value={spId} />
      <div className="grid gap-4">
        {!st.ok && st.loi && <Alert tone="bad">{st.loi}</Alert>}
        <Alert>Khoá học đếm buổi khi khách quét QR lớp, không trừ lượt thẻ vé và không chặn vào cửa. Khách vẫn cần thẻ vé để vào hồ (D1).</Alert>
        <Card>
          <CardHeader title="1. Chọn khoá học" />
          <div className="grid gap-2 p-4 md:grid-cols-2">
            {khoa.map((k) => (
              <button type="button" key={k.id} onClick={() => setSpId(k.id)} className={clsx("rounded-2xl p-4 text-left ring-2", k.id === spId ? "bg-ok-soft ring-ok" : "ring-line")}>
                <div className="flex justify-between gap-2 font-bold">
                  <span className="flex items-center gap-2">
                    <GraduationCap className="size-4 text-ok" />
                    {k.ten}
                  </span>
                  <span>{fmtTien(k.gia)}</span>
                </div>
                <p className="mt-1 text-xs text-ink-2">{k.luat}</p>
              </button>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="2. Lớp, giáo viên, học phí" />
          <div className="grid gap-3 p-4 md:grid-cols-2">
            <Field label="Lớp" required hint={lop?.lich ?? undefined}>
              <Select name="lopHocId" value={lopId ?? ""} onChange={(e) => setLopId(Number(e.target.value))} required>
                {lopCua.length === 0 && <option value="">Chưa có lớp cho khoá này</option>}
                {lopCua.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.ten}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Giáo viên" hint="Tự điền theo lớp, sửa được">
              <Select name="giaoVienId" value={gvId} onChange={(e) => setGvId(e.target.value)}>
                <option value="">—</option>
                {gvs.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.ten}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Học phí thực thu" hint={`Niêm yết ${fmtTien(sp?.gia)}`}>
              <Input name="giaThucThu" inputMode="numeric" value={gia} onChange={(e) => setGia(e.target.value)} />
            </Field>
            {giamKhoa > 0 ? (
              <Field label="Lý do giảm" required>
                <Input name="lyDoGiam" required placeholder="VD: Lớp công ty" />
              </Field>
            ) : (
              <div />
            )}
            <Field label="Thu lần này" hint={so(thu) === 0 ? "Chưa thu" : so(thu) < so(gia) ? "Cọc" : "Thu đủ"}>
              <Input name="thu" inputMode="numeric" value={thu} onChange={(e) => setThu(e.target.value)} />
            </Field>
            <Field label="Hình thức">
              <Select name="hinhThuc">
                <option value="TIEN_MAT">Tiền mặt</option>
                <option value="CHUYEN_KHOAN">Chuyển khoản</option>
              </Select>
            </Field>
            <Field label="Ghi chú" className="md:col-span-2">
              <Textarea name="ghiChu" />
            </Field>
          </div>
        </Card>
        <Card className={kem ? "ring-2 ring-brand" : ""}>
          <CardHeader title="3. Bán kèm thẻ vé (tuỳ chọn)" sub={coTheVe ? "Khách đang có thẻ vé còn hiệu lực" : "Khách chưa có thẻ vé còn hiệu lực — nên bán kèm"} />
          <div className="grid gap-3 p-4 md:grid-cols-2">
            <Field label="Thẻ vé" className="md:col-span-2">
              <Select name="kemSanPhamId" value={kem} onChange={(e) => setKem(e.target.value)}>
                <option value="">Không bán kèm</option>
                {ve.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.ten} · {fmtTien(v.gia)}
                  </option>
                ))}
              </Select>
            </Field>
            {veKem && (
              <>
                <Field label="Giá thực thu thẻ">
                  <Input name="kemGiaThucThu" inputMode="numeric" value={kemGia} onChange={(e) => setKemGia(e.target.value)} />
                </Field>
                {giamKem > 0 ? (
                  <Field label="Lý do giảm thẻ" required>
                    <Input name="kemLyDoGiam" required />
                  </Field>
                ) : (
                  <div />
                )}
                <Field label="Thu thẻ lần này">
                  <Input name="kemthu" inputMode="numeric" value={kemThu} onChange={(e) => setKemThu(e.target.value)} />
                </Field>
                <Field label="Hình thức">
                  <Select name="kemhinhThuc">
                    <option value="TIEN_MAT">Tiền mặt</option>
                    <option value="CHUYEN_KHOAN">Chuyển khoản</option>
                  </Select>
                </Field>
              </>
            )}
          </div>
        </Card>
      </div>
      <Card className="h-fit">
        <CardHeader title="Tóm tắt" />
        <div className="grid gap-2 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-ink-2">Khoá học</span>
            <b>{sp?.ten}</b>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-2">Lớp</span>
            <b>{lop?.ten ?? "—"}</b>
          </div>
          {veKem && (
            <div className="flex justify-between">
              <span className="flex items-center gap-1 text-ink-2">
                <Ticket className="size-4" /> Thẻ kèm
              </span>
              <b>{veKem.ten}</b>
            </div>
          )}
          <div className="mt-2 flex justify-between border-t border-line pt-2">
            <span>Tổng thực thu</span>
            <b>{fmtTien(tong)}</b>
          </div>
          <div className="flex justify-between">
            <span>Thu lần này</span>
            <b>{fmtTien(tongThu)}</b>
          </div>
          <div className="flex justify-between text-bad">
            <span>Còn nợ</span>
            <b>{fmtTien(tong - tongThu)}</b>
          </div>
          <Button size="lg" variant="ok" className="mt-3" disabled={pending || !lopId}>
            {pending && <Loader2 className="size-5 animate-spin" />} Ghi danh {veKem ? "và bán thẻ" : ""}
          </Button>
          <Link href={`/admin/khach/${khachId}`} className="text-center text-sm font-semibold text-ink-2">
            Huỷ
          </Link>
        </div>
      </Card>
    </form>
  );
}
