"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  CalendarDays, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Plane,
  Home,
  UserCheck,
  Clock,
  Briefcase
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, addDays, subDays } from "date-fns";

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<'all' | 'special'>('all');

  const fetchSchedules = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/users?date=${selectedDate}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error("Failed to load schedules:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || 
      (u.team && u.team.toLowerCase().includes(search.toLowerCase())) ||
      (u.scheduleDescription && u.scheduleDescription.toLowerCase().includes(search.toLowerCase()));
    
    // "Special" means has a schedule that is NOT just generic work/system entries
    const hasSpecialSchedule = u.scheduleDescription && 
      typeof u.scheduleDescription === 'string' &&
      u.scheduleDescription.split(', ').some((d: string) => d !== '근무일' && d !== '업무' && d !== '보정시간' && d !== '휴가 발생');

    if (filterMode === 'special') return matchesSearch && hasSpecialSchedule;
    return matchesSearch;
  });

  const stats = {
    total: users.length,
    special: users.filter(u => 
      u.scheduleDescription && 
      typeof u.scheduleDescription === 'string' &&
      u.scheduleDescription.split(', ').some((d: string) => d !== '근무일' && d !== '업무' && d !== '보정시간' && d !== '휴가 발생')
    ).length,
    normal: users.filter(u => 
      !u.scheduleDescription || 
      typeof u.scheduleDescription !== 'string' ||
      u.scheduleDescription.split(', ').every((d: string) => d === '근무일' || d === '업무' || d === '보정시간' || d === '휴가 발생')
    ).length
  };

  const getScheduleBadgeColor = (desc: string) => {
    const leaveKeywords = ['휴가', '공가', '병가', '경조', '검진', '반차', '공휴일', '조퇴', '결근'];
    if (leaveKeywords.some(k => desc.includes(k))) return "bg-orange-50 text-orange-600 ring-orange-100";
    return "bg-blue-50 text-blue-600 ring-blue-100";
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-black text-gray-900 tracking-tight flex items-center">
            <CalendarDays className="w-7 h-7 mr-3 text-[#FF6F0F]" />
            전체 근무 현황
          </h1>
          <p className="text-sm text-gray-400 font-bold mt-1 ml-10">구성원들의 일일 근무 및 부재 일정을 통합 관리합니다.</p>
        </div>
        
        <div className="flex items-center bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
          <button 
            onClick={() => setSelectedDate(format(subDays(new Date(selectedDate), 1), "yyyy-MM-dd"))}
            className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-400"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="px-4 py-1 flex flex-col items-center">
             <input 
               type="date" 
               value={selectedDate}
               onChange={(e) => setSelectedDate(e.target.value)}
               className="bg-transparent text-sm font-black text-slate-800 outline-none cursor-pointer"
             />
          </div>
          <button 
            onClick={() => setSelectedDate(format(addDays(new Date(selectedDate), 1), "yyyy-MM-dd"))}
            className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-400"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">전체 구성원</p>
            <p className="text-2xl font-black text-slate-800">{stats.total}명</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500">
            <Plane className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">특별 일정/부재</p>
            <p className="text-2xl font-black text-slate-800">{stats.special}명</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">일반 근무</p>
            <p className="text-2xl font-black text-slate-800">{stats.normal}명</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden min-h-[400px] relative">
        <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/10">
          <div className="flex items-center space-x-3 w-full max-w-lg">
            <div className="flex items-center bg-white px-6 py-4 rounded-[24px] border border-gray-100 shadow-inner w-full focus-within:ring-2 focus-within:ring-orange-100 transition-all">
              <Search className="w-5 h-5 text-gray-400 mr-3" />
              <input 
                type="text" 
                placeholder="구성원 이름, 부서, 일정 내용 검색..." 
                className="bg-transparent text-sm outline-none w-full font-bold placeholder:text-gray-300"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex bg-gray-100/50 p-1 rounded-2xl self-start md:self-auto">
             <button 
               onClick={() => setFilterMode('all')}
               className={cn("px-4 py-2 text-xs font-black rounded-xl transition-all", filterMode === 'all' ? "bg-white text-slate-800 shadow-sm" : "text-gray-400 hover:text-gray-600")}
             >
               전체 보기
             </button>
             <button 
               onClick={() => setFilterMode('special')}
               className={cn("px-4 py-2 text-xs font-black rounded-xl transition-all", filterMode === 'special' ? "bg-white text-slate-800 shadow-sm" : "text-gray-400 hover:text-gray-600")}
             >
               특별 일정만
             </button>
          </div>
        </div>

        {isLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin" />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/30">
                <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.1em] whitespace-nowrap">구성원</th>
                <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.1em] text-center whitespace-nowrap">부서 / 팀</th>
                <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.1em] text-center whitespace-nowrap">스케줄 / 일정</th>
                <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.1em] text-center whitespace-nowrap">출퇴근 현황</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.length === 0 && !isLoading ? (
                <tr>
                  <td colSpan={4} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-300">
                      <Home className="w-12 h-12 mb-4 opacity-20" />
                      <p className="font-black text-gray-400">조회된 구성원이 없습니다.</p>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.map((user, idx) => (
                <tr key={idx} className="hover:bg-orange-50/10 transition-all group">
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-[15px] flex items-center justify-center font-black text-slate-400 text-xs shadow-inner group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors">
                        {user.displayName?.[0] || 'A'}
                      </div>
                      <div>
                        <p className="text-[14px] font-black text-slate-800 leading-tight">
                           {user.displayName || user.name}
                        </p>
                        <p className="text-[11px] text-gray-400 font-bold font-mono tracking-tighter mt-0.5">#{user.sabun || "미등록"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center whitespace-nowrap">
                    <span className="text-[13px] font-black text-slate-700">{user.team}</span>
                  </td>
                  <td className="px-8 py-6 text-center whitespace-nowrap">
                    {user.scheduleDescription ? (
                      <div className="flex flex-wrap justify-center gap-1.5">
                        {user.scheduleDescription.split(', ').map((desc: string, i: number) => (
                          <span key={i} className={cn("px-4 py-1.5 rounded-xl text-[12px] font-black ring-1", getScheduleBadgeColor(desc))}>
                            {desc}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[12px] font-bold text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-center whitespace-nowrap">
                    <div className="flex flex-col items-center space-y-1">
                      <div className={cn(
                        "px-3 py-1 rounded-xl text-[10px] font-black inline-flex items-center shadow-sm ring-1",
                        user.status === "출근" 
                          ? "bg-emerald-50 text-emerald-600 ring-emerald-100" 
                          : "bg-gray-50 text-gray-400 ring-gray-100"
                      )}>
                        <div className={cn("w-1.5 h-1.5 rounded-full mr-1.5", user.status === "출근" ? "bg-emerald-500" : "bg-gray-300")} />
                        {user.status || "미출근"}
                      </div>
                      {(user.checkIn !== "-" || user.checkOut !== "-") && (
                        <p className="text-[9px] font-bold text-gray-400 font-mono">
                          {user.checkIn} ~ {user.checkOut}
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
