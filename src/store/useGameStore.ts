import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import localforage from 'localforage';
import { Slave, Player, Location, TimePhase, Race, Gender } from '../types';
import { GAME_CONSTANTS } from '../utils/constants';
import { generateSlaveIdentity } from '../services/aiService';

// 定義完整的狀態與動作介面
export interface GameStore {
  player: Player;
  slaves: Slave[];
  marketSlaves: Slave[];
  isMarketGenerating: boolean;
  
  // 玩家資源動作
  addGold: (amount: number) => void;
  deductGold: (amount: number) => void;
  addFood: (amount: number) => void;
  deductFood: (amount: number) => void;
  changeLocation: (loc: Location) => void;
  
  // 奴隸管理動作
  addSlave: (slave: Slave) => void;
  updateCondition: (id: string, stats: Partial<Slave['conditionStats']>) => void;
  
  // 市場與 AI 動作
  triggerBackgroundMarketRefresh: () => Promise<void>;
  
  // 時間核心引擎
  processTurn: () => void;
}

// 輔助函式：生成基礎市場隨機範本 (用於 AI 換血前快速顯示)
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

// IndexedDB 配置
const storage: StateStorage = {
  getItem: async (name) => (await localforage.getItem(name)) || null,
  setItem: async (name, value) => { await localforage.setItem(name, value); },
  removeItem: async (name) => { await localforage.removeItem(name); },
};

const TIME_PHASES: TimePhase[] = ['早上', '中午', '下午', '晚上', '深夜'];

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // 初始狀態 (對齊中文種族與性別)
      player: { day: 1, timePhase: '早上', gold: 5000, food: 120, location: 'Frontlines' },
      slaves: [
        {
          id: 'init-1',
          name: '伊莉雅 (Ilya)',
          race: '精靈',
          gender: 'Female',
          primaryStats: { combat: 30, endurance: 20, intelligence: 95, obedience: 10 },
          conditionStats: { stamina: 60, stress: 80, rebellion: 90 },
          traits: ['精靈的傲骨'],
          backgroundStory: '前任精靈祭司，在部落戰敗後被俘。'
        },
        {
          id: 'init-2',
          name: '亞瑟 (Arthur)',
          race: '人類',
          gender: 'Male',
          primaryStats: { combat: 50, endurance: 50, intelligence: 50, obedience: 60 },
          conditionStats: { stamina: 80, stress: 10, rebellion: 10 },
          traits: ['適應力'],
          backgroundStory: '破產 reduction 的前王國騎士，為了生計自願簽下契約。'
        }
      ],
      marketSlaves: [],
      isMarketGenerating: false,

      // 資源控制實作
      addGold: (amount) => set((state) => ({ player: { ...state.player, gold: state.player.gold + amount } })),
      deductGold: (amount) => set((state) => ({ player: { ...state.player, gold: Math.max(0, state.player.gold - amount) } })),
      addFood: (amount) => set((state) => ({ player: { ...state.player, food: state.player.food + amount } })),
      deductFood: (amount) => set((state) => ({ player: { ...state.player, food: Math.max(0, state.player.food - amount) } })),
      changeLocation: (loc) => set((state) => ({ player: { ...state.player, location: loc } })),
      
      addSlave: (slave) => set((state) => ({ slaves: [...state.slaves, slave] })),
      updateCondition: (id, stats) => set((state) => ({
        slaves: state.slaves.map(s => s.id === id ? { ...s, conditionStats: { ...s.conditionStats, ...stats } } : s)
      })),

      // 核心動作：非同步 AI 背景批貨
      triggerBackgroundMarketRefresh: async () => {
        if (get().isMarketGenerating) return;
        
        // 1. 先進駐 3 個基礎框架，讓玩家知道商隊即將上架
        set({ isMarketGenerating: true, marketSlaves: [generateBaseMarketSlave('1'), generateBaseMarketSlave('2'), generateBaseMarketSlave('3')] });
        
        try {
          const currentMarket = get().marketSlaves;
          // 2. 平行發送 AI 請求，傳遞中文種族與性別
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

      // 時間核心引擎：推進時段與跨日大結算
      processTurn: () => {
        const state = get();
        const { player, slaves, triggerBackgroundMarketRefresh } = state;
        
        const currentPhaseIndex = TIME_PHASES.indexOf(player.timePhase);
        let nextPhase: TimePhase;
        let nextDay = player.day;
        let triggerDailySettlement = false;

        // 計算下一個時段
        if (currentPhaseIndex === TIME_PHASES.length - 1) {
          nextPhase = '早上';
          nextDay += 1;
          triggerDailySettlement = true; // 從深夜跨越到早上，觸發每日結算
        } else {
          nextPhase = TIME_PHASES[currentPhaseIndex + 1];
        }

        // 執行更新
        set({ player: { ...player, day: nextDay, timePhase: nextPhase } });

        // 每日大結算邏輯 (一天僅觸發一次)
        if (triggerDailySettlement) {
          const foodNeeded = slaves.length * GAME_CONSTANTS.FOOD_CONSUMPTION_PER_SLAVE;
          let isStarving = false;

          // 扣除糧食
          if (get().player.food >= foodNeeded) {
            get().deductFood(foodNeeded);
          } else {
            get().deductFood(get().player.food);
            isStarving = true;
          }

          // 刷新全體奴隸數值
          slaves.forEach(slave => {
            let newStamina = slave.conditionStats.stamina;
            let newStress = slave.conditionStats.stress;
            let newRebellion = slave.conditionStats.rebellion;

            if (isStarving) {
              newStress = Math.min(100, newStress + 20);
              newRebellion = Math.min(100, newRebellion + 10);
            } else {
              newStamina = Math.min(100, newStamina + 30);
              newStress = Math.max(0, newStress - 5);
            }

            get().updateCondition(slave.id, { stamina: newStamina, stress: newStress, rebellion: newRebellion });
          });

          // 跨日刷新市場：清空舊貨，並強制啟動背景 AI 重新批貨
          triggerBackgroundMarketRefresh();
        }
      }
    }),
    {
      name: 'dark-fantasy-save-v2', // 升級版本名稱，避免舊緩存型別衝突
      storage: createJSONStorage(() => storage),
    }
  )
);
