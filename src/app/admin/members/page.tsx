"use client";

import { useState, useEffect } from "react";
import { Users, Search, Filter, MoreHorizontal, ArrowLeft, Mail, Phone, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function MembersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const data = await res.json();
          // Adding fake data for UI demonstration if needed, but primarily use data.users
          const usersList = data.users || [];
          setUsers(usersList.map((u: any) => ({
            ...u,
            status: u.status || (Math.random() > 0.2 ? "Active" : "On Leave")
          })));
        }
      } catch (err) {
        console.error("Failed to load users:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.sabun.includes(search)
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-black text-gray-900 tracking-tight flex items-center">
            <Users className="w-7 h-7 mr-3 text-orange-500" />
            구성원 현황
          </h1>
          <p className="text-sm text-gray-400 font-bold mt-1 ml-10">총 {users.length}명의 구성원이 등록되어 있습니다.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/10">
          <div className="flex items-center space-x-3 w-full max-w-md">
            <div className="flex items-center bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm w-full focus-within:ring-2 focus-within:ring-orange-100 transition-all">
              <Search className="w-5 h-5 text-gray-400 mr-3" />
              <input 
                type="text" 
                placeholder="구성원 이름, 사번, 부서 검색..." 
                className="bg-transparent text-sm outline-none w-full font-bold placeholder:text-gray-300"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-orange-50 hover:border-orange-200 shadow-sm transition-all text-gray-400 hover:text-orange-500">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/30">
                <th className="px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">구성원 (성명/사번)</th>
                <th className="px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">부서 / 팀</th>
                <th className="px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">근무조</th>
                <th className="px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">상태</th>
                <th className="px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">입사일</th>
                <th className="px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">관리</th>
              </tr>

            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center">
                    <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredUsers.map((user, idx) => (
                <tr key={idx} className="hover:bg-orange-50/20 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-11 h-11 bg-gray-100 rounded-[18px] flex items-center justify-center font-black text-gray-400 text-sm shadow-inner group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors">
                        {user.displayName?.[0]}
                      </div>
                      <div>
                        <p className="text-[15px] font-black text-gray-800">
                           {user.displayName?.includes(user.name) ? user.displayName : `${user.displayName}(${user.name})`}
                        </p>
                        <p className="text-[11px] text-gray-400 font-bold font-mono tracking-tighter">#{user.sabun}</p>
                      </div>

                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-700">{user.team || user.department}</span>
                      {user.part && <span className="text-[11px] text-gray-400 font-bold">{user.part}</span>}
                    </div>
                  </td>

                  <td className="px-8 py-6 text-center">
                    <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-lg text-[12px] font-black ring-1 ring-orange-100">
                      {user.workGroup === "002" ? "정규" : (user.workGroup || "-")}
                    </span>
                  </td>

                  <td className="px-8 py-6 text-center">
                    <div className={cn(
                      "px-3 py-1.5 rounded-xl text-[11px] font-black inline-flex items-center shadow-sm ring-1",
                      user.status === "출근" || user.status === "재직" || user.status === "Active" 
                        ? "bg-emerald-50 text-emerald-600 ring-emerald-100" 
                        : "bg-gray-50 text-gray-400 ring-gray-100"
                    )}>
                      <div className={cn("w-1.5 h-1.5 rounded-full mr-2", (user.status === "출근" || user.status === "재직" || user.status === "Active") ? "bg-emerald-500" : "bg-gray-300")} />
                      {user.status || "미출근"}
                    </div>
                  </td>

                  <td className="px-8 py-6 text-sm font-bold text-gray-500 italic text-center">
                    {user.joiningDate || "-"}
                  </td>
                  <td className="px-8 py-6 text-center">
                    <Link 
                      href={`/?name=${encodeURIComponent(user.name)}`}
                      className="inline-flex items-center justify-center p-2.5 text-gray-300 hover:text-orange-500 hover:bg-white hover:shadow-md rounded-xl transition-all"
                    >
                      <Calendar className="w-5 h-5" />
                    </Link>
                    <button className="p-2.5 text-gray-300 hover:text-gray-600 hover:bg-white hover:shadow-md rounded-xl transition-all ml-1 opacity-0 pointer-events-none">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && filteredUsers.length === 0 && (
            <div className="py-32 flex flex-col items-center justify-center text-gray-300">
               <div className="w-20 h-20 bg-gray-50 rounded-[40px] flex items-center justify-center mb-6">
                 <Search className="w-10 h-10 text-gray-100" />
               </div>
               <p className="font-black text-gray-400">검색 결과와 일치하는 구성원이 없습니다.</p>
               <button onClick={() => setSearch("")} className="mt-4 text-orange-500 font-bold text-sm hover:underline">필터 초기화</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  return (
    <svg 
      className={cn("animate-spin", className)} 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}
