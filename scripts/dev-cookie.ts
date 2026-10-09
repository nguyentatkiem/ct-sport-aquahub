// Chỉ dùng khi phát triển: in cookie phiên cho 1 tài khoản để kiểm tra trang bằng curl.
import "dotenv/config";
import { eq } from "drizzle-orm";
import { db, getPool } from "../src/db";
import { nguoiDung } from "../src/db/schema";
import { kyToken } from "../src/server/jwt";

async function main() {
  const email = process.argv[2] ?? "chu@ctsport.local";
  const [u] = await db.select().from(nguoiDung).where(eq(nguoiDung.email, email));
  if (!u) throw new Error("Không có tài khoản " + email);
  console.log(`cts_session=${await kyToken({ uid: u.id, v: u.phienBan })}`);
  await getPool().end();
}
main();
