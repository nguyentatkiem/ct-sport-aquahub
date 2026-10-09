import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

const font = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Quản lý khách trung tâm bơi", template: "%s · Trung tâm bơi" },
  description: "Check-in QR, thẻ vé, khoá học, thu tiền và báo cáo cho trung tâm bơi nhiều cơ sở.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b84f3",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={font.variable}>
      <body className="min-h-dvh bg-[var(--bg)] text-[var(--ink)] antialiased">{children}</body>
    </html>
  );
}
