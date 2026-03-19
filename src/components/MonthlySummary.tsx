import { AttendanceRecord } from "./CalendarView";

interface MonthlySummaryProps {
  data: AttendanceRecord[];
  yearMonth: string; // "2026년 3월"
}

export function MonthlySummary({ data, yearMonth }: MonthlySummaryProps) {
  const totalWork = data.reduce((acc, curr) => acc + curr.TotalWorkTime, 0);
  const totalOW = data.reduce((acc, curr) => acc + curr.OWTime, 0);
  const totalNW = data.reduce((acc, curr) => acc + curr.NWTime, 0);
  const totalHW = data.reduce((acc, curr) => acc + curr.HWTime, 0);
  const totalLate = data.reduce((acc, curr) => acc + curr.bLate, 0);
  const totalAbsent = data.reduce((acc, curr) => acc + curr.bAbsent, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col text-sm shadow-sm min-h-[220px]">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-[17px] font-bold text-gray-800 tracking-tight">월간 요약</h2>
        <span className="text-gray-400 text-[13.5px] font-medium">{yearMonth}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 근로 영역 */}
        <div className="bg-gray-50 rounded-lg p-5 border border-gray-100">
           <div className="flex items-center mb-5 text-gray-800 font-bold space-x-1.5 text-sm tracking-tight">
             <span>⏱</span>
             <span>근무</span>
           </div>
           <div className="space-y-2.5">
             <div className="flex justify-between items-center text-[13.5px]">
               <span className="text-gray-500 font-medium">근로시간</span>
               <span className="font-bold text-gray-800 tracking-tight">{totalWork.toFixed(1)}h</span>
             </div>
             <div className="flex justify-between items-center text-[13.5px]">
               <span className="text-gray-500 font-medium">연장근로</span>
               <span className="font-bold text-gray-800 tracking-tight">{totalOW.toFixed(1)}h</span>
             </div>
             <div className="flex justify-between items-center text-[13.5px]">
               <span className="text-gray-500 font-medium">야간근로</span>
               <span className="font-bold text-gray-800 tracking-tight">{totalNW.toFixed(1)}h</span>
             </div>
             <div className="flex justify-between items-center text-[13.5px]">
               <span className="text-gray-500 font-medium">휴일근로</span>
               <span className="font-bold text-gray-800 tracking-tight">{totalHW.toFixed(1)}h</span>
             </div>
           </div>
        </div>

        {/* 휴가 영역 */}
        <div className="bg-gray-50 rounded-lg p-5 border border-gray-100">
           <div className="flex items-center mb-5 text-gray-800 font-bold space-x-1.5 text-sm tracking-tight">
             <span>🏖</span>
             <span>휴가</span>
           </div>
           <div className="space-y-2.5 mt-1">
             <div className="flex justify-between items-center text-[13.5px]">
               <span className="text-gray-500 font-medium">이번 달 사용</span>
               <span className="font-bold text-gray-800 tracking-tight">0.0일</span>
             </div>
             <div className="flex justify-between items-center text-[13.5px]">
               <span className="text-gray-500 font-medium">남은 연차</span>
               <span className="font-bold text-gray-800 tracking-tight">0.0일</span>
             </div>
           </div>
        </div>

        {/* 출결 영역 */}
        <div className="bg-gray-50 rounded-lg p-5 border border-gray-100 flex flex-col">
           <div className="flex items-center mb-5 text-gray-800 font-bold space-x-1.5 text-sm tracking-tight">
             <span>📊</span>
             <span>출결</span>
           </div>
           <div className="space-y-2.5 mt-1">
             <div className="flex justify-between items-center text-[13.5px]">
               <span className="text-gray-500 font-medium">지각</span>
               <span className="font-bold text-gray-800 tracking-tight">{totalLate}회</span>
             </div>
             <div className="flex justify-between items-center text-[13.5px]">
               <span className="text-gray-500 font-medium">결근</span>
               <span className="font-bold text-gray-800 tracking-tight">{totalAbsent}회</span>
             </div>
           </div>
           
           <div className="mt-auto pt-4 flex-1 flex flex-col justify-end">
             <div className="border-t border-gray-200 pt-3">
               <span className="text-gray-500 text-[13px] tracking-tight">✓ 출결 양호</span>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
