"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarView, AttendanceRecord } from "@/components/CalendarView";
import { DailyDetail } from "@/components/DailyDetail";
import { MonthlySummary } from "@/components/MonthlySummary";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

function DashboardContent() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 2, 18));
  const [currentViewMonth, setCurrentViewMonth] = useState<Date>(new Date(2026, 2, 18)); 
  const [data, setData] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const searchParams = useSearchParams();
  const userName = searchParams.get("name") || "본인";

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const yearMonth = format(currentViewMonth, "yyyy-MM");
        const res = await fetch(`/api/attendance?name=${encodeURIComponent(userName)}&yearMonth=${yearMonth}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setIsLoading(false);
      }
    }

    // 초기 및 의존성 변경 시 로드
    fetchData();

    // 1분마다 자동 갱신 (사용자가 페이지를 열어놓았을 때 최신 데이터 자동 반영)
    const interval = setInterval(() => {
      // 자동 갱신 시에는 isLoading을 true로 하지 않아 깜빡임 방지 (필요 시 선택 가능)
      const yearMonth = format(currentViewMonth, "yyyy-MM");
      fetch(`/api/attendance?name=${encodeURIComponent(userName)}&yearMonth=${yearMonth}`)
        .then(res => res.ok && res.json())
        .then(json => json && setData(json))
        .catch(err => console.error("Auto-fetch failed:", err));
    }, 60000);

    return () => clearInterval(interval);
  }, [userName, format(currentViewMonth, "yyyy-MM")]);

  const selectedRecord = data.find(d => d.WorkDate === format(selectedDate, "yyyy-MM-dd"));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_340px] gap-6">
      <div className="space-y-6">
        {/* Calendar View */}
        <div className="relative min-h-[450px]">
          {isLoading && (
            <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-sm flex items-center justify-center rounded-xl">
               <Loader2 className="w-8 h-8 text-slate-800 animate-spin" />
            </div>
          )}
          <CalendarView 
            data={data} 
            selectedDate={selectedDate} 
            onDateSelect={setSelectedDate}
            onMonthChange={setCurrentViewMonth}
          />
        </div>

        {/* Monthly Summary */}
        <MonthlySummary 
          data={data} 
          yearMonth={format(currentViewMonth, "yyyy년 M월")} 
        />

        {/* Approval Placeholder */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col p-6 min-h-[160px]">
          <div className="font-bold text-[15px] text-gray-800 tracking-tight flex items-center mb-6">
             승인 대기 <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs w-5 h-5 flex items-center justify-center rounded-full">0</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <div className="w-10 h-10 border-2 border-gray-200 rounded-full flex items-center justify-center mb-3">
              <span className="text-gray-300 text-lg">✓</span>
            </div>
            <p className="text-[13.5px] font-medium tracking-tight">승인 대기 중인 근태가 없습니다.</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Daily Detail */}
        <DailyDetail 
          date={selectedDate} 
          record={selectedRecord} 
        />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-[500px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-slate-500 animate-spin" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
