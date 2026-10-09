// Nhật ký thao tác (FR-HT-03): ai, lúc nào, giá trị cũ và mới.
import { db, type Exec } from "@/db";
import { nhatKy } from "@/db/schema";
import type { NguoiDungPhien } from "./auth";

export async function ghiNhatKy(
  ex: Exec,
  user: NguoiDungPhien | null,
  e: {
    module: string;
    hanhDong: string;
    doiTuong?: string;
    giaTriCu?: unknown;
    giaTriMoi?: unknown;
    lyDo?: string | null;
    coSoId?: number | null;
    ip?: string | null;
    thietBi?: string | null;
  },
) {
  await (ex ?? db).insert(nhatKy).values({
    nguoiDungId: user?.id ?? null,
    tenNguoiDung: user?.hoTen ?? null,
    vaiTro: user?.vaiTro ?? null,
    coSoId: e.coSoId ?? user?.coSoId ?? null,
    module: e.module,
    hanhDong: e.hanhDong,
    doiTuong: e.doiTuong ?? null,
    giaTriCu: (e.giaTriCu ?? null) as object | null,
    giaTriMoi: (e.giaTriMoi ?? null) as object | null,
    lyDo: e.lyDo ?? null,
    ip: e.ip ?? null,
    thietBi: e.thietBi ?? null,
  });
}
