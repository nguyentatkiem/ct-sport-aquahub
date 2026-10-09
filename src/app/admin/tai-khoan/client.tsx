"use client";
import { useActionState } from "react";
import { Alert, Button, Field, Input } from "@/components/ui";
import type { KetQuaAction } from "@/server/action";
import { doiMatKhauAction } from "../_actions/quan-ly";

export function DoiMatKhau() {
  const [st, act, p] = useActionState(doiMatKhauAction, { ok: true } as KetQuaAction);
  return (
    <form action={act} className="grid gap-3 p-4">
      {!st.ok && st.loi && <Alert tone="bad">{st.loi}</Alert>}
      <Field label="Mật khẩu hiện tại">
        <Input type="password" name="cu" autoComplete="current-password" required />
      </Field>
      <Field label="Mật khẩu mới" hint="Tối thiểu 8 ký tự">
        <Input type="password" name="moi" autoComplete="new-password" minLength={8} required />
      </Field>
      <Field label="Nhập lại mật khẩu mới">
        <Input type="password" name="nhapLai" autoComplete="new-password" required />
      </Field>
      <Button disabled={p}>Đổi mật khẩu</Button>
    </form>
  );
}
