"use client";

import { useState, useEffect } from "react";
import { X, Search, CheckSquare, Square, Loader2, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface MemberSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedSabuns: string[]) => void;
  initialSelected: string[];
}

export function MemberSelectModal({ isOpen, onClose, onConfirm, initialSelected }: MemberSelectModalProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));

  useEffect(() => {
    if (isOpen) {
      setSelected(new Set(initialSelected));
      fetchUsers();
    }
  }, [isOpen, initialSelected]);

  const fetchUsers = async () => {
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
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    (u.sabun && u.sabun.includes(search)) ||
    (u.team && u.team.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleUser = (sabun: string) => {
    const next = new Set(selected);
    if (next.has(sabun)) next.delete(sabun);
    else next.add(sabun);
    setSelected(next);
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selected));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
           <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
                 <Users className="w-5 h-5" />
              </div>
              <h3 className="font-black text-slate-900">대상자 선택</h3>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400">
              <X className="w-5 h-5" />
           </button>
        </div>

        <div className="p-4 bg-white border-b border-gray-100">
           <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="text" 
                placeholder="이름, 사번, 팀 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-10 pr-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
              />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
           {isLoading ? (
             <div className="py-20 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
                <p className="mt-4 text-xs font-bold text-gray-400">구성원 정보를 불러오는 중...</p>
             </div>
           ) : filteredUsers.length === 0 ? (
             <div className="py-20 text-center text-gray-300 italic font-bold text-xs uppercase tracking-widest">
                검색 결과가 없습니다.
             </div>
           ) : filteredUsers.map(user => (
             <div 
               key={user.sabun}
               onClick={() => toggleUser(user.sabun)}
               className={cn(
                 "p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group",
                 selected.has(user.sabun) ? "border-indigo-500 bg-indigo-50/30" : "border-transparent hover:bg-slate-50"
               )}
             >
                <div className="flex items-center space-x-3">
                   <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center font-black text-[10px] text-gray-400 shadow-sm">
                      {user.displayName?.[0]}
                   </div>
                   <div>
                      <p className="text-[13px] font-black text-slate-800 leading-tight">{user.displayName}</p>
                      <p className="text-[10px] text-gray-400 font-bold">{user.team} · #{user.sabun}</p>
                   </div>
                </div>
                {selected.has(user.sabun) ? (
                  <CheckSquare className="w-5 h-5 text-indigo-600" />
                ) : (
                  <Square className="w-5 h-5 text-slate-200 group-hover:text-slate-300" />
                )}
             </div>
           ))}
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
           <div className="text-xs font-bold text-gray-400">
             선택됨: <span className="text-indigo-600 font-black">{selected.size}</span>명
           </div>
           <div className="flex space-x-2">
              <button 
                onClick={onClose}
                className="px-6 py-3 text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors"
              >
                취소
              </button>
              <button 
                onClick={handleConfirm}
                className="px-8 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
              >
                선택 완료
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
