import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import localforage from 'localforage';
import { Slave, Player, Location, TimePhase, Race, Gender, Scene, SubView } from '../types';
import { GAME_CONSTANTS } from '../utils/constants';
// ★ 引入新的批次生成函數
import { fetchIdentityBatch, IdentityRecord } from '../services/aiService';

export interface Mission {
  id: string;
  title: string;
  rank: '黃金' | '紫色' | '蔚藍' | '翠綠';
  requiredPhases: number;
  staminaCost: number;
  stressGain: number;
  reward: number;
  description: string;
}

export interface ActiveDispatch {
  slaveId: string;
  mission: Mission;
  remainingPhases: number;
}

export interface GameStore {
  player: Player;
  slaves: Slave[];
  marketSlaves: Slave[];
  isMarketGenerating: boolean;
  
  // ★ 新增：AI 通用資源池
  identityPool: IdentityRecord[];
  isPoolGenerating: boolean;
  consumeIdentity: () => Promise<IdentityRecord>;
  refillPoolIfNeeded: () => Promise<void>;

  currentScene: Scene;
  currentSubView: SubView;

  dailyMissions: Mission[];
  activeDispatches: ActiveDispatch[];

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
}

const generateDailyMissions = (): Mission[] => {
  const missions: Mission[] = [];
  const baseId = Date.now().toString(36);
  const actions = ['護送', '掠奪', '鎮壓', '搜刮', '暗殺', '勘探'];
  const targets = ['私掠物資', '深淵礦脈', '異端營地', '帝國商隊', '地下黑市', '古老遺跡'];
  const getName = () => `【${actions[Math.floor(Math.random() * actions.length)]}${targets[Math.floor(Math.random() * targets.length)]}】`;

  const greenCount = Math.floor(Math.random() * 2) + 3;
  for (let i = 0; i < greenCount; i++) missions.push({ id: `m-grn-${baseId}-${i}`, title: `［常規］${getName()}`, rank: '翠綠', requiredPhases: 1, staminaCost: 20, stressGain: 10, reward: 300 + Math.floor(Math.random() * 100), description: '骯髒的體力活，適合壓榨低階成員的剩餘價值。' });

  const blueCount = Math.floor(Math.random() * 2) + 1;
  for (let i = 0; i < blueCount; i++) missions.push({ id: `m-blu-${baseId}-${i}`, title: `［進階］${getName()}`, rank: '蔚藍', requiredPhases: 2, staminaCost: 45, stressGain: 25, reward: 800 + Math.floor(Math.random() * 200), description: '離開據點保護圈的危險差事。' });

  if (Math.random() > 0.7) missions.push({ id: `m-pur-${baseId}`, title: `［特化］${getName()}`, rank: '紫色', requiredPhases: 2, staminaCost: 50, stressGain: 30, reward: 1200 + Math.floor(Math.random() * 300), description: '地區限定委託。結算時有極高機率獲得【商會威望】，或強制突破執行者的技能極限。' });

  if (Math.random() > 0.8) missions.push({ id: `m-gld-${baseId}`, title: `［傳說］${getName()}`, rank: '黃金', requiredPhases: 5, staminaCost: 90, stressGain: 60, reward: 3500 + Math.floor(Math.random() * 1500), description: '九死一生的死亡委託。極易造成精神崩潰或致殘。' });

  return missions;
};

