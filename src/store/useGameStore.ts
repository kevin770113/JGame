import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import localforage from 'localforage';
import { Slave, Player, Location, TimePhase, Race, Gender, Scene, SubView, ArenaNPC, CombatLog, ActiveWindow } from '../types';
import { GAME_CONSTANTS } from '../utils/constants';
import { fetchIdentityBatch } from '../services/aiService';
import { supabase } from '../services/supabaseClient';
import { ITEMS_DATA, HEROES_DATA, QUESTS_DATA } from '../utils/gameData';

export interface Mission {
  id: string; title: string; rank: '黃金' | '紫色' | '蔚藍' | '翠綠';
  requiredPhases: number; staminaCost: number; stressGain: number; reward: number; description: string;
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
  title: string;
  message: string;
  isConfirm: boolean;
  action?: () => void;
}

export const ARENA_NPCS: ArenaNPC[] = [
  { id: 'npc-1', location: 'Frontlines', name: '地下狂徒', description: '滿身泥濘與血污的亡命之徒，毫無技巧可言。', stats: { hp: 300, attack: 25, defense: 10, speed: 15 }, rewardGold: 800, rewardPrestige: 0 },
  { id: 'npc-2', location: 'NeutralHub', name: '鐵血角鬥士', description: '公會重金培育的職業鬥士，裝備精良且受過專業訓練。', stats: { hp: 800, attack: 55, defense: 35, speed: 40 }, rewardGold: 2500, rewardPrestige: 10 },
  { id: 'npc-3', location: 'Capital', name: '皇家處刑者', description: '帝國皇室的殺人機器，專門用來粉碎挑戰者的絕望。', stats: { hp: 2000, attack: 110, defense: 60, speed: 70 }, rewardGold: 6000, rewardPrestige: 50 }
];

export const getAbyssEnemy = (floor: number) => {
  const boss = HEROES_DATA.find(h => h.floor === floor);
  const multiplier = 1 + (floor - 1) * 0.05;
  if (boss) {
    return {
      name: boss.name, quote: boss.quote,
      stats: { hp: Math.floor(boss.stats.hp * multiplier), attack: Math.floor(boss.stats.attack * multiplier), defense: Math.floor(boss.stats.defense * multiplier), speed: Math.floor(boss.stats.speed * multiplier) },
      rewardGold: boss.rewardGold, rewardPrestige: boss.rewardPrestige, isBoss: true
    };
  }
  const baseHp = 400; const baseAtk = 35; const baseDef = 15; const baseSpd = 20;
  return {
    name: `深淵衛士 (第 ${floor} 階)`, quote: '……（空洞的盔甲發出低沉的摩擦聲）',
    stats: { hp: Math.floor(baseHp * multiplier), attack: Math.floor(baseAtk * multiplier), defense: Math.floor(baseDef * multiplier), speed: Math.floor(baseSpd * multiplier) },
    rewardGold: 500 + floor * 150, rewardPrestige: Math.floor(floor / 2), isBoss: false
  };
};

export interface GameStore {
  player: Player & { shopStock: Record<string, number> }; 
  slaves: Slave[];
  marketSlaves: Slave[];
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
  _hasHydrated: boolean; // ★ V2.4 水合鎖狀態

  setActiveWindow: (win: ActiveWindow | null) => void;
  setGlobalModal: (modal: GlobalModal | null) => void;
  setIsSaving: (val: boolean) => void; 
  setHasHydrated: (val: boolean) => void; // ★ V2.4 觸發水合解鎖
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

  for (let i = 0; i < Math.floor(Math.random() * 2) + 3; i++) missions.push({ id: `m-grn-${baseId}-${i}`, title: `［常規］${getName()}`, rank: '翠綠', requiredPhases: 1, staminaCost: 20, stressGain: 10, reward: 300 + Math.floor(Math.random() * 100), description: '骯髒的體力活。' });
  for (let i = 0; i < Math.floor(Math.random() * 2) + 1; i++) missions.push({ id: `m-blu-${baseId}-${i}`, title: `［進階］${getName()}`, rank: '蔚藍', requiredPhases: 2, staminaCost: 45, stressGain: 25, reward: 800 + Math.floor(Math.random() * 200), description: '危險差事。' });
  if (Math.random() > 0.7) missions.push({ id: `m-pur-${baseId}`, title: `［特化］${getName()}`, rank: '紫色', requiredPhases: 2, staminaCost: 50, stressGain: 30, reward: 1200 + Math.floor(Math.random() * 300), description: '極高機率獲得威望或技能突破。' });
  if (Math.random() > 0.8) missions.push({ id: `m-gld-${baseId}`, title: `［傳說］${getName()}`, rank: '黃金', requiredPhases: 5, staminaCost: 90, stressGain: 60, reward: 3500 + Math.floor(Math.random() * 1500), description: '死亡委託。' });
  return missions;
};

