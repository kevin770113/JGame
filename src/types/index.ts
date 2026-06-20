// 1. 空間場景與路由型別 (新增)
// 大場景：決定背景與主選單
export type Scene = 'Home' | 'Town';
// 子視圖：決定中央畫面的具體功能面板
export type SubView = 'Main' | 'Room' | 'Market' | 'Tavern' | 'Map';

// 2. 種族全面中文化
export type Race = '人類' | '精靈' | '半獸人' | '矮人' | '不死族' | '龍族';

// 3. 生物特徵型別
export type Gender = 'Male' | 'Female';

// 4. 時間軸時段型別
export type TimePhase = '早上' | '中午' | '下午' | '晚上' | '深夜';

// 5. 據點地緣型別
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

// 奴隸資料模型
export interface Slave {
  id: string;
  name: string;
  race: Race;
  gender: Gender;
  primaryStats: PrimaryStats;
  conditionStats: ConditionStats;
  traits: string[];
  backgroundStory: string;
  parents?: {
    fatherId: string;
    motherId: string;
  };
}

// 玩家資料模型 (擴充內政變數)
export interface Player {
  day: number;             // 天數 (從第 1 天開始)
  timePhase: TimePhase;    // 當前時段
  gold: number;            // 資金
  food: number;            // 糧食
  location: Location;      // 當前據點
  
  // ▼ 本次重構新增的內政與基建變數 ▼
  roomDirtiness: number;    // 房間髒亂度 (0 ~ 100)，過高會引發反噬
  maxSlaveCapacity: number; // 奴隸容納上限 (依據點與設施而異)
}
