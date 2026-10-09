"use client";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button, Field, Input, Alert } from "@/components/ui";
import { dangNhapAction } from "./action";

export default function LoginForm() {
  const [st, act, pending] = useActionState(dangNhapAction, { loi: "" });
  return (
    <form action={act} className="grid gap-4">
      {st.loi && <Alert tone="bad">{st.loi}</Alert>}
      <Field label="SĐT hoặc email">
        <Input name="id" autoComplete="username" required autoFocus />
      </Field>
      <Field label="Mật khẩu">
        <Input name="mk" type="password" autoComplete="current-password" required />
      </Field>
      <Button size="lg" disabled={pending}>
        {pending && <Loader2 className="size-5 animate-spin" />}
        Đăng nhập
      </Button>
    </form>
  );
}
