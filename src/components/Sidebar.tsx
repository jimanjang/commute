import { cn } from "@/lib/utils";
import { ChevronLeft, ExternalLink, Users, Building2, Calendar, CalendarDays, CalendarRange, MoreVertical } from "lucide-react";

export function Sidebar() {
  return (
    <aside className="w-[260px] border-r border-gray-200 h-screen flex flex-col bg-white overflow-y-auto shrink-0">
      {/* Header */}
      <div className="p-4 flex items-center justify-between pb-3">
        <div className="flex items-center">
          <img src="/logo.png" alt="당근서비스 워크" className="h-7 w-auto" />
        </div>
        <ChevronLeft className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
      </div>

      <div className="px-4 pb-4">
        <button className="w-full py-1.5 px-3 text-xs text-gray-600 border border-gray-200 rounded flex justify-center items-center hover:bg-gray-50 transition-colors">
          <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
          CS센터로 이동
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-4 pt-1">
        <div>
          <div className="px-3 mb-1.5 text-xs font-semibold text-gray-500 flex justify-between cursor-pointer">
            기본 정보
            <span className="text-gray-400">^</span>
          </div>
          <ul className="space-y-0.5">
            <li><a href="#" className="flex items-center px-3 py-1.5 text-sm text-gray-700 rounded-md hover:bg-gray-100"><Users className="w-4 h-4 mr-3" />구성원</a></li>
            <li><a href="#" className="flex items-center px-3 py-1.5 text-sm text-gray-700 rounded-md hover:bg-gray-100"><Building2 className="w-4 h-4 mr-3" />조직도</a></li>
          </ul>
        </div>

        <div>
          <div className="px-3 mb-1.5 text-xs font-semibold text-gray-500 flex justify-between cursor-pointer">
            일정
            <span className="text-gray-400">^</span>
          </div>
          <ul className="space-y-0.5">
            <li><a href="#" className="flex items-center px-3 py-1.5 text-sm text-gray-700 rounded-md hover:bg-gray-100"><Calendar className="w-4 h-4 mr-3" />휴가</a></li>
            <li><a href="#" className="flex items-center px-3 py-1.5 text-sm text-gray-900 bg-gray-100 font-medium rounded-md"><CalendarDays className="w-4 h-4 mr-3" />개인 일정</a></li>
            <li><a href="#" className="flex items-center px-3 py-1.5 text-sm text-gray-700 rounded-md hover:bg-gray-100"><CalendarRange className="w-4 h-4 mr-3" />팀 일정</a></li>
          </ul>
        </div>

        <div><div className="px-3 py-1.5 text-xs font-semibold text-gray-500 flex justify-between cursor-pointer">성과 <span className="text-gray-400">v</span></div></div>
        <div><div className="px-3 py-1.5 text-xs font-semibold text-gray-500 flex justify-between cursor-pointer">채용 <span className="text-gray-400">v</span></div></div>
        <div><div className="px-3 py-1.5 text-xs font-semibold text-gray-500 flex justify-between cursor-pointer">품질 평가 <span className="text-gray-400">v</span></div></div>
        <div><div className="px-3 py-1.5 text-xs font-semibold text-gray-500 flex justify-between cursor-pointer">관리 업무 <span className="text-gray-400">v</span></div></div>
      </nav>

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-gray-100 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-gray-800">Laika Jang</div>
          <div className="text-xs text-gray-400">laika@daangnservice.com</div>
        </div>
        <MoreVertical className="w-4 h-4 text-gray-400 cursor-pointer" />
      </div>
    </aside>
  );
}
