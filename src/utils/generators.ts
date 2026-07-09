import { Slave, Race, Gender } from '../types';
import { Mission, ArenaNPC } from '../types/storeTypes';
import { HEROES_DATA } from './gameData';
import i18next from 'i18next';

export const BASE_ARENA_NPCS: ArenaNPC[] = [
  { id: 'npc-1', location: 'Frontlines', name: '地下狂徒', description: '滿身泥濘與血污的亡命之徒，毫無技巧可言。', stats: { combat: 30, endurance: 25, intelligence: 15, charisma: 5, luck: 10 }, rewardGold: 800, rewardPrestige: 0 },
  { id: 'npc-2', location: 'NeutralHub', name: '鐵血角鬥士', description: '公會重金培育的職業鬥士，裝備精良且受過專業訓練。', stats: { combat: 60, endurance: 50, intelligence: 40, charisma: 40, luck: 30 }, rewardGold: 2500, rewardPrestige: 10 },
  { id: 'npc-3', location: 'Capital', name: '皇家處刑者', description: '帝國皇室的殺人機器，專門用來粉碎挑戰者。', stats: { combat: 120, endurance: 80, intelligence: 70, charisma: 85, luck: 45 }, rewardGold: 6000, rewardPrestige: 50 }
];

export const generateArenaNPCs = (): ArenaNPC[] => {
  const isEn = i18next.language?.startsWith('en');
  return BASE_ARENA_NPCS.map(base => {
    const rand = Math.random();
    let prefix = '';
    let stats = { ...base.stats };

    if (rand < 0.33) {
      prefix = isEn ? '[Frenzied] ' : '【狂暴的】';
      stats.combat = Math.floor(stats.combat * 1.15);
      stats.endurance = Math.floor(stats.endurance * 0.85);
    } else if (rand < 0.66) {
      prefix = isEn ? '[Ironclad] ' : '【鐵壁的】';
      stats.endurance = Math.floor(stats.endurance * 1.20);
      stats.combat = Math.floor(stats.combat * 0.90);
      stats.intelligence = Math.floor(stats.intelligence * 0.90);
    } else {
      prefix = isEn ? '[Cunning] ' : '【狡詐的】';
      stats.luck += 15;
      stats.intelligence = Math.floor(stats.intelligence * 1.10);
      stats.endurance = Math.floor(stats.endurance * 0.85);
    }

    const baseName = isEn ? (base.id === 'npc-1' ? 'Underground Thug' : base.id === 'npc-2' ? 'Iron Gladiator' : 'Royal Executioner') : base.name;
    return { ...base, id: `${base.id}-${Date.now()}`, name: `${prefix}${baseName}`, stats };
  });
};

export const getAbyssEnemy = (floor: number) => {
  const isEn = i18next.language?.startsWith('en');
  const boss = HEROES_DATA.find(h => h.floor === floor);
  const multiplier = 1 + (floor - 1) * 0.05;
  const linearFloor = Math.min(100, floor);
  const intLuckScale = linearFloor / 100; 

  if (boss) {
    return {
      name: boss.name, quote: boss.quote,
      stats: { 
        combat: Math.floor(boss.stats.combat * multiplier), 
        endurance: Math.floor(boss.stats.endurance * multiplier), 
        intelligence: Math.floor(boss.stats.intelligence + (100 - boss.stats.intelligence) * intLuckScale), 
        charisma: Math.min(100, boss.stats.charisma + Math.floor(floor / 5) * 5),
        luck: Math.floor(boss.stats.luck + (100 - boss.stats.luck) * intLuckScale)
      },
      rewardGold: boss.rewardGold, rewardPrestige: boss.rewardPrestige, isBoss: true
    };
  }
  
  const baseCombat = 35; const baseEndurance = 30;
  const baseInt = 20; const baseLuck = 10;
  const maxInt = 60; const maxLuck = 25; 

  return {
    name: isEn ? `Abyss Guard (Floor ${floor})` : `深淵衛士 (第 ${floor} 階)`, 
    quote: isEn ? '...' : '……',
    stats: { 
       combat: Math.floor(baseCombat * multiplier), 
       endurance: Math.floor(baseEndurance * multiplier), 
       intelligence: Math.floor(baseInt + (maxInt - baseInt) * intLuckScale), 
       charisma: Math.min(80, 10 + Math.floor(floor / 5) * 5),
       luck: Math.floor(baseLuck + (maxLuck - baseLuck) * intLuckScale)
    },
    rewardGold: 500 + floor * 150, rewardPrestige: Math.floor(floor / 2), isBoss: false
  };
};

