"use client";

import { useState } from "react";
import { X, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    name: string;
    displayName: string;
    checkIn: string;
    checkOut: string;
  };
  date: string; // YYYY-MM-DD
  onSuccess: () => void;
}

export function EditAttendanceModal({ isOpen, onClose, user, date, onSuccess }: EditAttendanceModalProps) {
  const [startTime, setStartTime] = useState(user.checkIn === "-" ? "09:00" : user.checkIn);
  const [endTime, setEndTime] = useState(user.checkOut === "-" ? "18:00" : user.checkOut);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSave() {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/attendance/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: user.name,
          date: date,
          startTime,
          endTime
        })
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || "수정 실패");
      }
    } catch (err) {
      setError("서버 연결 실패");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden border border-slate-100 flex flex-col animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
          <div>
            <h2 className="text-[20px] font-black text-slate-900 tracking-tight">근태 정보 수정</h2>
            <p className="text-sm text-gray-400 font-bold mt-1">{user.displayName} (#{date})</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center text-sm font-bold border border-red-100">
              <AlertCircle className="w-5 h-5 mr-3" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">출근 시간</label>
            <div className="relative group">
               <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
               <input 
                 type="time" 
                 className="w-full bg-gray-50 border border-gray-100 p-4 pl-12 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all font-mono font-bold"
                 value={startTime}
                 onChange={(e) => setStartTime(e.target.value)}
               />
            </div>
          </div>

          <div className="space-y-2 text-right">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest mr-1">퇴근 시간</label>
            <div className="relative group">
               <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
               <input 
                 type="time" 
                 className="w-full bg-gray-50 border border-gray-100 p-4 pl-12 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all font-mono font-bold"
                 value={endTime}
                 onChange={(e) => setEndTime(e.target.value)}
               />
            </div>
          </div>

          <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100/50">
             <p className="text-[11px] text-orange-700/70 font-bold leading-relaxed">
               * 저장 버튼을 누르면 세콤 PC의 MySQL 데이터가 즉각 수정되며, 약 1분 이내에 빅쿼리 및 대시보드에 반영됩니다.
             </p>
          </div>
        </div>

        <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex space-x-3">
          <button 
            onClick={onClose}
            className="flex-1 py-4 rounded-2xl font-black text-gray-500 hover:bg-gray-100 transition-all border border-gray-200"
          >
            취소
          </button>
          <button 
            onClick={handleSave}
            disabled={isSubmitting}
            className="flex-2 bg-blue-600 text-white py-4 px-8 rounded-2xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center disabled:opacity-50"
          >
            {isSubmitting ? "저장 중..." : "수정 완료"}
          </button>
        </div>
      </div>
    </div>
  );
}
