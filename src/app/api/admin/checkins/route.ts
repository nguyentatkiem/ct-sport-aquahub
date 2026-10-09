import { sql } from "drizzle-orm";
import { db } from "@/db";
import { layNguoiDung, phamViCoSo } from "@/server/auth";
import { json } from "@/server/http";

/** Mốc mới nhất để màn lễ tân biết có lượt mới (FR-CI-06, dưới 3 giây). */
export async function GET() {
  const u = await layNguoiDung();
  if (!u) return json({ loi: "Chưa đăng nhập" }, 401);
  const cs = await phamViCoSo(u);
  const r = await db.execute(sql`select coalesce(max(id),0)::int as m from check_in ${cs ? sql`where co_so_id = ${cs}` : sql``}`);
  return json({ m: (r.rows[0] as { m: number }).m });
}
