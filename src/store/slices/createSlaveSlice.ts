import { StateCreator } from 'zustand';
import { GameStore } from '../../types/storeTypes';
import { Slave, Role } from '../../types';
import { fetchIdentityBatch } from '../../services/aiService';
import { supabase } from '../../services/supabaseClient';
import { generateBaseMarketSlave } from '../../utils/generators';
import { getRandomFallbackName } from '../../utils/fallbackNames'; // ★ V2.11.0 引入備援庫

export const createSlaveSlice: StateCreator<GameStore, [], [], any> = (set, get) => ({
  slaves: [],
  marketSlaves: [],
  isMarketGenerating: false,
  isPoolGenerating: false,

  appointRole: (slaveId: string, role: Role) => set((state: GameStore) => {
    const target = state.slaves.find(s => s.id === slaveId);
    if (!target) return state;
    if (role !== 'none' && target.primaryStats.obedience < 80) {
      setTimeout(() => { get().setGlobalModal({ title: '［職務任免駁回］', message: `${target.name} 的服從度未達到 80 點，拒絕履行商會高級職務！`, isConfirm: false }); }, 50);
      return state;
    }
    const updated = state.slaves.map(s => {
      let r = s.role; if (role !== 'none' && s.role === role) r = 'none'; if (s.id === slaveId) r = role;
      return { ...s, role: r };
    });
    return { slaves: updated };
  }),

  addSlave: (slave: Slave) => { 
    set((state: GameStore) => ({ slaves: [...state.slaves, slave] })); 
    get().checkQuestCompletion(); 
  },

  updateSlave: (id: string, updates: Partial<Slave>) => set((state: GameStore) => ({ 
    slaves: state.slaves.map(s => s.id === id ? { ...s, ...updates, conditionStats: { ...s.conditionStats, ...(updates.conditionStats || {}) } } : s) 
  })),

  sellSlave: (slaveId: string) => set((state: GameStore) => {
    const slave = state.slaves.find(s => s.id === slaveId); if (!slave || slave.activityStatus !== '閒置') return state;
    const sellPrice = 50 + Math.floor((slave.primaryStats.combat + slave.primaryStats.endurance + slave.primaryStats.intelligence + slave.primaryStats.obedience) * 1.5) + ((slave.skills.combat + slave.skills.housework + slave.skills.survival) * 200);
    return { slaves: state.slaves.filter(s => s.id !== slaveId), player: { ...state.player, gold: state.player.gold + sellPrice } };
  }),

  triggerBackgroundMarketRefresh: async () => {
    if (get().isMarketGenerating) return;
    set({ isMarketGenerating: true, marketSlaves: [] });
    try { 
      const newSlaves = []; 
      for (let i = 0; i < 3; i++) { 
        const identity = await get().consumeIdentity(); 
        newSlaves.push(generateBaseMarketSlave(String(i), identity)); 
      } 
      set({ marketSlaves: newSlaves }); 
    } catch (e) { 
      console.error(e); 
    } finally { 
      set({ isMarketGenerating: false }); 
    }
  },

  consumeIdentity: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    // ★ 如果沒連線，直接抽本地備援，不走 AI，避免斷網卡死
    if (!session) return { name: getRandomFallbackName() };
    
    set({ isPoolGenerating: true });
    
    try {
      const usedIds = get().player.usedIdentityIds;
      let query = supabase.from('global_identities').select('*');
      if (usedIds.length > 0) {
         query = query.not('id', 'in', `(${usedIds.join(',')})`);
      }
      
      // ★ 防禦雪崩：我們只去資料庫拉資料。如果拉不到，不呼叫前端 AI，直接降級為本地備援。
      const { data: poolData, error: poolError } = await query.limit(1);
      if (poolError) throw poolError;
      
      const identity = (poolData && poolData.length > 0) ? poolData[0] : null;
      
      if (!identity) {
         console.warn('［系統］雲端名字庫已耗盡，啟動本地防禦備援陣列。');
         return { name: getRandomFallbackName() };
      }
      
      const { error: logError } = await supabase.from('user_identity_logs').insert({ user_id: session.user.id, identity_id: identity.id });
      if (logError) console.warn("［寫入紀錄失敗］", logError); 
      
      const newUsedIds = [...get().player.usedIdentityIds, identity.id];
      set((s: GameStore) => ({ player: { ...s.player, usedIdentityIds: newUsedIds } }));
      
      // ★ 徹底移除 story，僅回傳 name
      return { name: identity.name };
      
    } catch (e) {
      console.error("［系統攔截］", e); 
      return { name: getRandomFallbackName() };
    } finally {
      set({ isPoolGenerating: false });
    }
  },

  fulfillEvent: (slaveId: string) => {
    const state = get(); const evt = state.activeEvent; const slave = state.slaves.find(s => s.id === slaveId);
    if (!evt || !slave || slave.activityStatus !== '閒置') return false;
    if (evt.reqRace && slave.race !== evt.reqRace) return false;
    if (evt.reqGender && slave.gender !== evt.reqGender) return false;
    if (evt.reqStat && evt.reqStat.key === 'obedience' && slave.primaryStats.obedience < evt.reqStat.val) return false;
    if (evt.reqStat && evt.reqStat.key === 'combat' && slave.primaryStats.combat < evt.reqStat.val) return false;

    const newSlaves = state.slaves.filter(s => s.id !== slaveId); const newInv: Record<string, number> = { ...state.player.inventory };
    if (evt.reward.item) newInv[evt.reward.item] = (newInv[evt.reward.item] || 0) + 1;
    set({ slaves: newSlaves, activeEvent: null, player: { ...state.player, gold: state.player.gold + evt.reward.gold, prestige: state.player.prestige + evt.reward.prestige, inventory: newInv } });
    get().syncProfileToCloud(); return true;
  }
});
