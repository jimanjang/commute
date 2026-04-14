import { useState, useEffect } from "react";
import { X, Clock, CheckCircle2, AlertCircle, Mail, Save } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    sabun?: string;
    name: string;
    displayName: string;
    checkIn: string;
    checkOut: string;
    email?: string;
  };
  date: string; // YYYY-MM-DD
  onSuccess: () => void;
}

export function EditAttendanceModal({ isOpen, onClose, user, date, onSuccess }: EditAttendanceModalProps) {
  const [startTime, setStartTime] = useState(user.checkIn !== "-" ? user.checkIn : "10:00");
  const [endTime, setEndTime] = useState(user.checkOut !== "-" ? user.checkOut : "19:00");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user.email) setEmail(user.email);
    if (user.checkIn !== "-") setStartTime(user.checkIn);
    if (user.checkOut !== "-") setEndTime(user.checkOut);
  }, [user]);

  if (!isOpen) return null;

  async function handleSaveEmail() {
    setIsSavingEmail(true);
    try {
      const res = await fetch("/api/admin/users/update-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sabun: user.sabun,
          name: user.name,
          email: email
        })
      });
      if (res.ok) {
        onSuccess();
        alert("이메일 정보가 저장되었습니다.");
      } else {
        const d = await res.json();
        alert(`저장 실패: ${d.error}`);
      }
    } catch (err) {
      alert("서버 연결 실패");
    } finally {
      setIsSavingEmail(false);
    }
  }

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
          endTime,
          reason
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
      <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden border border-slate-100 flex flex-col animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
          <div>
            <h2 className="text-[22px] font-black text-slate-900 tracking-tight">구성원 정보 수정</h2>
            <p className="text-sm text-gray-400 font-bold mt-1">{user.displayName} (#{user.sabun})</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center text-sm font-bold border border-red-100">
              <AlertCircle className="w-5 h-5 mr-3" />
              {error}
            </div>
          )}

          {/* Section 1: User Profile (Email) */}
          <div className="space-y-4">
             <div className="flex items-center space-x-2 mb-1">
                <Mail className="w-4 h-4 text-indigo-500" />
                <h3 className="text-[12px] font-black text-slate-800 uppercase tracking-widest">기본 연락처 (MySQL 영구 저장)</h3>
             </div>
             <div className="flex space-x-2">
                <div className="relative flex-1 group">
                   <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-indigo-500 transition-colors" />
                   <input 
                     type="email" 
                     placeholder="example@daangnservice.com"
                     className="w-full bg-slate-50 border border-slate-100 p-4 pl-11 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all text-sm font-bold"
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                   />
                </div>
                <button 
                  onClick={handleSaveEmail}
                  disabled={isSavingEmail}
                  className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-all disabled:opacity-50"
                  title="이메일만 저장"
                >
                  {isSavingEmail ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                </button>
             </div>
          </div>

          <div className="h-[1px] bg-slate-100" />

          {/* Section 2: Attendance for Specific Date */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-1">
                <Clock className="w-4 h-4 text-orange-500" />
                <h3 className="text-[12px] font-black text-slate-800 uppercase tracking-widest">{date} 근태 수정 (BigQuery/MySQL)</h3>
             </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">출근 시간</label>
                <input 
                  type="time" 
                  className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-orange-100 focus:bg-white transition-all font-mono font-bold"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-right block">퇴근 시간</label>
                <input 
                  type="time" 
                  className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-orange-100 focus:bg-white transition-all font-mono font-bold"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">수정 사유</label>
              <textarea 
                placeholder="심야 근무 보정, 지문 인식 누락 등 사유..."
                className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-orange-100 focus:bg-white transition-all text-sm font-medium min-h-[80px] resize-none"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100/50">
             <p className="text-[11px] text-orange-700/70 font-bold leading-relaxed">
               * 근태 저장 시 세콤 PC의 MySQL 데이터가 즉각 수정되며, 약 1분 이내에 빅쿼리에 반영됩니다.
             </p>
          </div>
        </div>

        <div className="p-8 bg-slate-900 flex space-x-3">
          <button 
            onClick={onClose}
            className="flex-1 py-4 rounded-2xl font-black text-slate-400 hover:text-white transition-all"
          >
            취소
          </button>
          <button 
            onClick={handleSave}
            disabled={isSubmitting}
            className="flex-2 bg-blue-600 text-white py-4 px-8 rounded-2xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center disabled:opacity-50"
          >
            {isSubmitting ? "저장 중..." : "근태 수정 완료"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  return <Clock className={cn("animate-spin", className)} />;
}
