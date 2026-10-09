"use client";
import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Field, Input, Select } from "@/components/ui";
import type { KetQuaAction } from "@/server/action";
import { doiMaQrAction, taoQrAction, tatQrAction } from "../_actions/quan-ly";

export function QrActions({ id }: { id: number }) {
  const [p, start] = useTransition();
  const router = useRouter();
  const go = (fn: () => Promise<KetQuaAction>, hoi: string) =>
    confirm(hoi) &&
    start(async () => {
      const r = await fn();
      if (!r.ok) alert(r.loi);
      router.refresh();
    });
  return (
    <>
      <Button size="sm" variant="secondary" disabled={p} onClick={() => go(() => doiMaQrAction(id), "Đổi mã: QR đang dán sẽ hết hiệu lực ngay, cần in lại QR mới. Tiếp tục?")}>
        Đổi mã
      </Button>
      <Button size="sm" variant="ghost" disabled={p} onClick={() => go(() => tatQrAction(id), "Tắt QR này?")}>
        Tắt
      </Button>
    </>
  );
}

export function TaoQrForm({ coSo, lops }: { coSo: { id: number; ten: string }[] | null; lops: { id: number; ten: string }[] }) {
  const [st, act, p] = useActionState(taoQrAction, { ok: true } as KetQuaAction);
  const [loai, setLoai] = useState("QUAY");
  return (
    <form action={act} className="grid gap-3 p-4" key={st.at}>
      {!st.ok && st.loi && <Alert tone="bad">{st.loi}</Alert>}
      {st.ok && st.at && <Alert tone="ok">Đã tạo QR.</Alert>}
      <Field label="Loại">
        <Select name="loai" value={loai} onChange={(e) => setLoai(e.target.value)}>
          <option value="QUAY">QR quầy chung</option>
          <option value="LOP">QR lớp</option>
        </Select>
      </Field>
      {loai === "LOP" ? (
        <Field label="Lớp" required>
          <Select name="lopHocId" required>
            <option value="">Chọn lớp</option>
            {lops.map((l) => (
              <option key={l.id} value={l.id}>
                {l.ten}
              </option>
            ))}
          </Select>
        </Field>
      ) : (
        coSo && (
          <Field label="Cơ sở" required>
            <Select name="coSoId" required>
              <option value="">Chọn cơ sở</option>
              {coSo.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.ten}
                </option>
              ))}
            </Select>
          </Field>
        )
      )}
      <Field label="Tên hiển thị" hint={loai === "LOP" ? "Trống = tên lớp" : "VD: Quầy lễ tân, Cửa vào hồ"}>
        <Input name="ten" />
      </Field>
      <Button disabled={p}>Tạo QR</Button>
    </form>
  );
}
