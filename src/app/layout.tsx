import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { Providers } from "@/components/Providers";
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  // Server-side protection
  const headerList = await headers();
  const fullUrl = headerList.get("x-url") || "";
  const pathname = fullUrl ? new URL(fullUrl, "http://localhost").pathname : "";

  if (!session && !pathname.startsWith("/auth")) {
    redirect("/auth/signin");
  }

  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 flex min-h-screen overflow-hidden text-gray-900`}>
        <Providers session={session}>
          <div className="flex w-full h-screen overflow-hidden">
            {session && <Sidebar />}
            <main className={`flex-1 overflow-y-auto ${session ? "bg-gray-50/50" : "bg-white"}`}>
              <div className={session ? "max-w-7xl mx-auto px-6 py-8 md:px-10 md:py-12" : "w-full min-h-screen"}>
                {children}
              </div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}



