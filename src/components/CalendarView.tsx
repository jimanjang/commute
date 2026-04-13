"use client";

import { useState } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock Data Type
export interface AttendanceRecord {
  WorkDate: string; // YYYY-MM-DD
  WorkType: string;
  bLate: number; // 0 or 1
  bAbsent: number; // 0 or 1
  WSTime: string | null;
  WCTime: string | null;
  ScheduleName: string | null;
  ModifyUser: string | null;
  ModifyTime: string | null;
  ModifyReason?: string | null;
  PrevWSTime?: string | null;
  PrevWCTime?: string | null;
  isSynced?: boolean;

  TotalWorkTime: number;

  OWTime: number;
  NWTime: number;
  HWTime: number;
  Name: string;
  Sabun: string;
}

interface CalendarViewProps {
  data: AttendanceRecord[];
  onDateSelect: (date: Date) => void;
  selectedDate: Date | null;
  onMonthChange?: (date: Date) => void;
}

export function CalendarView({ data, onDateSelect, selectedDate, onMonthChange }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date(2026, 2, 1)); 

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const prevMonth = () => {
    const newM = subMonths(currentMonth, 1);
    setCurrentMonth(newM);
    if(onMonthChange) onMonthChange(newM);
  };
  const nextMonth = () => {
    const newM = addMonths(currentMonth, 1);
    setCurrentMonth(newM);
    if(onMonthChange) onMonthChange(newM);
  };

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[17px] font-bold text-gray-800 tracking-tight">월간 캘린더</h2>
        <div className="flex items-center space-x-3">
          <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded transition-colors"><ChevronLeft className="w-[18px] h-[18px] text-gray-700" /></button>
          <span className="font-bold text-gray-800 text-[15px] min-w-[90px] text-center tracking-tight">{format(currentMonth, 'yyyy년 M월')}</span>
          <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded transition-colors"><ChevronRight className="w-[18px] h-[18px] text-gray-700" /></button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    const date = ['일', '월', '화', '수', '목', '금', '토'];
    for (let i = 0; i < 7; i++) {
        days.push(
          <div className={cn("text-center text-xs font-semibold py-2", i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-gray-500")} key={i}>
            {date[i]}
          </div>
        );
    }
    return <div className="grid grid-cols-7 mb-1">{days}</div>;
  };

  const renderCells = () => {
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, "d");
        const currentStringDate = format(day, "yyyy-MM-dd");
        
        // Find data for this day
        const dayData = data.find(d => d.WorkDate.startsWith(currentStringDate));
        const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isToday = isSameDay(day, new Date());
        const isPast = day < new Date() && !isToday;
        const isWeekend = i === 0 || i === 6;
        const hasWork = dayData && (dayData.WorkType === "근무" || dayData.WorkType === "정상근무" || dayData.TotalWorkTime > 0 || !!dayData.WSTime);
        const hasCheckOut = !!dayData?.WCTime;
        const isMissingOut = dayData?.WSTime && !dayData?.WCTime && (isToday ? new Date().getHours() >= 19 : isPast);
        const isMissingAll = !isWeekend && isPast && (!dayData || (!dayData.WSTime && !dayData.WCTime));


        const isLate = dayData?.bLate === 1;
        const isAbsent = dayData?.bAbsent === 1;

        const cloneDay = day;

        days.push(
          <div
            className={cn(
              "h-20 border border-transparent p-1 flex flex-col items-center cursor-pointer transition-all rounded-lg select-none",
              !isCurrentMonth ? "opacity-30 pointer-events-none" : "",
              isSelected ? "bg-slate-700 text-white shadow" : "hover:bg-gray-50 text-gray-800",
            )}
            key={day.toISOString()}
            onClick={() => onDateSelect(cloneDay)}
          >
            <span className={cn(
               "text-sm font-medium mt-0.5 inline-flex w-7 h-7 items-center justify-center tracking-tight",
               !isSelected && i === 0 ? "text-red-500" : "",
               !isSelected && i === 6 ? "text-blue-500" : ""
            )}>
              {formattedDate}
            </span>
            
            <div className="mt-1 flex flex-col gap-0.5 w-full items-center">
              {isCurrentMonth && (
                <>
                  <div className="flex flex-col gap-0.5 items-center">
                    {hasWork && (
                      <div className="text-[10px] bg-emerald-500 text-white w-11 py-0.5 rounded-full font-bold tracking-tight text-center leading-none">
                        출근
                      </div>
                    )}
                    {hasCheckOut && (
                      <div className="text-[10px] bg-blue-500 text-white w-11 py-0.5 rounded-full font-bold tracking-tight text-center leading-none">
                        퇴근
                      </div>
                    )}
                  </div>

                  {!hasWork && !hasCheckOut && (i === 0 || i === 6) && (
                    <div className="text-[10px] bg-gray-100 text-gray-400 w-11 py-0.5 rounded-full font-bold tracking-tight text-center leading-none">
                      휴일
                    </div>
                  )}

                  {isMissingAll && (
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="text-[10px] bg-gray-500 text-white w-11 py-0.5 rounded-full font-bold tracking-tight text-center leading-none">출근X</div>
                      <div className="text-[10px] bg-gray-500 text-white w-11 py-0.5 rounded-full font-bold tracking-tight text-center leading-none">퇴근X</div>
                    </div>
                  )}

                  {isMissingOut && !isMissingAll && (
                    <div className="text-[10px] bg-red-500 text-white w-11 py-0.5 rounded-full font-bold tracking-tight text-center leading-none">퇴근X</div>
                  )}
                  
                  {isLate && <div className="text-[10px] text-orange-500 font-bold tracking-tight text-center">지각</div>}
                  {isAbsent && <div className="text-[10px] text-red-500 font-bold tracking-tight text-center">결근</div>}
                </>
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7 gap-1" key={day.toISOString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="flex flex-col gap-1">{rows}</div>;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full flex flex-col">
      {renderHeader()}
      <div className="border border-gray-100 rounded-lg p-2 bg-white">
        {renderDays()}
        <div className="flex-1">
          {renderCells()}
        </div>
      </div>
    </div>
  );
}
