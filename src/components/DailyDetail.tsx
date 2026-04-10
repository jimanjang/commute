import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Clock, Edit, Check } from "lucide-react";
import { AttendanceRecord } from "./CalendarView";

interface DailyDetailProps {
  date: Date;
  record: AttendanceRecord | undefined;
  onEditClick?: () => void;
}

export function DailyDetail({ date, record, onEditClick }: DailyDetailProps) {
  const isApproved = record?.ModifyUser || record?.ModifyTime;
  
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

      <div className="bg-gray-50 rounded-lg p-5 flex flex-col space-y-3 mb-6 border border-gray-100 items-center justify-center">
        <div className="flex items-center space-x-3 text-gray-800">
          <div className="bg-white p-2.5 rounded-xl shadow-sm border border-gray-100">
            <Clock className="w-4.5 h-4.5 text-orange-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-black text-gray-400 uppercase tracking-tighter">Daily Attendance</span>
            <span className="font-black text-[17px] tracking-tight whitespace-nowrap">
              {record?.WSTime ? record.WSTime.substring(0, 5) : "--:--"} ~ {record?.WCTime ? record.WCTime.substring(0, 5) : "진행중"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <div className="flex justify-between items-center mb-4 pb-2">
           <span className="text-[11px] font-bold text-gray-500 bg-gray-200 px-2.5 py-0.5 rounded-sm">근무일</span>
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
