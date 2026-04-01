"use client";

import { useState, useEffect } from "react";
import { 
  Database, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Cpu, 
  History 
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SyncStatusPage() {
  const [status, setStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function checkHealth() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/health");
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-black text-gray-900 tracking-tight flex items-center">
            <RefreshCw className="w-7 h-7 mr-3 text-blue-500" />
            동기화 상태 대시보드
          </h1>
          <p className="text-sm text-gray-400 font-bold mt-1 ml-10">세콤 시스템과 빅쿼리 간의 연동 상태를 실시간으로 점검합니다.</p>
        </div>
        <button 
          onClick={checkHealth}
          className="bg-white border border-gray-100 p-3 rounded-2xl shadow-sm hover:bg-gray-50 transition-all active:scale-95"
        >
          <RefreshCw className={cn("w-5 h-5 text-blue-500", isLoading && "animate-spin")} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* MySQL Status */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
          <div className={cn(
            "w-16 h-16 rounded-[24px] flex items-center justify-center mb-6",
            status?.mysql ? "bg-emerald-50 text-emerald-500" : "bg-red-50 text-red-500"
          )}>
            <Database className="w-8 h-8" />
          </div>
          <h3 className="font-black text-slate-800 text-lg mb-1">세콤 PC (MySQL)</h3>
          <p className="text-sm text-gray-400 font-medium mb-6">172.17.3.206</p>
          <div className="flex items-center space-x-2">
             {status?.mysql ? (
               <span className="text-emerald-500 text-xs font-black bg-emerald-50 px-3 py-1 rounded-full flex items-center">
                 <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> 연결됨
               </span>
             ) : (
               <div className="flex flex-col items-center">
                 <span className="text-red-500 text-xs font-black bg-red-50 px-3 py-1 rounded-full flex items-center mb-1">
                   <XCircle className="w-3.5 h-3.5 mr-1" /> 연결 끊김
                 </span>
                 <span className="text-[10px] text-red-400 font-mono">{status?.mysqlError || "CHECK NETWORK"}</span>
               </div>
             )}
          </div>
        </div>

        {/* BigQuery Status */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-[24px] flex items-center justify-center mb-6">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="font-black text-slate-800 text-lg mb-1">구글 빅쿼리</h3>
          <p className="text-sm text-gray-400 font-medium mb-6">secom-data.secom</p>
          <span className="text-blue-500 text-xs font-black bg-blue-50 px-3 py-1 rounded-full flex items-center">
             <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> 인증 유효
          </span>
        </div>

        {/* Python Script Health */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-[24px] flex items-center justify-center mb-6">
            <Cpu className="w-8 h-8" />
          </div>
          <h3 className="font-black text-slate-800 text-lg mb-1">동기화 프로세스</h3>
          <p className="text-sm text-gray-400 font-medium mb-6">Python Sync Script</p>
          <div className="flex flex-col items-center space-y-2">
             <span className="text-orange-500 text-xs font-black bg-orange-50 px-3 py-1 rounded-full flex items-center">
                최근 동기화: {status?.lastSync || "확인 중..."}
             </span>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 rounded-[32px] p-8 text-white">
        <div className="flex items-center space-x-4 mb-6">
           <div className="p-3 bg-slate-800 rounded-2xl">
              <History className="w-6 h-6 text-slate-400" />
           </div>
           <div>
              <h3 className="font-extrabold text-[17px]">시스템 가이드</h3>
              <p className="text-slate-400 text-sm">보정 데이터 처리 흐름에 대한 안내입니다.</p>
           </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 ml-4">
           <div className="border-l-2 border-slate-700 pl-6 py-2">
              <p className="text-orange-400 font-black mb-1">01. 수정 요청</p>
              <p className="text-sm text-slate-400">대시보드에서 보정 요청 시 내역이 세콤 PC의 로컬 DB(MySQL)에 즉시 반영됩니다.</p>
           </div>
           <div className="border-l-2 border-slate-700 pl-6 py-2">
              <p className="text-blue-400 font-black mb-1">02. 데이터 미러링</p>
              <p className="text-sm text-slate-400">세콤 PC에서 실행 중인 파이썬 스크립트가 1분 이내에 수정 내역을 빅쿼리로 전송합니다.</p>
           </div>
        </div>
      </div>
    </div>
  );
}
