import { StateCreator } from 'zustand';
import { GameStore } from '../../types/storeTypes';
import { Gender, Location } from '../../types';
import { ITEMS_DATA } from '../../utils/gameData';

const DEFAULT_SHOP_STOCK: Record<string, number> = { 'potion_heal_small': 5, 'weapon_iron_sword': 1 }; 

export const createPlayerSlice: StateCreator<GameStore, [], [], any> = (set, get) => ({
  player: { 
    leaderName: '神秘的支配者', leaderGender: 'Male', leaderStamina: 100, leaderFaintTurns: 0,
    day: 1, timePhase: '早上', gold: 99999, food: 120, location: 'Frontlines', roomDirtiness: 0, maxSlaveCapacity: 5, prestige: 9999, actionPoints: 50, lastApUpdateTime: Date.now(),
    deviceId: '', unlockedFacilities: [], usedIdentityIds: [],
    inventory: {} as Record<string, number>, quests: {}, abyssFloor: 1, shopStock: { ...DEFAULT_SHOP_STOCK }
  },
  
  setPlayerNameAndGender: (name: string, gender: Gender) => set((state: GameStore) => ({ player: { ...state.player, leaderName: name, leaderGender: gender } })),
  
  addGold: (amount: number) => set((state: GameStore) => ({ player: { ...state.player, gold: state.player.gold + amount } })),
  deductGold: (amount: number) => set((state: GameStore) => ({ player: { ...state.player, gold: Math.max(0, state.player.gold - amount) } })),
  addFood: (amount: number) => set((state: GameStore) => ({ player: { ...state.player, food: state.player.food + amount } })),
  deductFood: (amount: number) => set((state: GameStore) => ({ player: { ...state.player, food: Math.max(0, state.player.food - amount) } })),
  addPrestige: (amount: number) => set((state: GameStore) => ({ player: { ...state.player, prestige: state.player.prestige + amount } })),
  deductPrestige: (amount: number) => set((state: GameStore) => ({ player: { ...state.player, prestige: Math.max(0, state.player.prestige - amount) } })),
  
  changeLocation: (loc: Location) => { 
    set((state: GameStore) => { 
      let capacity = 5; let cost = 0;
      if (loc === 'NeutralHub') { capacity = 10; cost = 12000; }
      if (loc === 'Capital') { capacity = 20; cost = 40000; }
      if (loc === 'Frontlines') { capacity = 5; cost = 0; }
      
      const currentRank = state.player.location === 'Capital' ? 3 : state.player.location === 'NeutralHub' ? 2 : 1;
      const targetRank = loc === 'Capital' ? 3 : loc === 'NeutralHub' ? 2 : 1;
      
      if (targetRank > currentRank) {
        if (state.player.gold < cost) {
          setTimeout(() => { get().setGlobalModal({ title: '［資金不足］', message: `向上搬遷至該區域需要支付一個月的通行費 $${cost}。`, isConfirm: false }); }, 50);
          return state;
        }
        return { player: { ...state.player, gold: state.player.gold - cost, location: loc, maxSlaveCapacity: capacity } };
      }
      return { player: { ...state.player, location: loc, maxSlaveCapacity: capacity } }; 
    }); 
    get().checkQuestCompletion(); 
  },

  buyItem: (itemId: string) => set((state: GameStore) => {
    const item = ITEMS_DATA[itemId]; const stock = state.player.shopStock[itemId] || 0;
    if (item && state.player.gold >= item.price && stock > 0) {
        const newInv: Record<string, number> = { ...state.player.inventory, [itemId]: (state.player.inventory[itemId] || 0) + 1 };
        const newStock: Record<string, number> = { ...state.player.shopStock, [itemId]: stock - 1 };
        return { player: { ...state.player, gold: state.player.gold - item.price, inventory: newInv, shopStock: newStock } };
    }
    return state;
  }),

  useItem: (itemId: string, slaveId: string) => set((state: GameStore) => {
    const item = ITEMS_DATA[itemId]; const qty = state.player.inventory[itemId] || 0;
    if (qty > 0 && item.type === 'potion') {
        let healAmount = item.effect.stamina || 0;
        const newInv: Record<string, number> = { ...state.player.inventory, [itemId]: qty - 1 }; 
        if (newInv[itemId] <= 0) delete newInv[itemId];
        
        if (slaveId === 'LEADER') {
            const newStamina = Math.min(100, (state.player.leaderStamina ?? 100) + healAmount);
            return { player: { ...state.player, leaderStamina: newStamina, leaderFaintTurns: 0, inventory: newInv } };
        } else {
            const slave = state.slaves.find(s => s.id === slaveId);
            if (slave) {
                if (slave.isInjured) { healAmount = Math.floor(healAmount * 0.5); }
                const newStamina = Math.min(100, slave.conditionStats.stamina + healAmount);
                return { player: { ...state.player, inventory: newInv }, slaves: state.slaves.map(s => s.id === slaveId ? { ...s, conditionStats: { ...s.conditionStats, stamina: newStamina }, faintTurns: 0 } : s) };
            }
        }
    }
    return state;
  }),

  equipWeapon: (itemId: string, slaveId: string) => set((state: GameStore) => {
    const qty = state.player.inventory[itemId] || 0; const slave = state.slaves.find(s => s.id === slaveId);
    if (qty > 0 && slave && ITEMS_DATA[itemId].type === 'weapon') {
        const oldWeapon = slave.equipment?.weaponId; 
        const newInv: Record<string, number> = { ...state.player.inventory, [itemId]: qty - 1 };
        if (oldWeapon) newInv[oldWeapon] = (newInv[oldWeapon] || 0) + 1; 
        if (newInv[itemId] <= 0) delete newInv[itemId];
        
        const obedienceBonus = oldWeapon ? 0 : 10;
        const newObedience = Math.min(100, slave.primaryStats.obedience + obedienceBonus);

        return { 
          player: { ...state.player, inventory: newInv }, 
          slaves: state.slaves.map(s => s.id === slaveId ? { ...s, equipment: { weaponId: itemId }, primaryStats: { ...s.primaryStats, obedience: newObedience } } : s) 
        };
    }
    return state;
  }),

  unequipWeapon: (slaveId: string) => set((state: GameStore) => {
    const slave = state.slaves.find(s => s.id === slaveId);
    if (slave && slave.equipment?.weaponId) {
      const oldWeapon = slave.equipment.weaponId;
      const newInv: Record<string, number> = { ...state.player.inventory, [oldWeapon]: (state.player.inventory[oldWeapon] || 0) + 1 };
      const newObedience = Math.max(0, slave.primaryStats.obedience - 10);
      
      return {
        player: { ...state.player, inventory: newInv },
        slaves: state.slaves.map(s => s.id === slaveId ? { ...s, equipment: undefined, primaryStats: { ...s.primaryStats, obedience: newObedience } } : s)
      };
    }
    return state;
  })
});
