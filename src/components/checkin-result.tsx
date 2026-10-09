"use client";
// Màn kết quả M3 (BR-14): nền xanh/vàng/đỏ, ngày giờ máy chủ, đồng hồ chạy từng giây, mã xác nhận, hiệu ứng chuyển động.
import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Clock } from "lucide-react";
import clsx from "clsx";
import type { KetQuaView } from "@/server/checkin";
import type { Dict } from "@/lib/i18n";

const VN = 7 * 3600 * 1000;
function vn(d: number) {
  const x = new Date(d + VN);
  const p = (n: number) => String(n).padStart(2, "0");
  return { ngay: `${p(x.getUTCDate())}/${p(x.getUTCMonth() + 1)}/${x.getUTCFullYear()}`, gio: `${p(x.getUTCHours())}:${p(x.getUTCMinutes())}`, giay: `${p(x.getUTCHours())}:${p(x.getUTCMinutes())}:${p(x.getUTCSeconds())}` };
}
const fmtNgay = (s: string | null | undefined) => (s ? s.slice(0, 10).split("-").reverse().join("/") : "");

/** Đồng hồ theo giờ máy chủ: lệch = giờ máy chủ - giờ máy khách lúc nhận kết quả. */
export function useServerClock(serverNowIso: string) {
  const [offset] = useState(() => new Date(serverNowIso).getTime() - Date.now());
  const [now, setNow] = useState(() => Date.now() + offset);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now() + offset), 1000);
    return () => clearInterval(t);
  }, [offset]);
  return now;
}

const TONE = {
  XANH: { bg: "from-emerald-500 to-green-600", soft: "bg-ok-soft text-ok", Icon: CheckCircle2 },
  VANG: { bg: "from-amber-400 to-orange-500", soft: "bg-warn-soft text-warn", Icon: AlertTriangle },
  DO: { bg: "from-rose-500 to-red-600", soft: "bg-bad-soft text-bad", Icon: XCircle },
} as const;

export function KetQuaBanner({ r, t, now }: { r: KetQuaView; t: Dict; now: number }) {
  const tone = TONE[r.mau];
  const luc = vn(new Date(r.thoiGian).getTime());
  const title =
    r.ketQua === "DA_CHECKIN"
      ? t.alreadyAt(r.lanCheckinTruoc ? vn(new Date(r.lanCheckinTruoc).getTime()).gio : luc.gio)
      : r.mau === "XANH"
        ? t.successAt(luc.ngay, luc.gio)
        : r.mau === "VANG" && (r.ketQua === "CANH_BAO" || r.ketQua === "VUOT_CHAN")
          ? t.warnAt(luc.ngay, luc.gio)
          : r.mau === "VANG"
            ? t.seeReception
            : t.blockedAt(luc.ngay, luc.gio);
  return (
    <div className={clsx("sweep relative overflow-hidden rounded-3xl bg-gradient-to-br p-5 text-white shadow-lg", tone.bg)}>
      <div className="flex items-start gap-3">
        <div className="pulse-ring grid size-14 shrink-0 place-items-center rounded-full bg-white/20">
          <tone.Icon className="size-9" strokeWidth={2.4} />
        </div>
        <div className="min-w-0">
          <div className="text-xl leading-tight font-extrabold">{title}</div>
          {r.ketQua === "DA_CHECKIN" && <div className="mt-1 text-sm text-white/90">{t.alreadySub}</div>}
          {r.lyDo && r.ketQua !== "DA_CHECKIN" && (
            <div className="mt-1 text-[15px] font-medium text-white/95">
              {t.reasons[r.lyDo] ?? r.lyDoText}
              {r.ketQua === "CANH_BAO" ? " " + t.warnLetIn : ""}
              {r.lyDo === "BAO_LUU" && r.baoLuuDen ? " " + t.holdUntil(fmtNgay(r.baoLuuDen)) : ""}
            </div>
          )}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-white/15 px-3 py-2">
          <div className="flex items-center gap-1 text-xs text-white/85">
            <Clock className="size-3.5" /> {t.nowClock} · {vn(now).ngay}
          </div>
          <div className="tabular text-2xl font-extrabold">{vn(now).giay}</div>
        </div>
        <div className="rounded-2xl bg-white/15 px-3 py-2">
          <div className="text-xs text-white/85">{t.confirmCode}</div>
          <div className="tabular text-2xl font-extrabold tracking-[0.2em]">{r.maXacNhan ?? "—"}</div>
        </div>
      </div>
    </div>
  );
}

export function KetQuaChiTiet({ r, t, lang }: { r: KetQuaView; t: Dict; lang: "vi" | "en" }) {
  const row = (k: string, v: React.ReactNode, cls?: string) =>
    v === null || v === undefined || v === "" ? null : (
      <div className="flex items-center justify-between gap-3 border-b border-line/70 py-2 last:border-0">
        <span className="text-sm text-ink-2">{k}</span>
        <span className={clsx("text-right text-[15px] font-semibold text-ink", cls)}>{v}</span>
      </div>
    );
  const sh = r.sapHet;
  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-line">
      <div className="mb-1 text-lg font-extrabold">{r.khach.hoTen}</div>
      {row(t.customerCode, r.khach.maKh)}
      {r.the && (
        <>
          {row(t.ticket, lang === "en" && r.the.tenEn ? r.the.tenEn : r.the.ten)}
          {row(
            t.remaining,
            r.the.conLai == null ? t.unlimited : `${r.the.conLai}${r.the.soLuotGoc ? " / " + r.the.soLuotGoc : ""}`,
            r.the.conLai != null && r.the.conLai <= 0 ? "text-bad" : sh ? "text-warn" : "text-ok",
          )}
          {row(t.purchased, fmtNgay(r.the.ngayMua))}
          {row(t.expires, r.the.ngayHetHan ? fmtNgay(r.the.ngayHetHan) : t.noExpiry)}
        </>
      )}
      {r.ghiDanh && row(t.course, r.ghiDanh.tenKhoaHoc)}
      {r.lop && row(t.class, r.lop.ten)}
      {r.lop?.giaoVien && row(t.teacher, r.lop.giaoVien)}
      {r.ghiDanh && row(t.session, `${r.ghiDanh.buoi}${r.ghiDanh.tong ? " / " + r.ghiDanh.tong : ""}`)}
      {sh && r.mau === "XANH" && (
        <div className="mt-3 rounded-2xl bg-warn-soft px-3 py-2 text-sm font-semibold text-warn">
          {t.soonOut(sh.conLuot != null ? t.left(sh.conLuot) : "", sh.ngayHetHan ? t.expOn(fmtNgay(sh.ngayHetHan)) : "")}
        </div>
      )}
    </div>
  );
}
