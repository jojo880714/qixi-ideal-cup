/**
 * 8 種單身人格，對應 FactionKey。
 *
 * 文案（name/faction/tags/desc）＝ PLACEHOLDER，逐字取自原型，待文案定稿後整份替換。
 * 視覺欄位（bg/ink/frame/seal）＝ 已依 Design Spec v1.0 接入：
 *   - bg   結果卡／海報底色
 *   - ink  主文字色（對 bg 通過 WCAG AA）
 *   - frame「天字第一號條件」框線色、結果卡外框
 *   - seal 幾何印章：d1/d2 為 viewBox 64 的 SVG path，永遠以該型 ink 上色
 * 視覺若再改版，替換 bg/ink/frame/seal 即可，其餘程式碼不需改動。
 */

import type { FactionKey } from "./traits";

export interface PersonaSeal {
  /** 印章主 path（viewBox 0 0 64 64 座標系）。 */
  d1: string;
  /** 印章副 path；spark 型只有單一 path，此處為空字串。 */
  d2: string;
  /** 印章語意說明（供設計備註／alt 文字參考）。 */
  meaning: string;
}

export interface Persona {
  key: FactionKey;
  name: string;
  /** 描述性副標（原「XX型單身」名），顯示在派名下方。 */
  subtitle: string;
  faction: string;
  bg: string;
  ink: string;
  /** 框線色（天字第一號盒 2px 框、結果卡外框）。 */
  frame: string;
  seal: PersonaSeal;
  tags: string[];
  desc: string;
  /** 適合交往的派系 */
  date: FactionKey;
  /** 命定交往的一句「為什麼」。 */
  dateReason: string;
  /** 適合交友的派系 */
  friend: FactionKey;
  /** 命定交友的一句「為什麼」。 */
  friendReason: string;
}

