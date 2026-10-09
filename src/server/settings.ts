import { eq } from "drizzle-orm";
import { db, type Exec } from "@/db";
import { caiDat } from "@/db/schema";

export type CaiDat = {
  tenTrungTam: string;
  tenTrungTamEn: string;
  logoUrl: string | null;
  hotline: string;
  theDuocDungKhi: "DA_THU_DU" | "DA_COC" | "NGAY_KHI_TAO";
};

export const CAI_DAT_MAC_DINH: CaiDat = {
  tenTrungTam: "Trung tâm bơi",
  tenTrungTamEn: "Swimming Center",
  logoUrl: null,
  hotline: "",
  theDuocDungKhi: "DA_COC",
};

export async function docCaiDat(ex: Exec = db): Promise<CaiDat> {
  const rows = await ex.select().from(caiDat);
  const out: Record<string, unknown> = { ...CAI_DAT_MAC_DINH };
  for (const r of rows) out[r.khoa] = r.giaTri;
  return out as CaiDat;
}

export async function ghiCaiDat(ex: Exec, khoa: keyof CaiDat, giaTri: unknown) {
  const existing = await ex.select().from(caiDat).where(eq(caiDat.khoa, khoa));
  if (existing.length) await ex.update(caiDat).set({ giaTri: giaTri as object }).where(eq(caiDat.khoa, khoa));
  else await ex.insert(caiDat).values({ khoa, giaTri: giaTri as object });
}
