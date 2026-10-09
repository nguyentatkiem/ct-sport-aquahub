"use client";
// M4: màn chờ lớn, quét QR cá nhân bằng camera (hoặc máy quét USB), hoặc gõ mã khách. Kết quả hiện 5 giây rồi tự về màn chờ.
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Delete, ScanLine } from "lucide-react";
import { DICT } from "@/lib/i18n";
import { KetQuaBanner, KetQuaChiTiet, useServerClock } from "@/components/checkin-result";
import type { KetQuaView } from "@/server/checkin";

type BD = { detect: (s: CanvasImageSource) => Promise<{ rawValue: string }[]> };

const PHIM = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export default function Kiosk({ tenTrungTam, coSo, coSoMacDinh, chonCoSo }: { tenTrungTam: string; coSo: { id: number; ten: string }[]; coSoMacDinh: number | null; chonCoSo: boolean }) {
  const [cs, setCs] = useState<number | null>(coSoMacDinh ?? (coSo.length === 1 ? coSo[0].id : null));
  const [code, setCode] = useState("");
  const [kq, setKq] = useState<{ serverNow: string; ketQua: KetQuaView } | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [cam, setCam] = useState(false);
  const [dem, setDem] = useState(0);
  const busy = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const t = DICT.vi;

  const gui = useCallback(
    async (c: string) => {
      if (busy.current || !c.trim()) return;
      busy.current = true;
      setLoi(null);
      try {
        const r = await fetch("/api/kiosk", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code: c, coSoId: cs }) });
        const j = await r.json();
        if (!r.ok) setLoi(j.loi ?? "Lỗi");
        else {
          setKq(j);
          setDem(5);
        }
      } catch {
        setLoi("Mất kết nối, thử lại");
      } finally {
        setCode("");
        busy.current = false;
      }
    },
    [cs],
  );

  // Đếm ngược 5 giây rồi về màn chờ
  useEffect(() => {
    if (!dem) return;
    const x = setTimeout(() => {
      if (dem <= 1) {
        setKq(null);
        setDem(0);
        inputRef.current?.focus();
      } else setDem(dem - 1);
    }, 1000);
    return () => clearTimeout(x);
  }, [dem]);

  useEffect(() => {
    if (!loi) return;
    const x = setTimeout(() => setLoi(null), 4000);
    return () => clearTimeout(x);
  }, [loi]);

  // Camera + BarcodeDetector (Chrome/Android, Safari 17+). Không hỗ trợ thì dùng máy quét USB/gõ mã.
  useEffect(() => {
    if (!cam) return;
    const W = window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => BD };
    if (!W.BarcodeDetector) {
      setLoi("Trình duyệt chưa hỗ trợ quét bằng camera. Dùng máy quét hoặc gõ mã khách.");
      setCam(false);
      return;
    }
    const det = new W.BarcodeDetector({ formats: ["qr_code"] });
    let stream: MediaStream | null = null;
    let stop = false;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        const loop = async () => {
          if (stop) return;
          if (videoRef.current && !busy.current && !kq) {
            try {
              const r = await det.detect(videoRef.current);
              if (r[0]?.rawValue) await gui(r[0].rawValue);
            } catch {}
          }
          setTimeout(loop, 350);
        };
        loop();
      } catch {
        setLoi("Không mở được camera");
        setCam(false);
      }
    })();
    return () => {
      stop = true;
      stream?.getTracks().forEach((x) => x.stop());
    };
  }, [cam, gui, kq]);

  if (!cs)
    return (
      <main className="waves grid min-h-dvh place-items-center p-6">
        <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow">
          <h1 className="mb-4 text-xl font-extrabold">Chọn cơ sở cho ki-ốt</h1>
          <div className="grid gap-2">
            {coSo.map((c) => (
              <button key={c.id} onClick={() => setCs(c.id)} className="h-14 rounded-2xl bg-brand-soft text-lg font-bold text-brand">
                {c.ten}
              </button>
            ))}
          </div>
        </div>
      </main>
    );

  return (
    <main className="waves flex min-h-dvh flex-col p-4 md:p-8" onClick={() => !kq && inputRef.current?.focus()}>
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-2 to-brand text-2xl text-white">🏊</div>
          <div>
            <div className="text-xl font-extrabold">{tenTrungTam}</div>
            <div className="text-ink-2">{coSo.find((c) => c.id === cs)?.ten}</div>
          </div>
        </div>
        {chonCoSo && (
          <button onClick={() => setCs(null)} className="text-sm font-semibold text-ink-3">
            Đổi cơ sở
          </button>
        )}
      </header>
      {kq ? (
        <KetQua kq={kq} dem={dem} />
      ) : (
        <div className="mx-auto grid w-full max-w-4xl flex-1 content-center gap-6 md:grid-cols-2">
          <section className="grid content-start gap-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-line">
            <h1 className="flex items-center gap-2 text-2xl font-extrabold">
              <ScanLine className="size-7 text-brand" /> Đưa mã QR vào camera
            </h1>
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-ink/90">
              {cam ? <video ref={videoRef} className="size-full -scale-x-100 object-cover" muted playsInline /> : null}
              <div className="pointer-events-none absolute inset-[18%] rounded-2xl border-4 border-brand-2/80" />
              {!cam && (
                <button onClick={() => setCam(true)} className="absolute inset-0 grid place-items-center text-white">
                  <span className="flex items-center gap-2 rounded-full bg-white/15 px-5 py-3 text-lg font-bold">
                    <Camera className="size-6" /> Bật camera
                  </span>
                </button>
              )}
            </div>
            <p className="text-center text-ink-2">Hoặc dùng máy quét mã đặt tại quầy</p>
          </section>
          <section className="grid content-start gap-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-line">
            <h2 className="text-2xl font-extrabold">Gõ mã khách</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                gui(code);
              }}
            >
              <input
                ref={inputRef}
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="VD: LT00125"
                className="tabular h-20 w-full rounded-2xl border-2 border-line text-center text-4xl font-extrabold tracking-widest outline-none focus:border-brand"
                autoComplete="off"
              />
            </form>
            <div className="grid grid-cols-3 gap-2">
              {PHIM.map((k) => (
                <button key={k} onClick={() => setCode(code + k)} className="h-16 rounded-2xl bg-surface-2 text-3xl font-bold ring-1 ring-line active:bg-brand-soft">
                  {k}
                </button>
              ))}
              <button onClick={() => setCode(code.slice(0, -1))} className="grid h-16 place-items-center rounded-2xl bg-surface-2 ring-1 ring-line" aria-label="Xoá">
                <Delete className="size-7" />
              </button>
              <button onClick={() => setCode(code + "0")} className="h-16 rounded-2xl bg-surface-2 text-3xl font-bold ring-1 ring-line">
                0
              </button>
              <button onClick={() => gui(code)} className="h-16 rounded-2xl bg-brand text-xl font-bold text-white">
                Xong
              </button>
            </div>
            <p className="text-sm text-ink-3">Chữ cái đầu mã (VD LT) gõ bằng bàn phím máy tính bảng.</p>
          </section>
          {loi && <div className="rounded-2xl bg-bad-soft p-4 text-center text-lg font-bold text-bad md:col-span-2">{loi}</div>}
        </div>
      )}
      <p className="mt-6 text-center text-ink-2">Cần hỗ trợ? Mời gặp lễ tân · {t.seeReception}</p>
    </main>
  );
}

function KetQua({ kq, dem }: { kq: { serverNow: string; ketQua: KetQuaView }; dem: number }) {
  const now = useServerClock(kq.serverNow);
  return (
    <div className="mx-auto grid w-full max-w-xl flex-1 content-center gap-3">
      <KetQuaBanner r={kq.ketQua} t={DICT.vi} now={now} />
      <KetQuaChiTiet r={kq.ketQua} t={DICT.vi} lang="vi" />
      <div className="text-center text-ink-2">Tự về màn chờ sau {dem} giây</div>
    </div>
  );
}
