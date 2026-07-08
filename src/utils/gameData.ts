import { Item, NPC } from '../types';

export const PORTRAIT_COUNT = 112; 

export const getSlavePortraitUrl = (slave: { portraitId?: number; gender: 'Male' | 'Female' }) => {
  const id = slave.portraitId !== undefined ? slave.portraitId : 1;
  const genderPath = slave.gender === 'Male' ? 'male' : 'female';
  return `https://pub-960b13e3ff2e4b13940f018c6763a755.r2.dev/portraits/${genderPath}/${id}.webp`;
};

// ★ V2.11.0 武器資料庫字典化
export const ITEMS_DATA: Record<string, Item> = {
  iron_sword: {
    id: 'iron_sword',
    name: 'items.iron_sword.name',
    type: 'weapon',
    price: 150,
    desc: 'items.iron_sword.desc',
    effect: { attack: 8 }
  },
  steel_spear: {
    id: 'steel_spear',
    name: 'items.steel_spear.name',
    type: 'weapon',
    price: 320,
    desc: 'items.steel_spear.desc',
    effect: { attack: 15 }
  },
  obsidian_dagger: {
    id: 'obsidian_dagger',
    name: 'items.obsidian_dagger.name',
    type: 'weapon',
    price: 680,
    desc: 'items.obsidian_dagger.desc',
    effect: { attack: 28 }
  },
  abyss_reaper: {
    id: 'abyss_reaper',
    name: 'items.abyss_reaper.name',
    type: 'weapon',
    price: 1500,
    desc: 'items.abyss_reaper.desc',
    effect: { attack: 55 }
  }
};

// ★ V2.11.0 靜態區域鎮守者名詞 Key 化
export const BASE_ARENA_NPCS: NPC[] = [
  {
    id: 'npc-arena-capital',
    name: 'npc.arena_capital.name',
    location: 'Capital',
    stats: { combat: 35, endurance: 35, intelligence: 20, charisma: 20, luck: 15 },
    rewardGold: 300,
    rewardPrestige: 15,
    description: 'npc.arena_capital.desc'
  },
  {
    id: 'npc-arena-border',
    name: 'npc.arena_border.name',
    location: 'BorderTown',
    stats: { combat: 16, endurance: 16, intelligence: 10, charisma: 10, luck: 10 },
    rewardGold: 120,
    rewardPrestige: 5,
    description: 'npc.arena_border.desc'
  }
];
