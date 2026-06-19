import { StateCreator } from 'zustand';
import { PlayerState, Location } from '../../types';
import { GAME_CONSTANTS } from '../../utils/constants';

// 定義 PlayerSlice 的介面（包含狀態與可執行的動作）
export interface PlayerSlice {
  player: PlayerState;
  
  // 動作 (Actions)
  addGold: (amount: number) => void;
  deductGold: (amount: number) => void;
  addFood: (amount: number) => void;
  deductFood: (amount: number) => void;
  nextTurn: () => void;
  changeLocation: (newLocation: Location) => void;
}

// 實作 PlayerSlice
export const createPlayerSlice: StateCreator<PlayerSlice, [], [], PlayerSlice> = (set) => ({
  // 1. 初始狀態注入 (使用 constants 中定義的常數)
  player: {
    turn: GAME_CONSTANTS.INITIAL_TURN,
    gold: GAME_CONSTANTS.INITIAL_GOLD,
    food: GAME_CONSTANTS.INITIAL_FOOD,
    location: 'Frontlines', // 預設出生於混亂前線
  },

  // 2. 狀態變更邏輯
  addGold: (amount) => 
    set((state) => ({ player: { ...state.player, gold: state.player.gold + amount } })),
    
  deductGold: (amount) => 
    set((state) => ({ player: { ...state.player, gold: Math.max(0, state.player.gold - amount) } })),

  addFood: (amount) => 
    set((state) => ({ player: { ...state.player, food: state.player.food + amount } })),

  deductFood: (amount) => 
    set((state) => ({ player: { ...state.player, food: Math.max(0, state.player.food - amount) } })),

  nextTurn: () => 
    set((state) => ({ player: { ...state.player, turn: state.player.turn + 1 } })),

  changeLocation: (newLocation) => 
    set((state) => ({ player: { ...state.player, location: newLocation } })),
});
