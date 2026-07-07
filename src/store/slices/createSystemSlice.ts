import { StateCreator } from 'zustand';
import { GameStore, ActiveDispatch, GlobalModal } from '../../types/storeTypes';
import { TimePhase, ActiveWindow, CombatPlaybackData, Scene, SubView } from '../../types';
import { GAME_CONSTANTS } from '../../utils/constants';
import { supabase } from '../../services/supabaseClient';
import { QUESTS_DATA } from '../../utils/gameData';
import { generateDailyMissions, generateArenaNPCs } from '../../utils/generators';

const TIME_PHASES: TimePhase[] = ['早上', '中午', '下午', '晚上', '深夜'];
const DEFAULT_SHOP_STOCK: Record<string, number> = { 'potion_heal_small': 5, 'weapon_iron_sword': 1 }; 

export const createSystemSlice: StateCreator<GameStore, [], [], any> = (set, get) => ({
  arenaNPCs: generateArenaNPCs(),
  currentScene: 'Home',
  currentSubView: 'Main',
  dailyMissions: generateDailyMissions(),
  activeDispatches: [],
  activeEvent: null,
  globalModal: null,
  activeWindow: null,
  isSaving: false,
  localSaveVersion: 0,
  _hasHydrated: false,
  activeCombat: null,

  setActiveWindow: (win: ActiveWindow | null) => set({ activeWindow: win }),
  setGlobalModal: (modal: GlobalModal | null) => set({ globalModal: modal }),
  setIsSaving: (val: boolean) => set({ isSaving: val }),
  setHasHydrated: (val: boolean) => set({ _hasHydrated: val }),
  setActiveCombat: (combat: CombatPlaybackData | null) => set({ activeCombat: combat }),
  navigate: (scene: Scene, subView: SubView) => set({ currentScene: scene, currentSubView: subView }),

  triggerQuest: (questId: string) => set((state: GameStore) => {
    if (!state.player.quests[questId]) {
       const newQuests = { ...state.player.quests, [questId]: 'active' as const };
       const qData = QUESTS_DATA[questId as keyof typeof QUESTS_DATA];
       setTimeout(() => {
         get().syncProfileToCloud();
         if (qData) { get().setGlobalModal({ title: '［⚡ 發現新劇情任務解鎖］', message: `${qData.title}\n\n任務目標：${qData.description}`, isConfirm: false }); }
       }, 100); 
       return { player: { ...state.player, quests: newQuests } };
    }
    return state;
  }),

  checkQuestCompletion: () => {
     const state = get(); let updated = false; const newQuests = { ...state.player.quests }; let title = ''; let msg = ''; let addG = 0;
     if (newQuests['q_first_blood'] === 'active' && state.slaves.length > 0) { newQuests['q_first_blood'] = 'completed'; addG = 2000; updated = true; title = '［任務達成］【深淵的初啼】'; msg = `成功簽署第一份血脈契約！商會基礎雛形已然確立。\n\n獲得報酬：\n資金 +2,000`; }
     else if (newQuests['q_first_fusion'] === 'active' && state.slaves.some(s => s.parents)) { newQuests['q_first_fusion'] = 'completed'; addG = 1500; updated = true; title = '［任務達成］【禁忌的鍊金術】'; msg = `成功在血統密室中編織融合出全新的生命血脈！\n\n獲得報酬：\n資金 +1,500`; }
     else if (newQuests['q_enter_hub'] === 'active' && (state.player.location === 'NeutralHub' || state.player.location === 'Capital')) { newQuests['q_enter_hub'] = 'completed'; addG = 5000; updated = true; title = '［任務達成］【踏入灰色地帶】'; msg = `成功突破混亂前線，向核心城區拔營挺進！\n\n獲得報酬：\n資金 +5,000`; }

     if (updated) {
        set({ player: { ...state.player, quests: newQuests, gold: state.player.gold + addG } });
        get().setGlobalModal({ title, message: msg, isConfirm: false }); get().syncProfileToCloud();
     }
  },

  syncProfileToCloud: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    set({ isSaving: true });
    
    const newVersion = (get().localSaveVersion || 0) + 1;
    set({ localSaveVersion: newVersion });

    const state = get(); const p = state.player;
    const { error } = await supabase.from('profiles').upsert({
      id: session.user.id, day: p.day, gold: p.gold, food: p.food, action_points: p.actionPoints, prestige: p.prestige, unlocked_facilities: p.unlockedFacilities,
      save_data: { localSaveVersion: newVersion, usedIdentityIds: p.usedIdentityIds, inventory: p.inventory, quests: p.quests, abyssFloor: p.abyssFloor, shopStock: p.shopStock, slaves: state.slaves, marketSlaves: state.marketSlaves, activeDispatches: state.activeDispatches, activeEvent: state.activeEvent, arenaNPCs: state.arenaNPCs, leaderName: p.leaderName, leaderGender: p.leaderGender, leaderStamina: p.leaderStamina, leaderFaintTurns: p.leaderFaintTurns }
    });
    
    if (error) console.error('［同步異常］', error);
    set({ isSaving: false });
  },

  loadProfileFromCloud: async (forceLoad = false) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    if (error || !data) return;
    const sData = data.save_data || {};

    const cloudVersion = sData.localSaveVersion || 0;
    const currentLocalVersion = get().localSaveVersion || 0;

    if (!forceLoad && cloudVersion <= currentLocalVersion) { return; }

    set((state: GameStore) => ({
      localSaveVersion: cloudVersion,
      player: { ...state.player, day: data.day ?? state.player.day, gold: data.gold ?? state.player.gold, food: data.food ?? state.player.food, actionPoints: data.action_points ?? state.player.actionPoints, prestige: data.prestige ?? state.player.prestige, unlockedFacilities: data.unlocked_facilities || state.player.unlockedFacilities, usedIdentityIds: sData.usedIdentityIds || state.player.usedIdentityIds, inventory: sData.inventory || state.player.inventory, quests: sData.quests || state.player.quests, abyssFloor: sData.abyssFloor || state.player.abyssFloor, shopStock: sData.shopStock || state.player.shopStock, leaderName: sData.leaderName || state.player.leaderName, leaderGender: sData.leaderGender || state.player.leaderGender, leaderStamina: sData.leaderStamina ?? state.player.leaderStamina ?? 100, leaderFaintTurns: sData.leaderFaintTurns ?? state.player.leaderFaintTurns ?? 0 },
      slaves: sData.slaves || state.slaves, marketSlaves: sData.marketSlaves || state.marketSlaves, activeDispatches: sData.activeDispatches || state.activeDispatches, activeEvent: sData.activeEvent || state.activeEvent,
      arenaNPCs: sData.arenaNPCs && sData.arenaNPCs.length > 0 ? sData.arenaNPCs : state.arenaNPCs
    }));
  },

  performHousekeeping: (workerId: string) => {
    const state = get();
    if (state.player.actionPoints < 1) return;

    let dirtinessReduction = 0;
    
    if (workerId === 'LEADER') {
      const currentStamina = state.player.leaderStamina ?? 100;
      if (currentStamina < 20) return;
      dirtinessReduction = 40;
      
      set((s: GameStore) => ({
        player: { 
          ...s.player, 
          leaderStamina: (s.player.leaderStamina ?? 100) - 20, 
          roomDirtiness: Math.max(0, s.player.roomDirtiness - dirtinessReduction) 
        }
      }));
    } else {
      const slave = state.slaves.find(s => s.id === workerId);
      if (!slave || slave.conditionStats.stamina < 15 || slave.activityStatus !== '閒置') return;
      
      const houseworkSkill = slave.isInjured ? Math.floor((slave.skills.housework || 1) * 0.5) : (slave.skills.housework || 1);
      dirtinessReduction = 20 + (houseworkSkill * 5); 
      
      set((s: GameStore) => ({
        slaves: s.slaves.map(sl => sl.id === workerId ? { ...sl, conditionStats: { ...sl.conditionStats, stamina: sl.conditionStats.stamina - 15 } } : sl),
        player: { ...s.player, roomDirtiness: Math.max(0, s.player.roomDirtiness - dirtinessReduction) }
      }));
    }
    
    get().processTurn();
  },

  dispatchSlave: (slaveId: string, missionId: string) => {
    const state = get(); const mission = state.dailyMissions.find(m => m.id === missionId); if (!mission) return;
    if (slaveId !== 'LEADER') {
      state.updateSlave(slaveId, { activityStatus: '外派中' });
    }
    set({ activeDispatches: [...state.activeDispatches, { slaveId, mission, remainingPhases: mission.requiredPhases }], dailyMissions: state.dailyMissions.filter(m => m.id !== missionId) });
  },

  checkApRecovery: () => set((state: GameStore) => {
    const { actionPoints, lastApUpdateTime } = state.player; if (actionPoints >= 50) return state;
    const now = Date.now(); const elapsed = now - lastApUpdateTime; const recoverAmount = Math.floor(elapsed / 60000); 
    if (recoverAmount > 0) { const newAp = Math.min(50, actionPoints + recoverAmount); return { player: { ...state.player, actionPoints: newAp, lastApUpdateTime: newAp === 50 ? now : lastApUpdateTime + (recoverAmount * 60000) } }; }
    return state;
  }),

  processTurn: () => {
    get().checkApRecovery();
    const state = get(); const { player, slaves, activeDispatches, triggerBackgroundMarketRefresh } = state;
    if (player.actionPoints < 1) return;

    const newAp = player.actionPoints - 1; const newApUpdateTime = player.actionPoints === 50 ? Date.now() : player.lastApUpdateTime;
    const currentPhaseIndex = TIME_PHASES.indexOf(player.timePhase);
    let nextPhase: TimePhase; let nextDay = player.day; let triggerDailySettlement = false; let triggerWeeklyRent = false;

    if (currentPhaseIndex === TIME_PHASES.length - 1) { 
       nextPhase = '早上'; nextDay += 1; triggerDailySettlement = true; 
       if (nextDay % 7 === 0) triggerWeeklyRent = true;
    } else { 
       nextPhase = TIME_PHASES[currentPhaseIndex + 1]; 
    }

    let leaderFTurns = player.leaderFaintTurns ?? 0;
    if (leaderFTurns > 0) leaderFTurns -= 1;
    let leaderStamina = player.leaderStamina ?? 100;
    const isLeaderDispatched = activeDispatches.some(d => d.slaveId === 'LEADER');
    if (!isLeaderDispatched && leaderFTurns === 0) {
       leaderStamina = Math.min(100, leaderStamina + 10);
    }

    let updatedSlaves = slaves.map(s => {
      let fTurns = s.faintTurns || 0;
      if (fTurns > 0) fTurns -= 1;
      return { ...s, faintTurns: fTurns };
    });

    const overpopulation = Math.max(0, updatedSlaves.length - player.maxSlaveCapacity);
    let newDirtiness = Math.min(100, player.roomDirtiness + Math.ceil(updatedSlaves.length * (player.location === 'Capital' ? 1 : player.location === 'NeutralHub' ? 1.5 : 2)) + Math.pow(overpopulation, 2) * 5);
    
    const newDispatches: ActiveDispatch[] = []; let earnedGold = 0; let earnedPrestige = 0; let earnedFood = 0;
    let phaseLogs: string[] = [];

    activeDispatches.forEach(dispatch => {
      dispatch.remainingPhases -= 1;
      if (dispatch.remainingPhases <= 0) {
        let baseReward = dispatch.mission.reward;
        let foodReward = dispatch.mission.rank === '翠綠' ? 10 : dispatch.mission.rank === '蔚藍' ? 20 : dispatch.mission.rank === '紫色' ? 35 : 50;
        
        if (dispatch.slaveId === 'LEADER') {
           const isSuccess = Math.random() < (dispatch.mission.successRate ?? 1.0);
           if (isSuccess) {
             const successChance = 45 / 200; 
             if (Math.random() < successChance) {
                baseReward = Math.floor(baseReward * 1.5);
                phaseLogs.push(`［大捷］您親自出馬，完美規避風險，帶回額外 1.5 倍收益！`);
             }
             earnedGold += baseReward;
             earnedFood += foodReward;
             if (dispatch.mission.rank === '紫色' && Math.random() > 0.5) earnedPrestige += Math.floor(Math.random() * 20) + 10;
             
             leaderStamina = Math.max(0, leaderStamina - dispatch.mission.staminaCost);
             phaseLogs.push(`［平安歸隊］您已安全完成 ${dispatch.mission.title} 並帶回物資與資金。`);
             if (leaderStamina <= 0) { leaderStamina = 0; leaderFTurns = 3; phaseLogs.push(`［過勞］您耗盡了最後一絲體力，陷入重傷昏厥 (3時段)！`); }
           } else {
             leaderStamina = Math.max(0, leaderStamina - 40);
             phaseLogs.push(`［慘敗］您在執行 ${dispatch.mission.title} 時突遭致命挫敗！空手而歸且體力重挫！`);
             if (leaderStamina <= 0) { leaderStamina = 0; leaderFTurns = 3; phaseLogs.push(`［重傷］您傷勢過重，陷入重傷昏厥 (3時段)！`); }
           }
        } else {
           const slave = updatedSlaves.find(s => s.id === dispatch.slaveId);
           if (slave) {
              const isSuccess = Math.random() < (dispatch.mission.successRate ?? 1.0);
              if (isSuccess) {
                const intelligenceStat = slave.isInjured ? Math.floor(slave.primaryStats.intelligence * 0.5) : slave.primaryStats.intelligence;
                const successChance = intelligenceStat / 200;
                if (Math.random() < successChance) {
                   baseReward = Math.floor(baseReward * 1.5);
                   phaseLogs.push(`［大捷］${slave.name} 憑藉智力完美規避風險，帶回額外 1.5 倍收益！`);
                }
                earnedGold += baseReward;
                earnedFood += foodReward;

                let updatedSkills = { ...slave.skills };
                if (dispatch.mission.rank === '紫色') {
                  if (Math.random() > 0.5) earnedPrestige += Math.floor(Math.random() * 20) + 10;
                  else { const keys = ['combat', 'housework', 'survival'] as const; const k = keys[Math.floor(Math.random() * keys.length)]; if (updatedSkills[k] < 10) updatedSkills[k] += 1; }
                }
                
                const finalStamina = Math.max(0, slave.conditionStats.stamina - Math.max(10, dispatch.mission.staminaCost - ((slave.isInjured ? Math.floor(slave.skills.combat * 0.5) : slave.skills.combat) * 2)));
                slave.conditionStats.stamina = finalStamina;
                slave.conditionStats.stress = Math.min(100, slave.conditionStats.stress + dispatch.mission.stressGain);
                
                const obReward = dispatch.mission.obedienceReward || 0;
                if (obReward > 0) {
                  slave.primaryStats.obedience = Math.min(100, slave.primaryStats.obedience + obReward);
                  phaseLogs.push(`［捷報］${slave.name} 順利完成 ${dispatch.mission.title}，服從度提升 ${obReward} 點！`);
                } else {
                  phaseLogs.push(`［平安歸隊］${slave.name} 已安全完成 ${dispatch.mission.title}。`);
                }

                slave.activityStatus = '閒置';
                slave.skills = updatedSkills;

                if (finalStamina <= 0 && !slave.isInjured) {
                  slave.conditionStats.stamina = 0; slave.faintTurns = 5;
                  slave.primaryStats.obedience = Math.max(0, slave.primaryStats.obedience - 5);
                  slave.conditionStats.stress = Math.min(100, slave.conditionStats.stress + 15);
                }
              } else {
                slave.conditionStats.stamina = Math.max(0, slave.conditionStats.stamina - 40);
                slave.conditionStats.stress = Math.min(100, slave.conditionStats.stress + 20);
                slave.activityStatus = '閒置';
                phaseLogs.push(`［慘敗］${slave.name} 在執行 ${dispatch.mission.title} 時突遭致命挫敗！空手而歸且體力重挫！`);

                if (slave.conditionStats.stamina <= 0) {
                  slave.faintTurns = 5;
                  slave.primaryStats.obedience = Math.max(0, slave.primaryStats.obedience - 5);
                  slave.conditionStats.stress = Math.min(100, slave.conditionStats.stress + 15);
                }
              }
           }
        }
      } else { newDispatches.push(dispatch); }
    });

    if (earnedGold > 0) get().addGold(earnedGold); 
    if (earnedPrestige > 0) get().addPrestige(earnedPrestige);
    if (earnedFood > 0) get().addFood(earnedFood);
    set({ activeDispatches: newDispatches });

    let newShopStock: Record<string, number> = { ...player.shopStock };
    let newArenaNPCs = state.arenaNPCs;
    
    let dailyLogs: string[] = [];

    if (triggerDailySettlement) {
      newShopStock = { ...DEFAULT_SHOP_STOCK };
      newArenaNPCs = generateArenaNPCs();
      
      let isBankrupt = false;
      let rentCost = player.location === 'Frontlines' ? 500 : player.location === 'NeutralHub' ? 3000 : 10000;
      
      if (triggerWeeklyRent) {
         if (get().player.gold >= rentCost) {
            get().deductGold(rentCost);
            dailyLogs.push(`［繳納地租］已從金庫扣除本週地租 $${rentCost}，獲得片刻安寧。`);
         } else {
            get().deductGold(get().player.gold);
            get().deductPrestige(100);
            isBankrupt = true;
            dailyLogs.push(`［⚠️ 破產危機］資金斷裂！無法支付地租 $${rentCost}，商會威望掃地，據點內陷入極大恐慌與叛逆！`);
         }
      }

      const maid = updatedSlaves.find(s => s.role === 'maid');
      const totalPeople = updatedSlaves.length + 1; 
      const foodNeeded = totalPeople * GAME_CONSTANTS.FOOD_CONSUMPTION_PER_SLAVE;
      
      if (maid && (maid.faintTurns || 0) === 0) {
        const maidHousework = maid.isInjured ? Math.floor((maid.skills?.housework || 1) * 0.5) : (maid.skills?.housework || 1);
        newDirtiness = Math.max(0, newDirtiness - (maidHousework * 15));
        
        maid.conditionStats.stamina = Math.max(0, maid.conditionStats.stamina - 15);
        if (maid.conditionStats.stamina <= 0) {
          maid.faintTurns = 5;
          maid.primaryStats.obedience = Math.max(0, maid.primaryStats.obedience - 10);
          maid.conditionStats.stress = Math.min(100, maid.conditionStats.stress + 30);
          dailyLogs.push(`［傭人過勞］打掃管家【${maid.name}】因無腦高強度打掃致使體力徹底榨乾，陷入昏厥罷工。`);
        }

        const discount = Math.min(0.9, maidHousework * 0.05);
        const foodUnitPrice = Math.floor(20 * (1 - discount));
        const foodMissing = Math.max(0, foodNeeded - get().player.food);
        
        if (foodMissing > 0 && !isBankrupt) {
           const cost = foodMissing * foodUnitPrice;
           if (get().player.gold >= cost) {
              get().deductGold(cost);
              get().addFood(foodMissing);
              dailyLogs.push(`［管家後勤］管家 ${maid.name} 憑藉交涉技巧，花費 $${cost} 替商會採購了 ${foodMissing} 單位糧食。`);
           } else {
              const affordableFood = Math.floor(get().player.gold / foodUnitPrice);
              if (affordableFood > 0) {
                 get().deductGold(affordableFood * foodUnitPrice);
                 get().addFood(affordableFood);
                 dailyLogs.push(`［管家後勤］資金枯竭，管家 ${maid.name} 僅能勉強花費 $${affordableFood * foodUnitPrice} 買到 ${affordableFood} 單位口糧。`);
              }
           }
        }
      }

      let isStarving = false;
      if (get().player.food >= foodNeeded) {
         get().deductFood(foodNeeded);
      } else {
         get().deductFood(get().player.food);
         isStarving = true;
         dailyLogs.push(`［⚠️ 飢荒蔓延］口糧徹底耗盡！首領與所有成員強制進入飢餓狀態！`);
      }

      if (isStarving) {
         leaderStamina = Math.max(0, leaderStamina - 20);
         if (leaderStamina === 0 && leaderFTurns === 0) {
            leaderFTurns = 3;
            dailyLogs.push(`［首領倒下］您因嚴重飢餓與過勞，陷入重傷昏厥！`);
         }
      }

      if (isBankrupt) {
         updatedSlaves.forEach(s => {
            s.conditionStats.stress = Math.min(100, s.conditionStats.stress + 40);
            s.conditionStats.rebellion = Math.min(100, s.conditionStats.rebellion + 50);
         });
      }

      let escapedNames: string[] = [];
      let suppressedNames: string[] = [];
      
      const rebels = updatedSlaves.filter(s => s.conditionStats.rebellion >= 100 && (s.faintTurns || 0) === 0 && !s.isInjured);
      const security = updatedSlaves.find(s => s.role === 'security');

      let totalStolenGold = 0; let totalPrestigeLoss = 0;

      if (rebels.length > 0) {
        if (!security || (security.faintTurns || 0) > 0 || security.conditionStats.rebellion >= 100) {
          rebels.forEach(r => { escapedNames.push(r.name); totalStolenGold += Math.floor(Math.random() * 1500) + 500; totalPrestigeLoss += Math.floor(Math.random() * 20) + 10; });
        } else {
          for (let rebel of rebels) {
            if (security.conditionStats.stamina <= 0 || (security.faintTurns || 0) > 0) {
              escapedNames.push(rebel.name); totalStolenGold += Math.floor(Math.random() * 1500) + 500; totalPrestigeLoss += Math.floor(Math.random() * 20) + 10;
              continue;
            }
            let secHpMax = (security.isInjured ? Math.floor(security.primaryStats.endurance * 0.5) : security.primaryStats.endurance) * 5; let secHp = Math.floor(secHpMax * (security.conditionStats.stamina / 100));
            let rebHpMax = (rebel.isInjured ? Math.floor(rebel.primaryStats.endurance * 0.5) : rebel.primaryStats.endurance) * 5; let rebHp = Math.floor(rebHpMax * (rebel.conditionStats.stamina / 100));

            let secAtk = security.isInjured ? Math.floor(security.primaryStats.combat * 0.5) : security.primaryStats.combat; let secDef = security.isInjured ? Math.floor(security.primaryStats.endurance * 0.25) : Math.floor(security.primaryStats.endurance * 0.5);
            let rebAtk = rebel.isInjured ? Math.floor(rebel.primaryStats.combat * 0.5) : rebel.primaryStats.combat; let rebDef = rebel.isInjured ? Math.floor(rebel.primaryStats.endurance * 0.25) : Math.floor(rebel.primaryStats.endurance * 0.5);

            while (secHp > 0 && rebHp > 0) { rebHp -= Math.max(1, secAtk - rebDef); if (rebHp <= 0) break; secHp -= Math.max(1, rebAtk - secDef); }

            if (secHp > 0) {
              suppressedNames.push(rebel.name);
              rebel.isInjured = true; rebel.conditionStats.stamina = 0; rebel.conditionStats.rebellion = 0;
              security.conditionStats.stamina = Math.max(0, Math.floor((secHp / secHpMax) * 100));
              if (security.conditionStats.stamina <= 0) { security.faintTurns = 5; }
            } else {
              escapedNames.push(rebel.name); totalStolenGold += Math.floor(Math.random() * 1500) + 500; totalPrestigeLoss += Math.floor(Math.random() * 20) + 10;
              security.conditionStats.stamina = 0; security.faintTurns = 5; security.conditionStats.stress = Math.min(100, security.conditionStats.stress + 40); security.primaryStats.obedience = Math.max(0, security.primaryStats.obedience - 15); security.conditionStats.rebellion = Math.min(100, security.conditionStats.rebellion + 20);
            }
          }
        }
      }

      updatedSlaves.forEach(slave => {
        if (escapedNames.includes(slave.name)) return;
        let currentIsInjured = slave.isInjured; if (currentIsInjured && slave.conditionStats.stamina >= 100) { currentIsInjured = false; }
        let newStamina = slave.conditionStats.stamina; let newStress = slave.conditionStats.stress; let newRebellion = slave.conditionStats.rebellion;
        let fTurns = slave.faintTurns || 0;

        if (isStarving) { newStress = Math.min(100, newStress + 20); newRebellion = Math.min(100, newRebellion + 10); } else {
          if (slave.activityStatus === '閒置' && (slave.role === 'none' || !slave.role) && fTurns === 0) { newStamina = Math.min(100, newStamina + (newDirtiness > 50 ? 10 : 30)); if (overpopulation === 0) newStress = Math.max(0, newStress - 5); }
          if (newDirtiness > 80) { newStress = Math.min(100, newStress + 20); const rebGain = Math.max(1, 15 - Math.floor(slave.primaryStats.obedience / 10)); newRebellion = Math.min(100, newRebellion + rebGain); }
          if (overpopulation > 0) { newStress = Math.min(100, newStress + (overpopulation * 5)); const rebGain = Math.max(1, 3 - Math.floor(slave.primaryStats.obedience / 20)); newRebellion = Math.min(100, newRebellion + rebGain); }
        }

        if (slave.primaryStats.obedience >= 80) newRebellion = Math.max(0, newRebellion - 3);

        if (newStamina <= 0 && !slave.isInjured && fTurns === 0) {
          newStamina = 0; fTurns = 5; slave.primaryStats.obedience = Math.max(0, slave.primaryStats.obedience - 5); newStress = Math.min(100, newStress + 15);
        }

        slave.isInjured = currentIsInjured; slave.conditionStats.stamina = newStamina; slave.conditionStats.stress = newStress; slave.conditionStats.rebellion = newRebellion; slave.faintTurns = fTurns;
      });

      if (escapedNames.length > 0) {
         const actualStolen = Math.min(get().player.gold, totalStolenGold); const actualPrestigeLoss = Math.min(get().player.prestige, totalPrestigeLoss);
         set((s: GameStore) => ({ player: { ...s.player, gold: Math.max(0, s.player.gold - actualStolen), prestige: Math.max(0, s.player.prestige - actualPrestigeLoss) } }));
         dailyLogs.push(`［越獄成功］以下成員逃離據點：【${escapedNames.join('】、【')}】\n商會損失資金：$${actualStolen}，威望降低 ${actualPrestigeLoss} 點。`);
      }

      if (suppressedNames.length > 0) {
        dailyLogs.push(`［成功鎮壓］守衛成功擊潰以下成員的叛逃企圖：【${suppressedNames.join('】、【')}】\n上述成員已被強制重傷拘禁，反抗心清零。`);
      }

      let nextEvent = null;
      if (get().player.location === 'NeutralHub' && Math.random() < 0.4) { nextEvent = { id: 'evt1', type: 'merchant', desc: '【地頭蛇老張】急需一名服從度達 60 的女性半獸人。', reqRace: '半獸人', reqGender: 'Female', reqStat: { key: 'obedience', val: 60 }, reward: { gold: 12000, prestige: 20, item: 'potion_heal_small' } } as const; } 
      else if (get().player.location === 'Capital' && Math.random() < 0.3) { nextEvent = { id: 'evt2', type: 'noble', desc: '【腥紅伯爵】徵求武力達 80 的精靈。', reqRace: '精靈', reqStat: { key: 'combat', val: 80 }, reward: { gold: 35000, prestige: 100, item: 'weapon_iron_sword' } } as const; }

      triggerBackgroundMarketRefresh(); 
      set({ dailyMissions: generateDailyMissions(), activeEvent: nextEvent });
      
      const finalSlaves = updatedSlaves.filter(sl => !escapedNames.includes(sl.name));
      set({ slaves: finalSlaves });
    } else {
      set({ slaves: updatedSlaves });
    }

    set((s: GameStore) => ({ 
      player: { ...s.player, day: nextDay, timePhase: nextPhase, actionPoints: newAp, lastApUpdateTime: newApUpdateTime, roomDirtiness: newDirtiness, shopStock: newShopStock, leaderStamina, leaderFaintTurns: leaderFTurns }, 
      arenaNPCs: triggerDailySettlement ? newArenaNPCs : s.arenaNPCs 
    }));

    if (triggerDailySettlement) {
       if (phaseLogs.length > 0) dailyLogs = [...phaseLogs, ...dailyLogs];
       if (dailyLogs.length > 0) {
          setTimeout(() => { get().setGlobalModal({ title: '［每日經濟結算］', message: dailyLogs.join('\n\n'), isConfirm: false }); }, 250);
       }
    } else {
       if (phaseLogs.length > 0) {
          setTimeout(() => { get().setGlobalModal({ title: '［外派結果回報］', message: phaseLogs.join('\n\n'), isConfirm: false }); }, 250);
       }
    }
    
    get().syncProfileToCloud();
  }
});