export const generateDailyMissions = (): Mission[] => {
  const isEn = i18next.language?.startsWith('en');
  const missions: Mission[] = [];
  const baseId = Date.now().toString(36);
  
  const actions = isEn ? ['Escort', 'Raid', 'Suppress', 'Scavenge', 'Assassinate', 'Explore'] : ['護送', '掠奪', '鎮壓', '搜刮', '暗殺', '勘探'];
  const targets = isEn ? ['Contraband', 'Abyss Vein', 'Heretic Camp', 'Imperial Caravan', 'Black Market', 'Ancient Ruins'] : ['私掠物資', '深淵礦脈', '異端營地', '帝國商隊', '地下黑市', '古老遺跡'];
  const getName = () => isEn ? `${actions[Math.floor(Math.random() * actions.length)]} ${targets[Math.floor(Math.random() * targets.length)]}` : `${actions[Math.floor(Math.random() * actions.length)]}${targets[Math.floor(Math.random() * targets.length)]}`;

  for (let i = 0; i < Math.floor(Math.random() * 2) + 3; i++) {
    missions.push({ 
      id: `m-grn-${baseId}-${i}`, title: isEn ? `[Routine] [${getName()}]` : `［常規］【${getName()}】`, rank: '翠綠', requiredPhases: 1, staminaCost: 20, stressGain: 10, reward: 250 + Math.floor(Math.random() * 100), 
      description: isEn ? 'Routine field operation, mild intensity.' : '常規安全外派，勞動性質溫和。', successRate: 1.0, obedienceReward: 1 
    });
  }
  for (let i = 0; i < Math.floor(Math.random() * 2) + 1; i++) {
    missions.push({ 
      id: `m-blu-${baseId}-${i}`, title: isEn ? `[Advanced] [${getName()}]` : `［進階］【${getName()}】`, rank: '蔚藍', requiredPhases: 2, staminaCost: 35, stressGain: 15, reward: 800 + Math.floor(Math.random() * 200), 
      description: isEn ? 'Dangerous errand. [Penalty] If failed, reward is nullified and massive stamina/stress penalties apply.' : '危險差事。［失敗懲罰］若不幸失敗，酬金歸零，並扣除大量體力與壓力。', successRate: 0.8, obedienceReward: 2 
    });
  }
  if (Math.random() > 0.7) {
    missions.push({ 
      id: `m-pur-${baseId}`, title: isEn ? `[Spec-Op] [${getName()}]` : `［特化］【${getName()}】`, rank: '紫色', requiredPhases: 3, staminaCost: 50, stressGain: 25, reward: 2000 + Math.floor(Math.random() * 400), 
      description: isEn ? 'Specialized high-risk job. Grants bonus Prestige. [Penalty] If failed, reward nullified with massive penalties.' : '特化高危工作。成功將帶來「高額威望」獎勵。［失敗懲罰］若不幸失敗，酬金歸零，並扣除大量體力與壓力。', successRate: 0.6, obedienceReward: 3 
    });
  }
  if (Math.random() > 0.8) {
    missions.push({ 
      id: `m-gld-${baseId}`, title: isEn ? `[Legendary] [${getName()}]` : `［傳說］【${getName()}】`, rank: '黃金', requiredPhases: 5, staminaCost: 70, stressGain: 40, reward: 3500 + Math.floor(Math.random() * 800), 
      description: isEn ? 'Lethal contract. Grants extreme Prestige and a Skill Breakthrough. [Penalty] Extreme penalties on failure.' : '死亡搏命委託。成功將獲得「極高威望」與「一項能力突破」。［失敗懲罰］若不幸失敗，酬金歸零，並扣除極大體力與壓力。', successRate: 0.6, obedienceReward: 5 
    });
  }
  return missions;
};

export const generateBaseMarketSlave = (idSuffix: string, identity: {name: string}): Slave => {
  const races: Race[] = ['人類', '精靈', '半獸人', '矮人', '不死族', '龍族'];
  const race = races[Math.floor(Math.random() * races.length)];
  const gender: Gender = Math.random() > 0.5 ? 'Male' : 'Female';
  return {
    id: `market-${Date.now()}-${idSuffix}`, name: identity.name, race, gender, activityStatus: '閒置', role: 'none', faintTurns: 0,
    skills: { combat: 1, housework: 1, survival: 1 },
    primaryStats: { 
      combat: Math.floor(Math.random() * 60) + 20, 
      endurance: Math.floor(Math.random() * 60) + 20, 
      intelligence: Math.floor(Math.random() * 60) + 20, 
      obedience: Math.floor(Math.random() * 40) + 10,
      charisma: Math.floor(Math.random() * 80) + 10,
      luck: Math.floor(Math.random() * 80) + 10
    },
    conditionStats: { stamina: 100, stress: 0, rebellion: Math.floor(Math.random() * 20) },
    traits: [], 
    combatRecord: { wins: 0, losses: 0 },
    isInjured: false
  };
};
