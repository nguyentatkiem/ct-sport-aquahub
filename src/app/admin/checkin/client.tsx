"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, ShieldCheck } from "lucide-react";
import { Button, Card, CardHeader, Input, Select, Alert, Textarea } from "@/components/ui";
import { KetQuaBanner, KetQuaChiTiet, useServerClock } from "@/components/checkin-result";
import { DICT } from "@/lib/i18n";
import type { KetQuaView } from "@/server/checkin";
import { checkInHoAction, timKhachNhanh, vuotChanAction, type KhachNhanh } from "../_actions/checkin";

/** Hỏi mốc mới mỗi 2 giây; có lượt mới thì tải lại danh sách (FR-CI-06). */
export function LiveCheckins({ maxId }: { maxId: number }) {
  const router = useRouter();
  const last = useRef(maxId);
  useEffect(() => {
    last.current = maxId;
  }, [maxId]);
  useEffect(() => {
    const t = setInterval(async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const r = await fetch("/api/admin/checkins", { cache: "no-store" });
        const j = await r.json();
        if (j.m && j.m > last.current) {
          last.current = j.m;
          router.refresh();
        }
      } catch {}
    }, 2000);
    return () => clearInterval(t);
  }, [router]);
  return null;
}

function KetQuaNho({ r }: { r: KetQuaView }) {
  const now = useServerClock(r.thoiGian);
  return (
    <div className="grid gap-2">
      <KetQuaBanner r={r} t={DICT.vi} now={now} />
      <KetQuaChiTiet r={r} t={DICT.vi} lang="vi" />
    </div>
  );
}

export function CheckInHo({ lops, canChonCoSo }: { lops: { id: number; ten: string; coSoId: number }[]; canChonCoSo: boolean }) {
  const [q, setQ] = useState("");
  const [ds, setDs] = useState<KhachNhanh[]>([]);
  const [lop, setLop] = useState("");
  const [kq, setKq] = useState<KetQuaView | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(async () => {
      if (q.trim().length >= 2) setDs(await timKhachNhanh(q));
      else setDs([]);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const checkIn = (k: KhachNhanh) =>
    start(async () => {
      setLoi(null);
      const r = await checkInHoAction(k.id, lop ? Number(lop) : null, canChonCoSo ? k.coSoId : null);
      if (!r.ok) setLoi(r.loi ?? "Lỗi");
      else {
        setKq(r.data!);
        setQ("");
        setDs([]);
        router.refresh();
      }
    });

  return (
    <Card className="h-fit">
      <CardHeader title="Check-in hộ" sub="Cho khách không quét được QR (ghi kênh Lễ tân)" />
      <div className="grid gap-3 p-4">
        <label className="relative block">
          <Search className="pointer-events-none absolute top-3 left-3 size-5 text-ink-3" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tên, SĐT, mã khách, mã thẻ" className="pl-10" autoFocus />
        </label>
        <Select value={lop} onChange={(e) => setLop(e.target.value)} aria-label="Lớp">
          <option value="">Không theo lớp (quét quầy)</option>
          {lops.map((l) => (
            <option key={l.id} value={l.id}>
              {l.ten}
            </option>
          ))}
        </Select>
        {loi && <Alert tone="bad">{loi}</Alert>}
        {ds.length > 0 && (
          <div className="grid max-h-80 gap-1 overflow-y-auto">
            {ds.map((k) => (
              <div key={k.id} className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 ring-1 ring-line">
                <div className="min-w-0">
                  <div className="truncate font-semibold">{k.hoTen}</div>
                  <div className="text-xs text-ink-3">
                    {k.maKh} · {k.ngaySinh.slice(0, 4)} · {k.coSo}
                    {k.trangThai === "CHO_DUYET" && <b className="text-warn"> · Chờ duyệt</b>}
                  </div>
                </div>
                <Button size="sm" disabled={pending} onClick={() => checkIn(k)}>
                  {pending ? <Loader2 className="size-4 animate-spin" /> : "Check-in"}
                </Button>
              </div>
            ))}
          </div>
        )}
        {q.trim().length >= 2 && ds.length === 0 && <div className="text-sm text-ink-3">Không thấy khách. Khách cơ sở khác: nhập đúng mã khách hoặc SĐT.</div>}
        {kq && <KetQuaNho key={kq.checkInId ?? kq.thoiGian} r={kq} />}
      </div>
    </Card>
  );
}

export function VuotChanButton({ id, ten }: { id: number; ten: string }) {
  const [mo, setMo] = useState(false);
  const [lyDo, setLyDo] = useState("");
  const [loi, setLoi] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <>
      <Button size="sm" variant="warn" onClick={() => setMo(true)}>
        <ShieldCheck className="size-4" /> Cho vào 1 lần
      </Button>
      {mo && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onClick={() => setMo(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">Vượt chặn cho {ten}</h3>
            <p className="mt-1 text-sm text-ink-2">Cho vào 1 lần, không trừ lượt, không gia hạn thẻ. Bắt buộc ghi lý do, thao tác được ghi nhật ký.</p>
            <Textarea className="mt-3" value={lyDo} onChange={(e) => setLyDo(e.target.value)} placeholder="Lý do (VD: khách hứa mua thẻ sau buổi học)" autoFocus />
            {loi && <Alert tone="bad" className="mt-2">{loi}</Alert>}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setMo(false)}>
                Huỷ
              </Button>
              <Button
                variant="warn"
                disabled={pending || lyDo.trim().length < 3}
                onClick={() =>
                  start(async () => {
                    const r = await vuotChanAction(id, lyDo);
                    if (!r.ok) setLoi(r.loi ?? "Lỗi");
                    else {
                      setMo(false);
                      router.refresh();
                    }
                  })
                }
              >
                Xác nhận cho vào
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
