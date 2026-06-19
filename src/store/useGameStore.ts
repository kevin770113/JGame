import { create } from 'zustand';
import { createPlayerSlice, PlayerSlice } from './slices/playerSlice';
import { createSlaveSlice, SlaveSlice } from './slices/slaveSlice';

// 將所有的 Slice 型別合併為一個完整的 GameStore 型別
export type GameStore = PlayerSlice & SlaveSlice;

// 建立並匯出主狀態機 (運用 Zustand 的 slice 模式)
export const useGameStore = create<GameStore>()((...a) => ({
  ...createPlayerSlice(...a),
  ...createSlaveSlice(...a),
}));
