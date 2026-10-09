"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Loader2, Ticket } from "lucide-react";
import { Alert, Button, Card, CardHeader, Field, Input, Select } from "@/components/ui";
import { fmtTien } from "@/lib/text";
import { fmtNgay } from "@/lib/time";
import type { KetQuaAction } from "@/server/action";

type Sp = { id: number; ten: string; gia: number; luat: string; hetHanDuKien: string | null; hanTuLanDau: number | null; soLuot: number | null; chuyenDoi: boolean };

export function BanTheForm({ action, khachId, sanPham }: { action: (s: KetQuaAction, fd: FormData) => Promise<KetQuaAction>; khachId: number; sanPham: Sp[] }) {
  const [st, act, pending] = useActionState(action, { ok: true });
  const [spId, setSpId] = useState(sanPham.find((s) => !s.chuyenDoi)?.id ?? sanPham[0]?.id);
  const sp = sanPham.find((s) => s.id === spId);
  const [gia, setGia] = useState<string>(String(sp?.gia ?? 0));
  const [thu, setThu] = useState<string>(String(sp?.gia ?? 0));
  const giaSo = Number(gia.replace(/\D/g, "")) || 0;
  const thuSo = Number(thu.replace(/\D/g, "")) || 0;
  const giam = sp ? sp.gia - giaSo : 0;
  const chon = (s: Sp) => {
    setSpId(s.id);
    setGia(String(s.gia));
    setThu(String(s.gia));
  };
  if (!sanPham.length) return <Alert tone="warn">Cơ sở này chưa có sản phẩm thẻ vé đang bán. Vào Sản phẩm để tạo.</Alert>;
  return (
    <form action={act} className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <input type="hidden" name="sanPhamId" value={spId} />
      <div className="grid gap-4">
        {!st.ok && st.loi && <Alert tone="bad">{st.loi}</Alert>}
        <Card>
          <CardHeader title="1. Chọn loại thẻ vé" sub="Luật được chụp vào thẻ tại lúc bán (BR-22)" />
          <div className="grid gap-2 p-4 md:grid-cols-2">
            {sanPham.map((s) => (
              <button
                type="button"
                key={s.id}
                onClick={() => chon(s)}
                className={clsx("rounded-2xl p-4 text-left ring-2 transition", s.id === spId ? "bg-brand-soft ring-brand" : "bg-white ring-line hover:ring-brand/40")}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 font-bold">
                    <Ticket className="size-4 text-brand" />
                    {s.ten}
                  </span>
                  <span className="font-extrabold text-brand">{s.chuyenDoi ? "0đ" : fmtTien(s.gia)}</span>
                </div>
                <p className="mt-1 text-xs text-ink-2">{s.luat}</p>
              </button>
            ))}
          </div>
        </Card>
        {sp?.chuyenDoi ? (
          <Card>
            <CardHeader title="2. Thông tin thẻ giấy cũ" sub="Mục 11.2: không tính doanh số, không tính vào số mã thẻ xuất" />
            <div className="grid gap-3 p-4 md:grid-cols-3">
              <Field label="Số lượt còn lại trên thẻ giấy" required>
                <Input name="soLuotChuyenDoi" type="number" min={0} required />
              </Field>
              <Field label="Hạn ghi trên thẻ giấy" hint="Để trống nếu không có hạn">
                <Input name="ngayHetHanChuyenDoi" type="date" />
              </Field>
              <Field label="Ghi chú / ảnh thẻ giấy" hint="Mô tả hoặc đường dẫn ảnh đã chụp">
                <Input name="anhTheGiay" />
              </Field>
            </div>
            <input type="hidden" name="giaThucThu" value="0" />
          </Card>
        ) : (
          <Card>
            <CardHeader title="2. Giá và thu tiền" />
            <div className="grid gap-3 p-4 md:grid-cols-2">
              <Field label="Giá niêm yết">
                <Input value={fmtTien(sp?.gia)} disabled />
              </Field>
              <Field label="Giá thực thu" required hint={giam > 0 ? `Giảm ${fmtTien(giam)}` : undefined}>
                <Input name="giaThucThu" inputMode="numeric" value={gia} onChange={(e) => setGia(e.target.value)} required />
              </Field>
              {giam > 0 && (
                <Field label="Lý do giảm" required className="md:col-span-2" hint="BR-17: thấp hơn niêm yết phải ghi lý do">
                  <Input name="lyDoGiam" list="ly-do-giam" required placeholder="VD: Gia đình từ 3 người" />
                  <datalist id="ly-do-giam">
                    <option value="Gia đình từ 3 người" />
                    <option value="Lớp công ty" />
                    <option value="Khách quen" />
                    <option value="Khuyến mãi" />
                  </datalist>
                </Field>
              )}
              <Field label="Thu lần này" hint={thuSo === 0 ? "Chưa thu" : thuSo < giaSo ? "Ít hơn giá: ghi là CỌC" : "Thu đủ"}>
                <Input name="thu" inputMode="numeric" value={thu} onChange={(e) => setThu(e.target.value)} />
              </Field>
              <Field label="Hình thức">
                <Select name="hinhThuc">
                  <option value="TIEN_MAT">Tiền mặt</option>
                  <option value="CHUYEN_KHOAN">Chuyển khoản</option>
                </Select>
              </Field>
              <Field label="Ghi chú phiếu thu" className="md:col-span-2">
                <Input name="ghiChuThu" />
              </Field>
            </div>
          </Card>
        )}
      </div>
      <Card className="h-fit">
        <CardHeader title="3. Tóm tắt" />
        <div className="grid gap-2 p-4 text-sm">
          <Row k="Thẻ" v={sp?.ten} />
          <Row k="Số lượt" v={sp?.chuyenDoi ? "Theo thẻ giấy" : sp?.soLuot == null ? "Không giới hạn" : `${sp.soLuot} lượt`} />
          <Row k="Hết hạn dự kiến" v={sp?.chuyenDoi ? "Theo thẻ giấy" : sp?.hetHanDuKien ? fmtNgay(sp.hetHanDuKien) : sp?.hanTuLanDau ? `${sp.hanTuLanDau} ngày từ lần đầu vào` : "Không hạn"} />
          {!sp?.chuyenDoi && (
            <>
              <Row k="Giá thực thu" v={fmtTien(giaSo)} b />
              <Row k="Thu lần này" v={fmtTien(Math.min(thuSo, giaSo))} />
              <Row k="Còn nợ" v={fmtTien(Math.max(giaSo - thuSo, 0))} b />
            </>
          )}
          <Button size="lg" className="mt-3" disabled={pending || !spId}>
            {pending && <Loader2 className="size-5 animate-spin" />} Tạo thẻ và lưu đơn
          </Button>
          <Link href={`/admin/khach/${khachId}`} className="text-center text-sm font-semibold text-ink-2">
            Huỷ
          </Link>
        </div>
      </Card>
    </form>
  );
}

function Row({ k, v, b }: { k: string; v: React.ReactNode; b?: boolean }) {
  return (
    <div className="flex justify-between gap-2 border-b border-line/60 py-1.5">
      <span className="text-ink-2">{k}</span>
      <span className={b ? "font-extrabold" : "font-semibold"}>{v}</span>
    </div>
  );
}
