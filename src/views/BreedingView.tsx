import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { Slave } from '../types';
import CustomSelect, { Option } from '../components/CustomSelect';

export default function BreedingView() {
  const slaves = useGameStore((state) => state.slaves);
  const addSlave = useGameStore((state) => state.addSlave);

  const [parent1Id, setParent1Id] = useState<string>('');
  const [parent2Id, setParent2Id] = useState<string>('');
  const [resultMessage, setResultMessage] = useState<string>('');

  const handleBreed = () => {
    if (!parent1Id || !parent2Id) {
      setResultMessage('請先選擇兩名對象！');
      return;
    }
    if (parent1Id === parent2Id) {
      setResultMessage('無法與自己進行繁衍！');
      return;
    }

    const p1 = slaves.find(s => s.id === parent1Id);
    const p2 = slaves.find(s => s.id === parent2Id);
    if (!p1 || !p2) return;

    const calcStat = (s1: number, s2: number) => {
      const base = Math.floor((s1 + s2) / 2);
      const mutation = Math.floor(Math.random() * 21) - 10;
      return Math.max(1, Math.min(100, base + mutation));
    };

    const childRace = Math.random() > 0.5 ? p1.race : p2.race;
    const childId = 'child-' + Math.random().toString(36).substring(2, 9);

    const newChild: Slave = {
      id: childId,
      name: `未知的 ${childRace} (新生兒)`,
      race: childRace,
      primaryStats: {
        combat: calcStat(p1.primaryStats.combat, p2.primaryStats.combat),
        endurance: calcStat(p1.primaryStats.endurance, p2.primaryStats.endurance),
        intelligence: calcStat(p1.primaryStats.intelligence, p2.primaryStats.intelligence),
        obedience: calcStat(p1.primaryStats.obedience, p2.primaryStats.obedience),
      },
      conditionStats: { stamina: 100, stress: 0, rebellion: 0 },
      traits: [],
      backgroundStory: '在基地中誕生的新生代，繼承了雙親的血脈。',
      parents: { fatherId: p1.id, motherId: p2.id }
    };

    addSlave(newChild);
    setResultMessage(`繁衍成功！新生兒 [${newChild.name}] 已加入基地排程。`);
    setParent1Id('');
    setParent2Id('');
  };

  // 將奴隸名單轉換為 CustomSelect 需要的 Option 格式
  const slaveOptions: Option[] = slaves.map(s => ({
    value: s.id,
    label: `${s.name} (${s.race})`
  }));

  return (
    <div className="w-full flex flex-col gap-4 pb-10">
      <div className="flex justify-between items-end border-b border-gray-700 pb-2">
        <h2 className="text-xl font-bold text-gray-300">繁衍實驗</h2>
        <span className="text-sm text-gray-500">培育優勢血統</span>
      </div>

      <div className="bg-gray-800 p-4 sm:p-6 rounded-lg border border-gray-700 flex flex-col gap-5 shadow-lg">
        <p className="text-sm text-gray-400">
          選擇兩名成員進行繁衍。後代的能力值將繼承雙親的平均值，並帶有 [-10, 10] 的隨機突變。
        </p>

        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-300 font-bold">血統來源一 (父系/母系皆可)：</label>
          <CustomSelect options={slaveOptions} value={parent1Id} onChange={setParent1Id} focusColor="purple" />
        </div>

        <div className="flex flex-col gap-2 relative z-40">
          <label className="text-sm text-gray-300 font-bold">血統來源二：</label>
          <CustomSelect options={slaveOptions} value={parent2Id} onChange={setParent2Id} focusColor="purple" />
        </div>

        <button 
          onClick={handleBreed}
          className="mt-2 bg-purple-900 hover:bg-purple-800 text-white font-bold py-3 rounded-lg border border-purple-700 transition-colors shadow-md"
        >
          開始繁衍
        </button>

        {resultMessage && (
          <div className="p-3 bg-gray-900 border border-green-800 text-green-400 rounded text-sm text-center animate-pulse">
            {resultMessage}
          </div>
        )}
      </div>
    </div>
  );
}
