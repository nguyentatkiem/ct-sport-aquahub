// Sinh mã tự động (D3, mục 4.3). Bộ đếm cập nhật nguyên tử trong CSDL nên 3 cơ sở tạo cùng lúc không trùng.
import { sql } from "drizzle-orm";
import type { Exec } from "@/db";

async function tangBoDem(ex: Exec, tienTo: string, nam: number): Promise<number> {
  const r = await ex.execute(sql`
    insert into bo_dem (tien_to, nam, gia_tri) values (${tienTo}, ${nam}, 1)
    on conflict (tien_to, nam) do update set gia_tri = bo_dem.gia_tri + 1
    returning gia_tri`);
  return Number((r.rows[0] as { gia_tri: number }).gia_tri);
}

const pad = (n: number, w = 5) => String(n).padStart(w, "0");
const yy = (ngay: string) => Number(ngay.slice(2, 4));

/** Mã khách: [mã cơ sở 2 chữ][5 số], VD LT00125. */
export async function sinhMaKhach(ex: Exec, maCoSo: string): Promise<string> {
  return maCoSo.toUpperCase() + pad(await tangBoDem(ex, "KH-" + maCoSo.toUpperCase(), 0));
}

/** Mã thẻ vé: TV[yy][5 số]. */
export async function sinhMaThe(ex: Exec, ngay: string): Promise<string> {
  const y = yy(ngay);
  return `TV${String(y).padStart(2, "0")}${pad(await tangBoDem(ex, "TV", y))}`;
}

/** Mã đơn hàng: DH[yy][5 số]. */
export async function sinhMaDon(ex: Exec, ngay: string): Promise<string> {
  const y = yy(ngay);
  return `DH${String(y).padStart(2, "0")}${pad(await tangBoDem(ex, "DH", y))}`;
}

/** Mã phiếu thu: PT[yy][5 số] (đặc tả chưa quy định, dùng cùng mẫu với đơn). */
export async function sinhMaPhieu(ex: Exec, ngay: string): Promise<string> {
  const y = yy(ngay);
  return `PT${String(y).padStart(2, "0")}${pad(await tangBoDem(ex, "PT", y))}`;
}
