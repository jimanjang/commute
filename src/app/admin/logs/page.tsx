"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ChevronLeft, 
  Search, 
  History, 
  User, 
  Calendar as CalendarIcon, 
  Clock, 
  ArrowRight,
  Filter,
  Loader2,
  FileText,
  CheckCircle2,
  RefreshCw
} from "lucide-react";

import { cn } from "@/lib/utils";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/logs?name=${encodeURIComponent(debouncedSearch)}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [debouncedSearch]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Navigation Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link 
              href="/" 
              className="p-2.5 bg-gray-50 text-gray-400 hover:text-slate-800 hover:bg-white hover:shadow-sm rounded-xl transition-all border border-transparent hover:border-gray-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">기록 수정 통합 로그</h1>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">Admin Audit History</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="구성원 이름 또는 사번 검색..."
                className="w-72 bg-gray-50 border border-gray-100 py-3 pl-11 pr-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all text-sm font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={fetchLogs}
              className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-blue-500 hover:border-blue-100 transition-all shadow-sm"
              title="새로고침"
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            </button>
            <button className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-blue-500 hover:border-blue-100 transition-all shadow-sm">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-50 rounded-12 flex items-center justify-center">
                <History className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-[16px] font-black text-slate-800">전체 수정 내역</h3>
                <p className="text-[12px] text-gray-400 font-medium">관리자 웹을 통해 수정된 모든 근태 기록입니다.</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[20px] font-black text-slate-900">{logs.length}</span>
              <span className="text-[12px] text-gray-400 font-bold ml-1">건의 수정됨</span>
            </div>
          </div>

          <div className="overflow-x-auto min-h-[400px] relative">
            {isLoading && (
              <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                 <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
              </div>
            )}

            {logs.length === 0 && !isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 text-gray-300">
                <FileText className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg font-bold">검색 결과가 없거나 수정된 기록이 없습니다.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none whitespace-nowrap">수정 일시</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none whitespace-nowrap">대상 구성원</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none whitespace-nowrap">근무 일자</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none text-center whitespace-nowrap">수정된 시간</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none text-center whitespace-nowrap">수정 사유</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none text-center whitespace-nowrap">동기화 상태</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none text-right whitespace-nowrap">수정자</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/5 transition-colors group">
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-[13.5px] font-bold text-slate-800">{log.ModifyTime.split(' ')[0]}</span>
                          <span className="text-[11px] text-gray-400 font-mono">{log.ModifyTime.split(' ')[1]}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-black text-slate-400 uppercase group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                            {log.Name?.[0]}
                          </div>
                          <div>
                            <p className="text-[14px] font-black text-slate-800 leading-tight">{log.Name}</p>
                            <p className="text-[11px] text-gray-400 font-bold font-mono">#{log.Sabun}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="flex items-center space-x-2 text-slate-600">
                          <CalendarIcon className="w-4 h-4 text-gray-300" />
                          <span className="text-[14px] font-bold">{log.WorkDate}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="flex flex-col space-y-1 items-center">
                          <div className="flex items-center space-x-2">
                             <span className="text-[9px] font-black text-gray-300 w-6">IN</span>
                             <div className="flex items-center space-x-1.5">
                               <span className="text-[12px] font-bold text-gray-400 line-through">
                                 {log.PrevWSTime || "--:--"}
                               </span>
                               <ArrowRight className="w-3 h-3 text-gray-300" />
                               <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[12px] font-black font-mono">
                                 {log.WSTime}
                               </span>
                             </div>
                          </div>
                          <div className="flex items-center space-x-2">
                             <span className="text-[9px] font-black text-gray-300 w-6">OUT</span>
                             <div className="flex items-center space-x-1.5">
                               <span className="text-[12px] font-bold text-gray-400 line-through">
                                 {log.PrevWCTime || "--:--"}
                               </span>
                               <ArrowRight className="w-3 h-3 text-gray-300" />
                               <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[12px] font-black font-mono">
                                 {log.WCTime}
                               </span>
                             </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-8 py-5">
                        <div className="min-w-[150px] max-w-[300px]">
                          {log.ModifyReason ? (
                            <p className="text-[12px] text-slate-600 font-medium italic leading-relaxed">
                              "{log.ModifyReason}"
                            </p>
                          ) : (
                            <span className="text-gray-300 text-[12px]">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-center">
                        <div className="inline-flex items-center justify-center">
                          {log.isSynced ? (
                            <div className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 shadow-sm transition-all">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span className="text-[11px] font-black">동기화 성공</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full border border-amber-100 shadow-sm animate-pulse">
                              <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                              <span className="text-[11px] font-black">처리 대기</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 text-white rounded-lg text-[11px] font-black shadow-lg shadow-slate-200">
                          <User className="w-3.5 h-3.5" />
                          <span>{log.ModifyUser}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
