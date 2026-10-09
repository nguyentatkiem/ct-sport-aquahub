"use client";
import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ScanLine, Loader2, MoreHorizontal } from "lucide-react";
import { Alert, Button, Card, CardHeader, Field, Input, Select, Textarea } from "@/components/ui";
import { KetQuaBanner, KetQuaChiTiet, useServerClock } from "@/components/checkin-result";
import { DICT } from "@/lib/i18n";
import { fmtTien } from "@/lib/text";
import type { KetQuaView } from "@/server/checkin";
import type { KetQuaAction } from "@/server/action";
import { checkInHoAction } from "../../_actions/checkin";
import {
  duyetAction,
  tuChoiAction,
  xoaKhachAction,
  khoiPhucAction,
  capLaiQrAction,
  gopAction,
  thuTienAction,
  huyPhieuAction,
  suaGiaAction,
  totNghiepAction,
} from "../../_actions/khach";

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onClick={onClose}>
      <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-3 text-lg font-bold">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function useAct() {
  const [pending, start] = useTransition();
  const [loi, setLoi] = useState<string | null>(null);
  const router = useRouter();
  const run = (fn: () => Promise<KetQuaAction<unknown>>, done?: () => void) =>
    start(async () => {
      setLoi(null);
      const r = await fn();
      if (!r.ok) setLoi(r.loi ?? "Lỗi");
      else {
        done?.();
        router.refresh();
      }
    });
  return { pending, loi, run };
}

function KetQuaModalBody({ r }: { r: KetQuaView }) {
  const now = useServerClock(r.thoiGian);
  return (
    <div className="grid gap-2">
      <KetQuaBanner r={r} t={DICT.vi} now={now} />
      <KetQuaChiTiet r={r} t={DICT.vi} lang="vi" />
    </div>
  );
}

