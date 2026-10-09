import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { eq } from "drizzle-orm";
import { db, getPool } from "@/db";
import { coSo, nguoiDung, sanPham, giaoVien, lopHoc } from "@/db/schema";
import type { NguoiDungPhien } from "@/server/auth";

export async function resetDb() {
  const pool = getPool();
  await pool.query("drop schema if exists public cascade; drop schema if exists drizzle cascade; create schema public;");
  await migrate(drizzle(pool), { migrationsFolder: "drizzle" });
}

export async function seedCoBan() {
  const [cs1, cs2, cs3] = await db
    .insert(coSo)
    .values([
      { ma: "LT", ten: "Cơ sở La Thành" },
      { ma: "CG", ten: "Cơ sở Cầu Giấy" },
      { ma: "HD", ten: "Cơ sở Hà Đông" },
    ])
    .returning();
  const users = await db
    .insert(nguoiDung)
    .values([
      { hoTen: "Chủ", sdt: "0900000001", matKhauHash: "x", vaiTro: "CHU" },
      { hoTen: "Quản lý LT", sdt: "0900000002", matKhauHash: "x", vaiTro: "QUAN_LY", coSoId: cs1.id },
      { hoTen: "Lễ tân LT", sdt: "0900000003", matKhauHash: "x", vaiTro: "LE_TAN", coSoId: cs1.id },
      { hoTen: "Quản lý CG", sdt: "0900000004", matKhauHash: "x", vaiTro: "QUAN_LY", coSoId: cs2.id },
    ])
    .returning();
  const phien = (u: (typeof users)[number]): NguoiDungPhien => ({ id: u.id, hoTen: u.hoTen, vaiTro: u.vaiTro as NguoiDungPhien["vaiTro"], coSoId: u.coSoId });
  const [ve10] = await db
    .insert(sanPham)
    .values({ loai: "THE_VE", ten: "Vé 10 buổi", tenEn: "10-visit pass", giaNiemYet: 500000, soLuot: 10, hanDungNgay: 60, choBaoLuu: true, baoLuuToiDaNgay: 30 })
    .returning();
  const [khoa] = await db
    .insert(sanPham)
    .values({ loai: "KHOA_HOC", ten: "Bơi ếch cơ bản", giaNiemYet: 2500000, soBuoiHoc: 12, soBuoiTotNghiep: 12 })
    .returning();
  const [gv] = await db.insert(giaoVien).values({ hoTen: "Thầy Hùng" }).returning();
  const [lop] = await db.insert(lopHoc).values({ ten: "Ếch CB T3-T5 17h", coSoId: cs1.id, sanPhamId: khoa.id, giaoVienId: gv.id, lichText: "T3, T5 17:00" }).returning();
  return {
    cs1,
    cs2,
    cs3,
    chu: phien(users[0]),
    qlLT: phien(users[1]),
    ltLT: phien(users[2]),
    qlCG: phien(users[3]),
    ve10,
    khoa,
    gv,
    lop,
  };
}

export async function capNhatSanPham(id: number, v: Partial<typeof sanPham.$inferInsert>) {
  await db.update(sanPham).set(v).where(eq(sanPham.id, id));
}
