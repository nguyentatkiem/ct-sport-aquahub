"use client";
import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, AlertTriangle } from "lucide-react";
import { Alert, Button, Card, CardHeader, Field, Input, Select, Textarea } from "@/components/ui";
import type { KetQuaAction } from "@/server/action";
import { kiemTrungAction } from "../_actions/khach";

type Gt = {
  hoTen?: string;
  ngaySinh?: string;
  sdt?: string | null;
  lhHoTen?: string | null;
  lhSdt?: string | null;
  lhQuanHe?: string | null;
  coSoId?: number | null;
  ghiChu?: string | null;
  ghiChuSucKhoe?: string | null;
};

export function KhachForm({
  action,
  coSo,
  coSoMacDinh,
  chonCoSo,
  gt = {},
  idSua,
}: {
  action: (s: KetQuaAction, fd: FormData) => Promise<KetQuaAction>;
  coSo: { id: number; ten: string }[];
  coSoMacDinh: number | null;
  chonCoSo: boolean;
  gt?: Gt;
  idSua?: number;
}) {
  const [st, act, pending] = useActionState(action, { ok: true });
  const [f, setF] = useState({ hoTen: gt.hoTen ?? "", ngaySinh: gt.ngaySinh ?? "", sdt: gt.sdt ?? "", lhSdt: gt.lhSdt ?? "" });
  const [trung, setTrung] = useState<{ id: number; maKh: string; hoTen: string }[]>([]);
  const tuoi = useMemo(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.ngaySinh)) return null;
    const [y, m, d] = f.ngaySinh.split("-").map(Number);
    const n = new Date();
    let a = n.getFullYear() - y;
    if (n.getMonth() + 1 < m || (n.getMonth() + 1 === m && n.getDate() < d)) a--;
    return a;
  }, [f.ngaySinh]);
  const treEm = tuoi != null && tuoi < 18;

  useEffect(() => {
    const t = setTimeout(async () => {
      if (f.hoTen.trim().length > 3 && f.ngaySinh && (f.sdt || f.lhSdt)) setTrung(await kiemTrungAction({ hoTen: f.hoTen, ngaySinh: f.ngaySinh, sdt: f.sdt, sdtLienHe: f.lhSdt }, idSua));
      else setTrung([]);
    }, 400);
    return () => clearTimeout(t);
  }, [f, idSua]);

  return (
    <form action={act} className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <div className="grid gap-4">
        {!st.ok && st.loi && <Alert tone="bad">{st.loi}</Alert>}
        <Card>
          <CardHeader title="Thông tin khách" sub="Mã khách do hệ thống tự sinh" />
          <div className="grid gap-3 p-4 md:grid-cols-2">
            <Field label="Họ tên" required className="md:col-span-2">
              <Input name="hoTen" defaultValue={gt.hoTen} onChange={(e) => setF({ ...f, hoTen: e.target.value })} required autoFocus={!idSua} />
            </Field>
            <Field label="Ngày sinh" required hint={tuoi != null ? `${tuoi} tuổi` : "Tuổi tự tính"}>
              <Input type="date" name="ngaySinh" defaultValue={gt.ngaySinh} onChange={(e) => setF({ ...f, ngaySinh: e.target.value })} required />
            </Field>
            <Field label="SĐT của khách" required={!treEm && tuoi != null} hint={treEm ? "Trẻ em có thể để trống" : "Bắt buộc với người lớn"}>
              <Input name="sdt" inputMode="tel" defaultValue={gt.sdt ?? ""} onChange={(e) => setF({ ...f, sdt: e.target.value })} />
            </Field>
            {chonCoSo && (
              <Field label="Cơ sở đăng ký" required className="md:col-span-2">
                <Select name="coSoId" defaultValue={gt.coSoId ?? coSoMacDinh ?? ""} required>
                  <option value="">Chọn cơ sở</option>
                  {coSo.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.ten}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="Phụ huynh / người liên hệ" sub={treEm ? "Bắt buộc vì khách dưới 18 tuổi" : "Không bắt buộc với người lớn"} />
          <div className="grid gap-3 p-4 md:grid-cols-3">
            <Field label="Họ tên" required={treEm}>
              <Input name="lhHoTen" defaultValue={gt.lhHoTen ?? ""} />
            </Field>
            <Field label="SĐT" required={treEm} hint="1 SĐT có thể gắn nhiều con">
              <Input name="lhSdt" inputMode="tel" defaultValue={gt.lhSdt ?? ""} onChange={(e) => setF({ ...f, lhSdt: e.target.value })} />
            </Field>
            <Field label="Quan hệ">
              <Select name="lhQuanHe" defaultValue={gt.lhQuanHe ?? "ME"}>
                <option value="BO">Bố</option>
                <option value="ME">Mẹ</option>
                <option value="ONG">Ông</option>
                <option value="BA">Bà</option>
                <option value="KHAC">Khác</option>
              </Select>
            </Field>
          </div>
        </Card>
        <Card>
          <CardHeader title="Ghi chú" />
          <div className="grid gap-3 p-4 md:grid-cols-2">
            <Field label="Ghi chú chung">
              <Textarea name="ghiChu" defaultValue={gt.ghiChu ?? ""} />
            </Field>
            <Field label="Ghi chú sức khoẻ" hint="Chỉ ghi khi phụ huynh/khách đồng ý cung cấp (câu hỏi mở Q2)">
              <Textarea name="ghiChuSucKhoe" defaultValue={gt.ghiChuSucKhoe ?? ""} />
            </Field>
          </div>
        </Card>
      </div>
      <div className="grid h-fit gap-4">
        <Card className={trung.length ? "ring-2 ring-warn" : ""}>
          <CardHeader title="Kiểm tra trùng" sub="Họ tên + ngày sinh + SĐT liên hệ (BR-24)" />
          <div className="p-4 text-sm">
            {trung.length === 0 ? (
              <p className="text-ink-3">Chưa thấy hồ sơ trùng.</p>
            ) : (
              <>
                <div className="mb-2 flex items-center gap-2 font-bold text-warn">
                  <AlertTriangle className="size-4" /> Có {trung.length} hồ sơ giống
                </div>
                {trung.map((t) => (
                  <Link key={t.id} href={`/admin/khach/${t.id}`} className="block rounded-lg px-2 py-1.5 font-semibold text-brand hover:bg-brand-soft">
                    {t.maKh} · {t.hoTen} →
                  </Link>
                ))}
                {!idSua && (
                  <label className="mt-2 flex items-center gap-2 text-ink-2">
                    <input type="checkbox" name="boQuaTrung" value="1" /> Vẫn tạo hồ sơ mới
                  </label>
                )}
              </>
            )}
          </div>
        </Card>
        {!idSua && (
          <label className="flex items-start gap-2 rounded-xl bg-white p-3 text-sm text-ink-2 ring-1 ring-line">
            <input type="checkbox" name="dongY" defaultChecked className="mt-1" /> Khách/phụ huynh đồng ý cho trung tâm lưu và xử lý thông tin (NFR-08)
          </label>
        )}
        <div className="grid gap-2">
          {idSua ? (
            <Button size="lg" disabled={pending}>
              {pending && <Loader2 className="size-5 animate-spin" />} Lưu thay đổi
            </Button>
          ) : (
            <>
              <Button size="lg" name="sau" value="ban-the" disabled={pending}>
                {pending && <Loader2 className="size-5 animate-spin" />} Lưu và bán thẻ vé
              </Button>
              <Button variant="secondary" name="sau" value="ghi-danh" disabled={pending}>
                Lưu và ghi danh khoá học
              </Button>
              <Button variant="ghost" name="sau" value="xem" disabled={pending}>
                Chỉ lưu hồ sơ
              </Button>
            </>
          )}
        </div>
      </div>
    </form>
  );
}
