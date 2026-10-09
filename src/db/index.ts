import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export type DB = NodePgDatabase<typeof schema>;
export type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];
export type Exec = DB | Tx;

const g = globalThis as unknown as { __ctsPool?: Pool; __ctsDb?: DB };

export function getPool(): Pool {
  if (!g.__ctsPool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("Thiếu biến môi trường DATABASE_URL");
    g.__ctsPool = new Pool({
      connectionString: url,
      max: Number(process.env.DB_POOL_MAX ?? 5),
      ssl: /sslmode=require|neon\.tech/.test(url) ? { rejectUnauthorized: false } : undefined,
    });
  }
  return g.__ctsPool;
}

export const db: DB = new Proxy({} as DB, {
  get(_t, prop) {
    if (!g.__ctsDb) g.__ctsDb = drizzle(getPool(), { schema });
    return Reflect.get(g.__ctsDb, prop);
  },
});

export { schema };
