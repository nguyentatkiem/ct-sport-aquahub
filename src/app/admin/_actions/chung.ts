"use server";
import { revalidatePath } from "next/cache";
import { canDangNhap, chonCoSo } from "@/server/auth";

export async function chonCoSoAction(id: number) {
  const u = await canDangNhap();
  if (u.vaiTro !== "CHU") return;
  await chonCoSo(id);
  revalidatePath("/admin", "layout");
}
