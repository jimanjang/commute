"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";

export function Topbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<{name: string, sabun: string}[]>([]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const selectedName = searchParams.get("name") || "본인";
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        }
      } catch (err) {
        console.error("Failed to load user list:", err);
      }
    }
    fetchUsers();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.sabun.includes(search)
  );

  const handleSelect = (name: string) => {
    const params = new URLSearchParams(searchParams);
    if (name === "본인") {
      params.delete("name");
    } else {
      params.set("name", name);
    }
    router.push(`${pathname}?${params.toString()}`);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <header className="h-[60px] border-b border-gray-200 flex items-center justify-between px-6 bg-white shrink-0 z-10 w-full relative">
      <h1 className="text-[17px] font-bold text-gray-800 tracking-tight">개인 일정</h1>
      
      <div className="relative" ref={dropdownRef}>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 px-3 py-1.5 border border-gray-200 rounded-md text-sm text-gray-700 hover:bg-gray-50 focus:outline-none min-w-[120px] justify-between transition-colors"
        >
          <span>{selectedName}</span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-60 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
            <div className="p-2 border-b border-gray-100">
              <div className="flex items-center px-2 py-1.5 bg-gray-100 rounded-md border border-gray-200">
                <Search className="w-3.5 h-3.5 text-gray-400 mr-2 shrink-0" />
                <input 
                  type="text" 
                  placeholder="사용자 검색..." 
                  className="bg-transparent border-none outline-none text-sm w-full placeholder:text-gray-400"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <ul className="max-h-64 overflow-y-auto py-1 custom-scrollbar">
              {filteredUsers.map((user) => (
                <li key={user.name}>
                  <button
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center justify-between"
                    onClick={() => handleSelect(user.name)}
                  >
                    <span>{user.name}</span>
                    {user.sabun && <span className="text-gray-400 text-xs">#{user.sabun}</span>}
                  </button>
                </li>
              ))}
              {filteredUsers.length === 0 && (
                <li className="px-4 py-3 text-sm text-gray-400 text-center">검색 결과가 없습니다.</li>
              )}
            </ul>
          </div>
        )}
      </div>
    </header>
  );
}
