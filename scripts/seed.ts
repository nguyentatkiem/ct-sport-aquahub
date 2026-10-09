// Tạo dữ liệu nền (bắt buộc) và dữ liệu demo (tuỳ chọn --demo).
// Chạy: npm run db:seed            -> cài đặt, 3 cơ sở, tài khoản Chủ, sản phẩm "Thẻ chuyển đổi"
//       npm run db:seed -- --demo  -> thêm nhân viên, sản phẩm mẫu, lớp, QR, khách và lịch sử 30 ngày
import "dotenv/config";
import { writeFileSync } from "node:fs";
import { eq, sql } from "drizzle-orm";
import { db, getPool } from "../src/db";
import * as s from "../src/db/schema";
import { bamMatKhau } from "../src/server/password";
import { ghiCaiDat } from "../src/server/settings";
import { taoKhach } from "../src/server/customers";
import { banTheVe, ghiDanhKhoaHoc, ghiNhanThu } from "../src/server/sales";
import { thucHienCheckIn } from "../src/server/checkin";
import { tokenNgauNhien } from "../src/lib/text";
import type { NguoiDungPhien } from "../src/server/auth";

const DEMO = process.argv.includes("--demo");
const FILE_TK = process.env.SEED_CRED_FILE || ".seed-credentials.txt";

function matKhauNgauNhien() {
  return tokenNgauNhien(14);
}

async function nen() {
  const [daCo] = await db.select({ n: sql<number>`count(*)::int` }).from(s.coSo);
  if (daCo.n > 0) {
    console.log("CSDL đã có dữ liệu nền, bỏ qua bước nền.");
    return false;
  }
  await ghiCaiDat(db, "tenTrungTam", "Trung tâm bơi CT Sport");
  await ghiCaiDat(db, "tenTrungTamEn", "CT Sport Swimming Center");
  await ghiCaiDat(db, "hotline", "");
  await ghiCaiDat(db, "theDuocDungKhi", "DA_COC");
  await db.insert(s.coSo).values([
    { ma: "LT", ten: "Cơ sở La Thành", diaChi: "La Thành, Hà Nội" },
    { ma: "CB", ten: "Cơ sở 2", diaChi: "Chưa cập nhật địa chỉ" },
    { ma: "CC", ten: "Cơ sở 3", diaChi: "Chưa cập nhật địa chỉ" },
  ]);
  const mk = process.env.SEED_OWNER_PASSWORD || matKhauNgauNhien();
  const email = process.env.SEED_OWNER_EMAIL || "chu@ctsport.local";
  await db.insert(s.nguoiDung).values({ hoTen: "Chủ trung tâm", email, sdt: process.env.SEED_OWNER_PHONE || null, matKhauHash: await bamMatKhau(mk), vaiTro: "CHU" });
  // Sản phẩm dùng cho chuyển đổi thẻ giấy (mục 11.2)
  await db.insert(s.sanPham).values({
    loai: "THE_VE",
    ten: "Thẻ chuyển đổi (thẻ giấy cũ)",
    tenEn: "Converted paper card",
    giaNiemYet: 0,
    laTheChuyenDoi: true,
    trangThai: "DANG_BAN",
    luatChan: "HET_LUOT_HOAC_HET_HAN",
  });
  if (!process.env.SEED_OWNER_PASSWORD) {
    writeFileSync(FILE_TK, `Tài khoản Chủ trung tâm\nĐăng nhập: ${email}\nMật khẩu: ${mk}\nĐổi mật khẩu ngay sau lần đăng nhập đầu.\n`);
    console.log(`Đã ghi tài khoản Chủ vào ${FILE_TK} (không commit file này).`);
  }
  return true;
}

const HO = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Vũ", "Đặng", "Bùi", "Đỗ", "Ngô"];
const DEM = ["Minh", "Gia", "Bảo", "Ngọc", "Đức", "Thanh", "Khánh", "Anh", "Hải", "Thu"];
const TEN = ["An", "Bình", "Châu", "Dũng", "Giang", "Hà", "Khôi", "Linh", "Nam", "Phúc", "Quân", "Trang", "Vy", "Yến"];

function rnd<T>(a: T[], i: number) {
  return a[i % a.length];
}

