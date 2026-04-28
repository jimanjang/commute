"use client";

import { X, ChevronDown, Plus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { MemberSelectModal } from "./MemberSelectModal";

interface TriggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
}

export function TriggerModal({ isOpen, onClose, onSave, initialData }: TriggerModalProps) {
  const [functionName, setFunctionName] = useState(initialData?.function_name || "reminder");
  const [eventSource, setEventSource] = useState(initialData?.event_source || "TIME_DRIVEN");
  const [timeType, setTimeType] = useState(initialData?.time_type || "DAY_TIMER");
  const [timeValue, setTimeValue] = useState(initialData?.time_value || "09");
  const [targets, setTargets] = useState<string[]>(initialData?.targets || []);
  const [daysOfWeek, setDaysOfWeek] = useState(initialData?.days_of_week || "1,2,3,4,5");
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);

  // Sync form state when initialData or isOpen changes
  useEffect(() => {
    if (isOpen) {
      setFunctionName(initialData?.function_name || "reminder");
      setEventSource(initialData?.event_source || "TIME_DRIVEN");
      setTimeType(initialData?.time_type || "DAY_TIMER");
      setTimeValue(initialData?.time_value || "09");
      setTargets(initialData?.targets || []);
      setDaysOfWeek(initialData?.days_of_week || "1,2,3,4,5");
    }
  }, [isOpen, initialData]);

  const days = [
    { label: '일', value: '0' },
    { label: '월', value: '1' },
    { label: '화', value: '2' },
    { label: '수', value: '3' },
    { label: '목', value: '4' },
    { label: '금', value: '5' },
    { label: '토', value: '6' }
  ];

  const toggleDay = (value: string) => {
    const current = daysOfWeek.split(',').filter((d: string) => d !== '');
    if (current.includes(value)) {
      setDaysOfWeek(current.filter((d: string) => d !== value).join(','));
    } else {
      setDaysOfWeek([...current, value].sort().join(','));
    }
  };

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      id: initialData?.id,
      function_name: functionName,
      event_source: eventSource,
      time_type: timeType,
      time_value: timeValue,
      is_active: initialData?.is_active ?? true,
      targets: targets,
      days_of_week: daysOfWeek
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      
      {/* Modal Content - GAS Style */}
      <div className="relative bg-white w-full max-w-[700px] rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
          <h2 className="text-[15px] font-bold text-gray-700">트리거 추가/수정</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body - 2 Columns */}
        <div className="flex bg-gray-50/30">
          {/* Left Column: Main Settings */}
          <div className="flex-1 p-8 space-y-6 border-r border-gray-100">
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-gray-600">실행할 함수 선택</label>
              <div className="relative group">
                <select 
                  value={functionName}
                  onChange={(e) => setFunctionName(e.target.value)}
                  className="w-full appearance-none bg-white border border-gray-200 rounded-md px-4 py-2.5 text-[13px] outline-none group-hover:border-blue-400 transition-colors shadow-sm"
                >
                  <option value="checkin_confirm">출근 확인 알림</option>
                  <option value="reminder">미출근 리마인더</option>
                  <option value="attendance_smart_alert">근태 통합 알림 (Smart Alert)</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-bold text-gray-600">이벤트 소스 선택</label>
              <div className="relative group">
                <select 
                  value={eventSource}
                  onChange={(e) => setEventSource(e.target.value)}
                  className="w-full appearance-none bg-white border border-gray-200 rounded-md px-4 py-2.5 text-[13px] outline-none group-hover:border-blue-400 transition-colors shadow-sm"
                >
                  <option value="TIME_DRIVEN">시간 기반</option>
                  <option value="Sabun_DRIVEN">특정 이벤트 기반 (준비중)</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-bold text-gray-600">트리거 기반 시간 유형 선택</label>
              <div className="relative group">
                <select 
                  value={timeType}
                  onChange={(e) => setTimeType(e.target.value)}
                  className="w-full appearance-none bg-white border border-gray-200 rounded-md px-4 py-2.5 text-[13px] outline-none group-hover:border-blue-400 transition-colors shadow-sm"
                >
                  <option value="DAY_TIMER">일 단위 타이머</option>
                  <option value="MINUTE_TIMER">분 단위 타이머</option>
                  <option value="SPECIFIC_TIME">매일 특정 시간</option>
                  <option value="REALTIME_CHECKIN">🔔 지문 인식 시 (실시간)</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {timeType !== 'REALTIME_CHECKIN' && (
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-gray-600">시간 선택</label>
              <div className="relative group">
                {timeType === 'SPECIFIC_TIME' ? (
                  <input 
                    type="time"
                    value={timeValue}
                    onChange={(e) => setTimeValue(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-md px-4 py-2.5 text-[13px] outline-none group-hover:border-blue-400 transition-colors shadow-sm"
                  />
                ) : (
                  <>
                    <select 
                      value={timeValue}
                      onChange={(e) => setTimeValue(e.target.value)}
                      className="w-full appearance-none bg-white border border-gray-200 rounded-md px-4 py-2.5 text-[13px] outline-none group-hover:border-blue-400 transition-colors shadow-sm"
                    >
                      {Array.from({ length: 24 }).map((_, i) => (
                        <option key={i} value={i.toString().padStart(2, '0')}>
                          {i.toString().padStart(2, '0')}:00 ~ {(i+1).toString().padStart(2, '0')}:00 사이
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </>
                )}
              </div>
            </div>
            )}

            {timeType === 'REALTIME_CHECKIN' && (
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <p className="text-[12px] font-bold text-blue-700">🔔 실시간 모드</p>
                <p className="text-[11px] text-blue-500 mt-1">지문 인식이 감지되면 30초 이내에 슬랙 알림이 자동 발송됩니다. 당일 최초 출근 기록에 대해서만 1회 발송됩니다.</p>
              </div>
            )}

            <div className="space-y-4 pt-4 border-t border-gray-100">
               <label className="text-[13px] font-bold text-gray-600">실행 요일 선택</label>
               <div className="flex items-center space-x-2">
                 {days.map(day => {
                   const isActive = daysOfWeek.split(',').includes(day.value);
                   return (
                     <button
                       key={day.value}
                       onClick={() => toggleDay(day.value)}
                       className={cn(
                         "w-10 h-10 rounded-xl text-sm font-black transition-all border",
                         isActive 
                           ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100" 
                           : "bg-white border-gray-200 text-gray-400 hover:border-blue-200"
                       )}
                     >
                       {day.label}
                     </button>
                   );
                 })}
               </div>
               <p className="text-[10px] text-gray-400 font-bold">
                 * 선택한 요일에만 트리거가 동작합니다. (평일 기본값: 월~금)
               </p>
            </div>
          </div>

          {/* Right Column: Other Settings */}
          <div className="w-[280px] p-8 space-y-8">
             <div className="space-y-2">
               <div className="flex items-center justify-between">
                 <label className="text-[13px] font-bold text-gray-600">실패 알림 설정</label>
                 <Plus className="w-4 h-4 text-gray-400 hover:text-blue-500 cursor-pointer" />
               </div>
               <div className="relative group">
                <select className="w-full appearance-none bg-white border border-gray-200 rounded-md px-4 py-2.5 text-[11px] outline-none group-hover:border-blue-400 transition-colors shadow-sm">
                  <option>매일 알림</option>
                  <option>즉시 알림</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
              </div>
             </div>

             <div className="space-y-3 pt-2">
                <label className="text-[13px] font-bold text-gray-600">대상자 설정</label>
                <button 
                  onClick={() => setIsMemberModalOpen(true)}
                  className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-md px-4 py-2.5 text-[11px] font-bold text-gray-600 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all shadow-sm group"
                >
                   <div className="flex items-center space-x-2">
                      <Users className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-500" />
                      <span>대상자 선택</span>
                   </div>
                   <ChevronDown className="w-3 h-3 text-gray-300" />
                </button>
                <p className="text-[10px] text-indigo-500 font-bold ml-1">
                   {targets.length > 0 ? `${targets.length}명 선택됨` : "전체 발송 (미지정)"}
                </p>
             </div>
             
             <div className="pt-8 text-[11px] text-gray-400 font-bold text-center italic">
               (GMT+09:00) 설정됨
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-end space-x-3 bg-white border-t border-gray-100">
          <button 
            onClick={onClose}
            className="px-6 py-2 text-[13px] font-bold text-blue-600 hover:bg-blue-50 rounded-md transition-all"
          >
            취소
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2 bg-[#2d7ff9] text-white text-[13px] font-bold rounded-md hover:bg-[#1a6de9] transition-all shadow-md active:scale-95"
          >
            저장
          </button>
        </div>
      </div>

      {/* Member Selection Pop-up */}
      <MemberSelectModal 
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        onConfirm={(selectedSabuns) => {
          setTargets(selectedSabuns);
          setIsMemberModalOpen(false);
        }}
        initialSelected={targets}
      />
    </div>
  );
}
