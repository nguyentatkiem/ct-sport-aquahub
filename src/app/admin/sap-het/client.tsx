"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Select, Textarea } from "@/components/ui";
import { KET_QUA_GOI } from "@/lib/labels";
import { ghiLienHeAction } from "../_actions/khach";

export function GhiLienHe({ theId, ten }: { theId: number; ten: string }) {
  const [mo, setMo] = useState(false);
  const [kq, setKq] = useState("DA_GOI");
  const [gc, setGc] = useState("");
  const [loi, setLoi] = useState<string | null>(null);
  const [p, start] = useTransition();
  const router = useRouter();
  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setMo(true)}>
        Đã gọi
      </Button>
      {mo && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onClick={() => setMo(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-3 text-lg font-bold">Ghi kết quả gọi: {ten}</h3>
            <Select value={kq} onChange={(e) => setKq(e.target.value)}>
              {Object.entries(KET_QUA_GOI).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
            <Textarea className="mt-2" value={gc} onChange={(e) => setGc(e.target.value)} placeholder="Ghi chú kết quả" />
            {loi && <Alert tone="bad" className="mt-2">{loi}</Alert>}
            <div className="mt-3 flex justify-end">
              <Button
                disabled={p}
                onClick={() =>
                  start(async () => {
                    const r = await ghiLienHeAction(theId, kq, gc);
                    if (!r.ok) setLoi(r.loi ?? "Lỗi");
                    else {
                      setMo(false);
                      router.refresh();
                    }
                  })
                }
              >
                Lưu
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