// ★ 修改：從通用資料生成基礎屬性
const generateBaseMarketSlave = (idSuffix: string, identity: IdentityRecord): Slave => {
  const races: Race[] = ['人類', '精靈', '半獸人', '矮人', '不死族', '龍族'];
  const race = races[Math.floor(Math.random() * races.length)];
  const gender: Gender = Math.random() > 0.5 ? 'Male' : 'Female';
  
  return {
    id: `market-${Date.now()}-${idSuffix}`, name: identity.name, race, gender, activityStatus: '閒置',
    skills: { combat: 1, housework: 1, survival: 1 },
    primaryStats: { combat: Math.floor(Math.random() * 60) + 20, endurance: Math.floor(Math.random() * 60) + 20, intelligence: Math.floor(Math.random() * 60) + 20, obedience: Math.floor(Math.random() * 40) + 10 },
    conditionStats: { stamina: 100, stress: 0, rebellion: Math.floor(Math.random() * 20) },
    traits: [], backgroundStory: identity.story // 直接套用通用故事
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
      player: { day: 1, timePhase: '早上', gold: 99999, food: 120, location: 'Frontlines', roomDirtiness: 0, maxSlaveCapacity: 5, prestige: 9999, actionPoints: 50, lastApUpdateTime: Date.now() },
      currentScene: 'Home',
      currentSubView: 'Main',
      dailyMissions: generateDailyMissions(),
      activeDispatches: [],
      slaves: [],
      marketSlaves: [],
      isMarketGenerating: false,
      
      // ★ 初始化資源池
      identityPool: [],
      isPoolGenerating: false,

      // ★ 核心邏輯：背景補充資源池
      refillPoolIfNeeded: async () => {
        const state = get();
        // 如果庫存小於 5，且沒有正在生成的任務，則在背景安靜呼叫 AI
        if (state.identityPool.length < 5 && !state.isPoolGenerating) {
          set({ isPoolGenerating: true });
          try {
            const newIdentities = await fetchIdentityBatch();
            set(s => ({ identityPool: [...s.identityPool, ...newIdentities] }));
          } catch (e) {
            console.error(e);
          } finally {
            set({ isPoolGenerating: false });
          }
        }
      },

      // ★ 核心邏輯：抽取資料
      consumeIdentity: async () => {
        let currentPool = get().identityPool;
        
        // 只有當池子「完全見底」時，才會強迫玩家等待 (此時才會有載入時間)
        if (currentPool.length === 0) {
           set({ isPoolGenerating: true });
           try {
             const newIdentities = await fetchIdentityBatch();
             set({ identityPool: newIdentities });
             currentPool = newIdentities;
           } catch (e) {
             console.error(e);
           } finally {
             set({ isPoolGenerating: false });
           }
        }

        // 極端防呆
        if (currentPool.length === 0) {
            return { name: "深淵棄子", story: "［檔案毀損］極端異常的空白軀殼。" };
        }

        // 拿走第一筆資料
        const identity = currentPool[0];
        set(s => ({ identityPool: s.identityPool.slice(1) }));
        
        // 拿完後順便檢查是否需要補貨
        get().refillPoolIfNeeded();
        
        return identity;
      },

      addGold: (amount) => set((state) => ({ player: { ...state.player, gold: state.player.gold + amount } })),
      deductGold: (amount) => set((state) => ({ player: { ...state.player, gold: Math.max(0, state.player.gold - amount) } })),
      addFood: (amount) => set((state) => ({ player: { ...state.player, food: state.player.food + amount } })),
      deductFood: (amount) => set((state) => ({ player: { ...state.player, food: Math.max(0, state.player.food - amount) } })),
      addPrestige: (amount) => set((state) => ({ player: { ...state.player, prestige: state.player.prestige + amount } })),
      
      changeLocation: (loc) => set((state) => {
        let capacity = 5;
        if (loc === 'NeutralHub') capacity = 10;
        if (loc === 'Capital') capacity = 20;
        return { player: { ...state.player, location: loc, maxSlaveCapacity: capacity } };
      }),
      
      navigate: (scene, subView) => set({ currentScene: scene, currentSubView: subView }),

      cleanRoom: () => set((state) => {
        if (state.player.gold >= 50) return { player: { ...state.player, gold: state.player.gold - 50, roomDirtiness: Math.max(0, state.player.roomDirtiness - 40) } };
        return state;
      }),
      
      addSlave: (slave) => set((state) => ({ slaves: [...state.slaves, slave] })),
      updateSlave: (id, updates) => set((state) => ({ slaves: state.slaves.map(s => s.id === id ? { ...s, ...updates, conditionStats: { ...s.conditionStats, ...(updates.conditionStats || {}) } } : s) })),

      sellSlave: (slaveId) => set((state) => {
        const slave = state.slaves.find(s => s.id === slaveId);
        if (!slave || slave.activityStatus !== '閒置') return state;

        const statsSum = slave.primaryStats.combat + slave.primaryStats.endurance + slave.primaryStats.intelligence + slave.primaryStats.obedience;
        const skillsSum = slave.skills.combat + slave.skills.housework + slave.skills.survival;
        const sellPrice = 50 + Math.floor(statsSum * 1.5) + (skillsSum * 200);

        return {
          slaves: state.slaves.filter(s => s.id !== slaveId),
          player: { ...state.player, gold: state.player.gold + sellPrice }
        };
      }),

      dispatchSlave: (slaveId, missionId) => {
        const state = get();
        const mission = state.dailyMissions.find(m => m.id === missionId);
        if (!mission) return;
        state.updateSlave(slaveId, { activityStatus: '外派中' });
        set({ activeDispatches: [...state.activeDispatches, { slaveId, mission, remainingPhases: mission.requiredPhases }], dailyMissions: state.dailyMissions.filter(m => m.id !== missionId) });
      },

      // ★ 修改：市場進貨邏輯。改為從資料池提取，保留 isMarketGenerating 控制 UI
      triggerBackgroundMarketRefresh: async () => {
        if (get().isMarketGenerating) return;
        set({ isMarketGenerating: true, marketSlaves: [] });
        try {
          const newSlaves = [];
          for (let i = 0; i < 3; i++) {
            // 從池子抽出資料 (若池子空了這裡會 await 到有為止，畫面繼續轉圈)
            const identity = await get().consumeIdentity();
            newSlaves.push(generateBaseMarketSlave(String(i), identity));
          }
          set({ marketSlaves: newSlaves });
        } catch (e) { 
          console.error(e); 
        } finally { 
          set({ isMarketGenerating: false }); 
        }
      },

      checkApRecovery: () => set((state) => {
        const { actionPoints, lastApUpdateTime } = state.player;
        if (actionPoints >= 50) return state;

        const now = Date.now();
        const elapsed = now - lastApUpdateTime;
        const recoverAmount = Math.floor(elapsed / 60000); 

        if (recoverAmount > 0) {
          const newAp = Math.min(50, actionPoints + recoverAmount);
          const newUpdateTime = lastApUpdateTime + (recoverAmount * 60000); 
          return { player: { ...state.player, actionPoints: newAp, lastApUpdateTime: newAp === 50 ? now : newUpdateTime } };
        }
        return state;
      }),

      processTurn: () => {
        get().checkApRecovery();
        
        const state = get();
        const { player, slaves, activeDispatches, triggerBackgroundMarketRefresh } = state;
        
        if (player.actionPoints < 1) {
            console.warn('［系統］行動力不足，無法執行推進。');
            return;
        }

        const newAp = player.actionPoints - 1;
        const newApUpdateTime = player.actionPoints === 50 ? Date.now() : player.lastApUpdateTime;

        const currentPhaseIndex = TIME_PHASES.indexOf(player.timePhase);
        let nextPhase: TimePhase;
        let nextDay = player.day;
        let triggerDailySettlement = false;

        if (currentPhaseIndex === TIME_PHASES.length - 1) { nextPhase = '早上'; nextDay += 1; triggerDailySettlement = true; } 
        else { nextPhase = TIME_PHASES[currentPhaseIndex + 1]; }

        const overpopulation = Math.max(0, slaves.length - player.maxSlaveCapacity);
        const dirtMultiplier = player.location === 'Capital' ? 1 : player.location === 'NeutralHub' ? 1.5 : 2;
        const baseAddedDirtiness = Math.ceil(slaves.length * dirtMultiplier);
        const penaltyDirtiness = Math.pow(overpopulation, 2) * 5;
        const newDirtiness = Math.min(100, player.roomDirtiness + baseAddedDirtiness + penaltyDirtiness);

        set({ player: { ...player, day: nextDay, timePhase: nextPhase, roomDirtiness: newDirtiness, actionPoints: newAp, lastApUpdateTime: newApUpdateTime } });

        const newDispatches: ActiveDispatch[] = [];
        let earnedGold = 0;
        let earnedPrestige = 0;

        activeDispatches.forEach(dispatch => {
          dispatch.remainingPhases -= 1;
          
          if (dispatch.remainingPhases <= 0) {
            earnedGold += dispatch.mission.reward;
            const slave = get().slaves.find(s => s.id === dispatch.slaveId);
            if (slave) {
               const actualStaminaCost = Math.max(10, dispatch.mission.staminaCost - (slave.skills.combat * 2));
               const newStamina = Math.max(0, slave.conditionStats.stamina - actualStaminaCost);
               const newStress = Math.min(100, slave.conditionStats.stress + dispatch.mission.stressGain);
               
               let updatedSkills = { ...slave.skills };
               
               if (dispatch.mission.rank === '紫色') {
                 if (Math.random() > 0.5) {
                   earnedPrestige += Math.floor(Math.random() * 20) + 10;
                 } else {
                   const skillKeys = ['combat', 'housework', 'survival'] as const;
                   const targetSkill = skillKeys[Math.floor(Math.random() * skillKeys.length)];
                   if (updatedSkills[targetSkill] < 10) {
                     updatedSkills[targetSkill] += 1;
                   }
                 }
               }

               get().updateSlave(slave.id, {
                 activityStatus: '閒置',
                 skills: updatedSkills,
                 conditionStats: { ...slave.conditionStats, stamina: newStamina, stress: newStress }
               });
            }
          } else {
            newDispatches.push(dispatch);
          }
        });

        if (earnedGold > 0) get().addGold(earnedGold);
        if (earnedPrestige > 0) get().addPrestige(earnedPrestige);
        set({ activeDispatches: newDispatches });

        if (triggerDailySettlement) {
          const foodNeeded = slaves.length * GAME_CONSTANTS.FOOD_CONSUMPTION_PER_SLAVE;
          let isStarving = false;

          if (get().player.food >= foodNeeded) get().deductFood(foodNeeded);
          else { get().deductFood(get().player.food); isStarving = true; }

          slaves.forEach(slave => {
            let newStamina = slave.conditionStats.stamina;
            let newStress = slave.conditionStats.stress;
            let newRebellion = slave.conditionStats.rebellion;

            if (isStarving) { newStress = Math.min(100, newStress + 20); newRebellion = Math.min(100, newRebellion + 10); } 
            else {
              let staminaRecover = 30;
              if (newDirtiness > 50) staminaRecover = 10;
              
              if (slave.activityStatus === '閒置') { 
                newStamina = Math.min(100, newStamina + staminaRecover); 
                if (overpopulation === 0) {
                    newStress = Math.max(0, newStress - 5); 
                }
              }
              
              if (newDirtiness > 80) { 
                newStress = Math.min(100, newStress + 20); 
                newRebellion = Math.min(100, newRebellion + 15); 
              }

              if (overpopulation > 0) {
                  newStress = Math.min(100, newStress + (overpopulation * 5));
                  newRebellion = Math.min(100, newRebellion + (overpopulation * 3));
              }
            }
            get().updateSlave(slave.id, { conditionStats: { stamina: newStamina, stress: newStress, rebellion: newRebellion } });
          });

          triggerBackgroundMarketRefresh();
          set({ dailyMissions: generateDailyMissions() });
        }
      }
    }),
    // ★ 變更：由於資料結構大幅翻新，升級儲存至 v8，自動幫您初始化 10 筆名單的陣列
    { name: 'dark-fantasy-save-v8', storage: createJSONStorage(() => storage) }
  )
);