const generateBaseMarketSlave = (idSuffix: string, identity: {name: string, story: string}): Slave => {
  const races: Race[] = ['人類', '精靈', '半獸人', '矮人', '不死族', '龍族'];
  const race = races[Math.floor(Math.random() * races.length)];
  const gender: Gender = Math.random() > 0.5 ? 'Male' : 'Female';
  return {
    id: `market-${Date.now()}-${idSuffix}`, name: identity.name, race, gender, activityStatus: '閒置',
    skills: { combat: 1, housework: 1, survival: 1 },
    primaryStats: { combat: Math.floor(Math.random() * 60) + 20, endurance: Math.floor(Math.random() * 60) + 20, intelligence: Math.floor(Math.random() * 60) + 20, obedience: Math.floor(Math.random() * 40) + 10 },
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
      currentScene: 'Home', currentSubView: 'Main', dailyMissions: generateDailyMissions(), activeDispatches: [], slaves: [], marketSlaves: [], isMarketGenerating: false, isPoolGenerating: false,
      activeEvent: null, globalModal: null, activeWindow: null, isSaving: false, localSaveVersion: 0, _hasHydrated: false,

      setActiveWindow: (win) => set({ activeWindow: win }),
      setGlobalModal: (modal) => set({ globalModal: modal }),
      setIsSaving: (val) => set({ isSaving: val }),
      setHasHydrated: (val) => set({ _hasHydrated: val }),

      triggerQuest: (questId) => set(state => {
        if (!state.player.quests[questId]) {
           const newQuests = { ...state.player.quests, [questId]: 'active' as const };
           const qData = QUESTS_DATA[questId as keyof typeof QUESTS_DATA];
           setTimeout(() => {
             get().syncProfileToCloud();
             if (qData) {
               get().setGlobalModal({
                 title: '［⚡ 發現新劇情任務解鎖］',
                 message: `${qData.title}\n\n任務目標：${qData.description}`,
                 isConfirm: false
               });
             }
           }, 100); 
           return { player: { ...state.player, quests: newQuests } };
        }
        return state;
      }),

      checkQuestCompletion: () => {
         const state = get(); let updated = false; const newQuests = { ...state.player.quests }; let title = ''; let msg = ''; let addG = 0;
         
         if (newQuests['q_first_blood'] === 'active' && state.slaves.length > 0) { 
            newQuests['q_first_blood'] = 'completed'; addG = 2000; updated = true;
            title = '［任務達成］【深淵的初啼】'; msg = `成功簽署第一份血脈契約！商會基礎雛形已然確立。\n\n獲得報酬：\n資金 +2,000`;
         }
         else if (newQuests['q_first_fusion'] === 'active' && state.slaves.some(s => s.parents)) { 
            newQuests['q_first_fusion'] = 'completed'; addG = 1500; updated = true;
            title = '［任務達成］【禁忌的鍊金術】'; msg = `成功在血統密室中編織融合出全新的生命血脈！\n\n獲得報酬：\n資金 +1,500`;
         }
         else if (newQuests['q_enter_hub'] === 'active' && (state.player.location === 'NeutralHub' || state.player.location === 'Capital')) { 
            newQuests['q_enter_hub'] = 'completed'; addG = 5000; updated = true;
            title = '［任務達成］【踏入灰色地帶】'; msg = `成功突破混亂前線，向核心城區拔營挺進！\n\n獲得報酬：\n資金 +5,000`;
         }

         if (updated) {
            set({ player: { ...state.player, quests: newQuests, gold: state.player.gold + addG } });
            get().setGlobalModal({ title, message: msg, isConfirm: false });
            get().syncProfileToCloud();
         }
      },

      // ★ V2.4 寫入版號防護網
      syncProfileToCloud: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        set({ isSaving: true });
        
        // 每次存檔時，本地版號 +1
        const newVersion = (get().localSaveVersion || 0) + 1;
        set({ localSaveVersion: newVersion });

        const state = get(); const p = state.player;
        const { error } = await supabase.from('profiles').upsert({
          id: session.user.id, day: p.day, gold: p.gold, food: p.food, action_points: p.actionPoints, prestige: p.prestige, unlocked_facilities: p.unlockedFacilities,
          save_data: { localSaveVersion: newVersion, usedIdentityIds: p.usedIdentityIds, inventory: p.inventory, quests: p.quests, abyssFloor: p.abyssFloor, shopStock: p.shopStock, slaves: state.slaves, marketSlaves: state.marketSlaves, activeDispatches: state.activeDispatches, activeEvent: state.activeEvent }
        });
        
        if (error) console.error('［同步異常］', error);
        set({ isSaving: false });
      },

      // ★ V2.4 拔除版號 0 陷阱，絕對信任本地
      loadProfileFromCloud: async (forceLoad = false) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (error || !data) return;
        const sData = data.save_data || {};

        const cloudVersion = sData.localSaveVersion || 0;
        const currentLocalVersion = get().localSaveVersion || 0;

        // 若不是玩家按下的強制讀取，只要雲端版號沒有「嚴格大於」本地版號，就絕對信任本地並攔截！
        if (!forceLoad && cloudVersion <= currentLocalVersion) {
           console.log(`［防禦網啟動］雲端版號 (v${cloudVersion}) <= 本地版號 (v${currentLocalVersion})，絕對信任本地資料，攔截覆蓋。`);
           return; 
        }

        set((state) => ({
          localSaveVersion: cloudVersion,
          player: { ...state.player, day: data.day ?? state.player.day, gold: data.gold ?? state.player.gold, food: data.food ?? state.player.food, actionPoints: data.action_points ?? state.player.actionPoints, prestige: data.prestige ?? state.player.prestige, unlockedFacilities: data.unlocked_facilities || state.player.unlockedFacilities, usedIdentityIds: sData.usedIdentityIds || state.player.usedIdentityIds, inventory: sData.inventory || state.player.inventory, quests: sData.quests || state.player.quests, abyssFloor: sData.abyssFloor || state.player.abyssFloor, shopStock: sData.shopStock || state.player.shopStock },
          slaves: sData.slaves || state.slaves, marketSlaves: sData.marketSlaves || state.marketSlaves, activeDispatches: sData.activeDispatches || state.activeDispatches, activeEvent: sData.activeEvent || state.activeEvent
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
            return { player: { ...state.player, inventory: newInv }, slaves: state.slaves.map(s => s.id === slaveId ? { ...s, equipment: { weaponId: itemId } } : s) };
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
          console.error("［系統攔截］", e); return { name: "罪業之軀", story: "［檔案毀損］來自深淵的亂碼碎片。" };
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

        const overpopulation = Math.max(0, slaves.length - player.maxSlaveCapacity);
        const newDirtiness = Math.min(100, player.roomDirtiness + Math.ceil(slaves.length * (player.location === 'Capital' ? 1 : player.location === 'NeutralHub' ? 1.5 : 2)) + Math.pow(overpopulation, 2) * 5);
        
        let newShopStock = { ...player.shopStock };
        if (triggerDailySettlement) { newShopStock = { ...DEFAULT_SHOP_STOCK }; }

        set({ player: { ...player, day: nextDay, timePhase: nextPhase, roomDirtiness: newDirtiness, actionPoints: newAp, lastApUpdateTime: newApUpdateTime, shopStock: newShopStock } });

        const newDispatches: ActiveDispatch[] = []; let earnedGold = 0; let earnedPrestige = 0;
        let dispatchLogs: string[] = [];

        activeDispatches.forEach(dispatch => {
          dispatch.remainingPhases -= 1;
          if (dispatch.remainingPhases <= 0) {
            let baseReward = dispatch.mission.reward;
            const slave = get().slaves.find(s => s.id === dispatch.slaveId);
            if (slave) {
               const successChance = slave.primaryStats.intelligence / 200;
               if (Math.random() < successChance) {
                  baseReward = Math.floor(baseReward * 1.5);
                  dispatchLogs.push(`［⚡ 外派大成功］${slave.name} 憑藉卓越智力完美規避風險，帶回了額外 1.5 倍收益！`);
               }
               earnedGold += baseReward;

               let updatedSkills = { ...slave.skills };
               if (dispatch.mission.rank === '紫色') {
                 if (Math.random() > 0.5) earnedPrestige += Math.floor(Math.random() * 20) + 10;
                 else { const keys = ['combat', 'housework', 'survival'] as const; const k = keys[Math.floor(Math.random() * keys.length)]; if (updatedSkills[k] < 10) updatedSkills[k] += 1; }
               }
               get().updateSlave(slave.id, { activityStatus: '閒置', skills: updatedSkills, conditionStats: { ...slave.conditionStats, stamina: Math.max(0, slave.conditionStats.stamina - Math.max(10, dispatch.mission.staminaCost - (slave.skills.combat * 2))), stress: Math.min(100, slave.conditionStats.stress + dispatch.mission.stressGain) } });
            }
          } else { newDispatches.push(dispatch); }
        });

        if (earnedGold > 0) get().addGold(earnedGold); if (earnedPrestige > 0) get().addPrestige(earnedPrestige);
        set({ activeDispatches: newDispatches });

        if (triggerDailySettlement) {
          const foodNeeded = slaves.length * GAME_CONSTANTS.FOOD_CONSUMPTION_PER_SLAVE; let isStarving = false;
          if (get().player.food >= foodNeeded) get().deductFood(foodNeeded); else { get().deductFood(get().player.food); isStarving = true; }

          let desertedNames: string[] = [];
          let totalStolenGold = 0;
          let totalPrestigeLoss = 0;

          slaves.forEach(slave => {
            let currentIsInjured = slave.isInjured;
            if (currentIsInjured && slave.conditionStats.stamina >= 100) { currentIsInjured = false; }

            let newStamina = slave.conditionStats.stamina; let newStress = slave.conditionStats.stress; let newRebellion = slave.conditionStats.rebellion;
            if (isStarving) { newStress = Math.min(100, newStress + 20); newRebellion = Math.min(100, newRebellion + 10); } else {
              if (slave.activityStatus === '閒置') { newStamina = Math.min(100, newStamina + (newDirtiness > 50 ? 10 : 30)); if (overpopulation === 0) newStress = Math.max(0, newStress - 5); }
              if (newDirtiness > 80) { newStress = Math.min(100, newStress + 20); const rebGain = Math.max(1, 15 - Math.floor(slave.primaryStats.obedience / 10)); newRebellion = Math.min(100, newRebellion + rebGain); }
              if (overpopulation > 0) { newStress = Math.min(100, newStress + (overpopulation * 5)); const rebGain = Math.max(1, 3 - Math.floor(slave.primaryStats.obedience / 20)); newRebellion = Math.min(100, newRebellion + rebGain); }
            }

            if (newRebellion >= 100) {
               desertedNames.push(slave.name);
               totalStolenGold += Math.floor(Math.random() * 1500) + 500;
               totalPrestigeLoss += Math.floor(Math.random() * 20) + 10;
            } else {
               get().updateSlave(slave.id, { isInjured: currentIsInjured, conditionStats: { stamina: newStamina, stress: newStress, rebellion: newRebellion } });
            }
          });

          if (desertedNames.length > 0) {
             const actualStolen = Math.min(get().player.gold, totalStolenGold);
             const actualPrestigeLoss = Math.min(get().player.prestige, totalPrestigeLoss);
             set(s => ({ slaves: s.slaves.filter(sl => !desertedNames.includes(sl.name)), player: { ...s.player, gold: Math.max(0, s.player.gold - actualStolen), prestige: Math.max(0, s.player.prestige - actualPrestigeLoss) } }));
             setTimeout(() => { get().setGlobalModal({ title: '［⚠️ 據點突發事件：試驗體叛逃］', message: `因反抗心高漲至極限，以下成員已於深夜趁亂切斷枷鎖逃離據點：\n\n【${desertedNames.join('】、【')}】\n\n逃跑時他們洗劫了商會庫房，共計損失資金：$${actualStolen}，商會威望降低了 ${actualPrestigeLoss} 點。`, isConfirm: false }); }, 200);
          }

          if (dispatchLogs.length > 0 && desertedNames.length === 0) { setTimeout(() => { get().setGlobalModal({ title: '［外派成果回報］', message: dispatchLogs.join('\n'), isConfirm: false }); }, 250); }

          let nextEvent = null;
          if (get().player.location === 'NeutralHub' && Math.random() < 0.4) { nextEvent = { id: 'evt1', type: 'merchant', desc: '【地頭蛇老張】急需一名服從度達 60 的女性半獸人。', reqRace: '半獸人', reqGender: 'Female', reqStat: { key: 'obedience', val: 60 }, reward: { gold: 12000, prestige: 20, item: 'potion_heal_small' } } as const; } 
          else if (get().player.location === 'Capital' && Math.random() < 0.3) { nextEvent = { id: 'evt2', type: 'noble', desc: '【腥紅伯爵】徵求武力達 80 的精靈，願以精鋼長劍交換。', reqRace: '精靈', reqStat: { key: 'combat', val: 80 }, reward: { gold: 35000, prestige: 100, item: 'weapon_iron_sword' } } as const; }

          triggerBackgroundMarketRefresh(); 
          set({ dailyMissions: generateDailyMissions(), activeEvent: nextEvent });
        }
        get().syncProfileToCloud();
      },

      executeArenaBattle: (slaveId, npcId) => {
        const state = get(); const slave = state.slaves.find(s => s.id === slaveId); const npc = ARENA_NPCS.find(n => n.id === npcId);
        if (!slave || !npc || state.player.actionPoints < 1) return null;

        const logs: CombatLog[] = []; logs.push({ round: 0, message: `［系統］${slave.name} 踏入賽場，迎戰 ${npc.name}。`, type: 'system' });

        if (slave.race === '精靈') logs.push({ round: 0, message: `［風之眷顧］${slave.name} 身形如風奪得先手，首擊傷害大幅增幅！`, type: 'skill' });
        if (slave.race === '半獸人') logs.push({ round: 0, message: `［狂熱戰血］${slave.name} 點燃了怒火，放棄防禦以換取更具破壞力的重擊！`, type: 'skill' });
        if (slave.race === '矮人') logs.push({ round: 0, message: `［堅岩體魄］${slave.name} 展現了北地體格，肌肉宛如磐石般堅不可摧！`, type: 'skill' });
        if (slave.race === '龍族') logs.push({ round: 0, message: `［真龍威壓］${slave.name} 釋放了上位威壓，全屬性增幅並獲得巨額減傷！`, type: 'skill' });
        if (slave.race === '人類') logs.push({ round: 0, message: `［絕境意志］${slave.name} 懷抱求生潛能，瀕死狀態下攻擊力將大幅爆發。`, type: 'skill' });
        if (slave.race === '不死族') logs.push({ round: 0, message: `［枯骨不朽］${slave.name} 散發著死氣，其攻擊能精準汲取敵人的生命力。`, type: 'skill' });

        let weaponAtk = 0; if (slave.equipment?.weaponId && ITEMS_DATA[slave.equipment.weaponId]) weaponAtk = ITEMS_DATA[slave.equipment.weaponId].effect.attack || 0;

        let sHpMax = Math.floor(slave.primaryStats.endurance * 5); let sHp = Math.floor(sHpMax * (slave.conditionStats.stamina / 100));
        let sAtk = slave.primaryStats.combat + weaponAtk; let sDef = Math.floor(slave.primaryStats.endurance * 0.5 + slave.skills.survival * 2); let sSpd = slave.primaryStats.intelligence;
        let sDmgMulti = 1 + (slave.skills.combat * 0.05); let sDmgReduc = slave.skills.combat * 0.03;

        if (slave.race === '精靈') sSpd = Math.floor(sSpd * 1.2);
        if (slave.race === '半獸人') { sAtk = Math.floor(sAtk * 1.15); sDef = Math.floor(sDef * 0.9); }
        if (slave.race === '矮人') { sHpMax = Math.floor(sHpMax * 1.2); sHp = Math.floor(sHp * 1.2); sDef = Math.floor(sDef * 1.15); }
        if (slave.race === '龍族') { sAtk = Math.floor(sAtk * 1.1); sDef = Math.floor(sDef * 1.1); sSpd = Math.floor(sSpd * 1.1); sDmgReduc += 0.2; }

        let nHp = npc.stats.hp; const nAtk = npc.stats.attack; const nDef = npc.stats.defense; const nSpd = npc.stats.speed;
        let round = 1; let orcStack = 0; let humanUnstoppable = false;

        while (sHp > 0 && nHp > 0 && round <= 50) {
          const isSlaveFirst = sSpd >= nSpd;
          const slaveAction = () => {
            if (sHp <= 0) return; let atkPower = sAtk; let dmgMulti = sDmgMulti;
            if (slave.race === '人類' && sHp < sHpMax * 0.4 && !humanUnstoppable) { humanUnstoppable = true; logs.push({ round, message: `［絕境意志］${slave.name} 爆發強烈的求生欲，攻擊力極大幅提升！`, type: 'skill' }); }
            if (humanUnstoppable) atkPower = Math.floor(atkPower * 1.25);
            if (slave.race === '精靈' && isSlaveFirst) dmgMulti += 0.15;
            if (slave.race === '半獸人') dmgMulti += Math.min(0.3, orcStack * 0.03);
            let dmg = Math.floor(Math.max(1, atkPower - nDef) * dmgMulti); nHp -= dmg;
            logs.push({ round, message: `${slave.name} 發動攻擊，對 ${npc.name} 造成 ${dmg} 點傷害。`, type: 'damage' });
            if (slave.race === '不死族') { const heal = Math.floor(dmg * 0.15); if (heal > 0) { sHp = Math.min(sHpMax, sHp + heal); logs.push({ round, message: `［枯骨不朽］${slave.name} 吸收了 ${heal} 點生命力。`, type: 'heal' }); } }
          };
          const npcAction = () => {
            if (nHp <= 0) return; let dmg = Math.max(1, nAtk - sDef); 
            if (slave.race === '矮人') { dmg = Math.max(1, dmg - 5); logs.push({ round, message: `［天賦防禦］${slave.name} 的【堅岩體魄】使其硬生生抵擋並折抵了 5 點致命傷害！`, type: 'skill' }); }
            dmg = Math.floor(dmg * (1 - sDmgReduc)); sHp -= dmg; logs.push({ round, message: `${npc.name} 揮舞武器，對 ${slave.name} 造成 ${dmg} 點傷害。`, type: 'damage' });
            if (slave.race === '半獸人') { orcStack++; logs.push({ round, message: `［天賦狂暴］${slave.name} 的【狂熱戰血】受到痛覺刺激，怒氣加劇（當前層數: ${orcStack}，額外增傷: +${Math.min(30, orcStack * 3)}%）！`, type: 'skill' }); }
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
          logs.push({ round: round - 1, message: `［結算］${slave.name} 屹立到了最後，取得勝利。`, type: 'system' });
          get().addGold(npc.rewardGold); if (npc.rewardPrestige > 0) get().addPrestige(npc.rewardPrestige);

          const netWins = newWins - newLosses;
          if (netWins > 0 && netWins % 5 === 0) {
            const pool = ['combat', 'endurance', 'intelligence'] as const;
            const picked = pool[Math.floor(Math.random() * pool.length)];
            slave.primaryStats[picked] = Math.min(100, slave.primaryStats[picked] + 1);
            const nameMap = { combat: '武力', endurance: '體質', intelligence: '智力' };
            logs.push({ round: round - 1, message: `⚡ 歷練突破！${slave.name} 累積淨勝場達 ${netWins} 場，【${nameMap[picked]}】永久提升 1 點！`, type: 'skill' });
          }
        } else {
          newLosses++;
          newStamina = 0; 
          isInjuredNow = true; 
          logs.push({ round: round - 1, message: `［結算］${slave.name} 遭受重創倒地，體力徹底耗盡並陷入【負傷】狀態！`, type: 'system' });
        }

        set((s) => ({ player: { ...s.player, actionPoints: s.player.actionPoints - 1 } }));
        let newStress = slave.conditionStats.stress; let newRebellion = slave.conditionStats.rebellion;
        if (slave.race !== '不死族') {
          newStress = Math.min(100, newStress + (isWin ? 5 : 15)); newRebellion = Math.min(100, newRebellion + (isWin ? 2 : 10));
          if (slave.race === '人類' && isWin) newStress = Math.max(0, newStress - (round * 2));
          if (slave.race === '龍族' && newStamina < 30) newRebellion = Math.min(100, newRebellion + 20);
        }

        get().updateSlave(slave.id, { combatRecord: { wins: newWins, losses: newLosses }, isInjured: isInjuredNow, conditionStats: { stamina: newStamina, stress: newStress, rebellion: newRebellion }, primaryStats: slave.primaryStats });
        get().processTurn(); get().syncProfileToCloud(); return { logs, isWin };
      },

      executeAbyssBattle: (slaveId) => {
        const state = get(); const slave = state.slaves.find(s => s.id === slaveId);
        if (!slave || state.player.actionPoints < 1) return null;

        const floor = state.player.abyssFloor; const enemy = getAbyssEnemy(floor);
        const logs: CombatLog[] = [];

        logs.push({ round: 0, message: `［系統］${slave.name} 踏入深淵第 ${floor} 階，迎戰 ${enemy.name}。`, type: 'system' });
        logs.push({ round: 0, message: `「${enemy.quote}」`, type: 'system' });

        if (slave.race === '精靈') logs.push({ round: 0, message: `［風之眷顧］${slave.name} 身形如風奪得先手，首擊傷害大幅增幅！`, type: 'skill' });
        if (slave.race === '半獸人') logs.push({ round: 0, message: `［狂熱戰血］${slave.name} 點燃了怒火，放棄防禦以換取更具破壞力的重擊！`, type: 'skill' });
        if (slave.race === '矮人') logs.push({ round: 0, message: `［堅岩體魄］${slave.name} 展現了北地體格，肌肉宛如磐石般堅不可摧！`, type: 'skill' });
        if (slave.race === '龍族') logs.push({ round: 0, message: `［真龍威壓］${slave.name} 釋放了上位威壓，全屬性增幅並獲得巨額減傷！`, type: 'skill' });
        if (slave.race === '人類') logs.push({ round: 0, message: `［絕境意志］${slave.name} 懷抱求生潛能，瀕死狀態下攻擊力將大幅爆發。`, type: 'skill' });
        if (slave.race === '不死族') logs.push({ round: 0, message: `［枯骨不朽］${slave.name} 散發著死氣，其攻擊能精準汲取敵人的生命力。`, type: 'skill' });

        let weaponAtk = 0; if (slave.equipment?.weaponId && ITEMS_DATA[slave.equipment.weaponId]) weaponAtk = ITEMS_DATA[slave.equipment.weaponId].effect.attack || 0;

        let sHpMax = Math.floor(slave.primaryStats.endurance * 5); let sHp = Math.floor(sHpMax * (slave.conditionStats.stamina / 100));
        let sAtk = slave.primaryStats.combat + weaponAtk; let sDef = Math.floor(slave.primaryStats.endurance * 0.5 + slave.skills.survival * 2); let sSpd = slave.primaryStats.intelligence;
        let sDmgMulti = 1 + (slave.skills.combat * 0.05); let sDmgReduc = slave.skills.combat * 0.03;

        if (slave.race === '精靈') sSpd = Math.floor(sSpd * 1.2);
        if (slave.race === '半獸人') { sAtk = Math.floor(sAtk * 1.15); sDef = Math.floor(sDef * 0.9); }
        if (slave.race === '矮人') { sHpMax = Math.floor(sHpMax * 1.2); sHp = Math.floor(sHp * 1.2); sDef = Math.floor(sDef * 1.15); }
        if (slave.race === '龍族') { sAtk = Math.floor(sAtk * 1.1); sDef = Math.floor(sDef * 1.1); sSpd = Math.floor(sSpd * 1.1); sDmgReduc += 0.2; }

        let nHp = enemy.stats.hp; const nAtk = enemy.stats.attack; const nDef = enemy.stats.defense; const nSpd = enemy.stats.speed;
        let round = 1; let orcStack = 0; let humanUnstoppable = false;

        while (sHp > 0 && nHp > 0 && round <= 50) {
          const isSlaveFirst = sSpd >= nSpd;
          const slaveAction = () => {
            if (sHp <= 0) return; let atkPower = sAtk; let dmgMulti = sDmgMulti;
            if (slave.race === '人類' && sHp < sHpMax * 0.4 && !humanUnstoppable) { humanUnstoppable = true; logs.push({ round, message: `［絕境意志］${slave.name} 爆發強烈的求生欲，攻擊力極大幅提升！`, type: 'skill' }); }
            if (humanUnstoppable) atkPower = Math.floor(atkPower * 1.25);
            if (slave.race === '精靈' && isSlaveFirst) dmgMulti += 0.15;
            if (slave.race === '半獸人') dmgMulti += Math.min(0.3, orcStack * 0.03);
            let dmg = Math.floor(Math.max(1, atkPower - nDef) * dmgMulti); nHp -= dmg;
            logs.push({ round, message: `${slave.name} 發動攻擊，對 ${enemy.name} 造成 ${dmg} 點傷害。`, type: 'damage' });
            if (slave.race === '不死族') { const heal = Math.floor(dmg * 0.15); if (heal > 0) { sHp = Math.min(sHpMax, sHp + heal); logs.push({ round, message: `［枯骨不朽］${slave.name} 吸收了 ${heal} 點生命力。`, type: 'heal' }); } }
          };
          const npcAction = () => {
            if (nHp <= 0) return; let dmg = Math.max(1, nAtk - sDef); 
            if (slave.race === '矮人') { dmg = Math.max(1, dmg - 5); logs.push({ round, message: `［天賦防禦］${slave.name} 的【堅岩體魄】使其硬生生抵擋並折抵了 5 點致命傷害！`, type: 'skill' }); }
            dmg = Math.floor(dmg * (1 - sDmgReduc)); sHp -= dmg; logs.push({ round, message: `${enemy.name} 揮舞武器，對 ${slave.name} 造成 ${dmg} 點傷害.`, type: 'damage' });
            if (slave.race === '半獸人') { orcStack++; logs.push({ round, message: `［天賦層數］${slave.name} 承受攻擊，痛苦激發狂暴，傷害額外提升！`, type: 'skill' }); }
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
          logs.push({ round: round - 1, message: `［結算］${slave.name} 擊潰了深淵的阻礙，成功晉級！`, type: 'system' });
          get().addGold(enemy.rewardGold); if (enemy.rewardPrestige > 0) get().addPrestige(enemy.rewardPrestige);
          set((s) => ({ player: { ...s.player, abyssFloor: s.player.abyssFloor + 1 } }));

          const netWins = newWins - newLosses;
          if (netWins > 0 && netWins % 5 === 0) {
            const pool = ['combat', 'endurance', 'intelligence'] as const;
            const picked = pool[Math.floor(Math.random() * pool.length)];
            slave.primaryStats[picked] = Math.min(100, slave.primaryStats[picked] + 1);
            const nameMap = { combat: '武力', endurance: '體質', intelligence: '智力' };
            logs.push({ round: round - 1, message: `⚡ 歷練突破！${slave.name} 累積淨勝場達 ${netWins} 場，【${nameMap[picked]}】永久提升 1 點！`, type: 'skill' });
          }
        } else {
          newLosses++;
          newStamina = 0; 
          isInjuredNow = true; 
          logs.push({ round: round - 1, message: `［結算］${slave.name} 不支倒地，被深淵無情吞噬並陷入【負傷】狀態！`, type: 'system' });
        }

        set((s) => ({ player: { ...s.player, actionPoints: s.player.actionPoints - 1 } }));
        let newStress = slave.conditionStats.stress; let newRebellion = slave.conditionStats.rebellion;
        if (slave.race !== '不死族') {
          newStress = Math.min(100, newStress + (isWin ? 10 : 25)); newRebellion = Math.min(100, newRebellion + (isWin ? 5 : 15));
          if (slave.race === '人類' && isWin) newStress = Math.max(0, newStress - (round * 2));
          if (slave.race === '龍族' && newStamina < 30) newRebellion = Math.min(100, newRebellion + 20);
        }

        get().updateSlave(slave.id, { combatRecord: { wins: newWins, losses: newLosses }, isInjured: isInjuredNow, conditionStats: { stamina: newStamina, stress: newStress, rebellion: newRebellion }, primaryStats: slave.primaryStats });
        get().processTurn(); get().syncProfileToCloud(); return { logs, isWin };
      }
    }),
    { 
      name: 'dark-fantasy-save-v18', 
      storage: createJSONStorage(() => storage),
      // ★ V2.4 水合鎖防護：本地 IndexedDB 讀取完畢後解開 _hasHydrated 鎖
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }
      }
    }
  )
);
