import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import localforage from 'localforage';
import { Slave, Player, Location, TimePhase, Race, Gender, Scene, SubView, CombatLog, ActiveWindow, CombatPlaybackData, Role } from '../types';
import { GAME_CONSTANTS } from '../utils/constants';
import { fetchIdentityBatch } from '../services/aiService';
import { supabase } from '../services/supabaseClient';
import { ITEMS_DATA, HEROES_DATA, QUESTS_DATA } from '../utils/gameData';

export interface Mission {
  id: string; title: string; rank: '黃金' | '紫色' | '蔚藍' | '翠綠';
  requiredPhases: number; staminaCost: number; stressGain: number; reward: number; description: string;
  successRate: number; 
  obedienceReward: number;
}

export interface ActiveDispatch {
  slaveId: string; mission: Mission; remainingPhases: number;
}

export interface DynamicEvent {
  id: string; type: 'merchant' | 'noble'; desc: string;
  reqRace?: Race; reqGender?: Gender; reqStat?: { key: 'combat' | 'obedience'; val: number };
  reward: { gold: number; prestige: number; item?: string };
}

export interface GlobalModal {
  title: string; message: string; isConfirm: boolean; action?: () => void;
}

export interface ArenaNPC {
  id: string; location: Location; name: string; description: string;
  stats: { combat: number; endurance: number; intelligence: number; charisma: number; luck: number };
  rewardGold: number; rewardPrestige: number;
}

export const BASE_ARENA_NPCS: ArenaNPC[] = [
  { id: 'npc-1', location: 'Frontlines', name: '地下狂徒', description: '滿身泥濘與血污的亡命之徒，毫無技巧可言。', stats: { combat: 30, endurance: 25, intelligence: 15, charisma: 5, luck: 10 }, rewardGold: 800, rewardPrestige: 0 },
  { id: 'npc-2', location: 'NeutralHub', name: '鐵血角鬥士', description: '公會重金培育的職業鬥士，裝備精良且受過專業訓練。', stats: { combat: 60, endurance: 50, intelligence: 40, charisma: 40, luck: 30 }, rewardGold: 2500, rewardPrestige: 10 },
  { id: 'npc-3', location: 'Capital', name: '皇家處刑者', description: '帝國皇室的殺人機器，專門用來粉碎挑戰者。', stats: { combat: 120, endurance: 80, intelligence: 70, charisma: 85, luck: 45 }, rewardGold: 6000, rewardPrestige: 50 }
];

export const generateArenaNPCs = (): ArenaNPC[] => {
  return BASE_ARENA_NPCS.map(base => {
    const rand = Math.random();
    let prefix = '';
    let stats = { ...base.stats };

    if (rand < 0.33) {
      prefix = '【狂暴的】';
      stats.combat = Math.floor(stats.combat * 1.15);
      stats.endurance = Math.floor(stats.endurance * 0.85);
    } else if (rand < 0.66) {
      prefix = '【鐵壁的】';
      stats.endurance = Math.floor(stats.endurance * 1.20);
      stats.combat = Math.floor(stats.combat * 0.90);
      stats.intelligence = Math.floor(stats.intelligence * 0.90);
    } else {
      prefix = '【狡詐的】';
      stats.luck += 15;
      stats.intelligence = Math.floor(stats.intelligence * 1.10);
      stats.endurance = Math.floor(stats.endurance * 0.85);
    }

    return {
      ...base,
      id: `${base.id}-${Date.now()}`,
      name: `${prefix}${base.name}`,
      stats
    };
  });
};

export const getAbyssEnemy = (floor: number) => {
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
    name: `深淵衛士 (第 ${floor} 階)`, quote: '……',
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

export interface GameStore {
  player: Player & { shopStock: Record<string, number> }; 
  slaves: Slave[];
  marketSlaves: Slave[];
  arenaNPCs: ArenaNPC[];
  isMarketGenerating: boolean;
  isPoolGenerating: boolean;
  currentScene: Scene;
  currentSubView: SubView;
  dailyMissions: Mission[];
  activeDispatches: ActiveDispatch[];
  activeEvent: DynamicEvent | null; 
  globalModal: GlobalModal | null; 
  activeWindow: ActiveWindow | null; 
  isSaving: boolean; 
  localSaveVersion: number; 
  _hasHydrated: boolean;
  activeCombat: CombatPlaybackData | null;

  setActiveWindow: (win: ActiveWindow | null) => void;
  setGlobalModal: (modal: GlobalModal | null) => void;
  setIsSaving: (val: boolean) => void; 
  setHasHydrated: (val: boolean) => void;
  setActiveCombat: (combat: CombatPlaybackData | null) => void;
  appointRole: (slaveId: string, role: Role) => void; 
  
  syncProfileToCloud: () => Promise<void>;
  loadProfileFromCloud: (forceLoad?: boolean) => Promise<void>; 
  consumeIdentity: () => Promise<{name: string, story: string}>;
  
  addGold: (amount: number) => void;
  deductGold: (amount: number) => void;
  addFood: (amount: number) => void;
  deductFood: (amount: number) => void;
  addPrestige: (amount: number) => void;
  changeLocation: (loc: Location) => void;
  navigate: (scene: Scene, subView: SubView) => void;
  cleanRoom: () => void;
  addSlave: (slave: Slave) => void;
  updateSlave: (id: string, updates: Partial<Slave>) => void;
  sellSlave: (slaveId: string) => void; 
  dispatchSlave: (slaveId: string, missionId: string) => void;
  triggerBackgroundMarketRefresh: () => Promise<void>;
  checkApRecovery: () => void; 
  processTurn: () => void;
  executeArenaBattle: (slaveId: string, npcId: string) => { logs: CombatLog[], isWin: boolean } | null;
  executeAbyssBattle: (slaveId: string) => { logs: CombatLog[], isWin: boolean } | null;

  buyItem: (itemId: string) => void;
  useItem: (itemId: string, slaveId: string) => void;
  equipWeapon: (itemId: string, slaveId: string) => void;
  unequipWeapon: (slaveId: string) => void;
  fulfillEvent: (slaveId: string) => boolean;

  triggerQuest: (questId: string) => void;
  checkQuestCompletion: () => void;
}

const generateDailyMissions = (): Mission[] => {
  const missions: Mission[] = [];
  const baseId = Date.now().toString(36);
  const actions = ['護送', '掠奪', '鎮壓', '搜刮', '暗殺', '勘探'];
  const targets = ['私掠物資', '深淵礦脈', '異端營地', '帝國商隊', '地下黑市', '古老遺跡'];
  const getName = () => `【${actions[Math.floor(Math.random() * actions.length)]}${targets[Math.floor(Math.random() * targets.length)]}】`;

  for (let i = 0; i < Math.floor(Math.random() * 2) + 3; i++) {
    missions.push({ 
      id: `m-grn-${baseId}-${i}`, title: `［常規］${getName()}`, rank: '翠綠', requiredPhases: 1, staminaCost: 20, stressGain: 10, reward: 300 + Math.floor(Math.random() * 100), 
      description: '常規安全外派，勞動性質溫和。', successRate: 1.0, obedienceReward: 0 
    });
  }
  for (let i = 0; i < Math.floor(Math.random() * 2) + 1; i++) {
    missions.push({ 
      id: `m-blu-${baseId}-${i}`, title: `［進階］${getName()}`, rank: '蔚藍', requiredPhases: 2, staminaCost: 45, stressGain: 25, reward: 800 + Math.floor(Math.random() * 200), 
      description: '危險差事。［失敗懲罰］若不幸失敗，酬金歸零，體力重挫 40 點，壓力暴增 20 點。', successRate: 0.8, obedienceReward: 2 
    });
  }
  if (Math.random() > 0.7) {
    missions.push({ 
      id: `m-pur-${baseId}`, title: `［特化］${getName()}`, rank: '紫色', requiredPhases: 2, staminaCost: 50, stressGain: 30, reward: 1200 + Math.floor(Math.random() * 300), 
      description: '特化高危工作。［失敗懲罰］若不幸失敗，酬金歸零，體力重挫 40 點，壓力暴增 20 點。', successRate: 0.6, obedienceReward: 5 
    });
  }
  if (Math.random() > 0.8) {
    missions.push({ 
      id: `m-gld-${baseId}`, title: `［傳說］${getName()}`, rank: '黃金', requiredPhases: 5, staminaCost: 90, stressGain: 60, reward: 3500 + Math.floor(Math.random() * 1500), 
      description: '死亡搏命委託。［失敗懲罰］若不幸失敗，酬金歸零，體力重挫 40 點，壓力暴增 20 點。', successRate: 0.6, obedienceReward: 5 
    });
  }
  return missions;
};

const generateBaseMarketSlave = (idSuffix: string, identity: {name: string, story: string}): Slave => {
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
    traits: [], backgroundStory: identity.story,
    combatRecord: { wins: 0, losses: 0 },
    isInjured: false
  };
};

