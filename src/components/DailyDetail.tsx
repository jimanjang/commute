import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Clock, Edit, Check } from "lucide-react";
import { AttendanceRecord } from "./CalendarView";
import { cn } from "@/lib/utils";


interface DailyDetailProps {
  date: Date;
  record: AttendanceRecord | undefined;
  onEditClick?: () => void;
}

export function DailyDetail({ date, record, onEditClick }: DailyDetailProps) {
  const isApproved = record?.ModifyUser || record?.ModifyTime;
  const isToday = format(new Date(), "yyyy-MM-dd") === format(date, "yyyy-MM-dd");
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  
  // Real-time status logic
  const now = new Date();
  const currentHour = now.getHours();
  
  let mainStatus = "대기";
  let statusColor = "text-gray-400";
  let statusBg = "bg-gray-200";
  
  if (record?.WCTime) {
    mainStatus = "퇴근";
    statusColor = "text-blue-600";
    statusBg = "bg-blue-100";
  } else if (record?.WSTime) {
    mainStatus = "출근";
    statusColor = "text-emerald-600";
    statusBg = "bg-emerald-100";
  } else if (isToday && currentHour >= 10 && !isWeekend) {
    mainStatus = "지각";
    statusColor = "text-orange-600";
    statusBg = "bg-orange-100";
  } else if (isWeekend && !record?.WSTime) {
    mainStatus = "휴일";
    statusColor = "text-gray-400";
    statusBg = "bg-gray-100";
  }

  const isPastDate = date < new Date() && !isToday;
  const isMissingOut = record?.WSTime && !record?.WCTime && (isToday ? currentHour >= 19 : isPastDate);
  const isMissingAll = !isWeekend && isPastDate && (!record || (!record.WSTime && !record.WCTime));



  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col min-h-[300px]">
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-[17px] font-bold text-gray-800 tracking-tight">{format(date, "yyyy년 MM월 dd일")}</h2>
            {onEditClick && (
              <button 
                onClick={onEditClick}
                className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                title="기록 수정"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-[13px] text-gray-500 mt-1">{format(date, "EEEE", { locale: ko })}</p>
        </div>
      </div>

        <div className={cn(
          "rounded-lg p-5 flex flex-col space-y-3 mb-6 border items-center justify-center transition-all",
          isMissingAll ? "bg-gray-100 border-gray-200" : (isMissingOut ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100")
        )}>
          <div className="flex items-center space-x-3 text-gray-800">
            <div className="bg-white p-2.5 rounded-xl shadow-sm border border-gray-100">
              <Clock className={cn("w-4.5 h-4.5", isMissingAll ? "text-gray-400" : (isMissingOut ? "text-red-500" : "text-orange-500"))} />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-black text-gray-400 uppercase tracking-tighter">Daily Attendance</span>
              <span className={cn(
                "font-black text-[17px] tracking-tight whitespace-nowrap flex items-center gap-2",
                isMissingOut && !isMissingAll && "text-red-600"
              )}>
                {isMissingAll ? (
                  <>
                    <span className="bg-gray-500 text-white px-2 py-0.5 rounded-full text-[14px]">출근X</span>
                    <span className="bg-gray-500 text-white px-2 py-0.5 rounded-full text-[14px]">퇴근X</span>
                  </>
                ) : (
                  <>
                    {record?.WSTime ? record.WSTime.substring(0, 5) : "--:--"} ~ {record?.WCTime ? record.WCTime.substring(0, 5) : (isMissingOut ? (
                      <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[14px] animate-pulse">퇴근X</span>
                    ) : "진행중")}
                  </>
                )}
              </span>
            </div>
          </div>
        </div>


      <div className="flex-1">
        <div className="flex justify-between items-center mb-4 pb-2">
           <span className={cn(
             "text-[11px] font-bold px-2.5 py-0.5 rounded-sm",
             statusBg, statusColor
           )}>
             {mainStatus}
           </span>
           {isApproved ? (
             <span className="text-[12px] font-bold text-green-500 flex items-center pr-1"><Check className="w-3.5 h-3.5 mr-0.5"/> 승인</span>
           ) : (
             <span className="text-[12px] font-bold text-gray-400">대기</span>
           )}
        </div>
        
        <div className="space-y-3.5">
          <div className="grid grid-cols-[60px_1fr] text-[13.5px]">
            <span className="text-gray-400 font-medium">예정</span>
            <span className="text-gray-800">{record?.ScheduleName || "10:00 ~ 19:00"}</span>
          </div>
          <div className="grid grid-cols-[60px_1fr] text-[13.5px]">
            <span className="text-gray-400 font-medium">실제</span>
            <span className="text-gray-800">
              {record?.WSTime ? record.WSTime.substring(0,5) : "--:--"} ~ {record?.WCTime ? record.WCTime.substring(0,5) : "--:--"}
            </span>
          </div>
          <div className="grid grid-cols-[60px_1fr] text-[13.5px]">
            <span className="text-gray-400 font-medium">처리</span>
            <span className="text-gray-800">{record?.ModifyUser || "시스템"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

