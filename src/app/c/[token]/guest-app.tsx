"use client";
// Trang khách: M1 nhận diện → M1b chọn khách → M3 kết quả; M2 đăng ký khách mới.
import { useEffect, useMemo, useState } from "react";
import { Phone, UserPlus, ChevronLeft, Users, GraduationCap, MapPin, X, Check, Loader2 } from "lucide-react";
import clsx from "clsx";
import { DICT, type Lang } from "@/lib/i18n";
import { KetQuaBanner, KetQuaChiTiet, useServerClock } from "@/components/checkin-result";
import type { KetQuaView } from "@/server/checkin";

type UngVien = { tok: string; tenChe: string; namSinh: string };
type Saved = { tok: string; tenChe: string; id: number };
type Props = {
  qr: string;
  trungTam: { vi: string; en: string; logo: string | null };
  coSo: { ten: string; diaChi: string | null; choTuDangKy: boolean };
  lop: { id: number; ten: string; lich: string | null; giaoVien: string | null } | null;
  sanPham: { id: number; ten: string; tenEn: string | null; loai: string }[];
};

const LS_SAVED = "cts_saved";
const LS_LANG = "cts_lang";
const docLS = <T,>(k: string, d: T): T => {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : d;
  } catch {
    return d;
  }
};
const ghiLS = (k: string, v: unknown) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
};