async function demo() {
  const cs = await db.select().from(s.coSo).orderBy(s.coSo.id);
  const [chu] = await db.select().from(s.nguoiDung).where(eq(s.nguoiDung.vaiTro, "CHU"));
  const pChu: NguoiDungPhien = { id: chu.id, hoTen: chu.hoTen, vaiTro: "CHU", coSoId: null };

  const demoPass = process.env.SEED_STAFF_PASSWORD || matKhauNgauNhien();
  const hash = await bamMatKhau(demoPass);
  const staff = await db
    .insert(s.nguoiDung)
    .values(
      cs.flatMap((c, i) => [
        { hoTen: `Quản lý ${c.ten.replace("Cơ sở ", "")}`, email: `quanly${i + 1}@ctsport.local`, matKhauHash: hash, vaiTro: "QUAN_LY", coSoId: c.id },
        { hoTen: `Lễ tân ${c.ten.replace("Cơ sở ", "")}`, email: `letan${i + 1}@ctsport.local`, matKhauHash: hash, vaiTro: "LE_TAN", coSoId: c.id },
      ]),
    )
    .returning();
  writeFileSync(
    FILE_TK,
    `\nTài khoản demo nhân viên (mật khẩu chung): ${demoPass}\n` + staff.map((u) => `- ${u.email} (${u.vaiTro})`).join("\n") + "\n",
    { flag: "a" },
  );

  // Sản phẩm theo ví dụ trong phiếu khảo sát (giá chỉ để thử)
  const [ve1, ve10, ve30, the31] = await db
    .insert(s.sanPham)
    .values([
      { loai: "THE_VE", ten: "Vé lẻ", tenEn: "Single visit", giaNiemYet: 60000, soLuot: 1, hanDungNgay: 1, nguongCanhBaoLuot: 0, nguongCanhBaoNgay: 0, dungLienCoSo: true },
      { loai: "THE_VE", ten: "Vé 10 buổi", tenEn: "10-visit pass", giaNiemYet: 500000, soLuot: 10, hanDungNgay: 60, choBaoLuu: true, baoLuuToiDaNgay: 30 },
      { loai: "THE_VE", ten: "Vé 30 buổi", tenEn: "30-visit pass", giaNiemYet: 1350000, soLuot: 30, hanDungNgay: 120, choBaoLuu: true, baoLuuToiDaNgay: 30 },
      { loai: "THE_VE", ten: "Thẻ 31 lượt", tenEn: "31-visit card", giaNiemYet: 1500000, soLuot: 31, hanDungNgay: 365, dungLienCoSo: true, choBaoLuu: true, baoLuuToiDaNgay: 60 },
    ])
    .returning();
  const khoa = await db
    .insert(s.sanPham)
    .values([
      { loai: "KHOA_HOC", ten: "Bơi ếch cơ bản", tenEn: "Breaststroke basics", giaNiemYet: 2500000, soBuoiHoc: 12, soBuoiTotNghiep: 12, theVeKemTheoId: ve10.id, choBaoLuu: true, baoLuuToiDaNgay: 30 },
      { loai: "KHOA_HOC", ten: "Bơi sải", tenEn: "Freestyle", giaNiemYet: 3000000, soBuoiHoc: 15, soBuoiTotNghiep: 15, theVeKemTheoId: ve10.id },
      { loai: "KHOA_HOC", ten: "Kèm riêng 1-1", tenEn: "Private 1-1", giaNiemYet: 4500000, soBuoiHoc: 10, soBuoiTotNghiep: 10 },
    ])
    .returning();

  const gvs = await db
    .insert(s.giaoVien)
    .values([{ hoTen: "Thầy Trần Minh Khoa", sdt: "0900111222" }, { hoTen: "Cô Lê Thu Hà", sdt: "0900333444" }, { hoTen: "Thầy Ngô Anh Tuấn", sdt: "0900555666" }])
    .returning();
  for (const [i, g] of gvs.entries()) await db.insert(s.giaoVienCoSo).values({ giaoVienId: g.id, coSoId: cs[i % cs.length].id });

  const lops = [];
  for (const [i, c] of cs.entries()) {
    const [l1] = await db.insert(s.lopHoc).values({ ten: `Ếch cơ bản T3-T5 17h (${c.ma})`, coSoId: c.id, sanPhamId: khoa[0].id, giaoVienId: gvs[i % 3].id, lichText: "Thứ 3, Thứ 5 · 17:00-18:00" }).returning();
    const [l2] = await db.insert(s.lopHoc).values({ ten: `Sải T2-T4-T6 18h (${c.ma})`, coSoId: c.id, sanPhamId: khoa[1].id, giaoVienId: gvs[(i + 1) % 3].id, lichText: "Thứ 2, 4, 6 · 18:00-19:00" }).returning();
    lops.push(l1, l2);
    await db.insert(s.maQr).values([
      { loai: "QUAY", ten: `Quầy lễ tân ${c.ten}`, coSoId: c.id, token: tokenNgauNhien() },
      { loai: "LOP", ten: l1.ten, coSoId: c.id, lopHocId: l1.id, token: tokenNgauNhien() },
      { loai: "LOP", ten: l2.ten, coSoId: c.id, lopHocId: l2.id, token: tokenNgauNhien() },
    ]);
  }

  // Khách + giao dịch + check-in trong 30 ngày qua
  const now = Date.now();
  const ngayTruoc = (d: number, gio = 17) => new Date(now - d * 86400000 - ((now / 3600000) % 24) * 3600000 + (gio - 7) * 3600000);
  let i = 0;
  for (const c of cs) {
    const le = staff.find((u) => u.coSoId === c.id && u.vaiTro === "LE_TAN")!;
    const pLe: NguoiDungPhien = { id: le.id, hoTen: le.hoTen, vaiTro: "LE_TAN", coSoId: c.id };
    const soKhach = c.ma === "CB" ? 14 : 22;
    for (let n = 0; n < soKhach; n++, i++) {
      const tre = n % 3 !== 0;
      const hoTen = `${rnd(HO, i)} ${rnd(DEM, i * 7)} ${rnd(TEN, i * 3)}`;
      const k = await taoKhach(
        {
          hoTen,
          ngaySinh: tre ? `20${String(12 + (i % 8)).padStart(2, "0")}-0${1 + (i % 9)}-1${i % 9}` : `19${80 + (i % 15)}-0${1 + (i % 9)}-2${i % 8}`,
          sdt: tre ? null : `09${String(10000000 + i * 7919).slice(0, 8)}`,
          lienHe: tre ? { hoTen: `${rnd(HO, i)} Thị ${rnd(TEN, i + 5)}`, sdt: `08${String(20000000 + Math.floor(i / 2) * 104729).slice(0, 8)}`, quanHe: i % 2 ? "ME" : "BO" } : null,
          coSoId: c.id,
        },
        { nguonTao: "NV_NHAP", user: pLe },
      );
      const batDau = 25 - (n % 20);
      const sp = [ve10, ve30, the31, ve10][n % 4];
      const { don } = await banTheVe({
        khachHangId: k.id,
        sanPhamId: sp.id,
        coSoId: c.id,
        giaThucThu: n % 7 === 0 ? sp.giaNiemYet - 50000 : sp.giaNiemYet,
        lyDoGiam: n % 7 === 0 ? "Gia đình từ 3 người" : null,
        thu: { soTien: n % 5 === 0 ? Math.round(sp.giaNiemYet / 2) : sp.giaNiemYet - (n % 7 === 0 ? 50000 : 0), hinhThuc: n % 2 ? "TIEN_MAT" : "CHUYEN_KHOAN" },
        user: pLe,
        now: ngayTruoc(batDau, 9),
      });
      const coKhoa = tre && n % 2 === 0;
      const lop = lops.filter((l) => l.coSoId === c.id)[n % 2];
      if (coKhoa) {
        await ghiDanhKhoaHoc({
          khachHangId: k.id,
          sanPhamId: lop.sanPhamId,
          lopHocId: lop.id,
          coSoId: c.id,
          giaThucThu: khoa.find((x) => x.id === lop.sanPhamId)!.giaNiemYet,
          thu: { soTien: 1000000, hinhThuc: "CHUYEN_KHOAN" },
          user: pLe,
          now: ngayTruoc(batDau, 9),
        });
      }
      if (n % 5 === 0) await ghiNhanThu({ donHangId: don.id, loai: "THANH_TOAN", thu: { soTien: Math.round(sp.giaNiemYet / 4), hinhThuc: "TIEN_MAT" }, user: pLe, now: ngayTruoc(batDau - 3, 10) });
      // Lịch sử check-in
      const soLan = sp.id === ve10.id ? 6 + (n % 5) : 8 + (n % 9);
      for (let d = batDau - 1, lan = 0; d >= 0 && lan < soLan; d -= 1 + (n % 3), lan++) {
        const gio = [6, 7, 16, 17, 18, 19][(n + lan) % 6];
        if (ngayTruoc(d, gio).getTime() > Date.now()) continue;
        await thucHienCheckIn({ khachHangId: k.id, coSoId: c.id, lopHocId: coKhoa ? lop.id : null, kenh: lan % 4 === 0 ? "LE_TAN" : "KHACH_TU_QUET", nguoiThaoTac: lan % 4 === 0 ? pLe : null, now: ngayTruoc(d, gio) });
      }
    }
    // 2 hồ sơ tự đăng ký chờ duyệt
    for (let n = 0; n < 2; n++, i++) {
      await taoKhach(
        { hoTen: `${rnd(HO, i + 3)} ${rnd(DEM, i)} ${rnd(TEN, i + 1)}`, ngaySinh: "2016-06-0" + (n + 1), lienHe: { hoTen: "Phụ huynh " + rnd(TEN, i), sdt: `07${String(30000000 + i * 1009).slice(0, 8)}`, quanHe: "ME" }, coSoId: c.id, khoaHocMuonDangKyId: khoa[0].id, dongYDuLieu: true },
        { nguonTao: "KHACH_TU_DANG_KY", user: null },
      );
    }
  }
  void ve1;
  void pChu;
  console.log(`Đã tạo dữ liệu demo: ${i} khách, ${staff.length} nhân viên.`);
}

async function main() {
  await nen();
  if (DEMO) {
    const [x] = await db.select({ n: sql<number>`count(*)::int` }).from(s.khachHang);
    if (x.n > 0) console.log("Đã có khách, bỏ qua dữ liệu demo.");
    else await demo();
  }
  await getPool().end();
}

main().catch(async (e) => {
  console.error(e);
  await getPool().end();
  process.exit(1);
});
