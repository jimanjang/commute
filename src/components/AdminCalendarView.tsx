"use client";

import { useState } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays } from "date-fns";
import { ChevronLeft, ChevronRight, Users, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AdminDailyCount {
  date: string; // YYYY-MM-DD
  checkIns: number;
  checkOuts: number;
  lates: number;
  absents: number;
  target?: number;
  vacation?: number;
  off?: number;
  missing?: number;
  beforeWork?: number;
}

interface AdminCalendarViewProps {
  data: AdminDailyCount[];
  onDateSelect: (date: Date) => void;
  selectedDate: Date | null;
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}

export function AdminCalendarView({ data, onDateSelect, selectedDate, currentMonth, onMonthChange }: AdminCalendarViewProps) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const prevMonth = () => {
    onMonthChange(subMonths(currentMonth, 1));
  };
  const nextMonth = () => {
    onMonthChange(addMonths(currentMonth, 1));
  };

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[18px] font-extrabold text-slate-800 tracking-tight">월간 출퇴근 현황</h2>
          <p className="text-sm text-gray-400 font-medium mt-1">상세 기록을 보려면 날짜를 선택하세요.</p>
        </div>
        <div className="flex items-center space-x-3 bg-gray-50/50 p-1 rounded-xl border border-gray-100">
          <button onClick={prevMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
          <span className="font-extrabold text-slate-800 text-[16px] min-w-[110px] text-center tracking-tight">{format(currentMonth, 'yyyy년 M월')}</span>
          <button onClick={nextMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all"><ChevronRight className="w-5 h-5 text-gray-600" /></button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    const date = ['일', '월', '화', '수', '목', '금', '토'];
    for (let i = 0; i < 7; i++) {
        days.push(
          <div className={cn("text-center text-sm font-bold py-3", i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-400")} key={i}>
            {date[i]}
          </div>
        );
    }
    return <div className="grid grid-cols-7 mb-2">{days}</div>;
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
        const dayData = data.find(d => d.date === currentStringDate);
        const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isToday = isSameDay(day, new Date());
        
        const cloneDay = day;

        days.push(
          <div
            className={cn(
              "min-h-[160px] border border-transparent p-2 flex flex-col cursor-pointer transition-all rounded-2xl select-none relative group",
              !isCurrentMonth ? "opacity-30 pointer-events-none" : "",
              isSelected ? "bg-orange-50 border-orange-200 ring-2 ring-orange-100 ring-offset-2" : "hover:bg-gray-50 border-gray-100 bg-white",
            )}
            key={day.toISOString()}
            onClick={() => onDateSelect(cloneDay)}
          >
            <div className="flex justify-between items-start mb-2">
              <span className={cn(
                 "text-sm font-extrabold inline-flex w-7 h-7 items-center justify-center rounded-full tracking-tight",
                 isToday && !isSelected ? "bg-blue-100 text-blue-600" : "",
                 isSelected ? "bg-orange-500 text-white" : (!isToday && i === 0 ? "text-red-500" : !isToday && i === 6 ? "text-blue-500" : "text-slate-700")
              )}>
                {formattedDate}
              </span>
              {(dayData?.target !== undefined) && (
                <span className="text-[9px] font-black text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-lg border border-gray-100">
                  T {dayData.target}
                </span>
              )}
            </div>
            
            <div className="mt-auto flex flex-col gap-0.5 w-full">
              {dayData && (
                <>
                  {dayData.checkIns > 0 && (
                    <div className="flex items-center justify-between text-[10px] font-bold text-emerald-600 bg-emerald-50/30 rounded px-1.5 py-0.5">
                      <span>출근</span>
                      <span>{dayData.checkIns}</span>
                    </div>
                  )}
                  {(dayData.missing || 0) > 0 && (
                    <div className="flex items-center justify-between text-[10px] font-bold text-red-600 bg-red-50/30 rounded px-1.5 py-0.5">
                      <span>지각/누락</span>
                      <span>{dayData.missing}</span>
                    </div>
                  )}
                  {(dayData.beforeWork || 0) > 0 && (
                    <div className="flex items-center justify-between text-[10px] font-bold text-blue-600 bg-blue-50/30 rounded px-1.5 py-0.5">
                      <span>출근 전</span>
                      <span>{dayData.beforeWork}</span>
                    </div>
                  )}
                  {(dayData.off || 0) > 0 && (
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 bg-slate-100/50 rounded px-1.5 py-0.5">
                      <span>휴무</span>
                      <span>{dayData.off}</span>
                    </div>
                  )}
                  {(dayData.vacation || 0) > 0 && (
                    <div className="flex items-center justify-between text-[10px] font-bold text-purple-600 bg-purple-50/30 rounded px-1.5 py-0.5">
                      <span>휴가</span>
                      <span>{dayData.vacation}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7 gap-3 mb-3" key={day.toISOString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="flex flex-col">{rows}</div>;
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
      {renderHeader()}
      <div className="bg-white">
        {renderDays()}
        <div className="flex-1 mt-2">
          {renderCells()}
        </div>
      </div>
    </div>
  );
}
