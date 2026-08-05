import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Mobile App",
  description: "Vercel 모바일 웹 앱",
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
      <body className="bg-gray-100 flex justify-center min-h-screen">
        {/* 모바일 스마트폰 비율의 프레임 레이아웃 */}
        <div className="w-full max-w-md bg-white min-h-screen shadow-lg flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}