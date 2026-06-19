// 定義三個地緣據點選項
// Frontlines: 混亂前線 | NeutralHub: 中立貿易城 | Capital: 安逸皇城
export type Location = 'Frontlines' | 'NeutralHub' | 'Capital';

// 玩家全局狀態結構
export interface PlayerState {
  turn: number;         // 當前回合數
  gold: number;         // 當前持有資金
  food: number;         // 糧食存量 (維持奴隸生存必需)
  location: Location;   // 目前所在據點
}
