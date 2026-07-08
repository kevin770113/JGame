/**
 * V2.11.0 靜態雙語名字備援庫
 * 格式：English Name|繁體中文名字
 */
export const FALLBACK_SLAVE_NAMES = [
  "Kael|凱爾",
  "Zephyr|澤菲爾",
  "Thorne|索恩",
  "Eldrin|艾爾德林",
  "Varian|瓦里安",
  "Garrick|加里克",
  "Malakor|馬拉科",
  "Rowan|羅安",
  "Bram|布蘭",
  "Caelum|凱隆",
  "Dorian|多利安",
  "Evander|伊凡德",
  "Faramir|法拉米爾",
  "Gideon|吉翁",
  "Harlan|哈蘭",
  "Idris|伊德里斯",
  "Jarek|賈雷克",
  "Kaelen|凱倫",
  "Lysander|利桑德",
  "Marek|馬雷克",
  "Nicos|尼科斯",
  "Orion|奧利恩",
  "Valerius|瓦勒留",
  "Xanthos|桑索斯",
  "Zarek|查雷克",
  "Aveline|阿芙琳",
  "Bryn|布琳",
  "Cora|科拉",
  "Dahlia|黛莉亞",
  "Elysia|艾莉西亞",
  "Freya|芙蕾雅",
  "Gwen|關",
  "Hestia|赫斯提亞",
  "Iris|艾莉絲",
  "Juno|朱諾",
  "Kira|吉拉",
  "Lyra|萊拉",
  "Maeve|梅芙",
  "Nesta|內斯塔",
  "Opal|歐泊",
  "Rhiannon|里安儂",
  "Seraphina|塞拉菲娜",
  "Talia|塔莉亞",
  "Valeria|瓦勒莉亞",
  "Wren|雷恩",
  "Yvaine|伊凡妮",
  "Zelda|薩爾達"
];

export const getRandomFallbackName = (): string => {
  const index = Math.floor(Math.random() * FALLBACK_SLAVE_NAMES.length);
  return FALLBACK_SLAVE_NAMES[index];
};
