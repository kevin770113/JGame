import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import localforage from 'localforage';
import { GameStore } from '../types/storeTypes';

import { createPlayerSlice } from './slices/createPlayerSlice';
import { createSlaveSlice } from './slices/createSlaveSlice';
import { createCombatSlice } from './slices/createCombatSlice';
import { createSystemSlice } from './slices/createSystemSlice';

const storage: StateStorage = {
  getItem: async (name) => (await localforage.getItem(name)) || null,
  setItem: async (name, value) => { await localforage.setItem(name, value); },
  removeItem: async (name) => { await localforage.removeItem(name); },
};

export const useGameStore = create<GameStore>()(
  persist(
    (...a) => ({
      ...createPlayerSlice(...a),
      ...createSlaveSlice(...a),
      ...createCombatSlice(...a),
      ...createSystemSlice(...a),
    }),
    { 
      name: 'dark-fantasy-save-v18', 
      storage: createJSONStorage(() => storage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }
      }
    }
  )
);
