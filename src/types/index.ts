export type Scene = 'Home' | 'Town';
export type SubView = 'Main' | 'Room' | 'Market' | 'Tavern' | 'Map' | 'Interaction' | 'Arena' | 'Abyss';

export type Race = '人類' | '精靈' | '半獸人' | '矮人' | '不死族' | '龍族';
export type Gender = 'Male' | 'Female';

export type TimePhase = '早上' | '中午' | '下午' | '晚上' | '深夜';
export type Location = 'Frontlines' | 'NeutralHub' | 'Capital';

export type ActivityStatus = '閒置' | '外派中' | '特訓中';

export interface Skills {
  combat: number;
  housework: number;
  survival: number;
}

export interface PrimaryStats {
  combat: number;
  endurance: number;
  intelligence: number;
  obedience: number;
}

export interface ConditionStats {
  stamina: number;
  stress: number;
  rebellion: number;
}

export interface Slave {
  id: string;
  name: string;
  race: Race;
  gender: Gender;
  activityStatus: ActivityStatus;
  skills: Skills;
  primaryStats: PrimaryStats;
  conditionStats: ConditionStats;
  traits: string[];
  backgroundStory: string;
  parents?: {
    fatherId: string;
    motherId: string;
  };
  equipment?: {
    weaponId?: string;
  };
}

export interface Player {
  day: number;
  timePhase: TimePhase;
  gold: number;
  food: number;
  location: Location;
  roomDirtiness: number;
  maxSlaveCapacity: number;
  prestige: number;
  actionPoints: number;      
  lastApUpdateTime: number;  
  deviceId: string;             
  unlockedFacilities: string[]; 
  usedIdentityIds: string[]; 
  // ★ V2.0 新增擴充系統狀態
  inventory: Record<string, number>; 
  quests: Record<string, 'hidden' | 'active' | 'completed'>;
  abyssFloor: number;
}

export interface ArenaNPC {
  id: string;
  name: string;
  description: string;
  location: Location;
  stats: { hp: number; attack: number; defense: number; speed: number; };
  rewardGold: number;
  rewardPrestige: number;
}

export interface CombatLog {
  round: number;
  message: string;
  type: 'info' | 'damage' | 'heal' | 'skill' | 'system';
}