export default function GuestApp(p: Props) {
  const [lang, setLang] = useState<Lang>("vi");
  const [saved, setSaved] = useState<Saved[]>([]);
  const [step, setStep] = useState<"nhap" | "bon_so" | "chon" | "ket_qua" | "dang_ky" | "dang_ky_xong">("nhap");
  const [q, setQ] = useState("");
  const [last4, setLast4] = useState("");
  const [ungVien, setUngVien] = useState<UngVien[]>([]);
  const [chon, setChon] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [kq, setKq] = useState<{ serverNow: string; ketQua: KetQuaView[] } | null>(null);
  const [maMoi, setMaMoi] = useState<string | null>(null);
  const t = DICT[lang];

  useEffect(() => {
    const l = docLS<Lang | null>(LS_LANG, null) ?? (navigator.language?.startsWith("vi") ? "vi" : navigator.language ? "en" : "vi");
    setLang(l === "en" ? "en" : "vi");
    setSaved(docLS<Saved[]>(LS_SAVED, []));
  }, []);

  const doiNgonNgu = (l: Lang) => {
    setLang(l);
    ghiLS(LS_LANG, l);
  };

  async function goi<T>(url: string, body: unknown): Promise<T | null> {
    setBusy(true);
    setLoi(null);
    try {
      const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      if (r.status === 429) setLoi(t.tooMany);
      else if (r.status === 410) location.reload();
      else if (!r.ok) setLoi(j.loi && j.loi.length > 20 ? j.loi : t.error);
      else return j as T;
    } catch {
      setLoi(t.error);
    } finally {
      setBusy(false);
    }
    return null;
  }

  async function traCuu(e?: React.FormEvent) {
    e?.preventDefault();
    const j = await goi<{ buoc: string; ungVien?: UngVien[] }>("/api/guest/lookup", { qr: p.qr, q, last4: step === "bon_so" ? last4 : undefined });
    if (!j) return;
    if (j.buoc === "can_4_so") setStep("bon_so");
    else if (j.buoc === "sai_4_so") setLoi(t.notFound);
    else if (j.buoc === "khong_thay") setLoi(t.notFound);
    else if (j.buoc === "chon" && j.ungVien) {
      setUngVien(j.ungVien);
      setChon(j.ungVien.length === 1 ? [j.ungVien[0].tok] : []);
      setStep("chon");
    }
  }

  async function checkIn(toks: string[]) {
    const j = await goi<{ serverNow: string; ketQua: KetQuaView[]; nho: Saved[] }>("/api/guest/checkin", { qr: p.qr, toks });
    if (!j) {
      // Token nhớ hết hạn: bỏ khỏi máy
      return;
    }
    if (j.nho?.length) {
      const m = new Map(saved.map((s) => [s.id, s]));
      j.nho.forEach((n) => m.set(n.id, n));
      const arr = [...m.values()].slice(-6);
      setSaved(arr);
      ghiLS(LS_SAVED, arr);
    }
    setKq(j);
    setStep("ket_qua");
  }

  const boNho = (id: number) => {
    const arr = saved.filter((s) => s.id !== id);
    setSaved(arr);
    ghiLS(LS_SAVED, arr);
  };

  const reset = () => {
    setStep("nhap");
    setQ("");
    setLast4("");
    setUngVien([]);
    setChon([]);
    setKq(null);
    setLoi(null);
  };

  return (
    <main className="waves min-h-dvh pb-10">
      <div className="mx-auto max-w-md px-4 pt-4">
        <header className="mb-4 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {p.trungTam.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.trungTam.logo} alt="" className="size-10 rounded-xl object-contain" />
            ) : (
              <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-brand-2 to-brand text-xl text-white">🏊</div>
            )}
            <div className="min-w-0 leading-tight">
              <div className="truncate font-extrabold text-ink">{lang === "en" ? p.trungTam.en : p.trungTam.vi}</div>
              <div className="truncate text-xs text-ink-2">{p.coSo.ten}</div>
            </div>
          </div>
          <div className="flex rounded-full bg-white p-1 shadow-sm ring-1 ring-line">
            {(["vi", "en"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => doiNgonNgu(l)}
                className={clsx("h-9 min-w-11 rounded-full px-3 text-sm font-bold", lang === l ? "bg-brand text-white" : "text-ink-2")}
                aria-pressed={lang === l}
              >
                {DICT[l].lang}
              </button>
            ))}
          </div>
        </header>

        {step !== "ket_qua" && (p.lop || p.coSo.diaChi) && (
          <div className="mb-4 rounded-2xl bg-white/80 px-4 py-3 text-sm ring-1 ring-line backdrop-blur">
            {p.lop ? (
              <div className="flex items-center gap-2 font-semibold text-ink">
                <GraduationCap className="size-4 text-brand" />
                {t.class}: {p.lop.ten}
                {p.lop.lich ? <span className="font-normal text-ink-2">· {p.lop.lich}</span> : null}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-ink-2">
                <MapPin className="size-4 text-brand" />
                {p.coSo.diaChi}
              </div>
            )}
          </div>
        )}

        {loi && (
          <div role="alert" className="mb-3 rounded-2xl bg-bad-soft px-4 py-3 text-[15px] font-semibold text-bad">
            {loi}
          </div>
        )}

        {step === "nhap" && (
          <>
            {saved.length > 0 && (
              <section className="mb-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-line">
                <h2 className="mb-3 flex items-center gap-2 font-bold">
                  <Users className="size-5 text-brand" /> {t.savedOnDevice}
                </h2>
                <div className="grid gap-2">
                  {saved.map((s) => (
                    <div key={s.id} className="flex items-center gap-2">
                      <button
                        disabled={busy}
                        onClick={() => checkIn([s.tok])}
                        className="flex h-14 flex-1 items-center justify-between rounded-2xl bg-brand-soft px-4 text-left font-bold text-brand ring-1 ring-brand/20 active:scale-[.99]"
                      >
                        <span>{s.tenChe}</span>
                        <span className="text-sm">{t.checkin} →</span>
                      </button>
                      <button onClick={() => boNho(s.id)} className="h-14 rounded-2xl px-3 text-xs font-semibold text-ink-3 ring-1 ring-line" aria-label={t.notMe}>
                        {t.notMe}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
            <form onSubmit={traCuu} className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-line">
              <label htmlFor="q" className="mb-2 flex items-center gap-2 font-bold">
                <Phone className="size-5 text-brand" /> {t.phoneOrCode}
              </label>
              <input
                id="q"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t.phoneOrCodePh}
                inputMode="text"
                autoComplete="tel"
                className="h-14 w-full rounded-2xl border border-line px-4 text-lg outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
              />
              <p className="mt-2 text-sm text-ink-2">{t.hint}</p>
              <button disabled={busy || !q.trim()} className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-2 to-brand text-lg font-bold text-white shadow disabled:opacity-50">
                {busy ? <Loader2 className="size-5 animate-spin" /> : null}
                {t.checkin}
              </button>
            </form>
            {p.coSo.choTuDangKy && (
              <p className="mt-5 text-center text-[15px] text-ink-2">
                {t.newGuest}{" "}
                <button onClick={() => setStep("dang_ky")} className="font-bold text-brand underline-offset-4 hover:underline">
                  {t.register} →
                </button>
              </p>
            )}
          </>
        )}

        {step === "bon_so" && (
          <form onSubmit={traCuu} className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-line">
            <h2 className="text-lg font-bold">{t.last4Title}</h2>
            <p className="mt-1 mb-3 text-sm text-ink-2">{t.last4}</p>
            <input
              value={last4}
              onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
              inputMode="numeric"
              autoFocus
              className="tabular h-16 w-full rounded-2xl border border-line text-center text-3xl tracking-[0.5em] outline-none focus:border-brand"
              placeholder="••••"
            />
            <button disabled={busy || last4.length !== 4} className="mt-4 h-14 w-full rounded-2xl bg-brand text-lg font-bold text-white disabled:opacity-50">
              {t.confirm}
            </button>
            <button type="button" onClick={reset} className="mt-2 flex h-11 w-full items-center justify-center gap-1 font-semibold text-ink-2">
              <ChevronLeft className="size-4" /> {t.back}
            </button>
          </form>
        )}

        {step === "chon" && (
          <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-line">
            <h2 className="text-lg font-bold">{t.pickTitle}</h2>
            {ungVien.length > 1 && <p className="mt-1 text-sm text-ink-2">{t.pickSub}</p>}
            <div className="mt-3 grid gap-2">
              {ungVien.map((u) => {
                const on = chon.includes(u.tok);
                return (
                  <button
                    key={u.tok}
                    onClick={() => setChon(on ? chon.filter((x) => x !== u.tok) : [...chon, u.tok])}
                    className={clsx("flex min-h-16 items-center justify-between rounded-2xl px-4 text-left ring-2 transition", on ? "bg-brand-soft ring-brand" : "bg-white ring-line")}
                    aria-pressed={on}
                  >
                    <span>
                      <span className="block text-[17px] font-bold">{u.tenChe}</span>
                      <span className="text-sm text-ink-2">
                        {t.bornIn} {u.namSinh}
                      </span>
                    </span>
                    <span className={clsx("grid size-7 place-items-center rounded-lg", on ? "bg-brand text-white" : "ring-2 ring-line")}>{on && <Check className="size-5" />}</span>
                  </button>
                );
              })}
            </div>
            {ungVien.length > 1 && (
              <button onClick={() => setChon(ungVien.map((u) => u.tok))} className="mt-2 text-sm font-semibold text-brand">
                {t.selectAll}
              </button>
            )}
            <button
              disabled={busy || !chon.length}
              onClick={() => checkIn(chon)}
              className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-2 to-brand text-lg font-bold text-white disabled:opacity-50"
            >
              {busy && <Loader2 className="size-5 animate-spin" />}
              {t.continueN(chon.length || 1)}
            </button>
            <button onClick={reset} className="mt-2 flex h-11 w-full items-center justify-center gap-1 font-semibold text-ink-2">
              <ChevronLeft className="size-4" /> {t.back}
            </button>
          </section>
        )}

        {step === "ket_qua" && kq && <KetQua kq={kq} lang={lang} onDone={reset} />}

        {step === "dang_ky" && (
          <DangKy
            p={p}
            lang={lang}
            busy={busy}
            onBack={reset}
            onSubmit={async (data) => {
              const j = await goi<{ maKh: string }>("/api/guest/register", { qr: p.qr, ...data });
              if (j) {
                setMaMoi(j.maKh);
                setStep("dang_ky_xong");
              }
            }}
            setLoi={setLoi}
          />
        )}

        {step === "dang_ky_xong" && (
          <section className="rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-line">
            <div className="mx-auto mb-3 grid size-16 place-items-center rounded-full bg-ok-soft text-ok">
              <Check className="size-9" />
            </div>
            <h2 className="text-xl font-extrabold">{t.regDone}</h2>
            <p className="mt-1 text-ink-2">{t.yourCode}</p>
            <div className="tabular my-2 text-3xl font-extrabold tracking-widest text-brand">{maMoi}</div>
            <div className="mt-3 rounded-2xl bg-warn-soft px-4 py-3 font-bold text-warn">{t.regDoneSub}</div>
            <button onClick={reset} className="mt-5 h-12 w-full rounded-2xl bg-brand font-bold text-white">
              {t.done}
            </button>
          </section>
        )}
      </div>
    </main>
  );
}

function KetQua({ kq, lang, onDone }: { kq: { serverNow: string; ketQua: KetQuaView[] }; lang: Lang; onDone: () => void }) {
  const now = useServerClock(kq.serverNow);
  const t = DICT[lang];
  return (
    <div className="grid gap-4">
      {kq.ketQua.map((r, i) => (
        <div key={i} className="grid gap-3">
          <KetQuaBanner r={r} t={t} now={now} />
          <KetQuaChiTiet r={r} t={t} lang={lang} />
        </div>
      ))}
      <button onClick={onDone} className="h-12 rounded-2xl bg-white font-bold text-ink ring-1 ring-line">
        {t.done}
      </button>
    </div>
  );
}

function DangKy({
  p,
  lang,
  busy,
  onBack,
  onSubmit,
  setLoi,
}: {
  p: Props;
  lang: Lang;
  busy: boolean;
  onBack: () => void;
  onSubmit: (d: Record<string, unknown>) => void;
  setLoi: (s: string | null) => void;
}) {
  const t = DICT[lang];
  const [f, setF] = useState({ hoTen: "", ngaySinh: "", sdt: "", phHoTen: "", phSdt: "", phQuanHe: "ME", sanPhamId: "", dongY: false });
  const tuoi = useMemo(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.ngaySinh)) return null;
    const [y, m, d] = f.ngaySinh.split("-").map(Number);
    const n = new Date();
    let a = n.getFullYear() - y;
    if (n.getMonth() + 1 < m || (n.getMonth() + 1 === m && n.getDate() < d)) a--;
    return a;
  }, [f.ngaySinh]);
  const treEm = tuoi != null && tuoi < 18;
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value });
  const inp = "h-12 w-full rounded-xl border border-line px-3 text-[16px] outline-none focus:border-brand focus:ring-4 focus:ring-brand/15";
  const lbl = "mb-1 block text-sm font-semibold";

  if (!p.coSo.choTuDangKy) return <div className="rounded-3xl bg-white p-5 text-center font-semibold">{t.regClosed}</div>;

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!f.hoTen.trim() || !f.ngaySinh || !f.dongY || (treEm && (!f.phHoTen.trim() || !f.phSdt.trim())) || (!treEm && !f.sdt.trim())) {
          setLoi(t.required);
          return;
        }
        onSubmit({ ...f, sanPhamId: f.sanPhamId || null });
      }}
    >
      <div>
        <h2 className="flex items-center gap-2 text-xl font-extrabold">
          <UserPlus className="size-6 text-brand" /> {t.regTitle}
        </h2>
        <p className="text-sm text-ink-2">{t.regSub}</p>
      </div>
      <section className="grid gap-3 rounded-3xl bg-white p-4 ring-1 ring-line">
        <h3 className="font-bold">{t.learner}</h3>
        <label>
          <span className={lbl}>
            {t.fullName} <span className="text-bad">*</span>
          </span>
          <input className={inp} value={f.hoTen} onChange={set("hoTen")} autoComplete="name" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className={lbl}>
              {t.dob} <span className="text-bad">*</span>
            </span>
            <input type="date" className={inp} value={f.ngaySinh} onChange={set("ngaySinh")} max={new Date().toISOString().slice(0, 10)} />
          </label>
          <label>
            <span className={lbl}>
              {treEm ? t.phoneOpt : t.phone}
              {!treEm && <span className="text-bad"> *</span>}
            </span>
            <input className={inp} value={f.sdt} onChange={set("sdt")} inputMode="tel" autoComplete="tel" />
          </label>
        </div>
      </section>
      {(treEm || tuoi == null) && (
        <section className="grid gap-3 rounded-3xl bg-white p-4 ring-1 ring-line">
          <h3 className="font-bold">{t.parent}</h3>
          <p className="-mt-2 text-xs text-ink-2">{t.parentHint}</p>
          <label>
            <span className={lbl}>
              {t.parentName}
              {treEm && <span className="text-bad"> *</span>}
            </span>
            <input className={inp} value={f.phHoTen} onChange={set("phHoTen")} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label>
              <span className={lbl}>
                {t.parentPhone}
                {treEm && <span className="text-bad"> *</span>}
              </span>
              <input className={inp} value={f.phSdt} onChange={set("phSdt")} inputMode="tel" />
            </label>
            <label>
              <span className={lbl}>{t.relation}</span>
              <select className={inp} value={f.phQuanHe} onChange={set("phQuanHe")}>
                {Object.entries(t.relations).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>
      )}
      {p.sanPham.length > 0 && (
        <section className="rounded-3xl bg-white p-4 ring-1 ring-line">
          <label>
            <span className={lbl}>
              {t.wantCourse} <span className="font-normal text-ink-3">({t.optional})</span>
            </span>
            <select className={inp} value={f.sanPhamId} onChange={set("sanPhamId")}>
              <option value="">—</option>
              {p.sanPham.map((s) => (
                <option key={s.id} value={s.id}>
                  {lang === "en" && s.tenEn ? s.tenEn : s.ten}
                </option>
              ))}
            </select>
          </label>
        </section>
      )}
      <label className="flex items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-line">
        <input type="checkbox" className="mt-1 size-5 accent-[var(--brand)]" checked={f.dongY} onChange={set("dongY")} />
        <span className="text-sm text-ink-2">{t.consent}</span>
      </label>
      <button disabled={busy} className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-2 to-brand text-lg font-bold text-white disabled:opacity-50">
        {busy && <Loader2 className="size-5 animate-spin" />}
        {t.submit}
      </button>
      <button type="button" onClick={onBack} className="flex h-11 items-center justify-center gap-1 font-semibold text-ink-2">
        <X className="size-4" /> {t.back}
      </button>
    </form>
  );
}
