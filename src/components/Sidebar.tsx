"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Bell,
  History,
  RefreshCw,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/members", label: "구성원 현황", icon: Users },
  { href: "/admin/notifications", label: "알림 관리", icon: Bell },
  { href: "/admin/logs", label: "기록 수정 로그", icon: History },
  { href: "/admin/sync", label: "동기화 상태", icon: RefreshCw },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-xl bg-white/80 backdrop-blur text-gray-900 shadow-sm border border-gray-200"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-full w-64
          bg-white
          border-r border-gray-200
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:static md:z-auto shrink-0
        `}
      >
        {/* Logo */}
        <div className="px-6 py-6 border-b border-gray-100 flex items-center justify-start">
          <Link href="/" className="flex items-center">
            <img
              src="/logo.png"
              alt="Karrot Service"
              className="h-10 w-auto object-contain hover:scale-105 transition-transform"
            />
          </Link>
        </div>


        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          <p className="px-4 mb-2 text-[10px] font-black text-gray-400 tracking-widest uppercase opacity-50">Admin Menu</p>
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-2xl text-[14px] font-bold
                  transition-all duration-200 group
                  ${isActive
                    ? "bg-orange-50 text-[#FF6F0F] shadow-sm ring-1 ring-orange-100/50"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  }
                `}
              >
                <item.icon
                  className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive
                    ? "text-[#FF6F0F]"
                    : "text-gray-400 group-hover:text-gray-600"
                    }`}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer (Profile & Logout) */}
        <div className="p-4 border-t border-gray-100 space-y-3 bg-gray-50/30">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-xs font-bold text-white overflow-hidden shadow-md ring-2 ring-white">
              {session?.user?.image ? (
                <img src={session.user.image} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                session?.user?.name?.charAt(0) || "A"
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[13px] font-black text-gray-900 truncate">
                {session?.user?.name || "Admin"}
              </p>
              <p className="text-[10px] font-bold text-gray-400 truncate opacity-70">
                {session?.user?.email || "Super Admin"}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 rounded-xl text-[12px] font-black text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all border border-gray-200/50 bg-white hover:border-red-100 shadow-sm"
          >
            <LogOut size={14} className="opacity-70" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
