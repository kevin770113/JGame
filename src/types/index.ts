export type Scene = 'Home' | 'Town';
export type SubView = 'Main' | 'Room' | 'Market' | 'Tavern' | 'Map' | 'Interaction';

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
}

export interface Player {
  day: number;
  timePhase: TimePhase;
  gold: number;
  food: number;
  location: Location;
  roomDirtiness: number;
  maxSlaveCapacity: number;
  prestige: number; // ［新增］商會威望
}