const storage: StateStorage = {
  getItem: async (name) => (await localforage.getItem(name)) || null,
  setItem: async (name, value) => { await localforage.setItem(name, value); },
  removeItem: async (name) => { await localforage.removeItem(name); },
};

const TIME_PHASES: TimePhase[] = ['早上', '中午', '下午', '晚上', '深夜'];
const DEFAULT_SHOP_STOCK = { 'potion_heal_small': 5, 'weapon_iron_sword': 1 }; 

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      player: { 
        day: 1, timePhase: '早上', gold: 99999, food: 120, location: 'Frontlines', roomDirtiness: 0, maxSlaveCapacity: 5, prestige: 9999, actionPoints: 50, lastApUpdateTime: Date.now(),
        deviceId: '', unlockedFacilities: [], usedIdentityIds: [],
        inventory: {}, quests: {}, abyssFloor: 1, shopStock: { ...DEFAULT_SHOP_STOCK }
      },
      currentScene: 'Home', currentSubView: 'Main', dailyMissions: generateDailyMissions(), activeDispatches: [], slaves: [], marketSlaves: [], arenaNPCs: generateArenaNPCs(), isMarketGenerating: false, isPoolGenerating: false,
      activeEvent: null, globalModal: null, activeWindow: null, isSaving: false, localSaveVersion: 0, _hasHydrated: false,
      activeCombat: null,

      setActiveWindow: (win) => set({ activeWindow: win }),
      setGlobalModal: (modal) => set({ globalModal: modal }),
      setIsSaving: (val) => set({ isSaving: val }),
      setHasHydrated: (val) => set({ _hasHydrated: val }),
      setActiveCombat: (combat) => set({ activeCombat: combat }),

      appointRole: (slaveId, role) => set(state => {
        const target = state.slaves.find(s => s.id === slaveId);
        if (!target) return state;
        if (role !== 'none' && target.primaryStats.obedience < 80) {
          setTimeout(() => { get().setGlobalModal({ title: '［職務任免駁回］', message: `${target.name} 的服從度未達到 80 點，拒絕履行商會高級職務！`, isConfirm: false }); }, 50);
          return state;
        }
        const updated = state.slaves.map(s => {
          let r = s.role; if (role !== 'none' && s.role === role) r = 'none'; if (s.id === slaveId) r = role;
          return { ...s, role: r };
        });
        return { slaves: updated };
      }),

      triggerQuest: (questId) => set(state => {
        if (!state.player.quests[questId]) {
           const newQuests = { ...state.player.quests, [questId]: 'active' as const };
           const qData = QUESTS_DATA[questId as keyof typeof QUESTS_DATA];
           setTimeout(() => {
             get().syncProfileToCloud();
             if (qData) { get().setGlobalModal({ title: '［⚡ 發現新劇情任務解鎖］', message: `${qData.title}\n\n任務目標：${qData.description}`, isConfirm: false }); }
           }, 100); 
           return { player: { ...state.player, quests: newQuests } };
        }
        return state;
      }),

      checkQuestCompletion: () => {
         const state = get(); let updated = false; const newQuests = { ...state.player.quests }; let title = ''; let msg = ''; let addG = 0;
         if (newQuests['q_first_blood'] === 'active' && state.slaves.length > 0) { newQuests['q_first_blood'] = 'completed'; addG = 2000; updated = true; title = '［任務達成］【深淵的初啼】'; msg = `成功簽署第一份血脈契約！商會基礎雛形已然確立。\n\n獲得報酬：\n資金 +2,000`; }
         else if (newQuests['q_first_fusion'] === 'active' && state.slaves.some(s => s.parents)) { newQuests['q_first_fusion'] = 'completed'; addG = 1500; updated = true; title = '［任務達成］【禁忌的鍊金術】'; msg = `成功在血統密室中編織融合出全新的生命血脈！\n\n獲得報酬：\n資金 +1,500`; }
         else if (newQuests['q_enter_hub'] === 'active' && (state.player.location === 'NeutralHub' || state.player.location === 'Capital')) { newQuests['q_enter_hub'] = 'completed'; addG = 5000; updated = true; title = '［任務達成］【踏入灰色地帶】'; msg = `成功突破混亂前線，向核心城區拔營挺進！\n\n獲得報酬：\n資金 +5,000`; }

         if (updated) {
            set({ player: { ...state.player, quests: newQuests, gold: state.player.gold + addG } });
            get().setGlobalModal({ title, message: msg, isConfirm: false }); get().syncProfileToCloud();
         }
      },

      syncProfileToCloud: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        set({ isSaving: true });
        
        const newVersion = (get().localSaveVersion || 0) + 1;
        set({ localSaveVersion: newVersion });

        const state = get(); const p = state.player;
        const { error } = await supabase.from('profiles').upsert({
          id: session.user.id, day: p.day, gold: p.gold, food: p.food, action_points: p.actionPoints, prestige: p.prestige, unlocked_facilities: p.unlockedFacilities,
          save_data: { localSaveVersion: newVersion, usedIdentityIds: p.usedIdentityIds, inventory: p.inventory, quests: p.quests, abyssFloor: p.abyssFloor, shopStock: p.shopStock, slaves: state.slaves, marketSlaves: state.marketSlaves, activeDispatches: state.activeDispatches, activeEvent: state.activeEvent, arenaNPCs: state.arenaNPCs }
        });
        
        if (error) console.error('［同步異常］', error);
        set({ isSaving: false });
      },

      loadProfileFromCloud: async (forceLoad = false) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (error || !data) return;
        const sData = data.save_data || {};

        const cloudVersion = sData.localSaveVersion || 0;
        const currentLocalVersion = get().localSaveVersion || 0;

        if (!forceLoad && cloudVersion <= currentLocalVersion) {
           console.log(`［防禦網啟動］雲端版號 (v${cloudVersion}) <= 本地版號 (v${currentLocalVersion})，絕對信任本地資料，攔截覆蓋。`);
           return; 
        }

        set((state) => ({
          localSaveVersion: cloudVersion,
          player: { ...state.player, day: data.day ?? state.player.day, gold: data.gold ?? state.player.gold, food: data.food ?? state.player.food, actionPoints: data.action_points ?? state.player.actionPoints, prestige: data.prestige ?? state.player.prestige, unlockedFacilities: data.unlocked_facilities || state.player.unlockedFacilities, usedIdentityIds: sData.usedIdentityIds || state.player.usedIdentityIds, inventory: sData.inventory || state.player.inventory, quests: sData.quests || state.player.quests, abyssFloor: sData.abyssFloor || state.player.abyssFloor, shopStock: sData.shopStock || state.player.shopStock },
          slaves: sData.slaves || state.slaves, marketSlaves: sData.marketSlaves || state.marketSlaves, activeDispatches: sData.activeDispatches || state.activeDispatches, activeEvent: sData.activeEvent || state.activeEvent,
          arenaNPCs: sData.arenaNPCs && sData.arenaNPCs.length > 0 ? sData.arenaNPCs : state.arenaNPCs
        }));
      },

      buyItem: (itemId) => set(state => {
        const item = ITEMS_DATA[itemId]; const stock = state.player.shopStock[itemId] || 0;
        if (item && state.player.gold >= item.price && stock > 0) {
            return { player: { ...state.player, gold: state.player.gold - item.price, inventory: { ...state.player.inventory, [itemId]: (state.player.inventory[itemId] || 0) + 1 }, shopStock: { ...state.player.shopStock, [itemId]: stock - 1 } } };
        }
        return state;
      }),

      useItem: (itemId, slaveId) => set(state => {
        const item = ITEMS_DATA[itemId]; const slave = state.slaves.find(s => s.id === slaveId); const qty = state.player.inventory[itemId] || 0;
        if (qty > 0 && slave && item.type === 'potion') {
            let healAmount = item.effect.stamina || 0;
            if (slave.isInjured) { healAmount = Math.floor(healAmount * 0.5); }
            const newStamina = Math.min(100, slave.conditionStats.stamina + healAmount);
            const newInv = { ...state.player.inventory, [itemId]: qty - 1 }; if (newInv[itemId] <= 0) delete newInv[itemId];
            return { player: { ...state.player, inventory: newInv }, slaves: state.slaves.map(s => s.id === slaveId ? { ...s, conditionStats: { ...s.conditionStats, stamina: newStamina } } : s) };
        }
        return state;
      }),

      equipWeapon: (itemId, slaveId) => set(state => {
        const qty = state.player.inventory[itemId] || 0; const slave = state.slaves.find(s => s.id === slaveId);
        if (qty > 0 && slave && ITEMS_DATA[itemId].type === 'weapon') {
            const oldWeapon = slave.equipment?.weaponId; const newInv = { ...state.player.inventory, [itemId]: qty - 1 };
            if (oldWeapon) newInv[oldWeapon] = (newInv[oldWeapon] || 0) + 1; if (newInv[itemId] <= 0) delete newInv[itemId];
            
            const obedienceBonus = oldWeapon ? 0 : 10;
            const newObedience = Math.min(100, slave.primaryStats.obedience + obedienceBonus);

            return { 
              player: { ...state.player, inventory: newInv }, 
              slaves: state.slaves.map(s => s.id === slaveId ? { ...s, equipment: { weaponId: itemId }, primaryStats: { ...s.primaryStats, obedience: newObedience } } : s) 
            };
        }
        return state;
      }),

      unequipWeapon: (slaveId) => set(state => {
        const slave = state.slaves.find(s => s.id === slaveId);
        if (slave && slave.equipment?.weaponId) {
          const oldWeapon = slave.equipment.weaponId;
          const newInv = { ...state.player.inventory, [oldWeapon]: (state.player.inventory[oldWeapon] || 0) + 1 };
          const newObedience = Math.max(0, slave.primaryStats.obedience - 10);
          
          return {
            player: { ...state.player, inventory: newInv },
            slaves: state.slaves.map(s => s.id === slaveId ? { ...s, equipment: undefined, primaryStats: { ...s.primaryStats, obedience: newObedience } } : s)
          };
        }
        return state;
      }),

      fulfillEvent: (slaveId) => {
        const state = get(); const evt = state.activeEvent; const slave = state.slaves.find(s => s.id === slaveId);
        if (!evt || !slave || slave.activityStatus !== '閒置') return false;
        if (evt.reqRace && slave.race !== evt.reqRace) return false;
        if (evt.reqGender && slave.gender !== evt.reqGender) return false;
        if (evt.reqStat && evt.reqStat.key === 'obedience' && slave.primaryStats.obedience < evt.reqStat.val) return false;
        if (evt.reqStat && evt.reqStat.key === 'combat' && slave.primaryStats.combat < evt.reqStat.val) return false;

        const newSlaves = state.slaves.filter(s => s.id !== slaveId); const newInv = { ...state.player.inventory };
        if (evt.reward.item) newInv[evt.reward.item] = (newInv[evt.reward.item] || 0) + 1;
        set({ slaves: newSlaves, activeEvent: null, player: { ...state.player, gold: state.player.gold + evt.reward.gold, prestige: state.player.prestige + evt.reward.prestige, inventory: newInv } });
        get().syncProfileToCloud(); return true;
      },

      consumeIdentity: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return { name: "無名幽影", story: "未與深淵建立正式連結的幻影。" };
        set({ isPoolGenerating: true });
        try {
          const usedIds = get().player.usedIdentityIds;
          const { data: poolData, error: poolError } = await supabase.from('global_identities').select('*').limit(50);
          if (poolError) throw poolError;
          const availableIdentities = (poolData || []).filter(d => !usedIds.includes(d.id));
          let identity = availableIdentities.length > 0 ? availableIdentities[0] : null;
          if (!identity) {
             const newAiData = await fetchIdentityBatch(); 
             const { data: insertedData, error: insertError } = await supabase.from('global_identities').insert(newAiData).select();
             if (insertError) throw insertError;
             if (insertedData && insertedData.length > 0) identity = insertedData[0];
          }
          if (!identity) throw new Error('AI 與資料庫雙重潰堤');
          const { error: logError } = await supabase.from('user_identity_logs').insert({ user_id: session.user.id, identity_id: identity.id });
          if (logError) console.warn("［寫入紀錄失敗］", logError); 
          const newUsedIds = [...get().player.usedIdentityIds, identity.id];
          set(s => ({ player: { ...s.player, usedIdentityIds: newUsedIds } }));
          return { name: identity.name, story: identity.story };
        } catch (e) {
          console.error("［系統攔截］", e); return { name: "罪業之軀", story: "來自深淵的亂碼碎片。" };
        } finally {
          set({ isPoolGenerating: false });
        }
      },

      addGold: (amount) => set((state) => ({ player: { ...state.player, gold: state.player.gold + amount } })),
      deductGold: (amount) => set((state) => ({ player: { ...state.player, gold: Math.max(0, state.player.gold - amount) } })),
      addFood: (amount) => set((state) => ({ player: { ...state.player, food: state.player.food + amount } })),
      deductFood: (amount) => set((state) => ({ player: { ...state.player, food: Math.max(0, state.player.food - amount) } })),
      addPrestige: (amount) => set((state) => ({ player: { ...state.player, prestige: state.player.prestige + amount } })),
      changeLocation: (loc) => { set((state) => { let capacity = 5; if (loc === 'NeutralHub') capacity = 10; if (loc === 'Capital') capacity = 20; return { player: { ...state.player, location: loc, maxSlaveCapacity: capacity } }; }); get().checkQuestCompletion(); },
      navigate: (scene, subView) => set({ currentScene: scene, currentSubView: subView }),
      cleanRoom: () => set((state) => { if (state.player.gold >= 50) return { player: { ...state.player, gold: state.player.gold - 50, roomDirtiness: Math.max(0, state.player.roomDirtiness - 40) } }; return state; }),
      addSlave: (slave) => { set((state) => ({ slaves: [...state.slaves, slave] })); get().checkQuestCompletion(); },
      updateSlave: (id, updates) => set((state) => ({ slaves: state.slaves.map(s => s.id === id ? { ...s, ...updates, conditionStats: { ...s.conditionStats, ...(updates.conditionStats || {}) } } : s) })),
      sellSlave: (slaveId) => set((state) => {
        const slave = state.slaves.find(s => s.id === slaveId); if (!slave || slave.activityStatus !== '閒置') return state;
        const sellPrice = 50 + Math.floor((slave.primaryStats.combat + slave.primaryStats.endurance + slave.primaryStats.intelligence + slave.primaryStats.obedience) * 1.5) + ((slave.skills.combat + slave.skills.housework + slave.skills.survival) * 200);
        return { slaves: state.slaves.filter(s => s.id !== slaveId), player: { ...state.player, gold: state.player.gold + sellPrice } };
      }),
      dispatchSlave: (slaveId, missionId) => {
        const state = get(); const mission = state.dailyMissions.find(m => m.id === missionId); if (!mission) return;
        state.updateSlave(slaveId, { activityStatus: '外派中' });
        set({ activeDispatches: [...state.activeDispatches, { slaveId, mission, remainingPhases: mission.requiredPhases }], dailyMissions: state.dailyMissions.filter(m => m.id !== missionId) });
      },
      triggerBackgroundMarketRefresh: async () => {
        if (get().isMarketGenerating) return;
        set({ isMarketGenerating: true, marketSlaves: [] });
        try { const newSlaves = []; for (let i = 0; i < 3; i++) { const identity = await get().consumeIdentity(); newSlaves.push(generateBaseMarketSlave(String(i), identity)); } set({ marketSlaves: newSlaves }); } 
        catch (e) { console.error(e); } finally { set({ isMarketGenerating: false }); }
      },

      checkApRecovery: () => set((state) => {
        const { actionPoints, lastApUpdateTime } = state.player; if (actionPoints >= 50) return state;
        const now = Date.now(); const elapsed = now - lastApUpdateTime; const recoverAmount = Math.floor(elapsed / 60000); 
        if (recoverAmount > 0) { const newAp = Math.min(50, actionPoints + recoverAmount); return { player: { ...state.player, actionPoints: newAp, lastApUpdateTime: newAp === 50 ? now : lastApUpdateTime + (recoverAmount * 60000) } }; }
        return state;
      }),

      processTurn: () => {
        get().checkApRecovery();
        const state = get(); const { player, slaves, activeDispatches, triggerBackgroundMarketRefresh } = state;
        if (player.actionPoints < 1) return;

        const newAp = player.actionPoints - 1; const newApUpdateTime = player.actionPoints === 50 ? Date.now() : player.lastApUpdateTime;
        const currentPhaseIndex = TIME_PHASES.indexOf(player.timePhase);
        let nextPhase: TimePhase; let nextDay = player.day; let triggerDailySettlement = false;

        if (currentPhaseIndex === TIME_PHASES.length - 1) { nextPhase = '早上'; nextDay += 1; triggerDailySettlement = true; } else { nextPhase = TIME_PHASES[currentPhaseIndex + 1]; }

        let updatedSlaves = slaves.map(s => {
          let fTurns = s.faintTurns || 0;
          if (fTurns > 0) fTurns -= 1;
          return { ...s, faintTurns: fTurns };
        });

        const overpopulation = Math.max(0, updatedSlaves.length - player.maxSlaveCapacity);
        let newDirtiness = Math.min(100, player.roomDirtiness + Math.ceil(updatedSlaves.length * (player.location === 'Capital' ? 1 : player.location === 'NeutralHub' ? 1.5 : 2)) + Math.pow(overpopulation, 2) * 5);
        
        let newShopStock = { ...player.shopStock };
        let newArenaNPCs = state.arenaNPCs;
        
        let maidFaintedThisNight = false;
        let maidName = '';
        if (triggerDailySettlement) {
          newShopStock = { ...DEFAULT_SHOP_STOCK };
          newArenaNPCs = generateArenaNPCs();
          
          const maid = updatedSlaves.find(s => s.role === 'maid');
          if (maid && (maid.faintTurns || 0) === 0) {
            const maidHousework = maid.isInjured ? Math.floor((maid.skills?.housework || 1) * 0.5) : (maid.skills?.housework || 1);
            newDirtiness = Math.max(0, newDirtiness - (maidHousework * 15));
            
            maid.conditionStats.stamina = Math.max(0, maid.conditionStats.stamina - 15);
            if (maid.conditionStats.stamina <= 0) {
              maid.faintTurns = 5;
              maid.primaryStats.obedience = Math.max(0, maid.primaryStats.obedience - 10);
              maid.conditionStats.stress = Math.min(100, maid.conditionStats.stress + 30);
              maidFaintedThisNight = true;
              maidName = maid.name;
            }
          }
        }

        set({ player: { ...player, day: nextDay, timePhase: nextPhase, roomDirtiness: newDirtiness, actionPoints: newAp, lastApUpdateTime: newApUpdateTime, shopStock: newShopStock }, arenaNPCs: newArenaNPCs });

        const newDispatches: ActiveDispatch[] = []; let earnedGold = 0; let earnedPrestige = 0;
        let dispatchLogs: string[] = [];

        activeDispatches.forEach(dispatch => {
          dispatch.remainingPhases -= 1;
          if (dispatch.remainingPhases <= 0) {
            let baseReward = dispatch.mission.reward;
            const slave = updatedSlaves.find(s => s.id === dispatch.slaveId);
            if (slave) {
               const isSuccess = Math.random() < (dispatch.mission.successRate ?? 1.0);

               if (isSuccess) {
                 const intelligenceStat = slave.isInjured ? Math.floor(slave.primaryStats.intelligence * 0.5) : slave.primaryStats.intelligence;
                 const successChance = intelligenceStat / 200;
                 if (Math.random() < successChance) {
                    baseReward = Math.floor(baseReward * 1.5);
                    dispatchLogs.push(`［外派大成功］${slave.name} 憑藉智力完美規避風險，帶回額外 1.5 倍收益！`);
                 }
                 earnedGold += baseReward;

                 let updatedSkills = { ...slave.skills };
                 if (dispatch.mission.rank === '紫色') {
                   if (Math.random() > 0.5) earnedPrestige += Math.floor(Math.random() * 20) + 10;
                   else { const keys = ['combat', 'housework', 'survival'] as const; const k = keys[Math.floor(Math.random() * keys.length)]; if (updatedSkills[k] < 10) updatedSkills[k] += 1; }
                 }
                 
                 const finalStamina = Math.max(0, slave.conditionStats.stamina - Math.max(10, dispatch.mission.staminaCost - ((slave.isInjured ? Math.floor(slave.skills.combat * 0.5) : slave.skills.combat) * 2)));
                 slave.conditionStats.stamina = finalStamina;
                 slave.conditionStats.stress = Math.min(100, slave.conditionStats.stress + dispatch.mission.stressGain);
                 
                 const obReward = dispatch.mission.obedienceReward || 0;
                 if (obReward > 0) {
                   slave.primaryStats.obedience = Math.min(100, slave.primaryStats.obedience + obReward);
                   dispatchLogs.push(`［外派捷報］${slave.name} 順利完成 ${dispatch.mission.title}，服從度提升了 ${obReward} 點！`);
                 } else {
                   dispatchLogs.push(`［外派回報］${slave.name} 已安全完成 ${dispatch.mission.title} 並歸隊。`);
                 }

                 slave.activityStatus = '閒置';
                 slave.skills = updatedSkills;

                 if (finalStamina <= 0 && !slave.isInjured) {
                   slave.conditionStats.stamina = 0;
                   slave.faintTurns = 5;
                   slave.primaryStats.obedience = Math.max(0, slave.primaryStats.obedience - 5);
                   slave.conditionStats.stress = Math.min(100, slave.conditionStats.stress + 15);
                 }
               } else {
                 slave.conditionStats.stamina = Math.max(0, slave.conditionStats.stamina - 40);
                 slave.conditionStats.stress = Math.min(100, slave.conditionStats.stress + 20);
                 slave.activityStatus = '閒置';
                 dispatchLogs.push(`［外派慘敗］${slave.name} 在執行 ${dispatch.mission.title} 時突遭致命挫敗！空手而歸且體力重挫 40 點、壓力暴增 20 點！`);

                 if (slave.conditionStats.stamina <= 0) {
                   slave.faintTurns = 5;
                   slave.primaryStats.obedience = Math.max(0, slave.primaryStats.obedience - 5);
                   slave.conditionStats.stress = Math.min(100, slave.conditionStats.stress + 15);
                 }
               }
            }
          } else { newDispatches.push(dispatch); }
        });

        if (earnedGold > 0) get().addGold(earnedGold); if (earnedPrestige > 0) get().addPrestige(earnedPrestige);
        set({ activeDispatches: newDispatches });

        let escapedNames: string[] = [];
        let suppressedNames: string[] = [];
        if (triggerDailySettlement) {
          const foodNeeded = updatedSlaves.length * GAME_CONSTANTS.FOOD_CONSUMPTION_PER_SLAVE; let isStarving = false;
          if (get().player.food >= foodNeeded) get().deductFood(foodNeeded); else { get().deductFood(get().player.food); isStarving = true; }

          const rebels = updatedSlaves.filter(s => s.conditionStats.rebellion >= 100 && (s.faintTurns || 0) === 0 && !s.isInjured);
          const security = updatedSlaves.find(s => s.role === 'security');

          let totalStolenGold = 0;
          let totalPrestigeLoss = 0;

          if (rebels.length > 0) {
            if (!security || (security.faintTurns || 0) > 0 || security.conditionStats.rebellion >= 100) {
              rebels.forEach(r => {
                escapedNames.push(r.name);
                totalStolenGold += Math.floor(Math.random() * 1500) + 500;
                totalPrestigeLoss += Math.floor(Math.random() * 20) + 10;
              });
            } else {
              for (let rebel of rebels) {
                if (security.conditionStats.stamina <= 0 || (security.faintTurns || 0) > 0) {
                  escapedNames.push(rebel.name);
                  totalStolenGold += Math.floor(Math.random() * 1500) + 500;
                  totalPrestigeLoss += Math.floor(Math.random() * 20) + 10;
                  continue;
                }

                let secAtk = security.isInjured ? Math.floor(security.primaryStats.combat * 0.5) : security.primaryStats.combat;
                let secDef = security.isInjured ? Math.floor(security.primaryStats.endurance * 0.25) : Math.floor(security.primaryStats.endurance * 0.5);
                let secHpMax = (security.isInjured ? Math.floor(security.primaryStats.endurance * 0.5) : security.primaryStats.endurance) * 5;
                let secHp = Math.floor(secHpMax * (security.conditionStats.stamina / 100));

                let rebAtk = rebel.isInjured ? Math.floor(rebel.primaryStats.combat * 0.5) : rebel.primaryStats.combat;
                let rebDef = rebel.isInjured ? Math.floor(rebel.primaryStats.endurance * 0.25) : Math.floor(rebel.primaryStats.endurance * 0.5);
                let rebHpMax = (rebel.isInjured ? Math.floor(rebel.primaryStats.endurance * 0.5) : rebel.primaryStats.endurance) * 5;
                let rebHp = Math.floor(rebHpMax * (rebel.conditionStats.stamina / 100));

                while (secHp > 0 && rebHp > 0) {
                  rebHp -= Math.max(1, secAtk - rebDef);
                  if (rebHp <= 0) break;
                  secHp -= Math.max(1, rebAtk - secDef);
                }

                if (secHp > 0) {
                  suppressedNames.push(rebel.name);
                  rebel.isInjured = true;
                  rebel.conditionStats.stamina = 0;
                  rebel.conditionStats.rebellion = 0;
                  
                  security.conditionStats.stamina = Math.max(0, Math.floor((secHp / secHpMax) * 100));
                  if (security.conditionStats.stamina <= 0) {
                    security.faintTurns = 5;
                  }
                } else {
                  escapedNames.push(rebel.name);
                  totalStolenGold += Math.floor(Math.random() * 1500) + 500;
                  totalPrestigeLoss += Math.floor(Math.random() * 20) + 10;

                  security.conditionStats.stamina = 0;
                  security.faintTurns = 5;
                  security.conditionStats.stress = Math.min(100, security.conditionStats.stress + 40);
                  security.primaryStats.obedience = Math.max(0, security.primaryStats.obedience - 15);
                  security.conditionStats.rebellion = Math.min(100, security.conditionStats.rebellion + 20);
                }
              }
            }
          }

          updatedSlaves.forEach(slave => {
            if (escapedNames.includes(slave.name)) return;

            let currentIsInjured = slave.isInjured;
            if (currentIsInjured && slave.conditionStats.stamina >= 100) { currentIsInjured = false; }

            let newStamina = slave.conditionStats.stamina; let newStress = slave.conditionStats.stress; let newRebellion = slave.conditionStats.rebellion;
            let fTurns = slave.faintTurns || 0;

            if (isStarving) { newStress = Math.min(100, newStress + 20); newRebellion = Math.min(100, newRebellion + 10); } else {
              if (slave.activityStatus === '閒置' && (slave.role === 'none' || !slave.role) && fTurns === 0) { newStamina = Math.min(100, newStamina + (newDirtiness > 50 ? 10 : 30)); if (overpopulation === 0) newStress = Math.max(0, newStress - 5); }
              if (newDirtiness > 80) { newStress = Math.min(100, newStress + 20); const rebGain = Math.max(1, 15 - Math.floor(slave.primaryStats.obedience / 10)); newRebellion = Math.min(100, newRebellion + rebGain); }
              if (overpopulation > 0) { newStress = Math.min(100, newStress + (overpopulation * 5)); const rebGain = Math.max(1, 3 - Math.floor(slave.primaryStats.obedience / 20)); newRebellion = Math.min(100, newRebellion + rebGain); }
            }

            if (slave.primaryStats.obedience >= 80) {
              newRebellion = Math.max(0, newRebellion - 3);
            }

            if (newStamina <= 0 && !slave.isInjured && fTurns === 0) {
              newStamina = 0;
              fTurns = 5;
              slave.primaryStats.obedience = Math.max(0, slave.primaryStats.obedience - 5);
              newStress = Math.min(100, newStress + 15);
            }

            slave.isInjured = currentIsInjured;
            slave.conditionStats.stamina = newStamina;
            slave.conditionStats.stress = newStress;
            slave.conditionStats.rebellion = newRebellion;
            slave.faintTurns = fTurns;
          });

          if (escapedNames.length > 0) {
             const actualStolen = Math.min(get().player.gold, totalStolenGold);
             const actualPrestigeLoss = Math.min(get().player.prestige, totalPrestigeLoss);
             set(s => ({ player: { ...s.player, gold: Math.max(0, s.player.gold - actualStolen), prestige: Math.max(0, s.player.prestige - actualPrestigeLoss) } }));
             
             setTimeout(() => { 
               get().setGlobalModal({ 
                 title: '［據點突發事件：越獄成功］', 
                 message: `以下成員趁夜衝破防線逃離據點：\n\n【${escapedNames.join('】、【')}】\n\n商會共計損失資金：$${actualStolen}，威望降低 ${actualPrestigeLoss} 點。`, 
                 isConfirm: false 
               }); 
             }, 200);
          }

          if (suppressedNames.length > 0) {
            setTimeout(() => {
              get().setGlobalModal({
                title: '［據點治安回報：成功鎮壓］',
                message: `守衛防線成功攔截並擊潰了以下試驗體的夜間叛逃企圖：\n\n【${suppressedNames.join('】、【')}】\n\n上述成員已被強制重傷拘禁，反抗心重置為 0。`,
                isConfirm: false
              });
            }, escapedNames.length > 0 ? 250 : 200);
          }

          if (maidFaintedThisNight && escapedNames.length === 0 && suppressedNames.length === 0) {
            setTimeout(() => {
              get().setGlobalModal({ title: '［據點治安回報：傭人過勞］', message: `打掃管家【${maidName}】因無腦高強度打掃致使體力徹底榨乾，已陷入昏厥罷工狀態。`, isConfirm: false });
            }, 200);
          }

          if (dispatchLogs.length > 0 && escapedNames.length === 0 && suppressedNames.length === 0 && !maidFaintedThisNight) { 
            setTimeout(() => { get().setGlobalModal({ title: '［商會經營成果回報］', message: dispatchLogs.join('\n'), isConfirm: false }); }, 250); 
          }

          let nextEvent = null;
          if (get().player.location === 'NeutralHub' && Math.random() < 0.4) { nextEvent = { id: 'evt1', type: 'merchant', desc: '【地頭蛇老張】急需一名服從度達 60 的女性半獸人。', reqRace: '半獸人', reqGender: 'Female', reqStat: { key: 'obedience', val: 60 }, reward: { gold: 12000, prestige: 20, item: 'potion_heal_small' } } as const; } 
          else if (get().player.location === 'Capital' && Math.random() < 0.3) { nextEvent = { id: 'evt2', type: 'noble', desc: '【腥紅伯爵】徵求武力達 80 的精靈。', reqRace: '精靈', reqStat: { key: 'combat', val: 80 }, reward: { gold: 35000, prestige: 100, item: 'weapon_iron_sword' } } as const; }

          triggerBackgroundMarketRefresh(); 
          set({ dailyMissions: generateDailyMissions(), activeEvent: nextEvent });
        }

        const finalSlaves = updatedSlaves.filter(sl => !escapedNames.includes(sl.name));
        set({ slaves: finalSlaves });
        
        get().syncProfileToCloud();
      },

      executeArenaBattle: (slaveId, npcId) => {
        const state = get(); const slave = state.slaves.find(s => s.id === slaveId); const npc = state.arenaNPCs.find(n => n.id === npcId);
        if (!slave || !npc || state.player.actionPoints < 1) return null;

        let weaponAtk = 0; if (slave.equipment?.weaponId && ITEMS_DATA[slave.equipment.weaponId]) weaponAtk = ITEMS_DATA[slave.equipment.weaponId].effect.attack || 0;

        const combatStat = slave.isInjured ? Math.floor(slave.primaryStats.combat * 0.5) : slave.primaryStats.combat;
        const enduranceStat = slave.isInjured ? Math.floor(slave.primaryStats.endurance * 0.5) : slave.primaryStats.endurance;
        const intelligenceStat = slave.isInjured ? Math.floor(slave.primaryStats.intelligence * 0.5) : slave.primaryStats.intelligence;
        const combatSkill = slave.isInjured ? Math.floor((slave.skills?.combat || 1) * 0.5) : (slave.skills?.combat || 1);
        const survivalSkill = slave.isInjured ? Math.floor((slave.skills?.survival || 1) * 0.5) : (slave.skills?.survival || 1);

        const sLuck = slave.primaryStats.luck ?? 10;

        let sHpMax = Math.floor(enduranceStat * 5); let sHp = Math.floor(sHpMax * (slave.conditionStats.stamina / 100));
        let sAtk = combatStat + weaponAtk; let sDef = Math.floor(enduranceStat * 0.5 + survivalSkill * 2); let sSpd = intelligenceStat;
        let sDmgMulti = 1 + (combatSkill * 0.05); let sDmgReduc = combatSkill * 0.03;

        if (slave.race === '精靈') sSpd = Math.floor(sSpd * 1.2);
        if (slave.race === '半獸人') { sAtk = Math.floor(sAtk * 1.15); sDef = Math.floor(sDef * 0.9); }
        if (slave.race === '矮人') { sHpMax = Math.floor(sHpMax * 1.2); sHp = Math.floor(sHp * 1.2); sDef = Math.floor(sDef * 1.15); }
        if (slave.race === '龍族') { sAtk = Math.floor(sAtk * 1.1); sDef = Math.floor(sDef * 1.1); sSpd = Math.floor(sSpd * 1.1); sDmgReduc += 0.2; }

        let nHpMax = npc.stats.endurance * 5; 
        let nHp = nHpMax;
        let nAtk = npc.stats.combat; 
        let nDef = Math.floor(npc.stats.endurance * 0.5); 
        let nSpd = npc.stats.intelligence;
        let nLuck = npc.stats.luck;
        let nCharisma = npc.stats.charisma;

        const logs: CombatLog[] = []; 
        logs.push({ round: 0, message: `［系統］${slave.name} 踏入賽場，迎戰 ${npc.name}。`, type: 'system', sHp, nHp });

        if (slave.race === '精靈') logs.push({ round: 0, message: `［風之眷顧］${slave.name} 身形如風奪得先手，首擊傷害大幅增幅！`, type: 'skill', sHp, nHp });
        if (slave.race === '半獸人') logs.push({ round: 0, message: `［狂熱戰血］${slave.name} 點燃了怒火，放棄防禦以換取更具破壞力的重擊！`, type: 'skill', sHp, nHp });
        if (slave.race === '矮人') logs.push({ round: 0, message: `［堅岩體魄］${slave.name} 展現了北地體格，肌肉宛如磐石般堅不可摧！`, type: 'skill', sHp, nHp });
        if (slave.race === '龍族') logs.push({ round: 0, message: `［真龍威壓］${slave.name} 釋放了上位威壓，全屬性增幅並獲得巨額減傷！`, type: 'skill', sHp, nHp });
        if (slave.race === '人類') logs.push({ round: 0, message: `［絕境意志］${slave.name} 懷抱求生潛能，瀕死狀態下攻擊力將大幅爆發。`, type: 'skill', sHp, nHp });
        if (slave.race === '不死族') logs.push({ round: 0, message: `［枯骨不朽］${slave.name} 散發著死氣，其攻擊能精準汲取敵人的生命力。`, type: 'skill', sHp, nHp });

        let round = 1; let orcStack = 0; let humanUnstoppable = false;

        while (sHp > 0 && nHp > 0 && round <= 50) {
          const isSlaveFirst = sSpd >= nSpd;
          const slaveAction = () => {
            if (sHp <= 0) return; let atkPower = sAtk; let dmgMulti = sDmgMulti;
            if (slave.race === '人類' && sHp < sHpMax * 0.4 && !humanUnstoppable) { humanUnstoppable = true; logs.push({ round, message: `［絕境意志］${slave.name} 爆發強烈的求生欲，攻擊力極大幅提升！`, type: 'skill', sHp, nHp }); }
            if (humanUnstoppable) atkPower = Math.floor(atkPower * 1.25);
            if (slave.race === '精靈' && isSlaveFirst) dmgMulti += 0.15;
            if (slave.race === '半獸人') dmgMulti += Math.min(0.3, orcStack * 0.03);

            const nDodgeRate = Math.min(0.20, (nLuck / 100) * 0.20);
            if (Math.random() < nDodgeRate) {
                logs.push({ round, message: `［閃避］${npc.name} 驚險地避開了 ${slave.name} 的致命一擊！`, type: 'skill', sHp, nHp });
            } else {
                let dmg = Math.floor(Math.max(1, atkPower - nDef) * dmgMulti); 
                const sCritRate = Math.min(0.30, (sLuck / 100) * 0.30);
                if (Math.random() < sCritRate) {
                    dmg = Math.floor(dmg * 1.5);
                    logs.push({ round, message: `［爆擊］${slave.name} 抓住了轉瞬即逝的破綻，造成 1.5 倍爆擊傷害！`, type: 'damage', sHp, nHp });
                }
                nHp -= dmg;
                nHp = Math.max(0, nHp);
                logs.push({ round, message: `${slave.name} 發動攻擊，對 ${npc.name} 造成 ${dmg} 點傷害。`, type: 'damage', sHp, nHp, damage: dmg });
                if (slave.race === '不死族') { const heal = Math.floor(dmg * 0.15); if (heal > 0) { sHp = Math.min(sHpMax, sHp + heal); logs.push({ round, message: `［枯骨不朽］${slave.name} 吸收了 ${heal} 點生命力。`, type: 'heal', sHp, nHp, damage: heal }); } }
            }
          };
          const npcAction = () => {
            if (nHp <= 0) return; 
            const sDodgeRate = Math.min(0.20, (sLuck / 100) * 0.20);
            if (Math.random() < sDodgeRate) {
                logs.push({ round, message: `［閃避］${slave.name} 靈巧地避開了 ${npc.name} 的攻擊！`, type: 'skill', sHp, nHp });
            } else {
                let dmg = Math.max(1, nAtk - sDef); 
                if (slave.race === '矮人') { dmg = Math.max(1, dmg - 5); logs.push({ round, message: `［天賦防禦］${slave.name} 的【堅岩體魄】使其硬生生抵擋並折抵了 5 點致命傷害！`, type: 'skill', sHp, nHp }); }
                dmg = Math.floor(dmg * (1 - sDmgReduc)); 
                
                const nCritRate = Math.min(0.30, (nLuck / 100) * 0.30);
                if (Math.random() < nCritRate) {
                    dmg = Math.floor(dmg * 1.5);
                    logs.push({ round, message: `［爆擊］${npc.name} 的攻勢異常兇猛，對 ${slave.name} 造成 1.5 倍爆擊傷害！`, type: 'damage', sHp, nHp });
                }
                sHp -= dmg; 
                sHp = Math.max(0, sHp);
                logs.push({ round, message: `${npc.name} 揮舞武器，對 ${slave.name} 造成 ${dmg} 點傷害。`, type: 'damage', sHp, nHp, damage: dmg });
                if (slave.race === '半獸人') { orcStack++; logs.push({ round, message: `［天賦層數］${slave.name} 承受攻擊，痛苦激發狂暴！`, type: 'skill', sHp, nHp }); }
            }
          };
          if (isSlaveFirst) { slaveAction(); npcAction(); } else { npcAction(); slaveAction(); }
          round++;
        }

        const isWin = sHp > 0;
        let newWins = slave.combatRecord?.wins || 0;
        let newLosses = slave.combatRecord?.losses || 0;
        let isInjuredNow = slave.isInjured || false;
        let newStamina = Math.max(0, slave.conditionStats.stamina - 20);

        if (isWin) {
          newWins++;
          logs.push({ round: round - 1, message: `［結算］${slave.name} 屹立到了最後，取得勝利。`, type: 'system', sHp, nHp });
          
          const charismaBonus = 1 + Math.floor(nCharisma / 10) * 0.05;
          const finalRewardGold = Math.floor(npc.rewardGold * charismaBonus);
          get().addGold(finalRewardGold); 
          if (npc.rewardPrestige > 0) get().addPrestige(npc.rewardPrestige);

          if (charismaBonus > 1) {
              logs.push({ round: round - 1, message: `［戰利品加成］擊敗高魅力對手，基礎資金獲得額外 ${Math.round((charismaBonus - 1) * 100)}% 加成，共計獲取 ${finalRewardGold}！`, type: 'system', sHp, nHp });
          }

          const netWins = newWins - newLosses;
          if (netWins > 0 && netWins % 5 === 0) {
            const pool = ['combat', 'endurance', 'intelligence', 'charisma', 'luck'] as const;
            const picked = pool[Math.floor(Math.random() * pool.length)];
            slave.primaryStats[picked] = Math.min(100, (slave.primaryStats[picked] ?? 10) + 1);
            const nameMap = { combat: '武力', endurance: '體質', intelligence: '智力', charisma: '魅力', luck: '幸運' };
            logs.push({ round: round - 1, message: `歷練突破！${slave.name} 累積淨勝場達 ${netWins} 場，【${nameMap[picked]}】永久提升 1 點！`, type: 'skill', sHp, nHp });
          }
        } else {
          newLosses++;
          newStamina = 0; 
          isInjuredNow = true; 
          logs.push({ round: round - 1, message: `［結算］${slave.name} 遭受重創倒地，體力耗盡並陷入【負傷】狀態！`, type: 'system', sHp, nHp });
        }

        set((s) => ({ player: { ...s.player, actionPoints: s.player.actionPoints - 1 } }));
        let newStress = slave.conditionStats.stress; let newRebellion = slave.conditionStats.rebellion;
        if (slave.race !== '不死族') {
          newStress = Math.min(100, newStress + (isWin ? 5 : 15)); newRebellion = Math.min(100, newRebellion + (isWin ? 2 : 10));
          if (slave.race === '人類' && isWin) newStress = Math.max(0, newStress - (round * 2));
          if (slave.race === '龍族' && newStamina < 30) newRebellion = Math.min(100, newRebellion + 20);
        }

        get().updateSlave(slave.id, { combatRecord: { wins: newWins, losses: newLosses }, isInjured: isInjuredNow, conditionStats: { stamina: newStamina, stress: newStress, rebellion: newRebellion }, primaryStats: slave.primaryStats });
        
        const playbackData: CombatPlaybackData = {
           slaveId: slave.id, slaveName: slave.name, slaveMaxHp: sHpMax,
           npcName: npc.name, npcMaxHp: nHpMax, logs, isWin,
           rewardGold: isWin ? npc.rewardGold : 0, rewardPrestige: isWin ? npc.rewardPrestige : 0, isAbyss: false
        };
        set({ activeCombat: playbackData });

        get().processTurn(); get().syncProfileToCloud(); return { logs, isWin };
      },

      executeAbyssBattle: (slaveId) => {
        const state = get(); const slave = state.slaves.find(s => s.id === slaveId);
        if (!slave || state.player.actionPoints < 1) return null;

        const floor = state.player.abyssFloor; const enemy = getAbyssEnemy(floor);
        const logs: CombatLog[] = [];

        let weaponAtk = 0; if (slave.equipment?.weaponId && ITEMS_DATA[slave.equipment.weaponId]) weaponAtk = ITEMS_DATA[slave.equipment.weaponId].effect.attack || 0;

        const combatStat = slave.isInjured ? Math.floor(slave.primaryStats.combat * 0.5) : slave.primaryStats.combat;
        const enduranceStat = slave.isInjured ? Math.floor(slave.primaryStats.endurance * 0.5) : slave.primaryStats.endurance;
        const intelligenceStat = slave.isInjured ? Math.floor(slave.primaryStats.intelligence * 0.5) : slave.primaryStats.intelligence;
        const combatSkill = slave.isInjured ? Math.floor((slave.skills?.combat || 1) * 0.5) : (slave.skills?.combat || 1);
        const survivalSkill = slave.isInjured ? Math.floor((slave.skills?.survival || 1) * 0.5) : (slave.skills?.survival || 1);

        const sLuck = slave.primaryStats.luck ?? 10;

        let sHpMax = Math.floor(enduranceStat * 5); let sHp = Math.floor(sHpMax * (slave.conditionStats.stamina / 100));
        let sAtk = combatStat + weaponAtk; let sDef = Math.floor(enduranceStat * 0.5 + survivalSkill * 2); let sSpd = intelligenceStat;
        let sDmgMulti = 1 + (combatSkill * 0.05); let sDmgReduc = combatSkill * 0.03;

        if (slave.race === '精靈') sSpd = Math.floor(sSpd * 1.2);
        if (slave.race === '半獸人') { sAtk = Math.floor(sAtk * 1.15); sDef = Math.floor(sDef * 0.9); }
        if (slave.race === '矮人') { sHpMax = Math.floor(sHpMax * 1.2); sHp = Math.floor(sHp * 1.2); sDef = Math.floor(sDef * 1.15); }
        if (slave.race === '龍族') { sAtk = Math.floor(sAtk * 1.1); sDef = Math.floor(sDef * 1.1); sSpd = Math.floor(sSpd * 1.1); sDmgReduc += 0.2; }

        let nHpMax = enemy.stats.endurance * 5; 
        let nHp = nHpMax;
        let nAtk = enemy.stats.combat; 
        let nDef = Math.floor(enemy.stats.endurance * 0.5); 
        let nSpd = enemy.stats.intelligence;
        let nLuck = enemy.stats.luck;
        let nCharisma = enemy.stats.charisma;

        logs.push({ round: 0, message: `［系統］${slave.name} 踏入深淵第 ${floor} 階，迎戰 ${enemy.name}。`, type: 'system', sHp, nHp });
        logs.push({ round: 0, message: `「${enemy.quote}」`, type: 'system', sHp, nHp });

        if (slave.race === '精靈') logs.push({ round: 0, message: `［風之眷顧］${slave.name} 身形如風奪得先手，首擊傷害大幅增幅！`, type: 'skill', sHp, nHp });
        if (slave.race === '半獸人') logs.push({ round: 0, message: `［狂熱戰血］${slave.name} 點燃了怒火，放棄防禦以換取更具破壞力的重擊！`, type: 'skill', sHp, nHp });
        if (slave.race === '矮人') logs.push({ round: 0, message: `［堅岩體魄］${slave.name} 展現了北地體格，肌肉宛如磐石般堅不可摧！`, type: 'skill', sHp, nHp });
        if (slave.race === '龍族') logs.push({ round: 0, message: `［真龍威壓］${slave.name} 釋放了上位威壓，全屬性增幅並獲得巨額減傷！`, type: 'skill', sHp, nHp });
        if (slave.race === '人類') logs.push({ round: 0, message: `［絕境意志］${slave.name} 懷抱求生潛能，瀕死狀態下攻擊力將大幅爆發。`, type: 'skill', sHp, nHp });
        if (slave.race === '不死族') logs.push({ round: 0, message: `［枯骨不朽］${slave.name} 散發著死氣，其攻擊能精準汲取敵人的生命力。`, type: 'skill', sHp, nHp });

        let round = 1; let orcStack = 0; let humanUnstoppable = false;

        while (sHp > 0 && nHp > 0 && round <= 50) {
          const isSlaveFirst = sSpd >= nSpd;
          const slaveAction = () => {
            if (sHp <= 0) return; let atkPower = sAtk; let dmgMulti = sDmgMulti;
            if (slave.race === '人類' && sHp < sHpMax * 0.4 && !humanUnstoppable) { humanUnstoppable = true; logs.push({ round, message: `［絕境意志］${slave.name} 爆發強烈的求生欲，攻擊力極大幅提升！`, type: 'skill', sHp, nHp }); }
            if (humanUnstoppable) atkPower = Math.floor(atkPower * 1.25);
            if (slave.race === '精靈' && isSlaveFirst) dmgMulti += 0.15;
            if (slave.race === '半獸人') dmgMulti += Math.min(0.3, orcStack * 0.03);

            const nDodgeRate = Math.min(0.20, (nLuck / 100) * 0.20);
            if (Math.random() < nDodgeRate) {
                logs.push({ round, message: `［閃避］${enemy.name} 看破了攻勢，完美閃避了 ${slave.name} 的攻擊！`, type: 'skill', sHp, nHp });
            } else {
                let dmg = Math.floor(Math.max(1, atkPower - nDef) * dmgMulti); 
                const sCritRate = Math.min(0.30, (sLuck / 100) * 0.30);
                if (Math.random() < sCritRate) {
                    dmg = Math.floor(dmg * 1.5);
                    logs.push({ round, message: `［爆擊］${slave.name} 抓住了轉瞬即逝的破綻，造成 1.5 倍爆擊傷害！`, type: 'damage', sHp, nHp });
                }
                nHp -= dmg;
                nHp = Math.max(0, nHp);
                logs.push({ round, message: `${slave.name} 發動攻擊，對 ${enemy.name} 造成 ${dmg} 點傷害。`, type: 'damage', sHp, nHp, damage: dmg });
                if (slave.race === '不死族') { const heal = Math.floor(dmg * 0.15); if (heal > 0) { sHp = Math.min(sHpMax, sHp + heal); logs.push({ round, message: `［枯骨不朽］${slave.name} 吸收了 ${heal} 點生命力。`, type: 'heal', sHp, nHp, damage: heal }); } }
            }
          };
          const npcAction = () => {
            if (nHp <= 0) return; 
            const sDodgeRate = Math.min(0.20, (sLuck / 100) * 0.20);
            if (Math.random() < sDodgeRate) {
                logs.push({ round, message: `［閃避］${slave.name} 靈巧地避開了 ${enemy.name} 的攻擊！`, type: 'skill', sHp, nHp });
            } else {
                let dmg = Math.max(1, nAtk - sDef); 
                if (slave.race === '矮人') { dmg = Math.max(1, dmg - 5); logs.push({ round, message: `［天賦防禦］${slave.name} 的【堅岩體魄】使其硬生生抵擋並折抵了 5 點致命傷害！`, type: 'skill', sHp, nHp }); }
                dmg = Math.floor(dmg * (1 - sDmgReduc)); 
                
                const nCritRate = Math.min(0.30, (nLuck / 100) * 0.30);
                if (Math.random() < nCritRate) {
                    dmg = Math.floor(dmg * 1.5);
                    logs.push({ round, message: `［爆擊］${enemy.name} 的攻勢異常兇猛，對 ${slave.name} 造成 1.5 倍爆擊傷害！`, type: 'damage', sHp, nHp });
                }
                sHp -= dmg; 
                sHp = Math.max(0, sHp);
                logs.push({ round, message: `${enemy.name} 揮舞武器，對 ${slave.name} 造成 ${dmg} 點傷害.`, type: 'damage', sHp, nHp, damage: dmg });
                if (slave.race === '半獸人') { orcStack++; logs.push({ round, message: `［天賦層數］${slave.name} 承受攻擊，痛苦激發狂暴！`, type: 'skill', sHp, nHp }); }
            }
          };
          if (isSlaveFirst) { slaveAction(); npcAction(); } else { npcAction(); slaveAction(); }
          round++;
        }

        const isWin = sHp > 0;
        let newWins = slave.combatRecord?.wins || 0;
        let newLosses = slave.combatRecord?.losses || 0;
        let isInjuredNow = slave.isInjured || false;
        let newStamina = Math.max(0, slave.conditionStats.stamina - 30);

        if (isWin) {
          newWins++;
          logs.push({ round: round - 1, message: `［結算］${slave.name} 擊潰了深淵的阻礙，成功晉級！`, type: 'system', sHp, nHp });
          
          const charismaBonus = 1 + Math.floor(nCharisma / 10) * 0.05;
          const finalRewardGold = Math.floor(enemy.rewardGold * charismaBonus);
          get().addGold(finalRewardGold); 
          if (enemy.rewardPrestige > 0) get().addPrestige(enemy.rewardPrestige);
          
          set((s) => ({ player: { ...s.player, abyssFloor: s.player.abyssFloor + 1 } }));

          if (charismaBonus > 1) {
              logs.push({ round: round - 1, message: `［戰利品加成］擊破高魅力淵主，基礎資金獲得額外 ${Math.round((charismaBonus - 1) * 100)}% 加成，共計獲取 ${finalRewardGold}！`, type: 'system', sHp, nHp });
          }

          const netWins = newWins - newLosses;
          if (netWins > 0 && netWins % 5 === 0) {
            const pool = ['combat', 'endurance', 'intelligence', 'charisma', 'luck'] as const;
            const picked = pool[Math.floor(Math.random() * pool.length)];
            slave.primaryStats[picked] = Math.min(100, (slave.primaryStats[picked] ?? 10) + 1);
            const nameMap = { combat: '武力', endurance: '體質', intelligence: '智力', charisma: '魅力', luck: '幸運' };
            logs.push({ round: round - 1, message: `歷練突破！${slave.name} 累積淨勝場達 ${netWins} 場，【${nameMap[picked]}】永久提升 1 點！`, type: 'skill', sHp, nHp });
          }
        } else {
          newLosses++;
          newStamina = 0; 
          isInjuredNow = true; 
          logs.push({ round: round - 1, message: `［結算］${slave.name} 不支倒地，被深淵無情吞噬並陷入【負傷】狀態！`, type: 'system', sHp, nHp });
        }

        set((s) => ({ player: { ...s.player, actionPoints: s.player.actionPoints - 1 } }));
        let newStress = slave.conditionStats.stress; let newRebellion = slave.conditionStats.rebellion;
        if (slave.race !== '不死族') {
          newStress = Math.min(100, newStress + (isWin ? 10 : 25)); newRebellion = Math.min(100, newRebellion + (isWin ? 5 : 15));
          if (slave.race === '人類' && isWin) newStress = Math.max(0, newStress - (round * 2));
          if (slave.race === '龍族' && newStamina < 30) newRebellion = Math.min(100, newRebellion + 20);
        }

        get().updateSlave(slave.id, { combatRecord: { wins: newWins, losses: newLosses }, isInjured: isInjuredNow, conditionStats: { stamina: newStamina, stress: newStress, rebellion: newRebellion }, primaryStats: slave.primaryStats });
        
        const playbackData: CombatPlaybackData = {
           slaveId: slave.id, slaveName: slave.name, slaveMaxHp: sHpMax,
           npcName: enemy.name, npcMaxHp: nHpMax, logs, isWin,
           rewardGold: isWin ? enemy.rewardGold : 0, rewardPrestige: isWin ? enemy.rewardPrestige : 0, isAbyss: true
        };
        set({ activeCombat: playbackData });

        get().processTurn(); get().syncProfileToCloud(); return { logs, isWin };
      }
    }),
    { 
      name: 'dark-fantasy-save-v18', 
      storage: createJSONStorage(() => storage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }
      }
    }
  )
);
