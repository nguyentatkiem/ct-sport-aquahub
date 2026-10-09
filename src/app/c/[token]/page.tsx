import { and, eq, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { sanPham } from "@/db/schema";
import { giaiMaQr } from "@/server/guest";
import { docCaiDat } from "@/server/settings";
import GuestApp from "./guest-app";
import { DICT } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata = { title: "Check-in" };

export default async function CheckinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const qr = await giaiMaQr(token);
  const cd = await docCaiDat();
  if (!qr || !qr.hieuLuc) {
    // FR-LH-04: QR cũ mở ra trang báo hết hiệu lực
    return (
      <main className="waves grid min-h-dvh place-items-center p-6 text-center">
        <div className="max-w-sm">
          <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-bad-soft text-3xl">⛔</div>
          <h1 className="text-xl font-extrabold">{DICT.vi.expiredQr}</h1>
          <p className="mt-2 text-ink-2">{DICT.vi.expiredQrSub}</p>
          <p className="mt-6 text-sm font-semibold">{DICT.en.expiredQr}</p>
          <p className="text-sm text-ink-3">{DICT.en.expiredQrSub}</p>
        </div>
      </main>
    );
  }
  const sp = qr.coSo.choTuDangKy
    ? await db
        .select({ id: sanPham.id, ten: sanPham.ten, tenEn: sanPham.tenEn, loai: sanPham.loai })
        .from(sanPham)
        .where(
          and(
            eq(sanPham.trangThai, "DANG_BAN"),
            eq(sanPham.laTheChuyenDoi, false),
            or(isNull(sanPham.coSoApDung), sql`${qr.coSo.id} = any(${sanPham.coSoApDung})`),
          ),
        )
        .orderBy(sanPham.loai, sanPham.ten)
    : [];
  return (
    <GuestApp
      qr={token}
      trungTam={{ vi: cd.tenTrungTam, en: cd.tenTrungTamEn || cd.tenTrungTam, logo: cd.logoUrl }}
      coSo={{ ten: qr.coSo.ten, diaChi: qr.coSo.diaChi, choTuDangKy: qr.coSo.choTuDangKy }}
      lop={qr.lop}
      sanPham={sp}
    />
  );
}
