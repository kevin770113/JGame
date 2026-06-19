import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import localforage from 'localforage';
import { createPlayerSlice, PlayerSlice } from './slices/playerSlice';
import { createSlaveSlice, SlaveSlice } from './slices/slaveSlice';
import { GAME_CONSTANTS } from '../utils/constants';

// 擴充 GameStore 型別
export type GameStore = PlayerSlice & SlaveSlice & {
  processTurn: () => void;
};

// 建立 IndexedDB 儲存介面
const storage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await localforage.getItem(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await localforage.setItem(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await localforage.removeItem(name);
  },
};

// 建立並匯出主狀態機 (包裝 persist 中介軟體)
export const useGameStore = create<GameStore>()(
  persist(
    (set, get, api) => ({
      ...createPlayerSlice(set, get, api),
      ...createSlaveSlice(set, get, api),
      
      // 核心迴圈：回合結算引擎
      processTurn: () => {
        const state = get();
        const { slaves, player, deductFood, nextTurn, updateCondition } = state;
        
        const foodNeeded = slaves.length * GAME_CONSTANTS.FOOD_CONSUMPTION_PER_SLAVE;
        let isStarving = false;
        
        if (player.food >= foodNeeded) {
          deductFood(foodNeeded);
        } else {
          deductFood(player.food); 
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
            newStamina = Math.min(100, newStamina + 30);
            newStress = Math.max(0, newStress - 5);
          }

          updateCondition(slave.id, { 
            stamina: newStamina, 
            stress: newStress, 
            rebellion: newRebellion 
          });
        });

        nextTurn();
      }
    }),
    {
      name: 'dark-fantasy-save', // 寫入 IndexedDB 的專屬存檔名稱
      storage: createJSONStorage(() => storage),
    }
  )
);
