import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import localforage from 'localforage';
import { Slave, Player, Location, TimePhase, Race, Gender, Scene, SubView, ArenaNPC, CombatLog } from '../types';
import { GAME_CONSTANTS } from '../utils/constants';
import { fetchIdentityBatch, IdentityRecord } from '../services/aiService';
import { supabase } from '../services/supabaseClient';

export interface Mission {
  id: string; title: string; rank: '黃金' | '紫色' | '蔚藍' | '翠綠';
  requiredPhases: number; staminaCost: number; stressGain: number; reward: number; description: string;
}

export interface ActiveDispatch {
  slaveId: string; mission: Mission; remainingPhases: number;
}

export const ARENA_NPCS: ArenaNPC[] = [
  { id: 'npc-1', location: 'Frontlines', name: '地下狂徒', description: '滿身泥濘與血污的亡命之徒，毫無技巧可言。', stats: { hp: 300, attack: 25, defense: 10, speed: 15 }, rewardGold: 800, rewardPrestige: 0 },
  { id: 'npc-2', location: 'NeutralHub', name: '鐵血角鬥士', description: '公會重金培育的職業鬥士，裝備精良且受過專業訓練。', stats: { hp: 800, attack: 55, defense: 35, speed: 40 }, rewardGold: 2500, rewardPrestige: 10 },
  { id: 'npc-3', location: 'Capital', name: '皇家處刑者', description: '帝國皇室的殺人機器，專門用來粉碎挑戰者的絕望。', stats: { hp: 2000, attack: 110, defense: 60, speed: 70 }, rewardGold: 6000, rewardPrestige: 50 }
];

export interface GameStore {
  player: Player;
  slaves: Slave[];
  marketSlaves: Slave[];
  isMarketGenerating: boolean;
  isPoolGenerating: boolean;
  currentScene: Scene;
  currentSubView: SubView;
  dailyMissions: Mission[];
  activeDispatches: ActiveDispatch[];

  // ［新增］與雲端連線的函數
  syncProfileToCloud: () => Promise<void>;
  consumeIdentity: () => Promise<IdentityRecord>;
  
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

const generateBaseMarketSlave = (idSuffix: string, identity: IdentityRecord): Slave => {
  const races: Race[] = ['人類', '精靈', '半獸人', '矮人', '不死族', '龍族'];
  const race = races[Math.floor(Math.random() * races.length)];
  const gender: Gender = Math.random() > 0.5 ? 'Male' : 'Female';
  return {
    id: `market-${Date.now()}-${idSuffix}`, name: identity.name, race, gender, activityStatus: '閒置',
    skills: { combat: 1, housework: 1, survival: 1 },
    primaryStats: { combat: Math.floor(Math.random() * 60) + 20, endurance: Math.floor(Math.random() * 60) + 20, intelligence: Math.floor(Math.random() * 60) + 20, obedience: Math.floor(Math.random() * 40) + 10 },
    conditionStats: { stamina: 100, stress: 0, rebellion: Math.floor(Math.random() * 20) },
    traits: [], backgroundStory: identity.story
  };
};

const storage: StateStorage = {
  getItem: async (name) => (await localforage.getItem(name)) || null,
  setItem: async (name, value) => { await localforage.setItem(name, value); },
  removeItem: async (name) => { await localforage.removeItem(name); },
};

const TIME_PHASES: TimePhase[] = ['早上', '中午', '下午', '晚上', '深夜'];

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      player: { 
        day: 1, timePhase: '早上', gold: 99999, food: 120, location: 'Frontlines', roomDirtiness: 0, maxSlaveCapacity: 5, prestige: 9999, actionPoints: 50, lastApUpdateTime: Date.now(),
        deviceId: '', unlockedFacilities: [], 
        usedIdentityIds: [] // ★ v11 新增欄位
      },
      currentScene: 'Home', currentSubView: 'Main', dailyMissions: generateDailyMissions(), activeDispatches: [], slaves: [], marketSlaves: [], isMarketGenerating: false, isPoolGenerating: false,

