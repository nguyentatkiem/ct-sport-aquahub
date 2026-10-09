"use client";
import { useActionState, useState } from "react";
import { Alert, Button, Field, Input, Select } from "@/components/ui";
import type { KetQuaAction } from "@/server/action";
import { luuNhanVienAction } from "../_actions/quan-ly";

type Gt = Partial<{ id: number; hoTen: string; email: string | null; sdt: string | null; vaiTro: string; coSoId: number | null; trangThai: string }>;

function Form({ coSo, gt, onDone }: { coSo: { id: number; ten: string }[]; gt: Gt; onDone?: () => void }) {
  const [st, act, p] = useActionState(async (s: KetQuaAction, fd: FormData) => {
    const r = await luuNhanVienAction(gt.id ?? null, s, fd);
    if (r.ok) onDone?.();
    return r;
  }, { ok: true } as KetQuaAction);
  const [vt, setVt] = useState(gt.vaiTro ?? "LE_TAN");
  return (
    <form action={act} className="grid gap-3 p-4" key={gt.id ? undefined : st.at}>
      {!st.ok && st.loi && <Alert tone="bad">{st.loi}</Alert>}
      {st.ok && st.at && !gt.id && <Alert tone="ok">Đã tạo tài khoản.</Alert>}
      <Field label="Họ tên" required>
        <Input name="hoTen" defaultValue={gt.hoTen} required />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Email">
          <Input name="email" type="email" defaultValue={gt.email ?? ""} />
        </Field>
        <Field label="SĐT">
          <Input name="sdt" defaultValue={gt.sdt ?? ""} inputMode="tel" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Vai trò">
          <Select name="vaiTro" value={vt} onChange={(e) => setVt(e.target.value)}>
            <option value="LE_TAN">Lễ tân</option>
            <option value="QUAN_LY">Quản lý cơ sở</option>
            <option value="CHU">Chủ trung tâm</option>
          </Select>
        </Field>
        {vt !== "CHU" && (
          <Field label="Cơ sở" required>
            <Select name="coSoId" defaultValue={gt.coSoId ?? ""} required>
              <option value="">Chọn</option>
              {coSo.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.ten}
                </option>
              ))}
            </Select>
          </Field>
        )}
      </div>
      <Field label={gt.id ? "Đặt lại mật khẩu" : "Mật khẩu"} hint={gt.id ? "Để trống nếu không đổi. Đổi xong nhân viên phải đăng nhập lại." : "Tối thiểu 8 ký tự"} required={!gt.id}>
        <Input name="matKhau" type="password" autoComplete="new-password" required={!gt.id} minLength={8} />
      </Field>
      {gt.id && (
        <Field label="Trạng thái">
          <Select name="trangThai" defaultValue={gt.trangThai}>
            <option value="HOAT_DONG">Hoạt động</option>
            <option value="KHOA">Khoá tài khoản</option>
          </Select>
        </Field>
      )}
      <Button disabled={p}>{gt.id ? "Lưu" : "Tạo tài khoản"}</Button>
    </form>
  );
}

export function NhanVienForm({ coSo, gt, inline }: { coSo: { id: number; ten: string }[]; gt: Gt; inline?: boolean }) {
  const [mo, setMo] = useState(false);
  if (inline) return <Form coSo={coSo} gt={gt} />;
  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setMo(true)}>
        Sửa
      </Button>
      {mo && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onClick={() => setMo(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 pt-4 text-lg font-bold">Sửa tài khoản</div>
            <Form coSo={coSo} gt={gt} onDone={() => setMo(false)} />
          </div>
        </div>
      )}
    </>
  );
}
