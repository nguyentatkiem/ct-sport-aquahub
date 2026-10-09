"use client";
import { useActionState, useState } from "react";
import { Alert, Button, Field, Input, Select } from "@/components/ui";
import type { KetQuaAction } from "@/server/action";
import type { CaiDat } from "@/server/settings";
import { luuCaiDatAction, luuCoSoAction } from "../_actions/quan-ly";

export function CaiDatForm({ gt }: { gt: CaiDat }) {
  const [st, act, p] = useActionState(luuCaiDatAction, { ok: true } as KetQuaAction);
  const [logo, setLogo] = useState(gt.logoUrl ?? "");
  const chonAnh = (f: File | undefined) => {
    if (!f) return;
    if (f.size > 300_000) return alert("Logo tối đa 300 KB");
    const r = new FileReader();
    r.onload = () => setLogo(String(r.result));
    r.readAsDataURL(f);
  };
  return (
    <form action={act} className="grid gap-3 p-4">
      {!st.ok && st.loi && <Alert tone="bad">{st.loi}</Alert>}
      {st.ok && st.at && <Alert tone="ok">Đã lưu cài đặt.</Alert>}
      <Field label="Tên trung tâm" required>
        <Input name="tenTrungTam" defaultValue={gt.tenTrungTam} required />
      </Field>
      <Field label="Tên tiếng Anh" hint="Hiện trên trang khách khi chọn EN">
        <Input name="tenTrungTamEn" defaultValue={gt.tenTrungTamEn} />
      </Field>
      <Field label="Hotline">
        <Input name="hotline" defaultValue={gt.hotline} />
      </Field>
      <Field label="Logo" hint="PNG/JPG/SVG tối đa 300 KB, hoặc dán đường dẫn https">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {logo && <img src={logo} alt="" className="size-14 rounded-lg object-contain ring-1 ring-line" />}
          <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" onChange={(e) => chonAnh(e.target.files?.[0])} className="text-sm" />
        </div>
        <Input name="logoUrl" value={logo} onChange={(e) => setLogo(e.target.value)} className="mt-2" placeholder="https://..." />
      </Field>
      <Field label="Thẻ được dùng khi (BR-19)" hint="Chưa đạt điều kiện thì check-in báo vàng: Mời gặp lễ tân">
        <Select name="theDuocDungKhi" defaultValue={gt.theDuocDungKhi}>
          <option value="DA_COC">Đã cọc (đã thu một phần)</option>
          <option value="DA_THU_DU">Đã thu đủ</option>
          <option value="NGAY_KHI_TAO">Ngay khi tạo thẻ</option>
        </Select>
      </Field>
      <Button disabled={p}>Lưu cài đặt</Button>
    </form>
  );
}

type Cs = { id: number; ma: string; ten: string; diaChi: string | null; sdt: string | null; choTuDangKy: boolean; trangThai: string };

export function CoSoForm({ gt }: { gt: Cs | null }) {
  const [st, act, p] = useActionState(luuCoSoAction.bind(null, gt?.id ?? null), { ok: true } as KetQuaAction);
  return (
    <form action={act} className="grid gap-2 md:grid-cols-6" key={gt ? undefined : st.at}>
      {!st.ok && st.loi && <Alert tone="bad" className="md:col-span-6">{st.loi}</Alert>}
      <Input name="ma" defaultValue={gt?.ma} placeholder="Mã (LT)" maxLength={2} className="uppercase" required />
      <Input name="ten" defaultValue={gt?.ten} placeholder="Tên cơ sở" className="md:col-span-2" required />
      <Input name="diaChi" defaultValue={gt?.diaChi ?? ""} placeholder="Địa chỉ" className="md:col-span-3" />
      <Input name="sdt" defaultValue={gt?.sdt ?? ""} placeholder="SĐT" className="md:col-span-2" />
      <label className="flex items-center gap-2 text-sm md:col-span-2">
        <input type="checkbox" name="choTuDangKy" defaultChecked={gt?.choTuDangKy ?? true} /> Cho khách tự đăng ký
      </label>
      <Select name="trangThai" defaultValue={gt?.trangThai ?? "HOAT_DONG"}>
        <option value="HOAT_DONG">Hoạt động</option>
        <option value="NGUNG">Ngừng</option>
      </Select>
      <Button size="sm" variant={gt ? "secondary" : "primary"} disabled={p} className="h-11">
        {gt ? "Lưu" : "Thêm"}
      </Button>
    </form>
  );
}
