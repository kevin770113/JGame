// 1. 空間場景與路由型別
export type Scene = 'Home' | 'Town';
export type SubView = 'Main' | 'Room' | 'Market' | 'Tavern' | 'Map' | 'Interaction'; // 新增 Interaction 路由

// 2. 種族與生物特徵
export type Race = '人類' | '精靈' | '半獸人' | '矮人' | '不死族' | '龍族';
export type Gender = 'Male' | 'Female';

// 3. 時間與地緣
export type TimePhase = '早上' | '中午' | '下午' | '晚上' | '深夜';
export type Location = 'Frontlines' | 'NeutralHub' | 'Capital';

// 4. ▼ 新增：成員動態狀態與技能系統 ▼
export type ActivityStatus = '閒置' | '外派中' | '特訓中';

export interface Skills {
  combat: number;    // 戰鬥專精 (影響高階任務)
  housework: number; // 內政管家 (影響打掃效率)
  survival: number;  // 生存本能 (影響日常消耗與隨機事件)
}

// 核心能力與動態狀態值結構
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

// 5. 奴隸資料模型 (注入狀態與技能)
export interface Slave {
  id: string;
  name: string;
  race: Race;
  gender: Gender;
  activityStatus: ActivityStatus; // 新增：狀態鎖定機制
  skills: Skills;                 // 新增：三維技能樹
  primaryStats: PrimaryStats;
  conditionStats: ConditionStats;
  traits: string[];
  backgroundStory: string;
  parents?: {
    fatherId: string;
    motherId: string;
  };
}

// 6. 玩家資料模型
export interface Player {
  day: number;
  timePhase: TimePhase;
  gold: number;
  food: number;
  location: Location;
  roomDirtiness: number;
  maxSlaveCapacity: number;
}
