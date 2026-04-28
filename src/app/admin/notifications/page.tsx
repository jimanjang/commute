"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Bell, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  Clock, 
  Info,
  Loader2,
  Trash2,
  CheckSquare,
  Square,
  Plus,
  Play,
  Edit2,
  ExternalLink,
  ChevronRight,
  MoreVertical,
  Users,
  History,
  FileText,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { TriggerModal } from "@/components/TriggerModal";

export default function NotificationsPage() {
  // Triggers State
  const [triggers, setTriggers] = useState<any[]>([]);
  const [isTriggerModalOpen, setIsTriggerModalOpen] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<any>(null);
  
  // Members State (Manual Run)
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLogsLoading, setIsLogsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedSabuns, setSelectedSabuns] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'triggers' | 'manual' | 'logs'>('triggers');
  
  const [sendingStatus, setSendingStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [results, setResults] = useState<any>(null);

  // Fetch Triggers
  const fetchTriggers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/bot/triggers');
      if (res.ok) {
        setTriggers(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch triggers:", err);
    }
  }, []);

  // Fetch Users for Manual Tab
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch Logs
  const fetchLogs = useCallback(async () => {
    setIsLogsLoading(true);
    try {
      const res = await fetch('/api/admin/bot/triggers/logs');
      if (res.ok) {
        setLogs(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setIsLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTriggers();
    fetchUsers();
    if (activeTab === 'logs') {
      fetchLogs();
    }
  }, [fetchTriggers, fetchUsers, fetchLogs, activeTab]);

  // Trigger Handlers
  const handleSaveTrigger = async (data: any) => {
    try {
      const res = await fetch('/api/admin/bot/triggers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        setIsTriggerModalOpen(false);
        setEditingTrigger(null);
        fetchTriggers();
      }
    } catch (err) {
      console.error("Failed to save trigger:", err);
    }
  };

  const handleDeleteTrigger = async (id: number) => {
    if (!confirm("이 트리거를 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/admin/bot/triggers?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchTriggers();
    } catch (err) {
      console.error("Failed to delete trigger:", err);
    }
  };

  const handleRunTrigger = async (id: number) => {
    setSendingStatus('sending');
    try {
      const res = await fetch('/api/admin/bot/triggers/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`${data.targets}명 중 ${data.sent}명에게 알림 발송을 완료했습니다.`);
        fetchTriggers();
        if (activeTab === 'logs') fetchLogs();
      }
    } catch (err) {
      alert("트리거 실행 실패");
    } finally {
      setSendingStatus('idle');
    }
  };

  // Manual Filter
  const targetUsers = users.filter(u => 
    u.status === "지각" || u.status === "미출근" || u.status === "결근"
  ).filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    (u.sabun && u.sabun.includes(search)) ||
    (u.team && u.team.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-[28px] font-black text-slate-900 tracking-tight flex items-center">
            <Bell className="w-8 h-8 mr-4 text-indigo-600" />
            트리거
          </h1>
          <p className="text-sm text-gray-400 font-bold mt-1 ml-12">사용자 및 라이선스 관련 자동 알림 트리거를 관리합니다.</p>
        </div>
        
        <div className="flex items-center space-x-2">
           <button 
             onClick={() => {
                setEditingTrigger(null);
                setIsTriggerModalOpen(true);
             }}
             className="px-6 py-3 bg-[#2d7ff9] text-white text-sm font-bold rounded-2xl shadow-lg shadow-blue-100 flex items-center space-x-2 hover:bg-[#1a6de9] transition-all active:scale-95"
           >
              <Plus className="w-4 h-4" />
              <span>트리거 추가</span>
           </button>
        </div>
      </div>

      {/* GAS Sub-header / Tabs */}
      <div className="flex items-center space-x-8 border-b border-gray-200">
         <button 
           onClick={() => setActiveTab('triggers')}
           className={cn(
             "pb-4 text-sm font-bold transition-all border-b-2 px-2",
             activeTab === 'triggers' ? "border-blue-500 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600"
           )}
         >
           내 트리거
         </button>
          <button 
            onClick={() => setActiveTab('manual')}
            className={cn(
              "pb-4 text-sm font-bold transition-all border-b-2 px-2",
              activeTab === 'manual' ? "border-blue-500 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600"
            )}
          >
            수동 즉시 발송
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={cn(
              "pb-4 text-sm font-bold transition-all border-b-2 px-2",
              activeTab === 'logs' ? "border-blue-500 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600"
            )}
          >
            알림 발송 이력
          </button>
      </div>

      {activeTab === 'triggers' ? (
        /* Triggers Dashboard - GAS Style List */
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead>
                 <tr className="bg-gray-50/50">
                   <th className="px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">트리거 이름 (함수)</th>
                   <th className="px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">이벤트</th>
                   <th className="px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">최종 실행</th>
                   <th className="px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">오류율</th>
                   <th className="px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">관리</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                 {triggers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-32 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
                          <Clock className="w-8 h-8 text-gray-200" />
                        </div>
                        <p className="font-black text-gray-400">설정된 알림 트리거가 없습니다.</p>
                      </td>
                    </tr>
                 ) : triggers.map((trigger) => (
                   <tr key={trigger.id} className="hover:bg-blue-50/5 transition-colors group">
                     <td className="px-8 py-6">
                        <div className="flex items-center space-x-3">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
                              trigger.function_name === 'reminder' ? "bg-orange-50 text-orange-500" : 
                              trigger.function_name === 'attendance_smart_alert' ? "bg-indigo-50 text-indigo-500" :
                              trigger.time_type === 'REALTIME_CHECKIN' ? "bg-violet-50 text-violet-500" :
                              "bg-emerald-50 text-emerald-500"
                            )}>
                               {trigger.function_name === 'reminder' ? <AlertCircle className="w-5 h-5" /> : 
                                trigger.function_name === 'attendance_smart_alert' ? <Bell className="w-5 h-5" /> :
                                <CheckCircle2 className="w-5 h-5" />}
                            </div>
                           <div>
                               <p className="text-sm font-black text-slate-800">
                                 {trigger.time_type === 'REALTIME_CHECKIN' ? "🔔 지문 인식 시 실시간 알림" :
                                  trigger.function_name === 'reminder' ? "미출근 리마인더" : 
                                  trigger.function_name === 'attendance_smart_alert' ? "근태 통합 알림 (Smart)" :
                                  "출근 확인 알림"}
                               </p>
                              <p className="text-[11px] text-gray-400 font-bold">{trigger.function_name}</p>
                           </div>
                        </div>
                     </td>
                     <td className="px-8 py-6">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-700">
                               {trigger.time_type === 'SPECIFIC_TIME' ? '매일 특정 시간' : 
                                trigger.time_type === 'MINUTE_TIMER' ? '분 단위' : 
                                trigger.time_type === 'REALTIME_CHECKIN' ? '🔔 실시간 (지문 인식)' : '시간 기반'}
                            </span>
                            <span className="text-[11px] text-gray-400 font-bold">
                               {trigger.time_type === 'SPECIFIC_TIME' ? (
                                  `매일 ${trigger.time_value} 발송`
                               ) : trigger.time_type === 'MINUTE_TIMER' ? (
                                  `매 ${trigger.time_value}분마다 발송`
                               ) : trigger.time_type === 'REALTIME_CHECKIN' ? (
                                  '지문 인식 즉시 (30초 이내)'
                               ) : (
                                  `매일 ${trigger.time_value}:00시경 발송`
                               )}
                            </span>
                            <div className="flex items-center mt-1 space-x-1.5 opacity-80">
                               <div className="flex space-x-0.5">
                                 {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => {
                                   const active = (trigger.days_of_week || "1,2,3,4,5").split(',').includes(i.toString());
                                   return (
                                     <span key={i} className={cn(
                                       "text-[9px] font-black w-3.5 h-3.5 flex items-center justify-center rounded-sm",
                                       active ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-300"
                                     )}>
                                       {d}
                                     </span>
                                   );
                                 })}
                               </div>
                               <span className="text-gray-300">|</span>
                               <Users className="w-3 h-3 text-indigo-400" />
                               <span className="text-[10px] font-black text-indigo-500 uppercase tracking-tighter">
                                 {trigger.targets?.length > 0 ? `${trigger.targets.length}명 지정됨` : "전체 발송"}
                               </span>
                            </div>
                        </div>
                     </td>
                     <td className="px-8 py-6">
                        <p className="text-[11px] font-bold text-slate-500">
                          {trigger.last_run ? new Date(trigger.last_run).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }) : "실행 이력 없음"}
                        </p>
                     </td>
                     <td className="px-8 py-6 text-center">
                        <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                          {trigger.error_rate || "0%"}
                        </span>
                     </td>
                     <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end space-x-1">
                           <button 
                             onClick={() => handleRunTrigger(trigger.id)}
                             disabled={sendingStatus === 'sending'}
                             className="p-2.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                             title="지금 실행"
                           >
                              <Play className="w-4 h-4 fill-current" />
                           </button>
                           <button 
                             onClick={() => {
                               setEditingTrigger(trigger);
                               setIsTriggerModalOpen(true);
                             }}
                             className="p-2.5 text-slate-300 hover:text-slate-600 hover:bg-gray-50 rounded-lg transition-all"
                           >
                              <Edit2 className="w-4 h-4" />
                           </button>
                           <button 
                             onClick={() => handleDeleteTrigger(trigger.id)}
                             className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                           >
                              <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      ) : activeTab === 'manual' ? (
        <div className="animate-in fade-in duration-300 space-y-6">
           <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
             <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center bg-gray-50 px-6 py-3 rounded-[20px] w-full max-w-sm border border-gray-100">
                   <Search className="w-4 h-4 text-gray-400 mr-3" />
                   <input 
                     type="text" 
                     placeholder="수동 알림 대상자 검색..." 
                     className="bg-transparent text-xs font-bold outline-none w-full"
                     value={search}
                     onChange={(e) => setSearch(e.target.value)}
                   />
                </div>
                <button 
                  onClick={() => {
                    if (selectedSabuns.size === 0) return;
                    alert(`${selectedSabuns.size}명에게 즉시 발송합니다.`);
                  }}
                  disabled={selectedSabuns.size === 0}
                  className="px-6 py-3 bg-slate-900 text-white text-xs font-black rounded-2xl flex items-center space-x-2 disabled:opacity-50"
                >
                  <Send className="w-3 h-3" />
                  <span>{selectedSabuns.size}명 즉시 발송</span>
                </button>
             </div>
             <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {targetUsers.map(user => (
                  <div 
                    key={user.sabun}
                    onClick={() => {
                      const next = new Set(selectedSabuns);
                      if (next.has(user.sabun)) next.delete(user.sabun);
                      else next.add(user.sabun);
                      setSelectedSabuns(next);
                    }}
                    className={cn(
                      "p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between",
                      selectedSabuns.has(user.sabun) ? "border-blue-500 bg-blue-50/30" : "border-gray-100 hover:bg-gray-50"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                       <div className="w-8 h-8 bg-white border border-gray-100 rounded-lg flex items-center justify-center font-bold text-[10px] text-gray-400">
                          {user.displayName?.[0]}
                       </div>
                       <div>
                          <p className="text-[13px] font-black text-slate-800">{user.displayName}</p>
                          <p className="text-[10px] text-gray-400 font-bold">{user.team}</p>
                       </div>
                    </div>
                    {selectedSabuns.has(user.sabun) ? <CheckSquare className="w-4 h-4 text-blue-500" /> : <Square className="w-4 h-4 text-gray-200" />}
                  </div>
                ))}
             </div>
           </div>
        </div>
      ) : (
        /* Notification Logs Section */
        <div className="animate-in fade-in duration-300">
           <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead>
                   <tr className="bg-gray-50/50">
                     <th className="px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">일시</th>
                     <th className="px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">트리거 / 유형</th>
                     <th className="px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">수신자</th>
                     <th className="px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">결과</th>
                     <th className="px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">상세</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                   {isLogsLoading ? (
                     <tr><td colSpan={5} className="px-8 py-20 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-300" /></td></tr>
                   ) : logs.length === 0 ? (
                     <tr><td colSpan={5} className="px-8 py-20 text-center text-gray-400 font-bold text-sm">발송 이력이 없습니다.</td></tr>
                   ) : logs.map((log) => (
                     <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                       <td className="px-8 py-4 whitespace-nowrap">
                         <p className="text-[11px] font-bold text-slate-500">{format(new Date(log.created_at), "MM.dd HH:mm:ss")}</p>
                       </td>
                       <td className="px-8 py-4">
                         <div className="flex flex-col">
                           <span className="text-[13px] font-black text-slate-800">{log.trigger_name}</span>
                           <span className="text-[10px] text-gray-400 font-bold uppercase">{log.notify_type}</span>
                         </div>
                       </td>
                       <td className="px-8 py-4">
                         <div className="flex flex-col">
                           <span className="text-[13px] font-black text-slate-800">{log.name}</span>
                           <span className="text-[10px] text-gray-400 font-bold">{log.email}</span>
                         </div>
                       </td>
                       <td className="px-8 py-4">
                          <div className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black tracking-tight",
                            log.status === 'success' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                          )}>
                             {log.status === 'success' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <AlertTriangle className="w-3 h-3 mr-1" />}
                             {log.status === 'success' ? "성공" : "실패"}
                          </div>
                       </td>
                       <td className="px-8 py-4 text-right">
                          <span className="text-[11px] text-gray-400 font-medium">
                             {log.status === 'failure' ? log.error_message : (log.notify_type === 'checkin' ? "출근 확인" : "리마인더")}
                          </span>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>
        </div>
      )}

      {/* Trigger Modal */}
      <TriggerModal 
        isOpen={isTriggerModalOpen}
        onClose={() => setIsTriggerModalOpen(false)}
        onSave={handleSaveTrigger}
        initialData={editingTrigger}
      />
    </div>
  );
}
