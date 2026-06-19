// 1. 種族全面中文化
export type Race = '人類' | '精靈' | '半獸人' | '矮人' | '不死族' | '龍族';

// 2. 新增性別型別
export type Gender = 'Male' | 'Female';

// 3. 新增時間軸時段型別
export type TimePhase = '早上' | '中午' | '下午' | '晚上' | '深夜';

// 4. 據點地緣型別
export type Location = 'Frontlines' | 'NeutralHub' | 'Capital';

// 核心能力值結構
export interface PrimaryStats {
  combat: number;       // 武力
  endurance: number;    // 體質
  intelligence: number; // 智力
  obedience: number;    // 服從
}

// 動態狀態值結構
export interface ConditionStats {
  stamina: number;   // 體力 (0 ~ 100)
  stress: number;    // 壓力 (0 ~ 100)
  rebellion: number; // 反抗 (0 ~ 100)
}

// 5. 奴隸資料模型 (加入性別屬性)
export interface Slave {
  id: string;
  name: string;
  race: Race;
  gender: Gender; // 新增：決定命名方向與繁殖限制
  primaryStats: PrimaryStats;
  conditionStats: ConditionStats;
  traits: string[];
  backgroundStory: string;
  parents?: {
    fatherId: string;
    motherId: string;
  };
}

// 6. 玩家資料模型 (將 turn 升級為 day 與 timePhase)
export interface Player {
  day: number;             // 天數 (從第 1 天開始)
  timePhase: TimePhase;    // 當前時段
  gold: number;            // 資金
  food: number;            // 糧食
  location: Location;      // 當前據點
}
