"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CalendarView, AttendanceRecord } from "@/components/CalendarView";
import { AdminCalendarView, AdminDailyCount } from "@/components/AdminCalendarView";
import { DailyDetail } from "@/components/DailyDetail";
import { ModificationLog } from "@/components/ModificationLog";
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
  Edit2,
  ChevronLeft,
  Send,
  Mail
} from "lucide-react";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { EditAttendanceModal } from "@/components/EditAttendanceModal";
import { BulkEmailModal } from "@/components/BulkEmailModal";

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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentViewMonth, setCurrentViewMonth] = useState<Date>(new Date()); 
  const [data, setData] = useState<AttendanceRecord[]>([]);
  const [allUsersData, setAllUsersData] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'present' | 'lateMissing' | 'modified'>('all');
  const [adminCalendarData, setAdminCalendarData] = useState<AdminDailyCount[]>([]);
  const [summaryStats, setSummaryStats] = useState<any>({
    totalMember: 0,
    todayCheckIn: 0,
    lateMissing: 0,
    modifiedCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [isSendingSlack, setIsSendingSlack] = useState(false);
  const [isTestingBot, setIsTestingBot] = useState(false);
  const [testTargetEmail, setTestTargetEmail] = useState("laika@daangnservice.com");
  const [isBulkEmailOpen, setIsBulkEmailOpen] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const userName = searchParams.get("name") || "전체";
  const targetDateParam = searchParams.get("date");

  const handleSendSlack = async () => {
    setIsSendingSlack(true);
    try {
      const res = await fetch("/api/admin/notify-slack", { method: "POST" });
      if (res.ok) {
        alert("슬랙 알림이 laika@daangnservice.com 님에게 전송되었습니다.");
      } else {
        const data = await res.json();
        alert(`발송 실패: ${data.error}`);
      }
    } catch (err) {
      alert("서버 오류로 슬랙 발송에 실패했습니다.");
    } finally {
      setIsSendingSlack(false);
    }
  };

  const handleTestBot = async (type: 'checkin' | 'reminder') => {
    setIsTestingBot(true);
    try {
      const endpoint = type === 'checkin' ? '/api/admin/bot/notify-checkin' : '/api/admin/bot/remind-missing';
      const body = { email: testTargetEmail };
      
      const res = await fetch(endpoint, { 
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      if (res.ok) {
        if (data.message) {
           alert(`${data.message}`);
        } else {
           alert(`봇 알림(${type === 'checkin' ? '출근 확인' : '리마인더'})이 ${testTargetEmail} 님에게 발송되었습니다.`);
        }
      } else {
        alert(`봇 발송 실패: ${data.message || data.error}`);
      }
    } catch (err) {
      alert("서버 오류로 봇 발송에 실패했습니다.");
    } finally {
      setIsTestingBot(false);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (userName === "전체") {
        const usersRes = await fetch(`/api/users?date=${targetDateParam || ""}`);
        if (usersRes.ok) {
          const udata = await usersRes.json();
          setAllUsersData(udata.users);
          setSummaryStats(udata.stats);
        }
        
        if (!targetDateParam) {
          const yearMonth = format(currentViewMonth, "yyyy-MM");
          const calRes = await fetch(`/api/admin/calendar?yearMonth=${yearMonth}`);
          if (calRes.ok) {
            const cdata = await calRes.json();
            setAdminCalendarData(cdata);
          }
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
  }, [userName, targetDateParam, format(currentViewMonth, "yyyy-MM")]);

  const filteredUsers = allUsersData.filter(user => {
    if (filterType === 'all') return true;
    if (filterType === 'present') return user.checkIn !== "-";
    if (filterType === 'lateMissing') return user.status === "지각" || user.status === "미출근" || user.status === "결근";
    if (filterType === 'modified') return user.isModified;
    return true;
  });

  const selectedRecord = data.find(d => d.WorkDate === format(selectedDate, "yyyy-MM-dd"));

  if (userName === "전체") {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-black text-slate-900 tracking-tight">전사 근태 현황</h1>
            <p className="text-sm text-gray-400 font-bold mt-1">실시간 전사 출퇴근 데이터 및 통계를 확인합니다.</p>
          </div>
          <div className="flex items-center space-x-3">
             <button 
               onClick={handleSendSlack}
               disabled={isSendingSlack}
               className="px-4 py-2 bg-slate-900 text-white rounded-2xl shadow-lg shadow-slate-200 text-xs font-black uppercase tracking-widest flex items-center space-x-2 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
             >
                {isSendingSlack ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                <span>슬랙 알림 발송</span>
             </button>
             <div className="px-4 py-2 bg-white border border-gray-100 rounded-2xl shadow-sm text-xs font-black text-gray-400 uppercase tracking-widest">
                Real-time Sync
             </div>
          </div>
        </div>


        {/* Admin Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="cursor-pointer" onClick={() => setFilterType('all')}>
            <StatCard 
              title="총 구성원" 
              value={`${summaryStats.totalMember}명`} 
              icon={Users} 
              color={filterType === 'all' ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600"}
            />
          </div>
          <div className="cursor-pointer" onClick={() => setFilterType('present')}>
            <StatCard 
              title={targetDateParam ? `${targetDateParam} 출근` : "오늘 출근"} 
              value={`${summaryStats.todayCheckIn}명`} 
              icon={CheckCircle2} 
              trend={summaryStats.todayCheckIn > 0 && !targetDateParam ? "Real-time" : ""} 
              color={filterType === 'present' ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-600"}
            />
          </div>
          <div className="cursor-pointer" onClick={() => setFilterType('lateMissing')}>
            <StatCard 
              title="지각/누락" 
              value={`${summaryStats.lateMissing}건`} 
              icon={AlertCircle} 
              color={filterType === 'lateMissing' ? "bg-orange-600 text-white" : "bg-orange-50 text-orange-600"}
            />
          </div>
          <div className="cursor-pointer" onClick={() => setFilterType('modified')}>
            <StatCard 
              title="수정 사용자" 
              value={`${summaryStats.modifiedCount}명`} 
              icon={Edit2} 
              color={filterType === 'modified' ? "bg-purple-600 text-white" : "bg-purple-50 text-purple-600"}
            />
          </div>
        </div>

        {/* Content Area: Calendar or Filtered Table */}
        {(!targetDateParam && filterType === 'all') ? (
          <div className="relative">
            {isLoading && (
              <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-sm flex items-center justify-center rounded-3xl">
                 <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
              </div>
            )}
            <AdminCalendarView 
              data={adminCalendarData}
              selectedDate={null}
              onDateSelect={(date) => {
                router.push(`/?name=전체&date=${format(date, 'yyyy-MM-dd')}`);
              }}
              currentMonth={currentViewMonth}
              onMonthChange={setCurrentViewMonth}
            />
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
              <div>
                <h2 className="text-[20px] font-black text-slate-800 tracking-tight">
                  {targetDateParam || format(new Date(), 'yyyy-MM-dd')} 기준 {
                    filterType === 'all' ? '전체 구성원' : 
                    filterType === 'present' ? '출근 구성원' :
                    filterType === 'lateMissing' ? '지각/누락 명단' :
                    '수정 내역 명단'
                  }
                </h2>
                <p className="text-sm text-gray-400 font-bold mt-1">
                  {targetDateParam ? '선택하신 날짜의' : '오늘(실시간)'} 근태 현황을 필터링하여 보여줍니다.
                </p>
              </div>
              <div className="flex items-center space-x-3">
                {filterType !== 'all' && (
                  <button 
                    onClick={() => setFilterType('all')}
                    className="px-4 py-2 bg-gray-100 text-gray-600 text-xs font-black rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    필터 해제
                  </button>
                )}
                <button 
                  onClick={() => setIsBulkEmailOpen(true)}
                  className="px-4 py-2.5 bg-indigo-50 text-indigo-700 text-xs font-black rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-all flex items-center space-x-2"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>이메일 일괄 관리</span>
                </button>
                <Link href="/?name=전체" className="px-5 py-2.5 bg-white text-slate-700 text-sm font-bold rounded-xl border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors inline-flex items-center space-x-2">
                  <ChevronLeft className="w-4 h-4 text-gray-500" />
                  <span>달력으로 돌아가기</span>
                </Link>
              </div>
            </div>

            <div className="overflow-x-auto relative min-h-[300px]">
              {isLoading && (
                <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                   <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                </div>
              )}
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] whitespace-nowrap">구성원 (성명/사번)</th>
                    <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center whitespace-nowrap">부서 / 팀</th>
                    <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center whitespace-nowrap">이메일</th>
                    <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center whitespace-nowrap">출근 시간</th>
                    <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center whitespace-nowrap">퇴근 시간</th>
                    <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center whitespace-nowrap">상태</th>
                    <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center whitespace-nowrap">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((user, idx) => (
                    <tr key={idx} className="hover:bg-orange-50/10 transition-colors group">

                      <td className="px-5 py-5 whitespace-nowrap">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-slate-100 rounded-[14px] flex items-center justify-center font-black text-slate-400 text-xs shadow-inner group-hover:bg-orange-100 group-hover:text-orange-600 transition-all">
                            {user.displayName?.[0]}
                          </div>
                          <div>
                            <p className="text-[14px] font-black text-slate-800 leading-tight">
                              {user.displayName?.includes(user.name) ? user.displayName : `${user.displayName}(${user.name})`}
                            </p>
                            <p className="text-[11px] text-gray-400 font-bold font-mono tracking-tighter">#{user.sabun}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-5 text-center whitespace-nowrap">
                        <span className="text-[13px] font-bold text-gray-700">{user.team}</span>
                      </td>
                      <td className="px-5 py-5 text-center whitespace-nowrap">
                        <span className="text-[12px] font-bold text-slate-500">{user.email || "-"}</span>
                      </td>
                      <td className="px-5 py-5 text-center text-sm font-bold text-gray-600 font-mono whitespace-nowrap">
                        {user.checkIn !== "-" ? (
                          <span className="text-blue-600">{user.checkIn}</span>
                        ) : (
                          <span className="text-gray-300">--:--</span>
                        )}
                      </td>
                      <td className="px-5 py-5 text-center text-sm font-bold text-gray-600 font-mono whitespace-nowrap">
                        {user.checkOut !== "-" ? (
                          <span className="text-blue-600">{user.checkOut}</span>
                        ) : (
                          <span className="text-gray-300">--:--</span>
                        )}
                      </td>
                      <td className="px-5 py-5 text-center whitespace-nowrap">
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
                      <td className="px-5 py-5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1">
                          <Link 
                            href={`/?name=${encodeURIComponent(user.name)}&yearMonth=${targetDateParam ? targetDateParam.substring(0,7) : format(new Date(), 'yyyy-MM')}`}
                            className="inline-flex items-center justify-center p-2.5 text-gray-300 hover:text-blue-500 hover:bg-blue-50/50 rounded-xl transition-all"
                            title="상세 보기"
                          >
                            <Calendar className="w-4 h-4" />
                          </Link>
                          <button 
                            onClick={() => {
                              setEditUser(user);
                              setIsEditModalOpen(true);
                            }}
                            className="inline-flex items-center justify-center p-2.5 text-gray-300 hover:text-orange-500 hover:bg-orange-50/50 rounded-xl transition-all"
                            title="기록 수정 (MySQL)"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {editUser && (
          <EditAttendanceModal 
            isOpen={isEditModalOpen} 
            onClose={() => setIsEditModalOpen(false)}
            user={editUser}
            date={targetDateParam || format(new Date(), "yyyy-MM-dd")} 
            onSuccess={() => fetchData()}
          />
        )}

        <BulkEmailModal 
          isOpen={isBulkEmailOpen}
          onClose={() => setIsBulkEmailOpen(false)}
          onSuccess={() => fetchData()}
          users={allUsersData}
        />
      </div>
    );
  }

  // Individual Member View (Existing View)
  return (
    <>
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
        </div>

        <div className="space-y-8">
          {/* Daily Detail */}
          <div className="sticky top-[94px] space-y-8">
            <DailyDetail 
              date={selectedDate} 
              record={selectedRecord} 
              onEditClick={() => {
                const userObj = {
                  name: userName,
                  displayName: userName,
                  sabun: selectedRecord?.Sabun || "",
                  team: "",
                  status: "출근",
                  checkIn: selectedRecord?.WSTime || "-",
                  checkOut: selectedRecord?.WCTime || "-"
                };
                setEditUser(userObj);
                setIsEditModalOpen(true);
              }}
            />
          </div>
        </div>
      </div>

      {/* Full Width Modification Log */}
      <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
        <ModificationLog data={data} />
      </div>

      {editUser && (
        <EditAttendanceModal 
          isOpen={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)}
          user={editUser}
          date={format(selectedDate, "yyyy-MM-dd")} 
          onSuccess={() => fetchData()}
        />
      )}
    </>
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
