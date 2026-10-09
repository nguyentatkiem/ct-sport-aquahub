"use client";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Alert, Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import type { KetQuaAction } from "@/server/action";

export function GvForm({
  action,
  coSo,
  gt,
}: {
  action: (s: KetQuaAction, fd: FormData) => Promise<KetQuaAction>;
  coSo: { id: number; ten: string }[] | null;
  gt: Partial<{ hoTen: string; sdt: string | null; trangThai: string; ghiChu: string | null; coSoIds: number[] }>;
}) {
  const [st, act, pending] = useActionState(action, { ok: true });
  return (
    <Card className="max-w-xl">
      <form action={act} className="grid gap-3 p-4">
        {!st.ok && st.loi && <Alert tone="bad">{st.loi}</Alert>}
        <Field label="Họ tên" required>
          <Input name="hoTen" defaultValue={gt.hoTen} required />
        </Field>
        <Field label="SĐT">
          <Input name="sdt" defaultValue={gt.sdt ?? ""} inputMode="tel" />
        </Field>
        {coSo && (
          <Field label="Cơ sở dạy" required>
            <div className="flex flex-wrap gap-3 pt-1">
              {coSo.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="coSoIds" value={c.id} defaultChecked={gt.coSoIds?.includes(c.id)} /> {c.ten}
                </label>
              ))}
            </div>
          </Field>
        )}
        <Field label="Trạng thái" hint="Giáo viên nghỉ không hiện khi tạo lớp mới">
          <Select name="trangThai" defaultValue={gt.trangThai ?? "DANG_LAM"}>
            <option value="DANG_LAM">Đang làm</option>
            <option value="NGHI">Nghỉ</option>
          </Select>
        </Field>
        <Field label="Ghi chú">
          <Textarea name="ghiChu" defaultValue={gt.ghiChu ?? ""} />
        </Field>
        <Button disabled={pending}>{pending && <Loader2 className="size-4 animate-spin" />} Lưu</Button>
      </form>
    </Card>
  );
}
