"use client";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Alert, Button, Card, CardHeader, Field, Input, Select } from "@/components/ui";
import type { KetQuaAction } from "@/server/action";

export function LopForm({
  action,
  coSo,
  khoa,
  gvs,
  gt,
  moi,
}: {
  action: (s: KetQuaAction, fd: FormData) => Promise<KetQuaAction>;
  coSo: { id: number; ten: string }[] | null;
  khoa: { id: number; ten: string }[];
  gvs: { id: number; ten: string }[];
  gt: Partial<{ ten: string; coSoId: number | null; sanPhamId: number; giaoVienId: number | null; lichText: string | null; trangThai: string }>;
  moi: boolean;
}) {
  const [st, act, pending] = useActionState(action, { ok: true });
  return (
    <Card className="h-fit">
      <CardHeader title="Thông tin lớp" />
      <form action={act} className="grid gap-3 p-4">
        {!st.ok && st.loi && <Alert tone="bad">{st.loi}</Alert>}
        <Field label="Tên lớp" required>
          <Input name="ten" defaultValue={gt.ten} required placeholder="VD: Ếch cơ bản T3-T5 17h" />
        </Field>
        {coSo && (
          <Field label="Cơ sở" required>
            <Select name="coSoId" defaultValue={gt.coSoId ?? ""} required>
              <option value="">Chọn cơ sở</option>
              {coSo.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.ten}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label="Khoá học" required>
          <Select name="sanPhamId" defaultValue={gt.sanPhamId ?? ""} required>
            <option value="">Chọn khoá học</option>
            {khoa.map((k) => (
              <option key={k.id} value={k.id}>
                {k.ten}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Giáo viên" hint="Giáo viên nghỉ không hiện ở đây. Đổi GV không ảnh hưởng lượt check-in cũ.">
          <Select name="giaoVienId" defaultValue={gt.giaoVienId ?? ""}>
            <option value="">—</option>
            {gvs.map((g) => (
              <option key={g.id} value={g.id}>
                {g.ten}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Lịch (dạng chữ)" hint="Không xếp lịch tự động ở v1">
          <Input name="lichText" defaultValue={gt.lichText ?? ""} placeholder="Thứ 3, Thứ 5 · 17:00-18:00" />
        </Field>
        <Field label="Trạng thái">
          <Select name="trangThai" defaultValue={gt.trangThai ?? "DANG_HOC"}>
            <option value="DANG_HOC">Đang học</option>
            <option value="KET_THUC">Kết thúc</option>
          </Select>
        </Field>
        {moi && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="taoQr" defaultChecked /> Tạo mã QR lớp ngay
          </label>
        )}
        <Button disabled={pending}>{pending && <Loader2 className="size-4 animate-spin" />} Lưu lớp</Button>
      </form>
    </Card>
  );
}
