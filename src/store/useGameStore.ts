import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import localforage from 'localforage';
import { Slave, Player, Location, TimePhase, Race, Gender, Scene, SubView } from '../types';
import { GAME_CONSTANTS } from '../utils/constants';
import { generateSlaveIdentity } from '../services/aiService';

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
  checkApRecovery: () => void; // ［新增］檢查並回復行動力
  processTurn: () => void;
}

const generateDailyMissions = (): Mission[] => {
  const missions: Mission[] = [];
  const baseId = Date.now().toString(36);
  const actions = ['護送', '掠奪', '鎮壓', '搜刮', '暗殺', '勘探'];
  const targets = ['私掠物資', '深淵礦脈', '異端營地', '帝國商隊', '地下黑市', '古老遺跡'];

  const getName = () => `【${actions[Math.floor(Math.random() * actions.length)]}${targets[Math.floor(Math.random() * targets.length)]}】`;

  const greenCount = Math.floor(Math.random() * 2) + 3;
  for (let i = 0; i < greenCount; i++) {
    missions.push({
      id: `m-grn-${baseId}-${i}`, title: `［常規］${getName()}`, rank: '翠綠', requiredPhases: 1, staminaCost: 20, stressGain: 10, reward: 300 + Math.floor(Math.random() * 100), description: '骯髒的體力活，適合壓榨低階成員的剩餘價值。'
    });
  }

  const blueCount = Math.floor(Math.random() * 2) + 1;
  for (let i = 0; i < blueCount; i++) {
    missions.push({
      id: `m-blu-${baseId}-${i}`, title: `［進階］${getName()}`, rank: '蔚藍', requiredPhases: 2, staminaCost: 45, stressGain: 25, reward: 800 + Math.floor(Math.random() * 200), description: '離開據點保護圈的危險差事。'
    });
  }

  if (Math.random() > 0.7) {
    missions.push({
      id: `m-pur-${baseId}`, title: `［特化］${getName()}`, rank: '紫色', requiredPhases: 2, staminaCost: 50, stressGain: 30, reward: 1200 + Math.floor(Math.random() * 300), description: '地區限定委託。結算時有極高機率獲得【商會威望】，或強制突破執行者的技能極限。'
    });
  }

  if (Math.random() > 0.8) {
    missions.push({
      id: `m-gld-${baseId}`, title: `［傳說］${getName()}`, rank: '黃金', requiredPhases: 5, staminaCost: 90, stressGain: 60, reward: 3500 + Math.floor(Math.random() * 1500), description: '九死一生的死亡委託。極易造成精神崩潰或致殘。'
    });
  }

  return missions;
};

const generateBaseMarketSlave = (idSuffix: string): Slave => {
  const races: Race[] = ['人類', '精靈', '半獸人', '矮人', '不死族', '龍族'];
  const race = races[Math.floor(Math.random() * races.length)];
  const gender: Gender = Math.random() > 0.5 ? 'Male' : 'Female';
  
  return {
    id: `market-${Date.now()}-${idSuffix}`, name: `未知的 ${race}`, race, gender, activityStatus: '閒置',
    skills: { combat: 1, housework: 1, survival: 1 },
    primaryStats: { combat: Math.floor(Math.random() * 60) + 20, endurance: Math.floor(Math.random() * 60) + 20, intelligence: Math.floor(Math.random() * 60) + 20, obedience: Math.floor(Math.random() * 40) + 10 },
    conditionStats: { stamina: 100, stress: 0, rebellion: Math.floor(Math.random() * 20) },
    traits: [], backgroundStory: '［檔案傳輸中...］'
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

      triggerBackgroundMarketRefresh: async () => {
        if (get().isMarketGenerating) return;
        set({ isMarketGenerating: true, marketSlaves: [generateBaseMarketSlave('1'), generateBaseMarketSlave('2'), generateBaseMarketSlave('3')] });
        try {
          const currentMarket = get().marketSlaves;
          const enriched = await Promise.all(currentMarket.map(async (slave) => {
            const aiData = await generateSlaveIdentity(slave.race, slave.gender);
            return { ...slave, name: aiData.name, backgroundStory: aiData.story };
          }));
          set({ marketSlaves: enriched });
        } catch (e) { console.error(e); } finally { set({ isMarketGenerating: false }); }
      },

      // ［實作］行動力檢查與回復（每分鐘回復 1 點）
      checkApRecovery: () => set((state) => {
        const { actionPoints, lastApUpdateTime } = state.player;
        if (actionPoints >= 50) return state;

        const now = Date.now();
        const elapsed = now - lastApUpdateTime;
        const recoverAmount = Math.floor(elapsed / 60000); 

        if (recoverAmount > 0) {
          const newAp = Math.min(50, actionPoints + recoverAmount);
          const newUpdateTime = lastApUpdateTime + (recoverAmount * 60000); // 保留剩餘未滿一分鐘的毫秒數
          return { player: { ...state.player, actionPoints: newAp, lastApUpdateTime: newAp === 50 ? now : newUpdateTime } };
        }
        return state;
      }),

      processTurn: () => {
        // 推進時優先核算一次行動力是否需要回復
        get().checkApRecovery();
        
        const state = get();
        const { player, slaves, activeDispatches, triggerBackgroundMarketRefresh } = state;
        
        // ［實作］行動力防禦判斷
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

        // ［實作］計算人口溢出狀態
        const overpopulation = Math.max(0, slaves.length - player.maxSlaveCapacity);

        // ［實作］環境髒亂度指數型爆發
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
                // ［實作］人口溢出時剝奪閒置恢復壓力的福利
                if (overpopulation === 0) {
                    newStress = Math.max(0, newStress - 5); 
                }
              }
              
              if (newDirtiness > 80) { 
                newStress = Math.min(100, newStress + 20); 
                newRebellion = Math.min(100, newRebellion + 15); 
              }

              // ［實作］壓力鍋效應：強制給所有人疊加高額壓力與反抗
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
    { name: 'dark-fantasy-save-v7', storage: createJSONStorage(() => storage) }
  )
);
