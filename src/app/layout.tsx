import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { Suspense } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "근태 관리 대시보드",
  description: "BigQuery 연동 근태 관리 대시보드",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#f4f6f8] flex h-screen overflow-hidden`}>
        <Sidebar />
        <div className="flex-1 flex flex-col h-full relative min-w-0 bg-[#f4f6f8]">
          <Suspense fallback={<header className="h-[60px] border-b border-gray-200 flex items-center px-6 bg-white"><div className="w-24 h-6 bg-gray-200 animate-pulse rounded"></div></header>}>
            <Topbar />
          </Suspense>
          <main className="flex-1 overflow-y-auto w-full max-w-7xl mx-auto p-6 md:p-8 custom-scrollbar">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
