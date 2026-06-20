import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import localforage from 'localforage';
import { Slave, Player, Location, TimePhase, Race, Gender, Scene, SubView, ActivityStatus } from '../types';
import { GAME_CONSTANTS } from '../utils/constants';
import { generateSlaveIdentity } from '../services/aiService';

// ▼ 新增：懸賞任務與外派佇列型別 ▼
export interface Mission {
  id: string;
  title: string;
  rank: '黃金' | '蔚藍' | '翠綠';
  requiredPhases: number; // 需耗費時段數
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
  
  currentScene: Scene;
  currentSubView: SubView;

  // ▼ 新增：酒館任務系統狀態 ▼
  dailyMissions: Mission[];
  activeDispatches: ActiveDispatch[];

  // 玩家資源與路由動作
  addGold: (amount: number) => void;
  deductGold: (amount: number) => void;
  addFood: (amount: number) => void;
  deductFood: (amount: number) => void;
  changeLocation: (loc: Location) => void;
  navigate: (scene: Scene, subView: SubView) => void;
  cleanRoom: () => void;

  // 奴隸與任務管理動作
  addSlave: (slave: Slave) => void;
  updateSlave: (id: string, updates: Partial<Slave>) => void; // 通用更新
  dispatchSlave: (slaveId: string, missionId: string) => void; // 執行外派

  // AI 動作與時間引擎
  triggerBackgroundMarketRefresh: () => Promise<void>;
  processTurn: () => void;
}

// 輔助函式：生成每日懸賞任務
const generateDailyMissions = (): Mission[] => {
  const missions: Mission[] = [];
  const baseId = Date.now().toString(36);

  // 翠綠級：低風險，1 時段，每日 3~4 個
  const greenCount = Math.floor(Math.random() * 2) + 3;
  for (let i = 0; i < greenCount; i++) {
    missions.push({
      id: `m-grn-${baseId}-${i}`,
      title: '［常規］下水道清理與搜刮',
      rank: '翠綠',
      requiredPhases: 1,
      staminaCost: 20,
      stressGain: 10,
      reward: 300 + Math.floor(Math.random() * 100),
      description: '惡臭且骯髒的體力活，適合用來壓榨低階成員的剩餘價值。'
    });
  }

  // 蔚藍級：中風險，2 時段，每日 1~2 個
  const blueCount = Math.floor(Math.random() * 2) + 1;
  for (let i = 0; i < blueCount; i++) {
    missions.push({
      id: `m-blu-${baseId}-${i}`,
      title: '［進階］走私物資武裝押運',
      rank: '蔚藍',
      requiredPhases: 2,
      staminaCost: 45,
      stressGain: 25,
      reward: 800 + Math.floor(Math.random() * 200),
      description: '離開據點保護圈的危險差事，可能遭遇流寇與審判官的盤查。'
    });
  }

  // 黃金級：極高風險，5 時段 (全天)，機率出現 (20%)
  if (Math.random() > 0.8) {
    missions.push({
      id: `m-gld-${baseId}`,
      title: '［傳說］深淵遺跡勘探與鎮壓',
      rank: '黃金',
      requiredPhases: 5,
      staminaCost: 90,
      stressGain: 60,
      reward: 3500 + Math.floor(Math.random() * 1500),
      description: '九死一生的死亡委託。深入地底直面古老恐懼，極易造成精神崩潰或致殘。'
    });
  }

  return missions;
};

