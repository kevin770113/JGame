import { StateCreator } from 'zustand';
import { Slave, ConditionStats } from '../../types';

// --- 初始假資料 (Mock Data) ---
const INITIAL_SLAVES: Slave[] = [
  {
    id: 's-001',
    name: '格羅姆 (Grom)',
    race: 'Orc',
    primaryStats: { combat: 85, endurance: 90, intelligence: 15, obedience: 30 },
    conditionStats: { stamina: 100, stress: 20, rebellion: 45 },
    traits: [
      { id: 't-orc-1', name: '嗜血', type: 'Racial', description: '戰鬥派遣必定全力以赴，但極易失控傷人。' }
    ],
    backgroundStory: '在前線戰役中被俘虜的獸人步兵，眼神依然充滿不屈的野性。'
  },
  {
    id: 's-002',
    name: '伊莉雅 (Ilya)',
    race: 'Elf',
    primaryStats: { combat: 30, endurance: 20, intelligence: 95, obedience: 10 },
    conditionStats: { stamina: 60, stress: 80, rebellion: 90 },
    traits: [
      { id: 't-elf-1', name: '精靈的傲骨', type: 'Racial', description: '智力訓練效果絕佳，但反抗值被動增加。' }
    ]
  },
  {
    id: 's-003',
    name: '亞瑟 (Arthur)',
    race: 'Human',
    primaryStats: { combat: 50, endurance: 50, intelligence: 50, obedience: 60 },
    conditionStats: { stamina: 80, stress: 10, rebellion: 10 },
    traits: [
      { id: 't-hum-1', name: '適應力', type: 'Racial', description: '壓力下降速度比其他種族快 20%。' }
    ]
  }
];

// --- 定義 SlaveSlice 介面 ---
export interface SlaveSlice {
  slaves: Slave[];
  
  // 動作 (Actions)
  addSlave: (newSlave: Slave) => void;
  removeSlave: (slaveId: string) => void;
  updateCondition: (slaveId: string, updates: Partial<ConditionStats>) => void;
}

// --- 實作 SlaveSlice ---
export const createSlaveSlice: StateCreator<SlaveSlice, [], [], SlaveSlice> = (set) => ({
  slaves: INITIAL_SLAVES,

  addSlave: (newSlave) => 
    set((state) => ({ slaves: [...state.slaves, newSlave] })),

  removeSlave: (slaveId) => 
    set((state) => ({ slaves: state.slaves.filter(s => s.id !== slaveId) })),

  updateCondition: (slaveId, updates) => 
    set((state) => ({
      slaves: state.slaves.map(slave => 
        slave.id === slaveId 
          ? { ...slave, conditionStats: { ...slave.conditionStats, ...updates } } 
          : slave
      )
    })),
});
