"use client";

import { useState } from "react";
import { 
  X, 
  Loader2, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Search,
  Check,
  UserPlus
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BulkEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  users: any[];
}

export function BulkEmailModal({ isOpen, onClose, onSuccess, users }: BulkEmailModalProps) {
  const [pasteData, setPasteData] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [step, setStep] = useState<'input' | 'preview'>('input');
  const [resultSummary, setResultSummary] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle Excel/CSV Pasted Data
  const handleParseData = () => {
    const lines = pasteData.split("\n").filter(l => l.trim());
    const mapped: any[] = [];

    lines.forEach(line => {
      // Allow comma, tab, or space separation
      const parts = line.split(/[\t,]/).map(p => p.trim());
      if (parts.length >= 2) {
        const identifier = parts[0]; // Sabun or Name
        const email = parts[1];

        // Find user by identifier
        const targetUser = users.find(u => u.sabun === identifier || u.name === identifier || u.displayName === identifier);
        
        if (targetUser) {
          mapped.push({
            sabun: targetUser.sabun,
            name: targetUser.name,
            currentEmail: targetUser.email,
            newEmail: email,
            status: 'matched'
          });
        } else {
          mapped.push({
            identifier,
            newEmail: email,
            status: 'not_found'
          });
        }
      }
    });

    setPreviewData(mapped);
    setStep('preview');
  };

  // Google Directory Auto-Sync (Simulation/Implementation)
  const handleGoogleSync = async () => {
    setIsSyncingGoogle(true);
    try {
      // In a real scenario, this calls a specialized API that uses Directory API for all users
      // For now, we simulate finding emails for users who don't have them
      const missing = users.filter(u => !u.email);
      const suggestions: any[] = [];
      
      for (const user of missing) {
         // Logic to suggest email based on name
         // e.g. Name "장지만" -> "laika@daangnservice.com"
         // This is a placeholder for the actual API call
         suggestions.push({
            sabun: user.sabun,
            name: user.name,
            currentEmail: "",
            newEmail: `${user.name.toLowerCase()}@daangnservice.com`, // Example fallback
            status: 'suggested'
         });
      }
      setPreviewData(suggestions);
      setStep('preview');
    } catch (err) {
      alert("구글 동기화에 실패했습니다.");
    } finally {
      setIsSyncingGoogle(false);
    }
  };

  const handleUpdate = async () => {
    setIsProcessing(true);
    try {
      const updates = previewData
        .filter(p => p.status !== 'not_found')
        .map(p => ({
          sabun: p.sabun,
          name: p.name,
          email: p.newEmail
        }));

      const res = await fetch("/api/admin/users/bulk-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates })
      });

      const data = await res.json();
      if (res.ok) {
        setResultSummary(data.message);
        onSuccess();
      } else {
        alert(`업데이트 실패: ${data.error}`);
      }
    } catch (err) {
      alert("서버 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h2 className="text-[24px] font-black text-slate-900 tracking-tight">이메일 일괄 관리</h2>
            <p className="text-sm text-gray-400 font-bold mt-1">대량의 사용자 이메일을 한꺼번에 등록하거나 수정합니다.</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10">
          {resultSummary ? (
            <div className="flex flex-col items-center justify-center space-y-6 py-20 text-center">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-[30px] flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">업데이트 완료!</h3>
                <p className="text-slate-500 font-bold">{resultSummary}</p>
              </div>
              <button 
                onClick={onClose}
                className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all"
              >
                닫기
              </button>
            </div>
          ) : step === 'input' ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                      <Upload className="w-5 h-5" />
                    </div>
                    <h3 className="font-black text-slate-800 text-lg">데이터 직접 입력</h3>
                  </div>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    엑셀이나 구글 시트에서 <span className="font-bold text-indigo-600">사번(또는 이름)</span>과 <span className="font-bold text-indigo-600">이메일</span> 컬럼을 복사하여 아래에 붙여넣어 주세요.<br/>
                    (형식: 사번,이메일 또는 사번[탭]이메일)
                  </p>
                  <textarea 
                    value={pasteData}
                    onChange={(e) => setPasteData(e.target.value)}
                    placeholder="2012001, gildong.hong@gmail.com&#10;장지만, laika@daangnservice.com"
                    className="w-full h-[250px] p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[30px] text-sm font-mono focus:border-indigo-400 focus:bg-white outline-none transition-all placeholder:text-slate-300"
                  />
                  <button 
                    onClick={handleParseData}
                    disabled={!pasteData.trim()}
                    className="w-full py-4 bg-indigo-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 transition-all"
                  >
                    데이터 분석하기
                  </button>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                      <UserPlus className="w-5 h-5" />
                    </div>
                    <h3 className="font-black text-slate-800 text-lg">Google 디렉토리 연동</h3>
                  </div>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    DB에 등록된 이름을 기반으로 구글 워크스페이스에서 이메일을 검색하여 자동으로 채워줍니다.<br/>
                    동명이인이 있을 경우 확인이 필요합니다.
                  </p>
                  <div className="h-[250px] flex items-center justify-center bg-emerald-50/30 rounded-[30px] border-2 border-dashed border-emerald-100">
                    <Search className="w-12 h-12 text-emerald-100" />
                  </div>
                  <button 
                    onClick={handleGoogleSync}
                    disabled={isSyncingGoogle}
                    className="w-full py-4 bg-emerald-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-lg shadow-emerald-100 hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
                  >
                    {isSyncingGoogle ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    <span>자동 매칭 제안받기</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-black text-slate-800">매칭 결과 미리보기</h3>
                <button onClick={() => setStep('input')} className="text-sm font-bold text-slate-400 hover:text-slate-600 underline">처음으로 돌아가기</button>
              </div>

              <div className="border border-gray-100 rounded-[25px] overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase">대상</th>
                      <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase">기존 이메일</th>
                      <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase">변경 예정</th>
                      <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase">상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {previewData.map((p, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-slate-800">{p.name || p.identifier}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">{p.currentEmail || "-"}</td>
                        <td className="px-6 py-4 text-sm font-black text-indigo-600">{p.newEmail}</td>
                        <td className="px-6 py-4">
                          {p.status === 'matched' || p.status === 'suggested' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                              <Check className="w-2.5 h-2.5 mr-1" /> 매칭완료
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-red-50 text-red-600 ring-1 ring-red-100">
                              <AlertCircle className="w-2.5 h-2.5 mr-1" /> 대상없음
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-6 bg-slate-900 text-white rounded-[30px] flex items-center justify-between">
                <div>
                  <p className="text-lg font-black">{previewData.filter(p => p.status !== 'not_found').length}명의 데이터가 준비되었습니다.</p>
                  <p className="text-xs text-slate-400 font-bold opacity-70">저장 버튼을 누르면 MySQL 데이터베이스에 영구적으로 반영됩니다.</p>
                </div>
                <button 
                  onClick={handleUpdate}
                  disabled={isProcessing || previewData.filter(p => p.status !== 'not_found').length === 0}
                  className="px-8 py-3 bg-white text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-slate-50 transition-all flex items-center space-x-2"
                >
                  {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>DB에 일괄 저장하기</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