// 輔助函式：生成基礎市場隨機範本
const generateBaseMarketSlave = (idSuffix: string): Slave => {
  const races: Race[] = ['人類', '精靈', '半獸人', '矮人', '不死族', '龍族'];
  const race = races[Math.floor(Math.random() * races.length)];
  const gender: Gender = Math.random() > 0.5 ? 'Male' : 'Female';
  
  return {
    id: `market-${Date.now()}-${idSuffix}`,
    name: `未知的 ${race}`,
    race,
    gender,
    activityStatus: '閒置',
    skills: { combat: 1, housework: 1, survival: 1 },
    primaryStats: {
      combat: Math.floor(Math.random() * 60) + 20,
      endurance: Math.floor(Math.random() * 60) + 20,
      intelligence: Math.floor(Math.random() * 60) + 20,
      obedience: Math.floor(Math.random() * 40) + 10
    },
    conditionStats: { stamina: 100, stress: 0, rebellion: Math.floor(Math.random() * 20) },
    traits: [],
    backgroundStory: '［檔案傳輸中...］'
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
        day: 1, 
        timePhase: '早上', 
        gold: 5000, 
        food: 120, 
        location: 'Frontlines',
        roomDirtiness: 0,
        maxSlaveCapacity: 5 
      },
      currentScene: 'Home',
      currentSubView: 'Main',
      dailyMissions: generateDailyMissions(),
      activeDispatches: [],
      slaves: [
        {
          id: 'init-1',
          name: '伊莉雅',
          race: '精靈',
          gender: 'Female',
          activityStatus: '閒置', // 補齊初始狀態
          skills: { combat: 2, housework: 4, survival: 3 }, // 補齊初始技能
          primaryStats: { combat: 30, endurance: 20, intelligence: 95, obedience: 10 },
          conditionStats: { stamina: 60, stress: 80, rebellion: 90 },
          traits: ['精靈的傲骨'],
          backgroundStory: '前任精靈祭司，在部落戰敗後被俘。'
        }
      ],
      marketSlaves: [],
      isMarketGenerating: false,

      addGold: (amount) => set((state) => ({ player: { ...state.player, gold: state.player.gold + amount } })),
      deductGold: (amount) => set((state) => ({ player: { ...state.player, gold: Math.max(0, state.player.gold - amount) } })),
      addFood: (amount) => set((state) => ({ player: { ...state.player, food: state.player.food + amount } })),
      deductFood: (amount) => set((state) => ({ player: { ...state.player, food: Math.max(0, state.player.food - amount) } })),
      
      changeLocation: (loc) => set((state) => {
        let capacity = 5;
        if (loc === 'NeutralHub') capacity = 10;
        if (loc === 'Capital') capacity = 20;
        return { player: { ...state.player, location: loc, maxSlaveCapacity: capacity } };
      }),
      
      navigate: (scene, subView) => set({ currentScene: scene, currentSubView: subView }),

      cleanRoom: () => set((state) => {
        if (state.player.gold >= 50) {
          return { player: { ...state.player, gold: state.player.gold - 50, roomDirtiness: Math.max(0, state.player.roomDirtiness - 40) } };
        }
        return state;
      }),
      
      addSlave: (slave) => set((state) => ({ slaves: [...state.slaves, slave] })),
      
      updateSlave: (id, updates) => set((state) => ({
        slaves: state.slaves.map(s => s.id === id ? { ...s, ...updates, conditionStats: { ...s.conditionStats, ...(updates.conditionStats || {}) } } : s)
      })),

      // 執行外派：改變奴隸狀態並加入佇列，從看板移除任務
      dispatchSlave: (slaveId, missionId) => {
        const state = get();
        const mission = state.dailyMissions.find(m => m.id === missionId);
        if (!mission) return;

        state.updateSlave(slaveId, { activityStatus: '外派中' });
        
        set({
          activeDispatches: [...state.activeDispatches, { slaveId, mission, remainingPhases: mission.requiredPhases }],
          dailyMissions: state.dailyMissions.filter(m => m.id !== missionId)
        });
      },

      triggerBackgroundMarketRefresh: async () => {
        if (get().isMarketGenerating) return;
        set({ isMarketGenerating: true, marketSlaves: [generateBaseMarketSlave('1'), generateBaseMarketSlave('2'), generateBaseMarketSlave('3')] });
        
        try {
          const currentMarket = get().marketSlaves;
          const enriched = await Promise.all(
            currentMarket.map(async (slave) => {
              const aiData = await generateSlaveIdentity(slave.race, slave.gender);
              return { ...slave, name: aiData.name, backgroundStory: aiData.story };
            })
          );
          set({ marketSlaves: enriched });
        } catch (e) {
          console.error("背景批貨失敗", e);
        } finally {
          set({ isMarketGenerating: false });
        }
      },

      // 時間引擎：推進時段、結算任務與跨日重置
      processTurn: () => {
        const state = get();
        const { player, slaves, activeDispatches, triggerBackgroundMarketRefresh } = state;
        
        const currentPhaseIndex = TIME_PHASES.indexOf(player.timePhase);
        let nextPhase: TimePhase;
        let nextDay = player.day;
        let triggerDailySettlement = false;

        if (currentPhaseIndex === TIME_PHASES.length - 1) {
          nextPhase = '早上';
          nextDay += 1;
          triggerDailySettlement = true; 
        } else {
          nextPhase = TIME_PHASES[currentPhaseIndex + 1];
        }

        const dirtMultiplier = player.location === 'Capital' ? 1 : player.location === 'NeutralHub' ? 1.5 : 2;
        const addedDirtiness = Math.ceil(slaves.length * dirtMultiplier);
        let newDirtiness = Math.min(100, player.roomDirtiness + addedDirtiness);

        set({ player: { ...player, day: nextDay, timePhase: nextPhase, roomDirtiness: newDirtiness } });

        // ★ 非同步任務結算引擎 ★
        const newDispatches: ActiveDispatch[] = [];
        let earnedGold = 0;

        activeDispatches.forEach(dispatch => {
          dispatch.remainingPhases -= 1;
          
          if (dispatch.remainingPhases <= 0) {
            // 任務完成：發放賞金並扣除體力
            earnedGold += dispatch.mission.reward;
            const slave = get().slaves.find(s => s.id === dispatch.slaveId);
            if (slave) {
               // 技能減免：戰鬥專精可微幅降低體力消耗
               const actualStaminaCost = Math.max(10, dispatch.mission.staminaCost - (slave.skills.combat * 2));
               const newStamina = Math.max(0, slave.conditionStats.stamina - actualStaminaCost);
               const newStress = Math.min(100, slave.conditionStats.stress + dispatch.mission.stressGain);
               
               get().updateSlave(slave.id, {
                 activityStatus: '閒置', // 釋放狀態
                 conditionStats: { ...slave.conditionStats, stamina: newStamina, stress: newStress }
               });
            }
          } else {
            // 任務未完成，推入新佇列繼續等待
            newDispatches.push(dispatch);
          }
        });

        if (earnedGold > 0) get().addGold(earnedGold);
        set({ activeDispatches: newDispatches });

        // 每日大結算邏輯
        if (triggerDailySettlement) {
          const foodNeeded = slaves.length * GAME_CONSTANTS.FOOD_CONSUMPTION_PER_SLAVE;
          let isStarving = false;

          if (get().player.food >= foodNeeded) {
            get().deductFood(foodNeeded);
          } else {
            get().deductFood(get().player.food);
            isStarving = true;
          }

          slaves.forEach(slave => {
            let newStamina = slave.conditionStats.stamina;
            let newStress = slave.conditionStats.stress;
            let newRebellion = slave.conditionStats.rebellion;

            if (isStarving) {
              newStress = Math.min(100, newStress + 20);
              newRebellion = Math.min(100, newRebellion + 10);
            } else {
              let staminaRecover = 30;
              if (newDirtiness > 50) staminaRecover = 10;

              // 只有閒置中的奴隸才能在深夜獲得完整恢復
              if (slave.activityStatus === '閒置') {
                 newStamina = Math.min(100, newStamina + staminaRecover);
                 newStress = Math.max(0, newStress - 5);
              }

              if (newDirtiness > 80) {
                 newStress = Math.min(100, newStress + 20);
                 newRebellion = Math.min(100, newRebellion + 15);
              }
            }

            get().updateSlave(slave.id, { conditionStats: { stamina: newStamina, stress: newStress, rebellion: newRebellion } });
          });

          // 刷新市場與酒館委託
          triggerBackgroundMarketRefresh();
          set({ dailyMissions: generateDailyMissions() });
        }
      }
    }),
    {
      name: 'dark-fantasy-save-v4', // 升級 V4 避免舊存檔崩潰
      storage: createJSONStorage(() => storage),
    }
  )
);
