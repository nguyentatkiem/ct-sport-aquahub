// Mở khi ai đó quét QR cá nhân bằng điện thoại: không hiện dữ liệu khách.
export const metadata = { title: "Thẻ cá nhân" };

export default function TheCaNhan() {
  return (
    <main className="waves grid min-h-dvh place-items-center p-6 text-center">
      <div className="max-w-sm">
        <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-white text-3xl shadow">🏊</div>
        <h1 className="text-xl font-extrabold">Thẻ check-in cá nhân</h1>
        <p className="mt-2 text-ink-2">Đưa mã QR này vào máy check-in tại quầy lễ tân. Mã không chứa thông tin cá nhân.</p>
        <p className="mt-4 text-sm text-ink-3">Personal check-in card · Show this code to the kiosk at the front desk.</p>
      </div>
    </main>
  );
}
