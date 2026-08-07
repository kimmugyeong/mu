import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tennis Joa | 테니스 좋아",
  description: "테니스 동호회 전적, 경기, 월례회, 단체복 스마트 관리 앱",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="bg-slate-200/70 flex justify-center min-h-screen text-slate-900 antialiased font-sans">
        {/* 모바일 화면 최적화 중앙 정렬 프레임 레이아웃 */}
        <div className="w-full max-w-md sm:max-w-lg bg-slate-50 min-h-screen shadow-2xl flex flex-col relative border-x border-slate-200/80 pb-20">
          {children}
        </div>
      </body>
    </html>
  );
}