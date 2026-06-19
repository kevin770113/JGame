// 集中管理遊戲內的靜態數值與初始設定
export const GAME_CONSTANTS = {
  // 開局基礎資源
  INITIAL_GOLD: 5000,
  INITIAL_FOOD: 100,
  INITIAL_TURN: 1,
  
  // 搬家所需費用對照表
  RELOCATION_COST: {
    Frontlines: 500,     // 搬至前線成本低
    NeutralHub: 1500,    // 中立城居中
    Capital: 5000,       // 進駐皇城極為昂貴
  },

  // 日常維護設定
  FOOD_CONSUMPTION_PER_SLAVE: 1, // 每位奴隸每回合消耗的糧食
};
