import { sql } from "drizzle-orm";
import { db } from "@/db";
import { gioiHanTraCuu } from "@/db/schema";

/** Đếm số lần theo khoá trong phút hiện tại; true nếu vượt `max` (NFR-06). */
export async function vuotGioiHan(khoa: string, max = 10): Promise<boolean> {
  const phut = Math.floor(Date.now() / 60000);
  const r = await db.execute(sql`
    insert into gioi_han_tra_cuu (khoa, phut, so_lan) values (${khoa}, ${phut}, 1)
    on conflict (khoa, phut) do update set so_lan = gioi_han_tra_cuu.so_lan + 1
    returning so_lan`);
  if (Math.random() < 0.02) await db.delete(gioiHanTraCuu).where(sql`${gioiHanTraCuu.phut} < ${phut - 60}`);
  return Number((r.rows[0] as { so_lan: number }).so_lan) > max;
}
