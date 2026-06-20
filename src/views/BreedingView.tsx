import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { Slave, Gender } from '../types';
import CustomSelect, { Option } from '../components/CustomSelect';
import { generateSlaveIdentity } from '../services/aiService';

export default function BreedingView() {
  const slaves = useGameStore((state) => state.slaves);
  const addSlave = useGameStore((state) => state.addSlave);
  const { roomDirtiness, location } = useGameStore((state) => state.player);
  const cleanRoom = useGameStore((state) => state.cleanRoom);
  const navigate = useGameStore((state) => state.navigate);

  const [parent1Id, setParent1Id] = useState<string>('');
  const [parent2Id, setParent2Id] = useState<string>('');
  const [sysMessage, setSysMessage] = useState<{ text: string; type: 'success' | 'error' | 'loading' } | null>(null);

  const getBedFacilityName = () => {
    if (location === 'Capital') return '皇城天鵝絨雙人床 (汙染上升極低)';
    if (location === 'NeutralHub') return '中立城精緻鐵骨雙人床';
    return '前線簡陋林地草蓆 (汙染上升極高)';
  };

  const handleBreed = async () => {
    if (!parent1Id || !parent2Id) {
      setSysMessage({ text: '請先選擇兩名對象！', type: 'error' });
      return;
    }
    if (parent1Id === parent2Id) {
      setSysMessage({ text: '無法與自己進行繁衍！', type: 'error' });
      return;
    }

    const p1 = slaves.find(s => s.id === parent1Id);
    const p2 = slaves.find(s => s.id === parent2Id);
    if (!p1 || !p2) return;

    if (p1.race !== p2.race) {
      setSysMessage({ text: `基因排斥：必須為同種族才可繁衍 (${p1.race} 與 ${p2.race} 不相容)。`, type: 'error' });
      return;
    }

    if (p1.gender === p2.gender) {
      setSysMessage({ text: `缺乏生殖條件：請選擇一男一女進行繁衍。`, type: 'error' });
      return;
    }

    setSysMessage({ text: '血統融合中，AI 正在編織新生命的誕生...', type: 'loading' });

    const calcStat = (s1: number, s2: number) => {
      const base = Math.floor((s1 + s2) / 2);
      const mutation = Math.floor(Math.random() * 21) - 10;
      return Math.max(1, Math.min(100, base + mutation));
    };

    const childRace = p1.race; 
    const childGender: Gender = Math.random() > 0.5 ? 'Male' : 'Female';
    const childId = 'child-' + Math.random().toString(36).substring(2, 9);

    const aiData = await generateSlaveIdentity(childRace, childGender);

    const newChild: Slave = {
      id: childId,
      name: aiData.name,
      race: childRace,
      gender: childGender,
      primaryStats: {
        combat: calcStat(p1.primaryStats.combat, p2.primaryStats.combat),
        endurance: calcStat(p1.primaryStats.endurance, p2.primaryStats.endurance),
        intelligence: calcStat(p1.primaryStats.intelligence, p2.primaryStats.intelligence),
        obedience: calcStat(p1.primaryStats.obedience, p2.primaryStats.obedience),
      },
      conditionStats: { stamina: 100, stress: 0, rebellion: 0 },
      traits: [],
      backgroundStory: `[房間繁衍誕生] ${aiData.story}`,
      parents: { fatherId: p1.gender === 'Male' ? p1.id : p2.id, motherId: p1.gender === 'Female' ? p1.id : p2.id }
    };

    addSlave(newChild);
    setSysMessage({ text: `血脈融合成功！新生兒 [${newChild.name}] 已順利降生。`, type: 'success' });
    setParent1Id('');
    setParent2Id('');
  };

  const slaveOptions: Option[] = slaves.map(s => ({
    value: s.id,
    label: `${s.name} ${s.gender === 'Male' ? '♂' : '♀'} (${s.race})`
  }));

  const isLoading = sysMessage?.type === 'loading';

  return (
    <div className="w-full flex flex-col gap-4 pb-10 animate-fade-in">
      <div className="flex justify-between items-center border-b border-gray-700 pb-2">
        <div>
          <h2 className="text-xl font-bold text-gray-300">私人臥室</h2>
          <p className="text-3xs text-gray-500 mt-0.5">當前內部設施：<span className="text-purple-400 font-bold">{getBedFacilityName()}</span></p>
        </div>
        <button 
          onClick={() => navigate('Home', 'Main')}
          className="px-3 py-1 bg-gray-900 border border-gray-700 hover:bg-gray-800 text-gray-400 font-bold rounded text-xs transition-colors shadow-sm"
        >
          🔙 返回大廳
        </button>
      </div>

      {/* 內政清理區塊 */}
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex flex-col gap-3 shadow-md">
        <h3 className="text-xs font-bold text-gray-300 flex items-center gap-1.5">🧹 臥室環境維護</h3>
        <div className="flex justify-between items-center bg-gray-950 p-3 rounded border border-gray-800">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-gray-400">當前髒亂度：<strong className={roomDirtiness > 50 ? 'text-yellow-500 font-mono' : 'text-green-500 font-mono'}>{roomDirtiness}%</strong></span>
            <span className="text-3xs text-gray-600">打掃會大幅回復環境健康值</span>
          </div>
          <button
            onClick={cleanRoom}
            className="px-3 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-600 rounded text-xs font-bold text-gray-300 transition-colors active:scale-95 shadow-sm"
          >
            整理打掃 (🪙 50)
          </button>
        </div>
      </div>

      {/* 血統繁衍區塊 */}
      <div className="bg-gray-800 p-4 sm:p-5 rounded-lg border border-gray-700 flex flex-col gap-4 shadow-md">
        <h3 className="text-xs font-bold text-gray-300 flex items-center gap-1.5">🧬 血統密室實驗</h3>
        <p className="text-3xs text-gray-400 leading-relaxed">
          限制條件：雙親必須為一男一女，且種族必須完全一致。融合後的新生兒將百分之百繼承同種族血脈。
        </p>

        <div className="flex flex-col gap-1.5">
          <label className="text-2xs text-gray-400 font-bold">選擇父親 (♂)：</label>
          <CustomSelect options={slaveOptions} value={parent1Id} onChange={setParent1Id} focusColor="purple" />
        </div>

        <div className="flex flex-col gap-1.5 relative z-40">
          <label className="text-2xs text-gray-400 font-bold">選擇母親 (♀)：</label>
          <CustomSelect options={slaveOptions} value={parent2Id} onChange={setParent2Id} focusColor="purple" />
        </div>

        <button 
          onClick={handleBreed}
          disabled={isLoading}
          className={`mt-1 font-bold py-2.5 rounded text-xs sm:text-sm border transition-colors shadow ${
            isLoading 
              ? 'bg-gray-700 text-gray-400 border-gray-600 cursor-not-allowed animate-pulse'
              : 'bg-purple-900 hover:bg-purple-800 text-white border-purple-700'
          }`}
        >
          {isLoading ? '血統融合中...' : '開啟融合實驗'}
        </button>

        {sysMessage && (
          <div className={`p-2 rounded text-xs text-center border ${
            sysMessage.type === 'success' ? 'bg-gray-900 border-green-800 text-green-400' : 
            sysMessage.type === 'loading' ? 'bg-gray-900 border-yellow-800 text-yellow-500' :
            'bg-gray-900 border-red-800 text-blood-red'
          }`}>
            {sysMessage.text}
          </div>
        )}
      </div>
    </div>
  );
}
