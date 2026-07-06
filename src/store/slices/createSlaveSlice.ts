import { StateCreator } from 'zustand';
import { GameStore } from '../../types/storeTypes';
import { Slave, Role } from '../../types';
import { fetchIdentityBatch } from '../../services/aiService';
import { supabase } from '../../services/supabaseClient';
import { generateBaseMarketSlave } from '../../utils/generators';

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
    if (!session) return { name: "無名幽影", story: "" };
    
    set({ isPoolGenerating: true });
    
    try {
      const usedIds = get().player.usedIdentityIds;
      let query = supabase.from('global_identities').select('*');
      if (usedIds.length > 0) {
         query = query.not('id', 'in', `(${usedIds.join(',')})`);
      }
      
      const { data: poolData, error: poolError } = await query.limit(50);
      if (poolError) throw poolError;
      
      const availableIdentities = poolData || [];
      let identity = availableIdentities.length > 0 ? availableIdentities[0] : null;
      
      if (!identity) {
         const newAiData = await fetchIdentityBatch(); 
         const { data: insertedData, error: insertError } = await supabase.from('global_identities').insert(newAiData).select();
         if (insertError) throw insertError;
         if (insertedData && insertedData.length > 0) identity = insertedData[0];
      }
      
      if (!identity) throw new Error('AI 與資料庫雙重潰堤');
      
      const { error: logError } = await supabase.from('user_identity_logs').insert({ user_id: session.user.id, identity_id: identity.id });
      if (logError) console.warn("［寫入紀錄失敗］", logError); 
      
      const newUsedIds = [...get().player.usedIdentityIds, identity.id];
      set((s: GameStore) => ({ player: { ...s.player, usedIdentityIds: newUsedIds } }));
      
      return { name: identity.name, story: identity.story || "" };
    } catch (e) {
      console.error("［系統攔截］", e); 
      return { name: `代號 ${Math.floor(Math.random() * 9000 + 1000)}`, story: "" };
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
