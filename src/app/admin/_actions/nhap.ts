"use server";
import { revalidatePath } from "next/cache";
import { canQuyen } from "@/server/auth";
import { chay } from "@/server/action";
import { docVaKiemTra, nhapKhach } from "@/server/import";
import { LoiNghiepVu } from "@/server/sales";

async function layFile(fd: FormData) {
  const f = fd.get("file");
  if (!(f instanceof File) || f.size === 0) throw new LoiNghiepVu("Chọn file Excel");
  if (f.size > 5_000_000) throw new LoiNghiepVu("File tối đa 5 MB");
  return f.arrayBuffer();
}

export async function kiemTraNhapAction(fd: FormData) {
  return chay(async () => {
    const u = await canQuyen("NHAP_EXCEL");
    const kt = await docVaKiemTra(await layFile(fd), u);
    return { loi: kt.loi, trung: kt.trung, soHopLe: kt.hopLe.length, xem: kt.hopLe.slice(0, 20).map((x) => ({ dong: x.dong, hoTen: x.hoTen, ngaySinh: x.d.ngaySinh, soLuot: x.soLuot, han: x.hanThe })) };
  });
}

export async function nhapAction(fd: FormData) {
  return chay(async () => {
    const u = await canQuyen("NHAP_EXCEL");
    const r = await nhapKhach(await layFile(fd), u, fd.get("boQuaTrung") === "on");
    revalidatePath("/admin/khach");
    return r;
  });
}
