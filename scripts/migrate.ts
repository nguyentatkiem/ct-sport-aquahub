import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Thiếu DATABASE_URL");
  const pool = new Pool({ connectionString: url, ssl: /sslmode=require|neon\.tech/.test(url) ? { rejectUnauthorized: false } : undefined });
  await pool.query("create extension if not exists pg_trgm").catch(() => {});
  await migrate(drizzle(pool), { migrationsFolder: "drizzle" });
  await pool.query("create index if not exists kh_tim_kiem_trgm on khach_hang using gin (tim_kiem gin_trgm_ops)").catch((e) => console.warn("Bỏ qua index trgm:", e.message));
  console.log("Đã chạy migration");
  await pool.end();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
