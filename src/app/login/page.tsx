import { redirect } from "next/navigation";
import { layNguoiDung } from "@/server/auth";
import { docCaiDat } from "@/server/settings";
import LoginForm from "./form";

export const metadata = { title: "Đăng nhập" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await layNguoiDung()) redirect("/admin");
  const cd = await docCaiDat();
  return (
    <main className="waves grid min-h-dvh place-items-center p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl ring-1 ring-line">
        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-2 to-brand text-2xl text-white">🏊</div>
          <h1 className="text-xl font-extrabold">{cd.tenTrungTam}</h1>
          <p className="text-sm text-ink-2">Đăng nhập nhân viên bằng SĐT hoặc email</p>
        </div>
        <LoginForm />
        <p className="mt-5 text-center text-xs text-ink-3">Quên mật khẩu? Liên hệ Chủ trung tâm để được đặt lại.</p>
      </div>
    </main>
  );
}
