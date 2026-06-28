import { useState } from 'react';
import { supabase } from '../services/supabaseClient';

export default function LoginView() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sysMessage, setSysMessage] = useState<{text: string, type: 'error' | 'success'} | null>(null);

  // 匿名登入 (免註冊，直接生成一組雲端 UUID 給玩家)
  const handleAnonLogin = async () => {
    setLoading(true);
    setSysMessage({ text: '［系統］正在與深淵建立無名連結...', type: 'success' });
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      setSysMessage({ text: `［拒絕］${error.message}`, type: 'error' });
      setLoading(false);
    }
    // 成功的話，Supabase 會自動觸發 App.tsx 的狀態改變，不需在此手動跳轉
  };

  // 信箱密碼登入或註冊
  const handleEmailLogin = async (isSignUp: boolean) => {
    if (!email || !password) {
       setSysMessage({ text: '［警告］請提供完整的血脈印記（信箱與密碼）。', type: 'error' });
       return;
    }
    setLoading(true);
    setSysMessage({ text: '［系統］驗證血脈中...', type: 'success' });

    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setSysMessage({ text: `［拒絕］${error.message}`, type: 'error' });
    } else if (isSignUp) {
      setSysMessage({ text: '［系統］血脈註冊成功，請前往您的信箱點擊驗證信。', type: 'success' });
    }
    setLoading(false);
  };

  return (
    <div className="w-full min-h-[100dvh] flex flex-col items-center justify-center p-4 bg-dark-bg text-gray-200 animate-fade-in relative">
      {/* 背景裝飾 */}
      <div className="absolute inset-0 bg-black/60 z-0 pointer-events-none"></div>

      <div className="max-w-sm w-full bg-gray-900 border border-gray-700 rounded-lg p-6 shadow-2xl flex flex-col gap-6 relative overflow-hidden z-10">
         <div className="absolute top-0 left-0 w-full h-1 bg-blood-red"></div>
         
         <div className="text-center mt-2">
           <h1 className="text-2xl font-bold text-gray-200 tracking-widest mb-2">戰火中的血統商人</h1>
           <p className="text-xs text-gray-500">深淵的入口已開啟，請宣告您的降臨方式。</p>
         </div>

         {sysMessage && (
            <div className={`p-3 border rounded text-xs leading-relaxed tracking-wide ${sysMessage.type === 'success' ? 'bg-gray-900 border-green-800 text-green-500' : 'bg-gray-900 border-red-900 text-red-500'}`}>
              {sysMessage.text}
            </div>
         )}

         <div className="flex flex-col gap-4">
            {/* 首選：匿名登入 */}
            <button 
              onClick={handleAnonLogin} 
              disabled={loading} 
              className="w-full py-3.5 bg-blood-red/20 hover:bg-blood-red/40 border border-blood-red/50 text-red-400 font-bold rounded shadow transition-colors tracking-widest text-sm"
            >
              {loading ? '［連線中...］' : '［簽署無名血契］(免註冊快速遊玩)'}
            </button>

            <div className="flex items-center gap-3 my-2">
              <div className="h-px bg-gray-800 flex-1"></div>
              <span className="text-2xs text-gray-600 font-bold tracking-widest">或使用正式印記</span>
              <div className="h-px bg-gray-800 flex-1"></div>
            </div>

            {/* 備選：信箱登入 */}
            <div className="flex flex-col gap-3">
              <input 
                type="email" 
                placeholder="信箱地址" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="w-full bg-gray-950 border border-gray-700 rounded p-3 text-sm text-gray-200 focus:border-gray-500 outline-none transition-colors" 
              />
              <input 
                type="password" 
                placeholder="密碼 (至少 6 碼)" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="w-full bg-gray-950 border border-gray-700 rounded p-3 text-sm text-gray-200 focus:border-gray-500 outline-none transition-colors" 
              />
            </div>

            <div className="flex gap-3 mt-1">
              <button onClick={() => handleEmailLogin(false)} disabled={loading} className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 font-bold rounded shadow transition-colors tracking-widest text-xs">
                ［驗證並登入］
              </button>
              <button onClick={() => handleEmailLogin(true)} disabled={loading} className="flex-1 py-2.5 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-500 font-bold rounded shadow transition-colors tracking-widest text-xs">
                ［註冊新血脈］
              </button>
            </div>
         </div>
      </div>
    </div>
  );
}
