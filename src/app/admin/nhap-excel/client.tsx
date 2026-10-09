"use client";
import { useRef, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Alert, Button, Table, Th, Td } from "@/components/ui";
import { kiemTraNhapAction, nhapAction } from "../_actions/nhap";

type Kt = { loi: { dong: number; loi: string }[]; trung: { dong: number; ma: string }[]; soHopLe: number; xem: { dong: number; hoTen: string; ngaySinh: string; soLuot: number | null; han: string | null }[] };

export function NhapForm() {
  const ref = useRef<HTMLFormElement>(null);
  const [kt, setKt] = useState<Kt | null>(null);
  const [kq, setKq] = useState<string | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [p, start] = useTransition();
  const fd = () => new FormData(ref.current!);
  return (
    <form ref={ref} className="grid gap-4 p-4" onSubmit={(e) => e.preventDefault()}>
      <input type="file" name="file" accept=".xlsx" className="text-sm" onChange={() => (setKt(null), setKq(null), setLoi(null))} />
      {loi && <Alert tone="bad">{loi}</Alert>}
      {kq && <Alert tone="ok">{kq}</Alert>}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={p}
          onClick={() =>
            start(async () => {
              setLoi(null);
              setKq(null);
              const r = await kiemTraNhapAction(fd());
              if (!r.ok) setLoi(r.loi ?? "Lỗi");
              else setKt(r.data as Kt);
            })
          }
        >
          {p && <Loader2 className="size-4 animate-spin" />} Kiểm tra file
        </Button>
        {kt && kt.loi.length === 0 && (
          <Button
            type="button"
            disabled={p}
            onClick={() =>
              start(async () => {
                const r = await nhapAction(fd());
                if (!r.ok) setLoi(r.loi ?? "Lỗi");
                else {
                  const d = r.data as { soKhach: number; soThe: number; boQua: number };
                  setKq(`Đã nhập ${d.soKhach} khách, ${d.soThe} thẻ chuyển đổi${d.boQua ? `, bỏ qua ${d.boQua} dòng trùng` : ""}.`);
                  setKt(null);
                }
              })
            }
          >
            Nhập {kt.soHopLe} dòng
          </Button>
        )}
      </div>
      {kt && (
        <>
          {kt.loi.length > 0 ? (
            <Alert tone="bad">
              <b>{kt.loi.length} dòng lỗi</b>, chưa nhập gì. Sửa file rồi kiểm tra lại.
              <ul className="mt-2 list-disc pl-5">
                {kt.loi.map((l) => (
                  <li key={l.dong}>
                    Dòng {l.dong}: {l.loi}
                  </li>
                ))}
              </ul>
            </Alert>
          ) : (
            <Alert tone="ok">File hợp lệ: {kt.soHopLe} dòng sẵn sàng nhập.</Alert>
          )}
          {kt.trung.length > 0 && (
            <Alert tone="warn">
              {kt.trung.length} dòng trùng hồ sơ đã có: {kt.trung.map((t) => `dòng ${t.dong} (${t.ma})`).join(", ")}.
              <label className="mt-2 flex items-center gap-2 font-semibold">
                <input type="checkbox" name="boQuaTrung" defaultChecked /> Bỏ qua các dòng trùng
              </label>
            </Alert>
          )}
          {kt.xem.length > 0 && (
            <Table>
              <thead>
                <tr>
                  <Th>Dòng</Th>
                  <Th>Họ tên</Th>
                  <Th>Ngày sinh</Th>
                  <Th>Lượt thẻ cũ</Th>
                  <Th>Hạn thẻ cũ</Th>
                </tr>
              </thead>
              <tbody>
                {kt.xem.map((x) => (
                  <tr key={x.dong}>
                    <Td>{x.dong}</Td>
                    <Td>{x.hoTen}</Td>
                    <Td>{x.ngaySinh}</Td>
                    <Td>{x.soLuot ?? "—"}</Td>
                    <Td>{x.han ?? "—"}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </>
      )}
    </form>
  );
}
