import "server-only";
import { LoiQuyen } from "./auth";
import { LoiNghiepVu } from "./sales";

export type KetQuaAction<T = unknown> = { ok: boolean; loi?: string; data?: T; at?: number };

/** Bọc server action: trả lỗi nghiệp vụ thành thông báo, lỗi khác ghi log. */
export async function chay<T>(fn: () => Promise<T>): Promise<KetQuaAction<T>> {
  try {
    const data = await fn();
    return { ok: true, data, at: Date.now() };
  } catch (e) {
    if (e instanceof LoiNghiepVu || e instanceof LoiQuyen) return { ok: false, loi: e.message, at: Date.now() };
    const msg = (e as Error)?.message ?? "";
    if (msg === "NEXT_REDIRECT" || (e as { digest?: string })?.digest?.startsWith?.("NEXT_REDIRECT")) throw e;
    console.error(e);
    return { ok: false, loi: msg && msg.length < 160 ? msg : "Có lỗi xảy ra, vui lòng thử lại", at: Date.now() };
  }
}

export function soTien(v: FormDataEntryValue | null): number {
  const n = Number(String(v ?? "").replace(/[^\d-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}
export function chuoi(v: FormDataEntryValue | null): string {
  return String(v ?? "").trim();
}
export function so(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
