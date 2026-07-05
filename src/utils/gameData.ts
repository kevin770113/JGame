import { Slave } from '../types';

export type ItemType = 'potion' | 'weapon';

export const HEROES_DATA = [
  { floor: 5, name: '狂戰士・斯巴達克斯', stats: { hp: 1000, attack: 80, defense: 40, speed: 50 }, quote: '血...我要更多的血！', rewardGold: 3000, rewardPrestige: 50 },
  { floor: 10, name: '深淵暴君・項羽', stats: { hp: 3000, attack: 150, defense: 80, speed: 70 }, quote: '力拔山兮氣蓋世！', rewardGold: 10000, rewardPrestige: 200 }
];

export const QUESTS_DATA = {
  'q_first_blood': { title: '【主線】深淵的初啼', description: '前往地下商隊，引進您的第一名試驗體。' },
  'q_first_fusion': { title: '【主線】禁忌的鍊金術', description: '在血統密室中，完成第一次生命融合。' },
  'q_enter_hub': { title: '【主線】踏入灰色地帶', description: '累積 100 點威望，並將商會遷移至中立貿易城。' },
};

export const ITEMS_DATA: Record<string, { name: string, type: ItemType, effect: any, price: number, desc: string }> = {
  'potion_heal_small': { name: '劣質恢復藥', type: 'potion', effect: { stamina: 30 }, price: 500, desc: '勉強能喝的紅藥水，恢復 30 體力。' },
  'weapon_iron_sword': { name: '精鋼長劍', type: 'weapon', effect: { attack: 10 }, price: 2000, desc: '標準的步兵武器，戰鬥時武力判定 +10。' },
};

// ★ V2.8.1 新增：立繪網址生成器 (使用 djb2 Hash 演算法確保唯一性與平均分配)
export const getSlavePortraitUrl = (slave: Slave): string => {
  const RACE_MAP: Record<string, string> = {
    '人類': 'human',
    '精靈': 'elf',
    '半獸人': 'orc',
    '矮人': 'dwarf',
    '不死族': 'undead',
    '龍族': 'dragon'
  };

  const raceKey = RACE_MAP[slave.race] || 'human';
  const genderKey = slave.gender.toLowerCase();

  let hash = 5381;
  for (let i = 0; i < slave.id.length; i++) {
    hash = ((hash << 5) + hash) + slave.id.charCodeAt(i);
  }
  
  const index = (Math.abs(hash) % 3) + 1;
  return `https://pub-960b13e3ff2e4b13940f018c6763a755.r2.dev/portrait-${raceKey}-${genderKey}-${index}.webp`;
};
