import { AttendanceRecord } from "./CalendarView";
import { Clock, Edit3, UserCircle, CalendarDays } from "lucide-react";
import { format } from "date-fns";

interface ModificationLogProps {
  data: AttendanceRecord[];
}

export function ModificationLog({ data }: ModificationLogProps) {
  // Filter records that have been modified
  const modifiedRecords = data.filter(record => record.ModifyUser || record.ModifyTime);
  
  // Sort by WorkDate descending (latest first)
  modifiedRecords.sort((a, b) => new Date(b.WorkDate).getTime() - new Date(a.WorkDate).getTime());

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[17px] font-extrabold text-slate-800 tracking-tight flex items-center">
          이번 달 수정 기록 
          <span className="ml-3 bg-blue-50 text-blue-600 text-[11px] px-2.5 py-1 rounded-full font-bold shadow-sm">
            {modifiedRecords.length}건
          </span>
        </h2>
      </div>

      {modifiedRecords.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-300 py-10 min-h-[150px]">
          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 text-gray-200" />
          </div>
          <p className="text-[14px] font-bold text-gray-400 tracking-tight">수정된 출퇴근 기록이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
          {modifiedRecords.map((record, idx) => {
             // Safe date parsing in case ModifyTime format isn't standard ISO
             let formattedModifyTime = "-";
             if (record.ModifyTime) {
               try {
                 formattedModifyTime = format(new Date(record.ModifyTime), "yyyy.MM.dd HH:mm");
               } catch (e) {
                 formattedModifyTime = record.ModifyTime.substring(0, 16);
               }
             }

             return (
              <div key={idx} className="flex items-start bg-gray-50/50 hover:bg-orange-50/30 transition-colors p-4 rounded-2xl border border-gray-100 group">
                <div className="w-10 h-10 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center mr-4 flex-shrink-0 group-hover:border-orange-200 transition-colors">
                  <Edit3 className="w-4 h-4 text-orange-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-bold text-gray-800 text-[14.5px] tracking-tight">
                        {record.WorkDate}
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-400 font-medium">
                      {formattedModifyTime}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-white border border-gray-100 rounded-lg shadow-sm">
                      <span className="text-[12px] font-black text-blue-600 font-mono tracking-tighter">
                        {record.WSTime ? record.WSTime.substring(0, 5) : "--:--"}
                      </span>
                      <span className="text-gray-300 text-[10px]">~</span>
                      <span className="text-[12px] font-black text-blue-600 font-mono tracking-tighter">
                        {record.WCTime ? record.WCTime.substring(0, 5) : "--:--"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-[12.5px] text-gray-500 font-medium">
                      <UserCircle className="w-3.5 h-3.5 text-gray-400" />
                      <span>{record.ModifyUser || "System"}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
