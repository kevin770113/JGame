import { create } from 'zustand';
import { createPlayerSlice, PlayerSlice } from './slices/playerSlice';
import { createSlaveSlice, SlaveSlice } from './slices/slaveSlice';
import { GAME_CONSTANTS } from '../utils/constants';

// 擴充 GameStore 型別，加入回合結算函式
export type GameStore = PlayerSlice & SlaveSlice & {
  processTurn: () => void;
};

// 建立並匯出主狀態機
export const useGameStore = create<GameStore>()((set, get, api) => ({
  ...createPlayerSlice(set, get, api),
  ...createSlaveSlice(set, get, api),
  
  // 核心迴圈：回合結算引擎
  processTurn: () => {
    const state = get();
    const { slaves, player, deductFood, nextTurn, updateCondition } = state;
    
    // 計算所需總糧食
    const foodNeeded = slaves.length * GAME_CONSTANTS.FOOD_CONSUMPTION_PER_SLAVE;
    let isStarving = false;
    
    // 結算糧食
    if (player.food >= foodNeeded) {
      deductFood(foodNeeded);
    } else {
      deductFood(player.food); // 糧食見底，扣至 0
      isStarving = true;       // 觸發全體飢餓
    }

    // 迴圈遍歷更新所有奴隸的動態數值
    slaves.forEach(slave => {
      let newStamina = slave.conditionStats.stamina;
      let newStress = slave.conditionStats.stress;
      let newRebellion = slave.conditionStats.rebellion;

      if (isStarving) {
        // 飢餓懲罰：壓力與反抗爆增，無法回復體力
        newStress = Math.min(100, newStress + 20);
        newRebellion = Math.min(100, newRebellion + 10);
      } else {
        // 正常維護：回復體力，微幅降低壓力
        newStamina = Math.min(100, newStamina + 30);
        newStress = Math.max(0, newStress - 5);
      }

      updateCondition(slave.id, { 
        stamina: newStamina, 
        stress: newStress, 
        rebellion: newRebellion 
      });
    });

    // 推進回合數
    nextTurn();
  }
}));
