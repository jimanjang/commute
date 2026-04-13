"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Bell, LogOut, Users } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

export function Topbar() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<{name: string, sabun: string, displayName?: string}[]>([]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const selectedParam = searchParams.get("name") || "전체";
  const selectedUser = users.find(u => u.name === selectedParam);
  const selectedDisplayName = selectedUser?.displayName || (selectedParam === "전체" ? "전체 보기" : selectedParam);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const data = await res.json();
          setUsers(data.users || []);
        }
      } catch (err) {
        console.error("Failed to load user list:", err);
      }
    }
    fetchUsers();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredUsers = users.filter(u => 
    (u.displayName || u.name).toLowerCase().includes(search.toLowerCase()) || 
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.sabun.includes(search)
  );

  const handleSelect = (name: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (name === "전체") {
      params.delete("name");
    } else {
      params.set("name", name);
    }
    router.push(`${pathname}?${params.toString()}`);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <header className="h-[74px] border-b border-gray-100 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md shrink-0 z-30 w-full sticky top-0 transition-all duration-300">
      <div className="flex items-center space-x-5">
        <h1 className="text-[22px] font-[900] text-gray-900 tracking-tight">Admin Dashboard</h1>
        <div className="h-5 w-[2px] bg-gray-100 rounded-full"></div>
        <div className="flex items-center text-orange-600 bg-orange-50 px-3 py-1 rounded-lg">
          <span className="text-[13px] font-extrabold tracking-tight">전사 통합 관리자</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-6">
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center space-x-3 px-5 py-2.5 bg-white border border-gray-100 rounded-2xl text-[14px] text-gray-700 hover:border-orange-200 hover:bg-orange-50/30 focus:outline-none min-w-[180px] justify-between transition-all shadow-sm group"
          >
            <div className="flex items-center">
              <div className="w-5 h-5 mr-3 rounded-full bg-orange-100 flex items-center justify-center text-[10px] font-black text-orange-500">
                {selectedDisplayName[0]}
              </div>
              <span className="font-extrabold">{selectedDisplayName}</span>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-orange-500" />
          </button>


          {isOpen && (
            <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-100 rounded-[28px] shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black/5">
              <div className="p-4 bg-gray-50/50 border-b border-gray-100">
                <div className="flex items-center px-4 py-2.5 bg-white rounded-2xl border border-gray-200 shadow-sm focus-within:ring-2 focus-within:ring-orange-100 focus-within:border-orange-300 transition-all">
                  <Search className="w-4 h-4 text-gray-400 mr-2.5 shrink-0" />
                  <input 
                    type="text" 
                    placeholder="성함 또는 사번으로 검색..." 
                    className="bg-transparent border-none outline-none text-[14px] w-full placeholder:text-gray-400 font-medium"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              <ul className="max-h-[360px] overflow-y-auto py-2 custom-scrollbar">
                <li>
                  <button
                    className="w-full text-left px-5 py-3 text-[14.5px] text-gray-900 hover:bg-orange-50 hover:text-orange-600 transition-colors flex items-center font-extrabold"
                    onClick={() => handleSelect("전체")}
                  >
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                      <Users className="w-4 h-4 text-orange-600" />
                    </div>
                    전체 선택
                  </button>
                </li>
                {filteredUsers.map((user) => (
                  <li key={user.sabun}>
                    <button
                      className="w-full text-left px-5 py-4 text-[14px] text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition-colors flex items-center justify-between group"
                      onClick={() => handleSelect(user.name)}
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-100 rounded-[14px] flex items-center justify-center mr-3 font-black text-[11px] text-gray-400 group-hover:bg-orange-100 group-hover:text-orange-600 transition-all">
                          {(user.displayName || user.name)[0]}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black group-hover:text-orange-600 transition-colors">{user.displayName || user.name}</span>
                          <span className="text-[11px] text-gray-400 font-bold">{user.name}</span>
                        </div>
                      </div>
                      {user.sabun && <span className="text-[10px] font-black font-mono bg-gray-100 text-gray-400 px-2 py-0.5 rounded-lg group-hover:bg-white group-hover:text-orange-400 tracking-tighter">#{user.sabun}</span>}
                    </button>
                  </li>
                ))}
                {filteredUsers.length === 0 && (
                  <li className="px-5 py-10 text-sm text-gray-400 text-center font-bold">검색 결과가 없습니다.</li>
                )}
              </ul>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <button className="relative p-2.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-2xl transition-all group">
            <Bell className="w-5.5 h-5.5" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-orange-600 rounded-full border-2 border-white ring-2 ring-orange-100 animate-pulse"></span>
          </button>

          {/* User avatar + name */}
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-2xl">
            {session?.user?.image ? (
              <img src={session.user.image} alt="avatar" className="w-7 h-7 rounded-full" />
            ) : (
              <div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center font-black text-[11px] text-orange-600">
                {session?.user?.name?.[0] || "A"}
              </div>
            )}
            <span className="text-[13px] font-bold text-gray-700 max-w-[120px] truncate">
              {session?.user?.name || "Admin"}
            </span>
          </div>

          {/* Logout button */}
          <button
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all group"
            title="로그아웃"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