      // ★ 新增：非同步備份玩家重要資源到 Supabase
      syncProfileToCloud: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const p = get().player;
        await supabase.from('profiles').upsert({
          id: session.user.id,
          day: p.day,
          gold: p.gold,
          food: p.food,
          action_points: p.actionPoints,
          prestige: p.prestige,
          unlocked_facilities: p.unlockedFacilities
        });
      },

      // ★ 全域池智能打撈機制
      consumeIdentity: async () => {
        const state = get();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return { name: "無名幽影", story: "未與深淵建立正式連結的幻影。" };

        set({ isPoolGenerating: true });
        try {
          // 1. 從全域池中尋找「沒有在本地 usedIdentityIds 陣列」裡的資料
          let query = supabase.from('global_identities').select('*');
          if (state.player.usedIdentityIds.length > 0) {
             query = query.not('id', 'in', `(${state.player.usedIdentityIds.join(',')})`);
          }
          const { data: availableData } = await query.limit(1);

          let identity = availableData && availableData.length > 0 ? availableData[0] : null;

          // 2. 如果全域池沒貨了，呼叫 AI 生成並「捐贈」到全域池中
          if (!identity) {
             const newAiData = await fetchIdentityBatch(); // 這會產生 10 筆
             const { data: insertedData } = await supabase.from('global_identities').insert(newAiData).select();
             if (insertedData && insertedData.length > 0) {
                identity = insertedData[0];
             }
          }

          if (!identity) throw new Error('AI 與資料庫雙重潰堤');

          // 3. 在雲端紀錄消耗，並在本地更新已用清單
          await supabase.from('user_identity_logs').insert({ user_id: session.user.id, identity_id: identity.id });
          const newUsedIds = [...state.player.usedIdentityIds, identity.id];
          set(s => ({ player: { ...s.player, usedIdentityIds: newUsedIds } }));

          return { name: identity.name, story: identity.story };

        } catch (e) {
          console.error(e);
          return { name: "罪業之軀", story: "［檔案毀損］來自深淵的亂碼碎片。" };
        } finally {
          set({ isPoolGenerating: false });
        }
      },

      addGold: (amount) => set((state) => ({ player: { ...state.player, gold: state.player.gold + amount } })),
      deductGold: (amount) => set((state) => ({ player: { ...state.player, gold: Math.max(0, state.player.gold - amount) } })),
      addFood: (amount) => set((state) => ({ player: { ...state.player, food: state.player.food + amount } })),
      deductFood: (amount) => set((state) => ({ player: { ...state.player, food: Math.max(0, state.player.food - amount) } })),
      addPrestige: (amount) => set((state) => ({ player: { ...state.player, prestige: state.player.prestige + amount } })),
      changeLocation: (loc) => set((state) => { let capacity = 5; if (loc === 'NeutralHub') capacity = 10; if (loc === 'Capital') capacity = 20; return { player: { ...state.player, location: loc, maxSlaveCapacity: capacity } }; }),
      navigate: (scene, subView) => set({ currentScene: scene, currentSubView: subView }),
      cleanRoom: () => set((state) => { if (state.player.gold >= 50) return { player: { ...state.player, gold: state.player.gold - 50, roomDirtiness: Math.max(0, state.player.roomDirtiness - 40) } }; return state; }),
      addSlave: (slave) => set((state) => ({ slaves: [...state.slaves, slave] })),
      updateSlave: (id, updates) => set((state) => ({ slaves: state.slaves.map(s => s.id === id ? { ...s, ...updates, conditionStats: { ...s.conditionStats, ...(updates.conditionStats || {}) } } : s) })),
      sellSlave: (slaveId) => set((state) => {
        const slave = state.slaves.find(s => s.id === slaveId);
        if (!slave || slave.activityStatus !== '閒置') return state;
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
        const { actionPoints, lastApUpdateTime } = state.player;
        if (actionPoints >= 50) return state;
        const now = Date.now(); const elapsed = now - lastApUpdateTime; const recoverAmount = Math.floor(elapsed / 60000); 
        if (recoverAmount > 0) {
          const newAp = Math.min(50, actionPoints + recoverAmount);
          return { player: { ...state.player, actionPoints: newAp, lastApUpdateTime: newAp === 50 ? now : lastApUpdateTime + (recoverAmount * 60000) } };
        }
        return state;
      }),

      processTurn: () => {
        get().checkApRecovery();
        const state = get(); const { player, slaves, activeDispatches, triggerBackgroundMarketRefresh } = state;
        if (player.actionPoints < 1) return;

        const newAp = player.actionPoints - 1;
        const newApUpdateTime = player.actionPoints === 50 ? Date.now() : player.lastApUpdateTime;
        const currentPhaseIndex = TIME_PHASES.indexOf(player.timePhase);
        let nextPhase: TimePhase; let nextDay = player.day; let triggerDailySettlement = false;

        if (currentPhaseIndex === TIME_PHASES.length - 1) { nextPhase = '早上'; nextDay += 1; triggerDailySettlement = true; } else { nextPhase = TIME_PHASES[currentPhaseIndex + 1]; }

        const overpopulation = Math.max(0, slaves.length - player.maxSlaveCapacity);
        const newDirtiness = Math.min(100, player.roomDirtiness + Math.ceil(slaves.length * (player.location === 'Capital' ? 1 : player.location === 'NeutralHub' ? 1.5 : 2)) + Math.pow(overpopulation, 2) * 5);
        set({ player: { ...player, day: nextDay, timePhase: nextPhase, roomDirtiness: newDirtiness, actionPoints: newAp, lastApUpdateTime: newApUpdateTime } });

        const newDispatches: ActiveDispatch[] = []; let earnedGold = 0; let earnedPrestige = 0;
        activeDispatches.forEach(dispatch => {
          dispatch.remainingPhases -= 1;
          if (dispatch.remainingPhases <= 0) {
            earnedGold += dispatch.mission.reward;
            const slave = get().slaves.find(s => s.id === dispatch.slaveId);
            if (slave) {
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
          const foodNeeded = slaves.length * GAME_CONSTANTS.FOOD_CONSUMPTION_PER_SLAVE;
          let isStarving = false;
          if (get().player.food >= foodNeeded) get().deductFood(foodNeeded); else { get().deductFood(get().player.food); isStarving = true; }

          slaves.forEach(slave => {
            let newStamina = slave.conditionStats.stamina; let newStress = slave.conditionStats.stress; let newRebellion = slave.conditionStats.rebellion;
            if (isStarving) { newStress = Math.min(100, newStress + 20); newRebellion = Math.min(100, newRebellion + 10); } else {
              if (slave.activityStatus === '閒置') { newStamina = Math.min(100, newStamina + (newDirtiness > 50 ? 10 : 30)); if (overpopulation === 0) newStress = Math.max(0, newStress - 5); }
              if (newDirtiness > 80) { newStress = Math.min(100, newStress + 20); newRebellion = Math.min(100, newRebellion + 15); }
              if (overpopulation > 0) { newStress = Math.min(100, newStress + (overpopulation * 5)); newRebellion = Math.min(100, newRebellion + (overpopulation * 3)); }
            }
            get().updateSlave(slave.id, { conditionStats: { stamina: newStamina, stress: newStress, rebellion: newRebellion } });
          });
          triggerBackgroundMarketRefresh(); set({ dailyMissions: generateDailyMissions() });
        }
        // ★ 推進時段結束後，背景同步存檔至雲端
        get().syncProfileToCloud();
      },

      executeArenaBattle: (slaveId, npcId) => {
        const state = get();
        const slave = state.slaves.find(s => s.id === slaveId);
        const npc = ARENA_NPCS.find(n => n.id === npcId);
        if (!slave || !npc || state.player.actionPoints < 1) return null;

        const logs: CombatLog[] = [];
        logs.push({ round: 0, message: `［系統］${slave.name} 踏入賽場，迎戰 ${npc.name}。`, type: 'system' });

        let sHpMax = Math.floor(slave.primaryStats.endurance * 5);
        let sHp = Math.floor(sHpMax * (slave.conditionStats.stamina / 100));
        let sAtk = slave.primaryStats.combat;
        let sDef = Math.floor(slave.primaryStats.endurance * 0.5 + slave.skills.survival * 2);
        let sSpd = slave.primaryStats.intelligence;
        let sDmgMulti = 1 + (slave.skills.combat * 0.05);
        let sDmgReduc = slave.skills.combat * 0.03;

        if (slave.race === '精靈') sSpd = Math.floor(sSpd * 1.2);
        if (slave.race === '半獸人') { sAtk = Math.floor(sAtk * 1.15); sDef = Math.floor(sDef * 0.9); }
        if (slave.race === '矮人') { sHpMax = Math.floor(sHpMax * 1.2); sHp = Math.floor(sHp * 1.2); sDef = Math.floor(sDef * 1.15); }
        if (slave.race === '龍族') { sAtk = Math.floor(sAtk * 1.1); sDef = Math.floor(sDef * 1.1); sSpd = Math.floor(sSpd * 1.1); sDmgReduc += 0.2; }

        let nHp = npc.stats.hp; const nAtk = npc.stats.attack; const nDef = npc.stats.defense; const nSpd = npc.stats.speed;
        let round = 1; let orcStack = 0; let humanUnstoppable = false;

        while (sHp > 0 && nHp > 0 && round <= 50) {
          const isSlaveFirst = sSpd >= nSpd;

          const slaveAction = () => {
            if (sHp <= 0) return;
            let atkPower = sAtk; let dmgMulti = sDmgMulti;

            if (slave.race === '人類' && sHp < sHpMax * 0.4 && !humanUnstoppable) {
                humanUnstoppable = true;
                logs.push({ round, message: `［絕境意志］${slave.name} 爆發強烈的求生欲，攻擊力極大幅提升！`, type: 'skill' });
            }
            if (humanUnstoppable) atkPower = Math.floor(atkPower * 1.25);
            if (slave.race === '精靈' && isSlaveFirst) dmgMulti += 0.15;
            if (slave.race === '半獸人') dmgMulti += Math.min(0.3, orcStack * 0.03);

            let dmg = Math.floor(Math.max(1, atkPower - nDef) * dmgMulti);
            nHp -= dmg;
            logs.push({ round, message: `${slave.name} 發動攻擊，對 ${npc.name} 造成 ${dmg} 點傷害。`, type: 'damage' });

            if (slave.race === '不死族') {
                const heal = Math.floor(dmg * 0.15);
                if (heal > 0) { sHp = Math.min(sHpMax, sHp + heal); logs.push({ round, message: `［枯骨不朽］${slave.name} 吸收了 ${heal} 點生命力。`, type: 'heal' }); }
            }
          };

          const npcAction = () => {
            if (nHp <= 0) return;
            let dmg = Math.max(1, nAtk - sDef);
            if (slave.race === '矮人') dmg = Math.max(1, dmg - 5);
            dmg = Math.floor(dmg * (1 - sDmgReduc));
            sHp -= dmg;
            logs.push({ round, message: `${npc.name} 揮舞武器，對 ${slave.name} 造成 ${dmg} 點傷害。`, type: 'damage' });

            if (slave.race === '半獸人') orcStack++;
          };

          if (isSlaveFirst) { slaveAction(); npcAction(); } else { npcAction(); slaveAction(); }
          round++;
        }

        const isWin = sHp > 0;
        logs.push({ round: round - 1, message: isWin ? `［結算］${slave.name} 屹立到了最後，取得勝利。` : `［結算］${slave.name} 不支倒地，戰敗被抬出賽場。`, type: 'system' });

        set((s) => ({ player: { ...s.player, actionPoints: s.player.actionPoints - 1 } }));
        if (isWin) {
          get().addGold(npc.rewardGold);
          if (npc.rewardPrestige > 0) get().addPrestige(npc.rewardPrestige);
        }

        let newStamina = Math.max(0, slave.conditionStats.stamina - 20); 
        let newStress = slave.conditionStats.stress;
        let newRebellion = slave.conditionStats.rebellion;

        if (slave.race === '不死族') {
          // 不死族免疫賽場壓力
        } else {
          newStress = Math.min(100, newStress + (isWin ? 5 : 15));
          newRebellion = Math.min(100, newRebellion + (isWin ? 2 : 10));
          if (slave.race === '人類' && isWin) newStress = Math.max(0, newStress - (round * 2));
          if (slave.race === '龍族' && newStamina < 30) newRebellion = Math.min(100, newRebellion + 20);
        }

        get().updateSlave(slave.id, { conditionStats: { stamina: newStamina, stress: newStress, rebellion: newRebellion } });
        get().processTurn(); 
        get().syncProfileToCloud(); // ★ 戰鬥結算後同步雲端
        return { logs, isWin };
      }
    }),
    { name: 'dark-fantasy-save-v11', storage: createJSONStorage(() => storage) }
  )
);
