"use server";
import { redirect } from "next/navigation";
import { dangNhap } from "@/server/auth";

export async function dangNhapAction(_: { loi: string }, fd: FormData) {
  const r = await dangNhap(String(fd.get("id") ?? ""), String(fd.get("mk") ?? ""));
  if (!r.ok) return { loi: r.loi };
  redirect("/admin");
}
