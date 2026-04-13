import { AttendanceRecord } from "./CalendarView";
import { Clock, Edit3, UserCircle, CalendarDays, ExternalLink, CheckCircle2, MessageSquare, RefreshCw } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ModificationLogProps {
  data: AttendanceRecord[];
}

export function ModificationLog({ data }: ModificationLogProps) {
  // Filter records that have been modified (not -1, not empty)
  const modifiedRecords = data.filter(record => 
    record.ModifyUser && record.ModifyUser !== '-1' && record.ModifyUser !== ''
  );

  
  // Sort by WorkDate descending (latest first)
  modifiedRecords.sort((a, b) => new Date(b.WorkDate).getTime() - new Date(a.WorkDate).getTime());

  return (
    <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-orange-50 rounded-12 flex items-center justify-center">
            <Clock className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-[17px] font-extrabold text-slate-800 tracking-tight">
              이번 달 수정 기록 
            </h2>
            <p className="text-[12px] text-gray-400 font-medium">관리자에 의해 수정된 이번 달 근태 기록입니다.</p>
          </div>
          <span className="ml-2 bg-orange-50 text-orange-600 text-[11px] px-2.5 py-1 rounded-full font-extrabold shadow-sm ring-1 ring-orange-100">
            {modifiedRecords.length}건
          </span>
        </div>
        <Link 
          href="/admin/logs" 
          className="text-[12px] font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1 px-4 py-2 bg-white border border-gray-100 shadow-sm rounded-xl transition-all hover:bg-blue-50 hover:border-blue-100"
        >
          <span>전체 보기</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {modifiedRecords.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-300 py-20">
          <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mb-6 border border-gray-100/50">
            <Clock className="w-8 h-8 text-gray-200" />
          </div>
          <p className="text-[15px] font-bold text-gray-400 tracking-tight">수정된 출퇴근 기록이 없습니다.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">근무 일자</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none text-center">수정된 시간</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">수정 사유</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">대상 구성원</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none text-right">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {modifiedRecords.map((record, idx) => (
                <tr key={idx} className="hover:bg-orange-50/10 transition-colors group">
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="flex items-center space-x-2 text-slate-800">
                      <CalendarDays className="w-4 h-4 text-orange-400" />
                      <span className="text-[14px] font-bold">{record.WorkDate}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="flex flex-col space-y-2 items-center">
                      {/* Check-in transition */}
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-black text-gray-300 w-8">IN</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-[13px] font-bold text-gray-400 line-through">
                            {record.PrevWSTime ? record.PrevWSTime : "--:--"}
                          </span>
                          <span className="text-gray-300 font-bold">➜</span>
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[13px] font-black font-mono">
                            {record.WSTime ? record.WSTime.substring(0, 5) : "--:--"}
                          </span>
                        </div>
                      </div>
                      
                      {/* Check-out transition */}
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-black text-gray-300 w-8">OUT</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-[13px] font-bold text-gray-400 line-through">
                            {record.PrevWCTime ? record.PrevWCTime : "--:--"}
                          </span>
                          <span className="text-gray-300 font-bold">➜</span>
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[13px] font-black font-mono">
                            {record.WCTime ? record.WCTime.substring(0, 5) : "--:--"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-8 py-5">
                    <div className="max-w-[200px]">
                      {record.ModifyReason ? (
                        <p className="text-[12px] text-slate-500 font-medium italic truncate" title={record.ModifyReason}>
                          "{record.ModifyReason}"
                        </p>
                      ) : (
                        <span className="text-gray-300 text-[12px]">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="flex items-center space-x-2 text-[13px]">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] text-slate-400 font-black uppercase">
                        {record.Name[0]}
                      </div>
                      <span className="font-bold text-slate-700">{record.Name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right whitespace-nowrap">
                    {record.isSynced ? (
                      <div className="inline-flex items-center space-x-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black border border-emerald-100">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Synced</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center space-x-1 px-2 py-0.5 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black border border-amber-100 animate-pulse">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Syncing</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
