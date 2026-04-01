"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarView, AttendanceRecord } from "@/components/CalendarView";
import { DailyDetail } from "@/components/DailyDetail";
import { MonthlySummary } from "@/components/MonthlySummary";
import { format } from "date-fns";
import { 
  Loader2, 
  Users, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ArrowUpRight, 
  Search,
  Filter,
  MoreHorizontal,
  Calendar,
  Edit2
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { EditAttendanceModal } from "@/components/EditAttendanceModal";

function StatCard({ title, value, icon: Icon, trend, color }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-3 rounded-xl transition-colors", color)}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
            <ArrowUpRight className="w-3 h-3 mr-1" />
            {trend}
          </span>
        )}
      </div>
      <div>
        <h3 className="text-gray-500 text-sm font-medium mb-1 group-hover:text-gray-800 transition-colors">{title}</h3>
        <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{value}</p>
      </div>
    </div>
  );
}

function DashboardContent() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 2, 18));
  const [currentViewMonth, setCurrentViewMonth] = useState<Date>(new Date(2026, 2, 18)); 
  const [data, setData] = useState<AttendanceRecord[]>([]);
  const [allUsersData, setAllUsersData] = useState<any[]>([]);
  const [summaryStats, setSummaryStats] = useState<any>({
    totalMember: 0,
    todayCheckIn: 0,
    lateMissing: 0,
    pendingApproval: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  
  const searchParams = useSearchParams();
  const userName = searchParams.get("name") || "전체";

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (userName === "전체") {
        const res = await fetch(`/api/users`);
        if (res.ok) {
          const data = await res.json();
          setAllUsersData(data.users);
          setSummaryStats(data.stats);
        }
      } else {
        const yearMonth = format(currentViewMonth, "yyyy-MM");
        const res = await fetch(`/api/attendance?name=${encodeURIComponent(userName)}&yearMonth=${yearMonth}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userName, format(currentViewMonth, "yyyy-MM")]);

  const selectedRecord = data.find(d => d.WorkDate === format(selectedDate, "yyyy-MM-dd"));

  if (userName === "전체") {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Admin Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="총 구성원" 
            value={`${summaryStats.totalMember}명`} 
            icon={Users} 
            color="bg-blue-50 text-blue-600"
          />
          <StatCard 
            title="오늘 출근" 
            value={`${summaryStats.todayCheckIn}명`} 
            icon={CheckCircle2} 
            trend={summaryStats.todayCheckIn > 0 ? "Real-time" : ""} 
            color="bg-emerald-50 text-emerald-600"
          />
          <StatCard 
            title="지각/누락" 
            value={`${summaryStats.lateMissing}건`} 
            icon={AlertCircle} 
            color="bg-orange-50 text-orange-600"
          />
          <StatCard 
            title="승인 대기" 
            value={`${summaryStats.pendingApproval}건`} 
            icon={Clock} 
            color="bg-purple-50 text-purple-600"
          />
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
            <div>
              <h2 className="text-[18px] font-extrabold text-slate-800 tracking-tight">구성원 출퇴근 현황</h2>
              <p className="text-sm text-gray-400 font-medium mt-1">오늘의 실시간 근무 상태를 확인합니다. (002, 006, 007조 기준)</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">구성원 (성명/사번)</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">부서 / 팀</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">출근 시간</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">퇴근 시간</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">상태</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allUsersData.map((user, idx) => (
                  <tr key={idx} className="hover:bg-orange-50/10 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-slate-100 rounded-[14px] flex items-center justify-center font-black text-slate-400 text-xs shadow-inner group-hover:bg-orange-100 group-hover:text-orange-600 transition-all">
                          {user.displayName?.[0]}
                        </div>
                        <div>
                          <p className="text-[14px] font-black text-slate-800 leading-tight">{user.displayName}</p>
                          <p className="text-[11px] text-gray-400 font-bold font-mono tracking-tighter">{user.name} (#{user.sabun})</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className="text-[13px] font-bold text-gray-700">{user.team}</span>
                    </td>
                    <td className="px-8 py-5 text-center text-sm font-bold text-gray-600 font-mono">
                      {user.checkIn !== "-" ? (
                        <span className="text-blue-600">{user.checkIn}</span>
                      ) : (
                        <span className="text-gray-300">--:--</span>
                      )}
                    </td>
                    <td className="px-8 py-5 text-center text-sm font-bold text-gray-600 font-mono">
                      {user.checkOut !== "-" ? (
                        <span className="text-blue-600">{user.checkOut}</span>
                      ) : (
                        <span className="text-gray-300">--:--</span>
                      )}
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[11px] font-black shadow-sm ring-1",
                        user.status === "출근" ? "bg-emerald-50 text-emerald-600 ring-emerald-100" : 
                        user.status === "지각" ? "bg-orange-50 text-orange-600 ring-orange-100" :
                        user.status === "결근" ? "bg-red-50 text-red-600 ring-red-100" :
                        "bg-gray-100 text-gray-400 ring-gray-200"
                      )}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <Link 
                          href={`/?name=${encodeURIComponent(user.name)}`}
                          className="inline-flex items-center justify-center p-2.5 text-gray-300 hover:text-blue-500 hover:bg-blue-50/50 rounded-xl transition-all"
                          title="상세 보기"
                        >
                          <Calendar className="w-5 h-5" />
                        </Link>
                        <button 
                          onClick={() => {
                            setEditUser(user);
                            setIsEditModalOpen(true);
                          }}
                          className="inline-flex items-center justify-center p-2.5 text-gray-300 hover:text-orange-500 hover:bg-orange-50/50 rounded-xl transition-all"
                          title="기록 수정 (MySQL)"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {editUser && (
          <EditAttendanceModal 
            isOpen={isEditModalOpen} 
            onClose={() => setIsEditModalOpen(false)}
            user={editUser}
            date={format(new Date(), "yyyy-MM-dd")} 
            onSuccess={() => fetchData()}
          />
        )}
      </div>
    );
  }

  // Individual Member View (Existing View)
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_380px] gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-8">
        {/* Calendar View */}
        <div className="relative bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-2">
          {isLoading && (
            <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-sm flex items-center justify-center rounded-3xl">
               <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
            </div>
          )}
          <CalendarView 
            data={data} 
            selectedDate={selectedDate} 
            onDateSelect={setSelectedDate}
            onMonthChange={setCurrentViewMonth}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Monthly Summary */}
          <MonthlySummary 
            data={data} 
            yearMonth={format(currentViewMonth, "yyyy년 M월")} 
          />

          {/* Individual Approval / Request Status */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col p-8 group">
            <div className="font-extrabold text-[17px] text-slate-800 tracking-tight flex items-center mb-8">
               수정 요청 현황 <span className="ml-3 bg-orange-100 text-orange-600 text-[11px] px-2 py-0.5 rounded-full font-bold">0건</span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center text-gray-300 space-y-4">
              <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-7 h-7 text-gray-200" />
              </div>
              <p className="text-[14px] font-bold text-gray-400 tracking-tight">대기 중인 요청이 없습니다.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Daily Detail */}
        <div className="sticky top-[94px]">
          <DailyDetail 
            date={selectedDate} 
            record={selectedRecord} 
          />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-[500px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
