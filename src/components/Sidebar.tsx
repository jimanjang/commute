"use client";

import { cn } from "@/lib/utils";
import { 
  ChevronLeft, 
  LayoutDashboard, 
  Users, 
  History, 
  BarChart3, 
  Settings, 
  MoreVertical,
  ChevronDown
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: "대시보드", icon: LayoutDashboard, href: "/" },
    { name: "구성원 현황", icon: Users, href: "/admin/members" }, 
  ];

  // For proper navigation, let's redefine menu items with correct icons
  const navItems = [
    { name: "대시보드", icon: LayoutDashboard, href: "/" },
    { name: "구성원 현황", icon: Users, href: "/admin/members" },
  ];

  return (
    <aside className="w-[260px] border-r border-gray-100 h-screen flex flex-col bg-white overflow-y-auto shrink-0 shadow-sm transition-all duration-300">
      {/* Header */}
      <div className="p-6 flex items-center justify-between pb-8">
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center">
            <img src="/logo.png" alt="새콤 출퇴근 관리" className="h-[34px] w-auto transition-transform hover:scale-105" />
          </Link>
        </div>
        <div className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer transition-colors">
          <ChevronLeft className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        <div className="mb-4">
          <p className="px-3 mb-3 text-[11px] font-extrabold text-gray-400 tracking-widest uppercase">Admin Menu</p>
          <ul className="space-y-1.5">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link 
                  href={item.href}
                  className={cn(
                    "flex items-center px-4 py-3 text-[14.5px] rounded-2xl transition-all duration-200 group",
                    pathname === item.href 
                      ? "bg-orange-50 text-orange-600 font-extrabold shadow-sm ring-1 ring-orange-100" 
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon className={cn(
                    "w-5 h-5 mr-3 transition-transform group-hover:scale-110",
                    pathname === item.href ? "text-orange-600" : "text-gray-400 group-hover:text-gray-600"
                  )} />
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-50">
          <p className="px-3 mb-3 text-[11px] font-extrabold text-gray-400 tracking-widest uppercase">Settings</p>
          <ul className="space-y-1.5">
            <li>
              <Link href="/admin/settings" className="flex items-center px-4 py-3 text-[14.5px] rounded-2xl text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all group">
                <Settings className="w-5 h-5 mr-3 text-gray-400 group-hover:text-gray-600" />
                설정
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Footer / Admin Profile */}
      <div className="p-4 m-4 bg-gray-50/50 rounded-2xl border border-gray-100 flex items-center justify-between hover:bg-gray-100 transition-colors cursor-pointer">
        <div className="flex flex-col">
          <div className="text-[13px] font-extrabold text-gray-800 tracking-tight">Admin System</div>
          <div className="text-[11px] text-gray-400 font-medium truncate max-w-[140px]">admin@commute.com</div>
        </div>
        <MoreVertical className="w-4 h-4 text-gray-400" />
      </div>
    </aside>
  );
}
