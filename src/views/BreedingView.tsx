import { useState, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { Slave, Gender } from '../types';
import CustomSelect, { Option } from '../components/CustomSelect';

export default function BreedingView() {
  const slaves = useGameStore((state) => state.slaves);
  const maxSlaveCapacity = useGameStore((state) => state.player.maxSlaveCapacity);
  const addSlave = useGameStore((state) => state.addSlave);
  const navigate = useGameStore((state) => state.navigate);
  
  const consumeIdentity = useGameStore((state) => state.consumeIdentity);
  const triggerQuest = useGameStore((state) => state.triggerQuest);

  const [alphaId, setAlphaId] = useState<string>('');
  const [betaId, setBetaId] = useState<string>('');
  const [sysMessage, setSysMessage] = useState<{ text: string; type: 'success' | 'error' | 'loading' } | null>(null);

  // ★ 玩家第一次進入血統密室，觸發「禁忌的鍊金術」任務
  useEffect(() => {
    triggerQuest('q_first_fusion');
  }, [triggerQuest]);

  const isFull = slaves.length >= maxSlaveCapacity;

  const handleBreed = async () => {
    if (isFull) {
      setSysMessage({ text: '［警告］空間不足，據點已達人口上限，無法容納新的試驗體降生。', type: 'error' });
      return;
    }

    if (!alphaId || !betaId) {
      setSysMessage({ text: '［錯誤］必須提供兩具試驗體。', type: 'error' });
      return;
    }
    if (alphaId === betaId) {
      setSysMessage({ text: '［錯誤］無法進行自我複製實驗。', type: 'error' });
      return;
    }

    const p1 = slaves.find(s => s.id === alphaId);
    const p2 = slaves.find(s => s.id === betaId);
    if (!p1 || !p2) return;

    if (p1.activityStatus !== '閒置' || p2.activityStatus !== '閒置') {
      setSysMessage({ text: '［錯誤］試驗體必須處於閒置狀態才能進行融合。', type: 'error' });
      return;
    }

    if (p1.race !== p2.race) {
      setSysMessage({ text: `［排斥反應］基因序列衝突（${p1.race} 與 ${p2.race}），融合失敗。`, type: 'error' });
      return;
    }

    if (p1.gender === p2.gender) {
      setSysMessage({ text: `［排斥反應］缺乏足夠的異性生殖條件，融合失敗。`, type: 'error' });
      return;
    }

    setSysMessage({ text: '［運算中］血統融合陣列啟動，正在編織新生命的誕生...', type: 'loading' });

    const calcStat = (s1: number, s2: number) => {
      const base = Math.floor((s1 + s2) / 2);
      const mutation = Math.floor(Math.random() * 21) - 10;
      return Math.max(1, Math.min(100, base + mutation));
    };

    const childRace = p1.race; 
    const childGender: Gender = Math.random() > 0.5 ? 'Male' : 'Female';
    const childId = 'child-' + Math.random().toString(36).substring(2, 9);

    const aiData = await consumeIdentity();
    
    const genderSuffix = childGender === 'Male' ? '之子' : '之女';
    const fatherName = p1.gender === 'Male' ? p1.name : p2.name;
    const motherName = p1.gender === 'Female' ? p1.name : p2.name;

    const newChild: Slave = {
      id: childId,
      name: aiData.name,
      race: childRace,
      gender: childGender,
      activityStatus: '閒置',
      skills: { combat: 1, housework: 1, survival: 1 },
      primaryStats: {
        combat: calcStat(p1.primaryStats.combat, p2.primaryStats.combat),
        endurance: calcStat(p1.primaryStats.endurance, p2.primaryStats.endurance),
        intelligence: calcStat(p1.primaryStats.intelligence, p2.primaryStats.intelligence),
        obedience: calcStat(p1.primaryStats.obedience, p2.primaryStats.obedience),
      },
      conditionStats: { stamina: 100, stress: 0, rebellion: 0 },
      traits: [],
      backgroundStory: `［密室誕生］${fatherName} 與 ${motherName} ${genderSuffix}。${aiData.story}`,
      parents: { fatherId: p1.gender === 'Male' ? p1.id : p2.id, motherId: p1.gender === 'Female' ? p1.id : p2.id }
    };

    addSlave(newChild);
    setSysMessage({ text: `［系統］血脈融合成功！代號［${newChild.name}］已順利降生並建檔。`, type: 'success' });
    setAlphaId('');
    setBetaId('');
  };

  const idleSlaves = slaves.filter(s => s.activityStatus === '閒置');
  
  const slaveOptions: Option[] = idleSlaves.map(s => ({
    value: s.id,
    label: `${s.name} (種族: ${s.race})`
  }));

  const isLoading = sysMessage?.type === 'loading';

  return (
    <div className="w-full flex flex-col gap-4 pb-10 animate-fade-in">
      <div className="flex justify-between items-center border-b border-gray-700 pb-2">
        <div>
          <h2 className="text-xl font-bold text-gray-300">血統密室</h2>
          <p className="text-xs text-gray-500 mt-1">隱蔽於地下的實驗設施，進行著被帝國嚴格禁止的基因融合。</p>
        </div>
        <button onClick={() => navigate('Home', 'Main')} className="whitespace-nowrap shrink-0 px-3 py-1.5 bg-gray-900 border border-gray-600 hover:bg-gray-800 text-gray-400 font-bold rounded text-xs transition-colors shadow-sm tracking-widest">
          ［返回大廳］
        </button>
      </div>

      <div className="bg-gray-900/80 p-5 rounded-lg border border-gray-700 flex flex-col gap-4 shadow-md mt-2">
        <p className="text-xs text-gray-400 leading-relaxed italic border-l-2 border-blood-red pl-2">
          「放入不相容的基因序列將導致陣列啟動失敗。後代將繼承雙親的平均屬性，並帶有不可預測的深淵突變。」
        </p>

        <div className="flex flex-col gap-1.5 mt-2">
          <label className="text-xs text-gray-400 font-bold tracking-widest">［注入試驗體 Alpha］</label>
          <CustomSelect options={slaveOptions} value={alphaId} onChange={setAlphaId} focusColor="gray" />
        </div>

        <div className="flex flex-col gap-1.5 relative z-40">
          <label className="text-xs text-gray-400 font-bold tracking-widest">［注入試驗體 Beta］</label>
          <CustomSelect options={slaveOptions} value={betaId} onChange={setBetaId} focusColor="gray" />
        </div>

        <button 
          onClick={handleBreed}
          disabled={isLoading || isFull}
          className={`mt-4 font-bold py-3 rounded text-xs tracking-widest border transition-colors shadow ${
            isFull
              ? 'bg-gray-800 text-gray-600 border-gray-700 cursor-not-allowed'
              : isLoading 
                ? 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed animate-pulse'
                : 'bg-blood-red/20 hover:bg-blood-red/40 text-red-400 border-red-900/50'
          }`}
        >
          {isFull ? '［據點人口已滿］' : isLoading ? '［血統融合運算中...］' : '［啟動融合陣列］'}
        </button>

        {sysMessage && (
          <div className={`p-3 rounded text-xs leading-relaxed tracking-wide border ${
            sysMessage.type === 'success' ? 'bg-gray-900 border-green-800 text-green-500' : 
            sysMessage.type === 'loading' ? 'bg-gray-900 border-yellow-800 text-yellow-500' :
            'bg-gray-900 border-red-900 text-red-500'
          }`}>
            {sysMessage.text}
          </div>
        )}
      </div>
    </div>
  );
}
