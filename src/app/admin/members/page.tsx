"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Users, 
  Search, 
  Filter, 
  MoreHorizontal, 
  ArrowLeft, 
  Mail, 
  Phone, 
  Calendar,
  Edit2
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { EditAttendanceModal } from "@/components/EditAttendanceModal";
import { BulkEmailModal } from "@/components/BulkEmailModal";
import { format } from "date-fns";

export default function MembersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isBulkEmailOpen, setIsBulkEmailOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        // Standardize status for individual view
        const usersList = (data.users || []).map((u: any) => ({
          ...u,
          status: u.status || "미출근"
        }));
        setUsers(usersList);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    (u.sabun && u.sabun.includes(search)) ||
    (u.email && u.email.toLowerCase().includes(search.toLowerCase())) ||
    (u.team && u.team.toLowerCase().includes(search.toLowerCase()))
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
        <button 
          onClick={() => setIsBulkEmailOpen(true)}
          className="px-5 py-3 bg-indigo-50 text-indigo-700 text-sm font-black rounded-2xl border border-indigo-100 shadow-sm hover:bg-indigo-100 transition-all flex items-center space-x-2 active:scale-95"
        >
          <Mail className="w-4 h-4" />
          <span>이메일 일괄 관리</span>
        </button>
      </div>

      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/10">
          <div className="flex items-center space-x-3 w-full max-w-lg">
            <div className="flex items-center bg-white px-6 py-4 rounded-[24px] border border-gray-100 shadow-inner w-full focus-within:ring-2 focus-within:ring-orange-100 transition-all">
              <Search className="w-5 h-5 text-gray-400 mr-3" />
              <input 
                type="text" 
                placeholder="구성원 이름, 사번, 부서, 이메일 검색..." 
                className="bg-transparent text-sm outline-none w-full font-bold placeholder:text-gray-300"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="p-4 bg-white border border-gray-100 rounded-[22px] hover:bg-orange-50 hover:border-orange-200 shadow-sm transition-all text-gray-400 hover:text-orange-500">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/30">
                <th className="px-5 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.1em] whitespace-nowrap">구성원 (성명/사번)</th>
                <th className="px-5 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.1em] text-center whitespace-nowrap">부서 / 팀</th>
                <th className="px-5 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.1em] text-center whitespace-nowrap">이메일</th>
                <th className="px-5 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.1em] text-center whitespace-nowrap">근무조</th>
                <th className="px-5 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.1em] text-center whitespace-nowrap">상태</th>
                <th className="px-5 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.1em] text-center whitespace-nowrap">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-8 py-32 text-center">
                    <Loader2 className="w-10 h-10 text-orange-500 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredUsers.map((user, idx) => (
                <tr key={idx} className="hover:bg-orange-50/10 transition-all group">
                  <td className="px-5 py-6 whitespace-nowrap">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-[15px] flex items-center justify-center font-black text-slate-400 text-xs shadow-inner group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors">
                        {user.displayName?.[0] || 'A'}
                      </div>
                      <div>
                        <p className="text-[14px] font-black text-slate-800 leading-tight">
                           {user.displayName?.includes(user.name) ? user.displayName : `${user.displayName}(${user.name})`}
                        </p>
                        <p className="text-[11px] text-gray-400 font-bold font-mono tracking-tighter mt-0.5">#{user.sabun || "미등록"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-6 text-center whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-[13px] font-black text-slate-700">{user.team}</span>
                      {user.part && <span className="text-[10px] text-gray-400 font-bold mt-0.5">{user.part}</span>}
                    </div>
                  </td>

                  <td className="px-5 py-6 text-center whitespace-nowrap">
                    <span className="text-[12px] font-bold text-slate-500">{user.email || "-"}</span>
                  </td>

                  <td className="px-5 py-6 text-center whitespace-nowrap">
                    <span className="bg-slate-50 text-slate-500 px-2.5 py-1 rounded-lg text-[10px] font-black ring-1 ring-slate-100">
                      {user.workGroup === "002" ? "정규" : (user.workGroup || "-")}
                    </span>
                  </td>

                  <td className="px-5 py-6 text-center whitespace-nowrap">
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

                  <td className="px-5 py-6 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center space-x-1">
                      <Link 
                        href={`/?name=${encodeURIComponent(user.name)}`}
                        className="inline-flex items-center justify-center p-2.5 text-gray-300 hover:text-orange-500 hover:bg-orange-50/50 rounded-xl transition-all"
                        title="달력 보기"
                      >
                        <Calendar className="w-4 h-4" />
                      </Link>
                      <button 
                         onClick={() => {
                           setEditUser(user);
                           setIsEditModalOpen(true);
                         }}
                         className="inline-flex items-center justify-center p-2.5 text-gray-300 hover:text-indigo-500 hover:bg-indigo-50/50 rounded-xl transition-all"
                         title="인적사항/근태 수정"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && filteredUsers.length === 0 && (
            <div className="py-40 flex flex-col items-center justify-center text-gray-300">
               <div className="w-24 h-24 bg-gray-50 rounded-[48px] flex items-center justify-center mb-8">
                 <Search className="w-12 h-12 text-gray-100" />
               </div>
               <p className="font-black text-gray-400 text-lg">검색 결과와 일치하는 구성원이 없습니다.</p>
               <button onClick={() => setSearch("")} className="mt-4 text-orange-500 font-bold hover:underline">필터 초기화</button>
            </div>
          )}
        </div>
      </div>

      {editUser && (
        <EditAttendanceModal 
          isOpen={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)}
          user={editUser}
          date={format(new Date(), "yyyy-MM-dd")} 
          onSuccess={fetchUsers}
        />
      )}

      <BulkEmailModal 
        isOpen={isBulkEmailOpen}
        onClose={() => setIsBulkEmailOpen(false)}
        onSuccess={fetchUsers}
        users={users}
      />
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