export const PERSONAS: Record<FactionKey, Persona> = {
  soul: {
    key: "soul",
    name: "靈魂共鳴派",
    subtitle: "頻率至上型單身",
    faction: "靈魂共鳴派",
    bg: "#C9BDE8",
    ink: "#42375F",
    frame: "#8E7FC0",
    seal: {
      d1: "M22 45a13 13 0 1 1 0-26 13 13 0 0 1 0 26z",
      d2: "M42 45a13 13 0 1 0 0-26 13 13 0 0 0 0 26z",
      meaning: "兩圓交疊——頻率共振的交集",
    },
    tags: ["#懂的都懂", "#尬聊會死", "#頻率不對再帥都沒用", "#聊得來是底線"],
    desc: "對你來說，心動始於「接得住」。外表可以慢慢看，但話不投機半句多。你要的是一個眼神就知道彼此在想什麼的默契、聊到天亮也不累的頻率。遇到對的人你會發光，遇不到——你寧願單身。",
    date: "care",
    dateReason: "你最怕「話不投機」、渴望被懂；溫柔照顧派天生會注意到你沒說出口的情緒，把你放在心上——你要被接住，他正好最會接。",
    friend: "fun",
    friendReason: "聊得來是你的底線，而玩樂冒險派永遠有新話題、新鮮事，跟他當朋友聊不完、玩不膩。",
  },
  safe: {
    key: "safe",
    name: "安全感至上派",
    subtitle: "穩穩的幸福型單身",
    faction: "安全感至上派",
    bg: "#C6D3A5",
    ink: "#4B5732",
    frame: "#8C9A63",
    seal: {
      d1: "M32 10l16 6v13c0 12-8 20-16 25-8-5-16-13-16-25V16z",
      d2: "M25 33l6 6 10-12",
      meaning: "盾與勾——承諾兌現的保護",
    },
    tags: ["#不玩曖昧", "#已讀不回直接出局", "#說到做到", "#穩定是最高級的浪漫"],
    desc: "你不是不浪漫，只是更想要確定感。忽冷忽熱、模糊關係、搞消失，都會被你直接淘汰。你要的是一個說到做到、讓你不用猜的人——因為你很清楚：穩定不是無聊，是最高級的浪漫。",
    date: "life",
    dateReason: "你要確定感，他要「過得下去」的日常——穩定＋務實，是最不會累的長久組合。",
    friend: "care",
    friendReason: "你討厭忽冷忽熱，而溫柔照顧派把人放心上、細水長流，跟他相處你最安心。",
  },
  life: {
    key: "life",
    name: "生活合拍派",
    subtitle: "日常即浪漫型單身",
    faction: "生活合拍派",
    bg: "#E6D8C3",
    ink: "#5F5238",
    frame: "#B39C74",
    seal: {
      d1: "M14 34h36c0 11-8 19-18 19S14 45 14 34z",
      d2: "M26 26c0-5 3-5 3-10M37 26c0-5 3-5 3-10",
      meaning: "一碗熱食——把日子過熱的合拍",
    },
    tags: ["#吃得合最重要", "#冷氣溫度是大事", "#一起耍廢也幸福", "#日常即浪漫"],
    desc: "愛不愛是一時的，過不過得下去是一輩子的。你很清楚，激情會退，但每天一起吃飯、一起耍廢的日子不會。能把日常過舒服的人，才是你要找的人。你的愛情觀很務實——但務實得很迷人。",
    date: "safe",
    dateReason: "你重視「過得下去」，他給你「說到做到」——把日子過穩、過久，你們同一個頻道。",
    friend: "free",
    friendReason: "你務實不愛壓力，自由尊重派不查勤、不綁人，跟他當朋友最輕鬆自在。",
  },
  spark: {
    key: "spark",
    name: "怦然心動派",
    subtitle: "一眼淪陷型單身",
    faction: "怦然心動派",
    bg: "#F2C6CF",
    ink: "#7C4050",
    frame: "#D68A9B",
    seal: {
      d1: "M32 8c2 13 9 20 22 24-13 4-20 11-22 24-2-13-9-20-22-24 13-4 20-11 22-24z",
      d2: "",
      meaning: "四芒星——一瞬的心動閃光",
    },
    tags: ["#看對眼就是一切", "#視覺系不道歉", "#心動騙不了人", "#在等一眼淪陷"],
    desc: "你承認，你就是視覺系。心動這件事騙不了人——對到眼的那一秒就決定了。但別誤會，你不膚淺，你只是誠實：沒有心動的感情，再合適也走不遠。你在等的，是那個讓你一眼淪陷的人。",
    date: "fun",
    dateReason: "你要的是持續心動，而玩樂冒險派把日常過成冒險——新鮮感不斷，你的心動不會退燒。",
    friend: "soul",
    friendReason: "你憑感覺，靈魂共鳴派憑頻率，一旦對上就一拍即合，是懂你的那種朋友。",
  },
  grow: {
    key: "grow",
    name: "上進成長派",
    subtitle: "並肩前行型單身",
    faction: "上進成長派",
    bg: "#BCCBDE",
    ink: "#37496B",
    frame: "#7C93B8",
    seal: {
      d1: "M12 52h11V40h11V28h11V16h11",
      d2: "M49 11l6 5-6 5",
      meaning: "上行階梯——並肩向上的路徑",
    },
    tags: ["#慕強但有品味", "#一起變好", "#狀態比條件重要", "#並肩不依靠"],
    desc: "你欣賞的從來不是條件，是狀態。一個對生活有想法、對未來有規劃、讓你越看越佩服的人，比什麼都迷人。你要的不是依靠，是並肩——兩個人都在變好的感情，才是你心中的愛情。",
    date: "free",
    dateReason: "你要並肩不依靠，他要同行不綁定——兩個都獨立、都想一起變好，剛好對頻。",
    friend: "safe",
    friendReason: "你在拚狀態，需要一個說到做到、可靠的後盾型朋友，安全感至上派正是。",
  },
  care: {
    key: "care",
    name: "溫柔照顧派",
    subtitle: "小事最動人型單身",
    faction: "溫柔照顧派",
    bg: "#F3D6B9",
    ink: "#7A5432",
    frame: "#C79B67",
    seal: {
      d1: "M13 42a19 19 0 0 1 38 0",
      d2: "M32 24a5 5 0 1 1 0 10 5 5 0 0 1 0-10z",
      meaning: "掌心捧珠——被放在心上的重量",
    },
    tags: ["#小事最動人", "#溫柔是本能", "#把我放心上", "#一碗熱湯的勝利"],
    desc: "你嘴上說標準很多，其實你要的很簡單：被放在心上。記得你的小習慣、發現你不對勁、生病時的一碗熱湯——這些小事在你心裡比什麼都重。你值得一個溫柔是本能、不是表演的人。",
    date: "soul",
    dateReason: "你擅長把人放心上，靈魂共鳴派最需要被懂、被接住——你的溫柔，他最買單。",
    friend: "grow",
    friendReason: "你欣賞有目標的人，上進成長派的努力會圈粉你，跟他當朋友也會被帶著往前。",
  },
  free: {
    key: "free",
    name: "自由尊重派",
    subtitle: "自由戀愛型單身",
    faction: "自由尊重派",
    bg: "#BFE0D6",
    ink: "#33594E",
    frame: "#7FB3A3",
    seal: {
      d1: "M47 17A19 19 0 1 0 51 32",
      d2: "M50 14l2-6 2 6 6 2-6 2-2 6-2-6-6-2z",
      meaning: "開口之環——留有出口的自由",
    },
    tags: ["#不查勤", "#做自己還是被愛", "#我們是隊友", "#自由和愛全都要"],
    desc: "你要的愛情不是綁定，是同行。查勤、報備、情緒勒索，對你來說都是感情的毒藥。你相信最好的關係是：我做自己，你做自己，而我們依然選擇彼此。自由和愛——你全都要。",
    date: "grow",
    dateReason: "你要自由也要愛，他要並肩也要獨立——你們都懂「各自完整、依然選擇彼此」。",
    friend: "spark",
    friendReason: "你不綁人，怦然心動派憑感覺、各玩各的，你們互相欣賞、零壓力。",
  },
  fun: {
    key: "fun",
    name: "玩樂冒險派",
    subtitle: "人生玩伴型單身",
    faction: "玩樂冒險派",
    bg: "#F0E2A6",
    ink: "#6B5B24",
    frame: "#C4AE55",
    seal: {
      d1: "M32 12a20 20 0 1 1 0 40 20 20 0 0 1 0-40z",
      d2: "M40 24l-5 13-9 4 5-13z",
      meaning: "羅盤指針——出發的方向感",
    },
    tags: ["#說走就走", "#人生玩伴徵求中", "#無聊是大忌", "#把日常過成冒險"],
    desc: "跟你談戀愛的人有福了——你把生活過成冒險。你要找的不是另一半，是玩伴、隊友、共犯。能陪你說走就走、一起耍笨、把平凡日子玩出花的人，才配得上你的心動。",
    date: "spark",
    dateReason: "你把日常玩出花，他要的正是持續心動——你負責製造那些讓人心動的場景。",
    friend: "life",
    friendReason: "你衝、生活合拍派穩，一個把日子玩開、一個把日子顧好，剛好互補。",
  },
};
