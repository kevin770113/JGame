import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { Slave, Gender } from '../types';
import CustomSelect, { Option } from '../components/CustomSelect';
import { generateSlaveIdentity } from '../services/aiService';

export default function BreedingView() {
  const slaves = useGameStore((state) => state.slaves);
  const addSlave = useGameStore((state) => state.addSlave);

  const [parent1Id, setParent1Id] = useState<string>('');
  const [parent2Id, setParent2Id] = useState<string>('');
  const [sysMessage, setSysMessage] = useState<{ text: string; type: 'success' | 'error' | 'loading' } | null>(null);

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

    // 嚴格生物學防呆：必須同種族
    if (p1.race !== p2.race) {
      setSysMessage({ text: `基因排斥：必須為同種族才可繁衍 (${p1.race} 與 ${p2.race} 不相容)。`, type: 'error' });
      return;
    }

    // 嚴格生物學防呆：必須一男一女
    if (p1.gender === p2.gender) {
      setSysMessage({ text: `缺乏生殖條件：請選擇一男一女進行繁衍。`, type: 'error' });
      return;
    }

    // 進入 AI 生成讀取狀態
    setSysMessage({ text: '血統融合中，AI 正在見證新生命的誕生...', type: 'loading' });

    const calcStat = (s1: number, s2: number) => {
      const base = Math.floor((s1 + s2) / 2);
      const mutation = Math.floor(Math.random() * 21) - 10;
      return Math.max(1, Math.min(100, base + mutation));
    };

    const childRace = p1.race; // 雙親同種族，100% 繼承
    const childGender: Gender = Math.random() > 0.5 ? 'Male' : 'Female';
    const childId = 'child-' + Math.random().toString(36).substring(2, 9);

    // 非同步呼叫 AI 命名
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
      backgroundStory: `[基地誕生] ${aiData.story}`,
      parents: { fatherId: p1.gender === 'Male' ? p1.id : p2.id, motherId: p1.gender === 'Female' ? p1.id : p2.id }
    };

    addSlave(newChild);
    setSysMessage({ text: `繁衍成功！新生兒 [${newChild.name}] 已加入基地排程。`, type: 'success' });
    setParent1Id('');
    setParent2Id('');
  };

  const slaveOptions: Option[] = slaves.map(s => ({
    value: s.id,
    label: `${s.name} ${s.gender === 'Male' ? '♂' : '♀'} (${s.race})`
  }));

  const isLoading = sysMessage?.type === 'loading';

  return (
    <div className="w-full flex flex-col gap-4 pb-10">
      <div className="flex justify-between items-end border-b border-gray-700 pb-2">
        <h2 className="text-xl font-bold text-gray-300">繁衍實驗</h2>
        <span className="text-sm text-gray-500">培育優勢血統</span>
      </div>

      <div className="bg-gray-800 p-4 sm:p-6 rounded-lg border border-gray-700 flex flex-col gap-5 shadow-lg">
        <p className="text-sm text-gray-400">
          選擇一男一女且同種族的成員進行繁衍。後代的能力值將繼承雙親的平均值，並帶有 [-10, 10] 的隨機突變。
        </p>

        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-300 font-bold">血統來源一：</label>
          <CustomSelect options={slaveOptions} value={parent1Id} onChange={setParent1Id} focusColor="purple" />
        </div>

        <div className="flex flex-col gap-2 relative z-40">
          <label className="text-sm text-gray-300 font-bold">血統來源二：</label>
          <CustomSelect options={slaveOptions} value={parent2Id} onChange={setParent2Id} focusColor="purple" />
        </div>

        <button 
          onClick={handleBreed}
          disabled={isLoading}
          className={`mt-2 font-bold py-3 rounded-lg border transition-colors shadow-md ${
            isLoading 
              ? 'bg-gray-700 text-gray-400 border-gray-600 cursor-not-allowed animate-pulse'
              : 'bg-purple-900 hover:bg-purple-800 text-white border-purple-700'
          }`}
        >
          {isLoading ? '血統融合中...' : '開始繁衍'}
        </button>

        {sysMessage && (
          <div className={`p-3 border rounded text-sm text-center ${
            sysMessage.type === 'success' ? 'bg-gray-900 border-green-800 text-green-400 animate-pulse' : 
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
