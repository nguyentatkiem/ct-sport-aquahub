"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Alert, Button, Card, CardHeader, Field, Input, Select } from "@/components/ui";
import { moTaLuat } from "@/lib/rule-text";
import type { KetQuaAction } from "@/server/action";

type Gt = Partial<{
  loai: string;
  ten: string;
  tenEn: string | null;
  giaNiemYet: number;
  coSoApDung: number[] | null;
  soLuot: number | null;
  hanDungNgay: number | null;
  mocTinhHan: string;
  luatChan: string;
  hanhDongKhiViPham: string;
  dungLienCoSo: boolean;
  toiDaLuotMoiNgay: number;
  nguongCanhBaoLuot: number;
  nguongCanhBaoNgay: number;
  choBaoLuu: boolean;
  baoLuuToiDaNgay: number | null;
  soBuoiHoc: number | null;
  soBuoiTotNghiep: number | null;
  theVeKemTheoId: number | null;
  laTheChuyenDoi: boolean;
}>;

export function SanPhamForm({ action, coSo, ve, gt }: { action: (s: KetQuaAction, fd: FormData) => Promise<KetQuaAction>; coSo: { id: number; ten: string }[]; ve: { id: number; ten: string }[]; gt: Gt }) {
  const [st, act, pending] = useActionState(action, { ok: true });
  const [f, setF] = useState({
    loai: gt.loai ?? "THE_VE",
    soLuot: gt.soLuot === null && gt.ten ? "" : String(gt.soLuot ?? 10),
    khongGioiHanLuot: gt.soLuot === null && !!gt.ten,
    hanDungNgay: gt.hanDungNgay === null && gt.ten ? "" : String(gt.hanDungNgay ?? 60),
    khongHan: gt.hanDungNgay === null && !!gt.ten,
    mocTinhHan: gt.mocTinhHan ?? "NGAY_MUA",
    luatChan: gt.luatChan ?? "HET_LUOT_HOAC_HET_HAN",
    hanhDongKhiViPham: gt.hanhDongKhiViPham ?? "CHAN",
    dungLienCoSo: gt.dungLienCoSo ?? false,
    toiDaLuotMoiNgay: String(gt.toiDaLuotMoiNgay ?? 1),
    nguongCanhBaoLuot: String(gt.nguongCanhBaoLuot ?? 3),
    nguongCanhBaoNgay: String(gt.nguongCanhBaoNgay ?? 7),
    choBaoLuu: gt.choBaoLuu ?? false,
    baoLuuToiDaNgay: String(gt.baoLuuToiDaNgay ?? 30),
    soBuoiHoc: String(gt.soBuoiHoc ?? 12),
    soBuoiTotNghiep: String(gt.soBuoiTotNghiep ?? gt.soBuoiHoc ?? 12),
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value });
  const n = (s: string) => (s === "" ? null : Number(s));
  const xemTruoc = moTaLuat({
    loai: f.loai,
    soLuot: f.khongGioiHanLuot ? null : n(f.soLuot),
    hanDungNgay: f.khongHan ? null : n(f.hanDungNgay),
    mocTinhHan: f.mocTinhHan,
    luatChan: f.luatChan,
    hanhDongKhiViPham: f.hanhDongKhiViPham,
    dungLienCoSo: f.dungLienCoSo,
    toiDaLuotMoiNgay: n(f.toiDaLuotMoiNgay),
    nguongCanhBaoLuot: n(f.nguongCanhBaoLuot),
    nguongCanhBaoNgay: n(f.nguongCanhBaoNgay),
    choBaoLuu: f.choBaoLuu,
    baoLuuToiDaNgay: n(f.baoLuuToiDaNgay),
    soBuoiHoc: n(f.soBuoiHoc),
    soBuoiTotNghiep: n(f.soBuoiTotNghiep),
    laTheChuyenDoi: gt.laTheChuyenDoi,
  });
  const theVe = f.loai === "THE_VE";
  return (
    <form action={act} className="grid gap-4 lg:grid-cols-[1fr_380px]">
      <div className="grid gap-4">
        {!st.ok && st.loi && <Alert tone="bad">{st.loi}</Alert>}
        <Card>
          <CardHeader title="Thông tin chung" />
          <div className="grid gap-3 p-4 md:grid-cols-2">
            <Field label="Loại" required>
              <Select name="loai" value={f.loai} onChange={set("loai")} disabled={!!gt.ten}>
                <option value="THE_VE">Thẻ vé (lượt vào hồ)</option>
                <option value="KHOA_HOC">Khoá học</option>
              </Select>
              {gt.ten && <input type="hidden" name="loai" value={f.loai} />}
            </Field>
            <Field label="Giá niêm yết (đồng)" required>
              <Input name="giaNiemYet" inputMode="numeric" defaultValue={gt.giaNiemYet ?? ""} required />
            </Field>
            <Field label="Tên" required>
              <Input name="ten" defaultValue={gt.ten} required />
            </Field>
            <Field label="Tên tiếng Anh" hint="Hiện trên màn khách khi chọn EN">
              <Input name="tenEn" defaultValue={gt.tenEn ?? ""} />
            </Field>
            <Field label="Cơ sở áp dụng" hint="Không chọn = tất cả cơ sở" className="md:col-span-2">
              <div className="flex flex-wrap gap-3 pt-1">
                {coSo.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="coSoApDung" value={c.id} defaultChecked={gt.coSoApDung?.includes(c.id)} /> {c.ten}
                  </label>
                ))}
              </div>
            </Field>
          </div>
        </Card>
        {theVe ? (
          <Card>
            <CardHeader title="Luật thẻ vé" sub="Chụp vào thẻ tại lúc bán" />
            <div className="grid gap-3 p-4 md:grid-cols-3">
              <Field label="Số lượt">
                <Input name="soLuot" type="number" min={1} value={f.soLuot} onChange={set("soLuot")} disabled={f.khongGioiHanLuot} />
                <label className="mt-1 flex items-center gap-2 text-xs">
                  <input type="checkbox" name="khongGioiHanLuot" checked={f.khongGioiHanLuot} onChange={set("khongGioiHanLuot")} /> Không giới hạn lượt
                </label>
              </Field>
              <Field label="Hạn dùng (ngày)">
                <Input name="hanDungNgay" type="number" min={1} value={f.hanDungNgay} onChange={set("hanDungNgay")} disabled={f.khongHan} />
                <label className="mt-1 flex items-center gap-2 text-xs">
                  <input type="checkbox" name="khongHan" checked={f.khongHan} onChange={set("khongHan")} /> Không hạn
                </label>
              </Field>
              <Field label="Mốc tính hạn">
                <Select name="mocTinhHan" value={f.mocTinhHan} onChange={set("mocTinhHan")}>
                  <option value="NGAY_MUA">Từ ngày mua</option>
                  <option value="LAN_DAU_CHECKIN">Từ lần check-in đầu</option>
                </Select>
              </Field>
              <Field label="Luật chặn">
                <Select name="luatChan" value={f.luatChan} onChange={set("luatChan")}>
                  <option value="HET_LUOT_HOAC_HET_HAN">Hết lượt hoặc hết hạn</option>
                  <option value="CHI_HET_LUOT">Chỉ khi hết lượt</option>
                  <option value="CHI_HET_HAN">Chỉ khi hết hạn</option>
                </Select>
              </Field>
              <Field label="Khi vi phạm">
                <Select name="hanhDongKhiViPham" value={f.hanhDongKhiViPham} onChange={set("hanhDongKhiViPham")}>
                  <option value="CHAN">Chặn (màn đỏ)</option>
                  <option value="CANH_BAO">Cảnh báo, vẫn cho vào (màn vàng)</option>
                </Select>
              </Field>
              <Field label="Tối đa lượt mỗi ngày">
                <Input name="toiDaLuotMoiNgay" type="number" min={1} value={f.toiDaLuotMoiNgay} onChange={set("toiDaLuotMoiNgay")} />
              </Field>
              <Field label="Báo sắp hết khi còn ≤ (lượt)">
                <Input name="nguongCanhBaoLuot" type="number" min={0} value={f.nguongCanhBaoLuot} onChange={set("nguongCanhBaoLuot")} />
              </Field>
              <Field label="Báo sắp hết khi còn ≤ (ngày)">
                <Input name="nguongCanhBaoNgay" type="number" min={0} value={f.nguongCanhBaoNgay} onChange={set("nguongCanhBaoNgay")} />
              </Field>
              <Field label="Dùng liên cơ sở">
                <label className="flex h-11 items-center gap-2 text-sm">
                  <input type="checkbox" name="dungLienCoSo" checked={f.dungLienCoSo} onChange={set("dungLienCoSo")} /> Dùng ở các cơ sở áp dụng
                </label>
              </Field>
            </div>
          </Card>
        ) : (
          <Card>
            <CardHeader title="Khoá học" sub="Không trừ lượt, không chặn vào cửa (D1)" />
            <div className="grid gap-3 p-4 md:grid-cols-3">
              <Field label="Số buổi học" required>
                <Input name="soBuoiHoc" type="number" min={1} value={f.soBuoiHoc} onChange={set("soBuoiHoc")} required />
              </Field>
              <Field label="Số buổi tốt nghiệp" hint="Trống = bằng số buổi học">
                <Input name="soBuoiTotNghiep" type="number" min={1} value={f.soBuoiTotNghiep} onChange={set("soBuoiTotNghiep")} />
              </Field>
              <Field label="Thẻ vé gợi ý bán kèm">
                <Select name="theVeKemTheoId" defaultValue={gt.theVeKemTheoId ?? ""}>
                  <option value="">Không</option>
                  {ve.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.ten}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </Card>
        )}
        <Card>
          <CardHeader title="Bảo lưu" />
          <div className="grid gap-3 p-4 md:grid-cols-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="choBaoLuu" checked={f.choBaoLuu} onChange={set("choBaoLuu")} /> Cho phép bảo lưu
            </label>
            {f.choBaoLuu && (
              <Field label="Tối đa (ngày)">
                <Input name="baoLuuToiDaNgay" type="number" min={1} value={f.baoLuuToiDaNgay} onChange={set("baoLuuToiDaNgay")} />
              </Field>
            )}
          </div>
        </Card>
      </div>
      <div className="grid h-fit gap-3 lg:sticky lg:top-20">
        <Card className="ring-2 ring-brand/30">
          <CardHeader title="Xem trước luật" sub="FR-SP-03: đọc kỹ trước khi lưu" />
          <p className="p-4 text-[15px] leading-relaxed font-medium text-ink">{xemTruoc}</p>
        </Card>
        <Button size="lg" disabled={pending}>
          {pending && <Loader2 className="size-5 animate-spin" />} Lưu sản phẩm
        </Button>
        <Link href="/admin/san-pham" className="text-center font-semibold text-ink-2">
          Huỷ
        </Link>
      </div>
    </form>
  );
}
