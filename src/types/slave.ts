// 定義六大種族
export type Race = 'Orc' | 'Dwarf' | 'Elf' | 'Dragon' | 'Undead' | 'Human';

// 定義特質種類
export type TraitType = 'Racial' | 'Mutation';

// 永久能力值結構
export interface PrimaryStats {
  combat: number;       // 武力
  endurance: number;    // 體質
  intelligence: number; // 智力
  obedience: number;    // 服從度
}

// 動態狀態值結構
export interface ConditionStats {
  stamina: number;      // 體力 (通常為 0-100)
  stress: number;       // 壓力 (過高會增加反抗)
  rebellion: number;    // 反抗值 (爆發會引發逃跑或破壞)
}

// 單一特質結構
export interface Trait {
  id: string;
  name: string;
  type: TraitType;
  description: string;
}

// 奴隸（成員）主結構
export interface Slave {
  id: string;           // 唯一識別碼
  name: string;         // 姓名 (後續可由 AI 生成)
  race: Race;           // 種族
  primaryStats: PrimaryStats;
  conditionStats: ConditionStats;
  traits: Trait[];      // 所擁有的特質陣列
  
  // AI 動態生成的背景故事 (設為可選欄位)
  backgroundStory?: string;
  
  // 基因繼承與族譜系統 (記錄雙親 ID)
  parents?: {
    fatherId?: string;
    motherId?: string;
  };
}
