import { Slave, Player, Location, TimePhase, Race, Gender, Scene, SubView, CombatLog, ActiveWindow, CombatPlaybackData, Role } from './index';

export interface Mission {
  id: string; title: string; rank: '黃金' | '紫色' | '蔚藍' | '翠綠';
  requiredPhases: number; staminaCost: number; stressGain: number; reward: number; description: string;
  successRate: number; 
  obedienceReward: number;
}

export interface ActiveDispatch {
  slaveId: string; mission: Mission; remainingPhases: number;
}

export interface DynamicEvent {
  id: string; type: 'merchant' | 'noble'; desc: string;
  reqRace?: Race; reqGender?: Gender; reqStat?: { key: 'combat' | 'obedience'; val: number };
  reward: { gold: number; prestige: number; item?: string };
}

export interface GlobalModal {
  title: string; message: string; isConfirm: boolean; action?: () => void;
}

export interface ArenaNPC {
  id: string; location: Location; name: string; description: string;
  stats: { combat: number; endurance: number; intelligence: number; charisma: number; luck: number };
  rewardGold: number; rewardPrestige: number;
}

export interface GameStore {
  player: Player & { shopStock: Record<string, number> }; 
  slaves: Slave[];
  marketSlaves: Slave[];
  arenaNPCs: ArenaNPC[];
  isMarketGenerating: boolean;
  isPoolGenerating: boolean;
  currentScene: Scene;
  currentSubView: SubView;
  dailyMissions: Mission[];
  activeDispatches: ActiveDispatch[];
  activeEvent: DynamicEvent | null; 
  globalModal: GlobalModal | null; 
  activeWindow: ActiveWindow | null; 
  isSaving: boolean; 
  localSaveVersion: number; 
  _hasHydrated: boolean;
  activeCombat: CombatPlaybackData | null;

  setPlayerNameAndGender: (name: string, gender: Gender) => void;
  setActiveWindow: (win: ActiveWindow | null) => void;
  setGlobalModal: (modal: GlobalModal | null) => void;
  setIsSaving: (val: boolean) => void; 
  setHasHydrated: (val: boolean) => void;
  setActiveCombat: (combat: CombatPlaybackData | null) => void;
  appointRole: (slaveId: string, role: Role) => void; 
  
  syncProfileToCloud: () => Promise<void>;
  loadProfileFromCloud: (forceLoad?: boolean) => Promise<void>; 
  consumeIdentity: () => Promise<{name: string, story: string}>;
  
  addGold: (amount: number) => void;
  deductGold: (amount: number) => void;
  addFood: (amount: number) => void;
  deductFood: (amount: number) => void;
  addPrestige: (amount: number) => void;
  deductPrestige: (amount: number) => void;
  changeLocation: (loc: Location) => void;
  navigate: (scene: Scene, subView: SubView) => void;
  
  performHousekeeping: (workerId: string) => void;
  
  addSlave: (slave: Slave) => void;
  updateSlave: (id: string, updates: Partial<Slave>) => void;
  sellSlave: (slaveId: string) => void; 
  dispatchSlave: (slaveId: string, missionId: string) => void;
  triggerBackgroundMarketRefresh: () => Promise<void>;
  checkApRecovery: () => void; 
  processTurn: () => void;
  executeArenaBattle: (slaveId: string, npcId: string) => { logs: CombatLog[], isWin: boolean } | null;
  executeAbyssBattle: (slaveId: string) => { logs: CombatLog[], isWin: boolean } | null;

  buyItem: (itemId: string) => void;
  useItem: (itemId: string, slaveId: string) => void;
  equipWeapon: (itemId: string, slaveId: string) => void;
  unequipWeapon: (slaveId: string) => void;
  fulfillEvent: (slaveId: string) => boolean;

  triggerQuest: (questId: string) => void;
  checkQuestCompletion: () => void;
}
