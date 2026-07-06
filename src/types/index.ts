export type Scene = 'Home' | 'Town';
export type SubView = 'Main' | 'Room' | 'Market' | 'Tavern' | 'Map' | 'Interaction' | 'Arena' | 'Abyss';

export type Race = '人類' | '精靈' | '半獸人' | '矮人' | '不死族' | '龍族';
export type Gender = 'Male' | 'Female';

export type TimePhase = '早上' | '中午' | '下午' | '晚上' | '深夜';
export type Location = 'Frontlines' | 'NeutralHub' | 'Capital';

export type ActivityStatus = '閒置' | '外派中' | '特訓中';

export type Role = 'none' | 'maid' | 'security';

export type ActiveWindow = 'quest' | 'roster' | 'system' | null;

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
  charisma?: number;  
  luck?: number;      
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
  role: Role;            
  faintTurns: number;    
  skills: Skills;
  primaryStats: PrimaryStats;
  conditionStats: ConditionStats;
  traits: string[];
  backgroundStory?: string;
  parents?: {
    fatherId: string;
    motherId: string;
  };
  equipment?: {
    weaponId?: string;
  };
  combatRecord: { wins: number; losses: number; };
  isInjured: boolean;
}

export interface Player {
  // ★ V2.9.4 新增：首領本體實體化數據
  leaderName: string;
  leaderGender: Gender;
  leaderStamina: number;
  leaderFaintTurns: number;

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
  inventory: Record<string, number>; 
  quests: Record<string, 'hidden' | 'active' | 'completed'>;
  abyssFloor: number;
  shopStock: Record<string, number>;
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
  sHp?: number;
  nHp?: number;
  damage?: number;
}

export interface CombatPlaybackData {
  slaveId: string;
  slaveName: string;
  slaveMaxHp: number;
  npcName: string;
  npcMaxHp: number;
  logs: CombatLog[];
  isWin: boolean;
  rewardGold: number;
  rewardPrestige: number;
  isAbyss: boolean;
}

// ★ V2.9.4 新增：全域數值進位格式化工具 (供 UI 端統一呼叫)
export const formatK = (num: number): string => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
};
