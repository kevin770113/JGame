import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import localforage from 'localforage';
import { Slave, Player, Location, TimePhase, Race, Gender, Scene, SubView } from '../types';
import { GAME_CONSTANTS } from '../utils/constants';
import { generateSlaveIdentity } from '../services/aiService';

// 定義完整的狀態與動作介面
export interface GameStore {
  player: Player;
  slaves: Slave[];
  marketSlaves: Slave[];
  isMarketGenerating: boolean;
  
  // ▼ 新增：場景路由狀態 ▼
  currentScene: Scene;
  currentSubView: SubView;

  // 玩家資源動作
  addGold: (amount: number) => void;
  deductGold: (amount: number) => void;
  addFood: (amount: number) => void;
  deductFood: (amount: number) => void;
  changeLocation: (loc: Location) => void;
  
  // ▼ 新增：內政與路由動作 ▼
  navigate: (scene: Scene, subView: SubView) => void;
  cleanRoom: () => void;

  // 奴隸管理動作
  addSlave: (slave: Slave) => void;
  updateCondition: (id: string, stats: Partial<Slave['conditionStats']>) => void;
  
  // 市場與 AI 動作
  triggerBackgroundMarketRefresh: () => Promise<void>;
  
  // 時間核心引擎
  processTurn: () => void;
}

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
    primaryStats: {
      combat: Math.floor(Math.random() * 60) + 20,
      endurance: Math.floor(Math.random() * 60) + 20,
      intelligence: Math.floor(Math.random() * 60) + 20,
      obedience: Math.floor(Math.random() * 40) + 10
    },
    conditionStats: { stamina: 100, stress: 0, rebellion: Math.floor(Math.random() * 20) },
    traits: [],
    backgroundStory: '商隊護送中，即將抵達...'
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
      // 初始狀態 (加入髒亂度、人口上限與路由)
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
      slaves: [
        {
          id: 'init-1',
          name: '伊莉雅',
          race: '精靈',
          gender: 'Female',
          primaryStats: { combat: 30, endurance: 20, intelligence: 95, obedience: 10 },
          conditionStats: { stamina: 60, stress: 80, rebellion: 90 },
          traits: ['精靈的傲骨'],
          backgroundStory: '前任精靈祭司，在部落戰敗後被俘。'
        }
      ],
      marketSlaves: [],
      isMarketGenerating: false,

      // 資源控制實作
      addGold: (amount) => set((state) => ({ player: { ...state.player, gold: state.player.gold + amount } })),
      deductGold: (amount) => set((state) => ({ player: { ...state.player, gold: Math.max(0, state.player.gold - amount) } })),
      addFood: (amount) => set((state) => ({ player: { ...state.player, food: state.player.food + amount } })),
      deductFood: (amount) => set((state) => ({ player: { ...state.player, food: Math.max(0, state.player.food - amount) } })),
      
      // 據點遷移邏輯擴充：自動解鎖房間人口上限與降低髒亂度增長
      changeLocation: (loc) => set((state) => {
        let capacity = 5;
        if (loc === 'NeutralHub') capacity = 10;
        if (loc === 'Capital') capacity = 20;
        return { player: { ...state.player, location: loc, maxSlaveCapacity: capacity } };
      }),
      
      // 路由控制實作
      navigate: (scene, subView) => set({ currentScene: scene, currentSubView: subView }),

      // 內政動作：手動打掃房間 (消耗資金 50，降低 40 點髒亂度)
      cleanRoom: () => set((state) => {
        if (state.player.gold >= 50) {
          return {
            player: {
              ...state.player,
              gold: state.player.gold - 50,
              roomDirtiness: Math.max(0, state.player.roomDirtiness - 40)
            }
          };
        }
        return state;
      }),
      
      addSlave: (slave) => set((state) => ({ slaves: [...state.slaves, slave] })),
      updateCondition: (id, stats) => set((state) => ({
        slaves: state.slaves.map(s => s.id === id ? { ...s, conditionStats: { ...s.conditionStats, ...stats } } : s)
      })),

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

      // 時間與內政引擎：推進時段與環境反噬
      processTurn: () => {
        const state = get();
        const { player, slaves, triggerBackgroundMarketRefresh } = state;
        
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

        // ★ 內政邏輯：根據當前居住人數，每推進一個時段增加髒亂度 ★
        // 皇城基礎設施好，髒亂度上升較慢；前線較快
        const dirtMultiplier = player.location === 'Capital' ? 1 : player.location === 'NeutralHub' ? 1.5 : 2;
        const addedDirtiness = Math.ceil(slaves.length * dirtMultiplier);
        let newDirtiness = Math.min(100, player.roomDirtiness + addedDirtiness);

        set({ player: { ...player, day: nextDay, timePhase: nextPhase, roomDirtiness: newDirtiness } });

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

          // 刷新全體奴隸數值並計算環境反噬
          slaves.forEach(slave => {
            let newStamina = slave.conditionStats.stamina;
            let newStress = slave.conditionStats.stress;
            let newRebellion = slave.conditionStats.rebellion;

            if (isStarving) {
              newStress = Math.min(100, newStress + 20);
              newRebellion = Math.min(100, newRebellion + 10);
            } else {
              // 根據髒亂度調整體力恢復
              let staminaRecover = 30;
              if (newDirtiness > 50) staminaRecover = 10; // 髒亂度大於 50%，恢復嚴重打折

              newStamina = Math.min(100, newStamina + staminaRecover);
              newStress = Math.max(0, newStress - 5);

              // 髒亂度大於 80%，觸發高壓與反叛反噬
              if (newDirtiness > 80) {
                 newStress = Math.min(100, newStress + 20);
                 newRebellion = Math.min(100, newRebellion + 15);
              }
            }

            get().updateCondition(slave.id, { stamina: newStamina, stress: newStress, rebellion: newRebellion });
          });

          triggerBackgroundMarketRefresh();
        }
      }
    }),
    {
      name: 'dark-fantasy-save-v3', // 再次升級存檔版本，清除舊型別快取
      storage: createJSONStorage(() => storage),
    }
  )
);
