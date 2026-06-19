# 遊戲設計文件：技術架構與 Cloudflare 自動化部署指南

本文件針對「輕量級網頁端（Web-based）策略模擬遊戲」規劃技術疊棧，並詳細說明如何利用 GitHub 與 Cloudflare Pages 建立完全免費、極速且具備自動化部署（CI/CD）的開發流程。

## 1. 前端技術選型 (Frontend Stack)

由於這類遊戲主要由**大量 UI、表格、數值面板與文字事件**組成，強烈建議採用「Web 前端框架」而非大型遊戲引擎（如 Unity/Unreal），以達到秒開、易維護、高靈活度的特性。

* **核心框架**：**Vite + React** 或 **Vite + Vue 3**
  * *優勢*：極速的開發熱更新（HMR），成熟的組件化設計，非常適合處理繁複的 UI 面板與狀態變更。
* **狀態管理**：**Zustand** (React) 或 **Pinia** (Vue)
  * *優勢*：遊戲核心是龐大的數值矩陣（每回合結算所有角色的狀態、金錢、時間）。需要一個輕量、高性能的全局狀態管理庫來充當「遊戲引擎核心（Game Core State）」。
* **UI 與樣式**：**Tailwind CSS**
  * *優勢*：透過原子化類名快速構建具備科技感或奇幻感的管理面板，完全免去編寫繁瑣 CSS 的痛苦。
* **資料持久化**：**LocalStorage / IndexedDB**
  * *優勢*：玩家的存檔（Save Slots）直接以 JSON 格式儲存於瀏覽器本地，免去初期架設後端資料庫的成本。

---

## 2. 遊戲系統架構設計 (Software Architecture)

┌────────────────────────────────────────────────────────┐
│                      瀏覽器 UI 層                       │
│     (CharacterPanel, Scheduler, UpgradeShop, etc.)     │
└───────────────────────────┬────────────────────────────┘
                            │ 讀取狀態 / 觸發 Action
                            v
┌────────────────────────────────────────────────────────┐
│               Zustand / Pinia 遊戲狀態機                │
│   ┌────────────────────────────────────────────────┐   │
│   │ 狀態管理 (GameState):                           │   │
│   │ - turn: 1, gold: 1000                          │   │
│   │ - characters: [ { id: 1, hp: 100, stress: 0 } ]│   │
│   └────────────────────────────────────────────────┘   │
│   ┌────────────────────────────────────────────────┐   │
│   │ 核心邏輯 (Actions):                             │   │
│   │ - executeTurn()  <-- 計算所有數值增減與事件觸發    │   │
│   │ - trainCharacter(id, type)                     │   │
│   └────────────────────────────────────────────────┘   │
└───────────────────────────┬────────────────────────────┘
                            │ 存檔存取
                            v
┌────────────────────────────────────────────────────────┐
│               LocalStorage / 雲端備份                  │
└────────────────────────────────────────────────────────┘

---

## 3. GitHub + Cloudflare Pages 部署流程 (CI/CD Pipeline)

透過此架構，您只需將代碼推送到 GitHub，Cloudflare 就會自動幫您編譯並發布遊戲，全球 CDN 加速。

### 步驟一：初始化本地專案與 Git
在您的電腦終端機執行：
`npm create vite@latest my-management-game -- --template react-ts`
`cd my-management-game`

# 安裝基礎依賴
`npm install`
`npm install zustand tailwindcss`

# 初始化 Git 倉庫
`git init`
`git add .`
`git commit -m "feat: 遊戲初始架構"`

### 步驟二：託管至 GitHub
1. 前往 GitHub 創建一個新的私有或公開倉庫，命名為 `my-management-game`。
2. 將本地倉庫與 GitHub 關聯並推送：
`git remote add origin https://github.com/您的用戶名/my-management-game.git`
`git branch -M main`
`git push -u origin main`

### 步驟三：配置 Cloudflare Pages
1. 登入 Cloudflare Dashboard。
2. 點擊左側導覽列的 **「Workers & Pages」** -> **「Create」** -> **「Pages」**。
3. 點擊 **「Connect to Git」**，授權您的 GitHub 帳號，並選擇 `my-management-game` 倉庫。
4. **Build settings (構建設置)** 配置如下：
   * **Framework preset (框架預設)**: 選擇 `Vite`
   * **Build command (構建命令)**: `npm run build` (或 `vite build`)
   * **Build output directory (輸出目錄)**: `dist`
5. 點擊 **「Save and Deploy」**。

> **自動化效益**：此後，只要您在本地修改了遊戲代碼，執行 Git 推送，Cloudflare 就會在 1 分鐘內自動抓取最新代碼、完成編譯，並更新您的遊戲網頁。

---

## 4. 進階擴充：雲端存檔與排行榜 (Cloudflare D1/KV)

當遊戲基本功能完成，想加入「玩家雲端存檔」或「全服排行榜」時，無需購買傳統伺服器，直接利用 Cloudflare 的 Serverless 生態：
* **Cloudflare KV (鍵值存儲)**：適合用來儲存玩家的「雲端備份存檔碼」，用玩家的 UID 作為 Key，存檔 JSON 字串作 Value。
* **Cloudflare D1 (SQL 資料庫)**：免費且極快的 SQLite 資料庫，適合用來記錄「玩家通關時間排行」、「全服最快達成傳奇公會」的排行榜數據。
* 
