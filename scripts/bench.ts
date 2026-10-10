// Đo thời gian các truy vấn chính trên CSDL lớn (NFR-02). Chạy: DATABASE_URL=... npx tsx scripts/bench.ts
import "dotenv/config";
import { getPool } from "../src/db";
import { dsKhach, dsCheckIn, tongQuan, dsSapHet, chiTietKhach, dsHetTheChuaMua, dsCongNo } from "../src/server/queries";
import { bc01, bc04, bc05, bc07 } from "../src/server/reports";
import { traCuuKhach } from "../src/server/guest";
import { thucHienCheckIn } from "../src/server/checkin";
import { congNgay, ngayVN } from "../src/lib/time";

async function t(ten: string, fn: () => Promise<unknown>) {
  await fn();
  const a = performance.now();
  await fn();
  const ms = performance.now() - a;
  console.log(`${ms > 1000 ? "CHẬM" : ms > 300 ? "vừa" : "  ok"}  ${ms.toFixed(0).padStart(5)} ms  ${ten}`);
}

async function main() {
  const hn = ngayVN();
  const dau = hn.slice(0, 8) + "01";
  const pool = getPool();
  const k = (await pool.query("select id from khach_hang where ma_kh like 'P%' order by id desc limit 1")).rows[0].id;
  await t("Q3 tìm tên không dấu 'van khach 1999'", () => dsKhach({ coSoId: null, q: "van khach 1999" }));
  await t("Q3 tìm SĐT '0910019'", () => dsKhach({ coSoId: null, q: "0910019" }));
  await t("Q3 tìm mã thẻ 'TP00012'", () => dsKhach({ coSoId: null, q: "TP00012" }));
  await t("Q3 trang đầu không lọc", () => dsKhach({ coSoId: 1 }));
  await t("Q2 check-in hôm nay", () => dsCheckIn({ coSoId: null, ngay: hn, limit: 500 }));
  await t("Q1 tổng quan", () => tongQuan(null, hn));
  await t("Q5 sắp hết", () => dsSapHet({ coSoId: null }));
  await t("Hết thẻ chưa mua lại", () => dsHetTheChuaMua(null));
  await t("Công nợ", () => dsCongNo(null));
  await t("Q4 chi tiết khách", () => chiTietKhach(k));
  await t("Tra cứu khách theo SĐT (trang khách)", () => traCuuKhach("0910019999"));
  await t("BC-01 tháng", () => bc01({ tu: dau, den: hn, coSoId: null }));
  await t("BC-04 tháng", () => bc04({ tu: dau, den: hn, coSoId: null }));
  await t("BC-05 tháng", () => bc05({ tu: dau, den: hn, coSoId: null }));
  await t("BC-07 năm", () => bc07({ tu: congNgay(hn, -365), den: hn, coSoId: null }));
  await t("Check-in 1 khách (giao dịch)", () => thucHienCheckIn({ khachHangId: k, coSoId: 3, kenh: "LE_TAN", now: new Date(Date.now() + Math.random() * 1e9) }));
  await pool.end();
}
main();