export function CheckInHoNut({ khachId, lops }: { khachId: number; lops: { id: number; ten: string }[] }) {
  const [mo, setMo] = useState(false);
  const [lop, setLop] = useState("");
  const [kq, setKq] = useState<KetQuaView | null>(null);
  const { pending, loi, run } = useAct();
  return (
    <>
      <Button variant="secondary" onClick={() => setMo(true)}>
        <ScanLine className="size-4" /> Check-in hộ
      </Button>
      {mo && (
        <Modal
          title="Check-in hộ"
          onClose={() => {
            setMo(false);
            setKq(null);
          }}
        >
          {kq ? (
            <KetQuaModalBody r={kq} />
          ) : (
            <div className="grid gap-3">
              <Select value={lop} onChange={(e) => setLop(e.target.value)}>
                <option value="">Không theo lớp (check-in quầy)</option>
                {lops.map((l) => (
                  <option key={l.id} value={l.id}>
                    Lớp: {l.ten}
                  </option>
                ))}
              </Select>
              {loi && <Alert tone="bad">{loi}</Alert>}
              <Button
                disabled={pending}
                onClick={() =>
                  run(async () => {
                    const r = await checkInHoAction(khachId, lop ? Number(lop) : null);
                    if (r.ok) setKq(r.data!);
                    return r;
                  })
                }
              >
                {pending && <Loader2 className="size-4 animate-spin" />} Xác nhận check-in
              </Button>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}

export function DuyetTuChoi({ id }: { id: number }) {
  const [mo, setMo] = useState(false);
  const [lyDo, setLyDo] = useState("");
  const { pending, loi, run } = useAct();
  return (
    <>
      <Button variant="ok" disabled={pending} onClick={() => run(() => duyetAction(id))}>
        Duyệt hồ sơ
      </Button>
      <Button variant="secondary" onClick={() => setMo(true)}>
        Từ chối
      </Button>
      {loi && <Alert tone="bad">{loi}</Alert>}
      {mo && (
        <Modal title="Từ chối hồ sơ tự đăng ký" onClose={() => setMo(false)}>
          <Textarea value={lyDo} onChange={(e) => setLyDo(e.target.value)} placeholder="Lý do (VD: hồ sơ trùng, đăng ký nhầm)" />
          <div className="mt-3 flex justify-end">
            <Button variant="danger" disabled={pending || !lyDo.trim()} onClick={() => run(() => tuChoiAction(id, lyDo), () => setMo(false))}>
              Từ chối
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}

export function QuanLyHoSo({ id, trangThai, xoa, gop }: { id: number; trangThai: string; xoa: boolean; gop: boolean }) {
  const [mo, setMo] = useState<null | "menu" | "qr" | "xoa" | "gop">(null);
  const [txt, setTxt] = useState("");
  const { pending, loi, run } = useAct();
  const dong = () => {
    setMo(null);
    setTxt("");
  };
  return (
    <>
      <Button variant="ghost" onClick={() => setMo("menu")} aria-label="Thao tác khác">
        <MoreHorizontal className="size-5" />
      </Button>
      {mo === "menu" && (
        <Modal title="Thao tác hồ sơ" onClose={dong}>
          <div className="grid gap-2">
            <Button variant="secondary" onClick={() => setMo("qr")}>
              Cấp lại QR cá nhân (mất thẻ)
            </Button>
            {gop && (
              <Button variant="secondary" onClick={() => setMo("gop")}>
                Gộp hồ sơ trùng vào hồ sơ này
              </Button>
            )}
            {xoa && trangThai !== "NGUNG" && (
              <Button variant="danger" onClick={() => setMo("xoa")}>
                Xoá hồ sơ (chuyển Ngừng)
              </Button>
            )}
            {xoa && trangThai === "NGUNG" && (
              <Button variant="ok" disabled={pending} onClick={() => run(() => khoiPhucAction(id), dong)}>
                Khôi phục hồ sơ
              </Button>
            )}
          </div>
        </Modal>
      )}
      {mo === "qr" && (
        <Modal title="Cấp lại QR cá nhân" onClose={dong}>
          <p className="mb-2 text-sm text-ink-2">QR cũ hết tác dụng ngay lập tức. Nhớ in lại thẻ cho khách.</p>
          <Input value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="Lý do (VD: mất thẻ)" />
          {loi && <Alert tone="bad" className="mt-2">{loi}</Alert>}
          <div className="mt-3 flex justify-end">
            <Button disabled={pending} onClick={() => run(() => capLaiQrAction(id, txt || "Mất thẻ"), dong)}>
              Cấp lại
            </Button>
          </div>
        </Modal>
      )}
      {mo === "xoa" && (
        <Modal title="Xoá hồ sơ" onClose={dong}>
          <p className="mb-2 text-sm text-ink-2">Không xoá cứng (BR-29): hồ sơ chuyển trạng thái Ngừng, ẩn khỏi danh sách, giữ toàn bộ lịch sử.</p>
          <Input value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="Lý do xoá" />
          {loi && <Alert tone="bad" className="mt-2">{loi}</Alert>}
          <div className="mt-3 flex justify-end">
            <Button variant="danger" disabled={pending || !txt.trim()} onClick={() => run(() => xoaKhachAction(id, txt), dong)}>
              Xoá hồ sơ
            </Button>
          </div>
        </Modal>
      )}
      {mo === "gop" && (
        <Modal title="Gộp hồ sơ trùng" onClose={dong}>
          <p className="mb-2 text-sm text-ink-2">Toàn bộ thẻ, lượt, đơn, phiếu thu của hồ sơ kia chuyển về hồ sơ này. Hồ sơ kia chuyển Ngừng.</p>
          <Input value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="Mã khách cần gộp, VD LT00125" />
          {loi && <Alert tone="bad" className="mt-2">{loi}</Alert>}
          <div className="mt-3 flex justify-end">
            <Button disabled={pending || !txt.trim()} onClick={() => run(() => gopAction(id, txt), dong)}>
              Gộp vào hồ sơ này
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}

export function ThuTienForm({
  khachId,
  dons,
  hoan,
  chonDon,
}: {
  khachId: number;
  dons: { id: number; ma: string; ten: string; conNo: number; daThu: number }[];
  hoan: boolean;
  chonDon: number | null;
}) {
  const macDinh = chonDon ?? dons.find((d) => d.conNo > 0)?.id ?? dons[0]?.id;
  const [donId, setDonId] = useState(String(macDinh ?? ""));
  const [loai, setLoai] = useState("THANH_TOAN");
  const don = dons.find((d) => String(d.id) === donId);
  const [st, act, pending] = useActionState(thuTienAction.bind(null, khachId), { ok: true } as KetQuaAction);
  return (
    <Card>
      <CardHeader title="Ghi nhận thu tiền / cọc / hoàn tiền" />
      <form action={act} className="grid gap-3 p-4 md:grid-cols-5" key={st.at}>
        {!st.ok && st.loi && <Alert tone="bad" className="md:col-span-5">{st.loi}</Alert>}
        {st.ok && st.data ? <Alert tone="ok" className="md:col-span-5">Đã tạo phiếu {String(st.data)}.</Alert> : null}
        <Field label="Đơn hàng" className="md:col-span-2">
          <Select name="donHangId" value={donId} onChange={(e) => setDonId(e.target.value)}>
            {dons.map((d) => (
              <option key={d.id} value={d.id}>
                {d.ma} · {d.ten} · nợ {fmtTien(d.conNo)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Loại">
          <Select name="loai" value={loai} onChange={(e) => setLoai(e.target.value)}>
            <option value="THANH_TOAN">Thanh toán</option>
            <option value="COC">Cọc</option>
            {hoan && <option value="HOAN_TIEN">Hoàn tiền</option>}
          </Select>
        </Field>
        <Field label="Số tiền" hint={don ? (loai === "HOAN_TIEN" ? `Tối đa ${fmtTien(don.daThu)}` : `Còn nợ ${fmtTien(don.conNo)}`) : undefined}>
          <Input name="soTien" inputMode="numeric" defaultValue={loai === "HOAN_TIEN" ? "" : don?.conNo || ""} required />
        </Field>
        <Field label="Hình thức">
          <Select name="hinhThuc">
            <option value="TIEN_MAT">Tiền mặt</option>
            <option value="CHUYEN_KHOAN">Chuyển khoản</option>
          </Select>
        </Field>
        <Field label={loai === "HOAN_TIEN" ? "Lý do hoàn tiền" : "Ghi chú"} required={loai === "HOAN_TIEN"} className="md:col-span-4">
          <Input name="ghiChu" />
        </Field>
        <div className="flex items-end">
          <Button className="w-full" disabled={pending || !donId}>
            {pending && <Loader2 className="size-4 animate-spin" />} Lưu phiếu
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function HuyPhieuNut({ khachId, phieuId, ma }: { khachId: number; phieuId: number; ma: string }) {
  const [mo, setMo] = useState(false);
  const [lyDo, setLyDo] = useState("");
  const { pending, loi, run } = useAct();
  return (
    <>
      <Button size="sm" variant="ghost" className="text-bad" onClick={() => setMo(true)}>
        Huỷ
      </Button>
      {mo && (
        <Modal title={`Huỷ phiếu ${ma}`} onClose={() => setMo(false)}>
          <Textarea value={lyDo} onChange={(e) => setLyDo(e.target.value)} placeholder="Lý do huỷ (bắt buộc)" />
          {loi && <Alert tone="bad" className="mt-2">{loi}</Alert>}
          <div className="mt-3 flex justify-end">
            <Button variant="danger" disabled={pending || !lyDo.trim()} onClick={() => run(() => huyPhieuAction(khachId, phieuId, lyDo), () => setMo(false))}>
              Huỷ phiếu
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}

export function SuaGiaNut({ khachId, donId, gia }: { khachId: number; donId: number; gia: number }) {
  const [mo, setMo] = useState(false);
  const [g, setG] = useState(String(gia));
  const [lyDo, setLyDo] = useState("");
  const { pending, loi, run } = useAct();
  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setMo(true)}>
        Sửa giá
      </Button>
      {mo && (
        <Modal title="Sửa giá thực thu sau khi lưu" onClose={() => setMo(false)}>
          <div className="grid gap-3">
            <Field label="Giá thực thu mới">
              <Input value={g} onChange={(e) => setG(e.target.value)} inputMode="numeric" />
            </Field>
            <Field label="Lý do" required>
              <Input value={lyDo} onChange={(e) => setLyDo(e.target.value)} />
            </Field>
            {loi && <Alert tone="bad">{loi}</Alert>}
            <Button disabled={pending || !lyDo.trim()} onClick={() => run(() => suaGiaAction(khachId, donId, Number(g.replace(/\D/g, "")), lyDo), () => setMo(false))}>
              Lưu
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}

export function TotNghiepNut({ khachId, ghiDanhId }: { khachId: number; ghiDanhId: number }) {
  const { pending, loi, run } = useAct();
  return (
    <>
      <Button size="sm" variant="ok" disabled={pending} onClick={() => run(() => totNghiepAction(khachId, ghiDanhId))}>
        Xác nhận tốt nghiệp
      </Button>
      {loi && <span className="text-xs text-bad">{loi}</span>}
    </>
  );
}
