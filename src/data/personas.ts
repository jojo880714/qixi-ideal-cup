/**
 * 8 種單身人格，對應 FactionKey。
 *
 * PLACEHOLDER CONTENT — 內容逐字取自原型 qixi-ideal-cup-v2.html，尚未經文案定稿。
 * 文案定稿後，直接整份替換這個檔案即可，其餘程式碼不需改動。
 * bg / ink 為結果卡底色與文字色（視覺定稿後可整份替換為新配色）。
 */

import type { FactionKey } from "./traits";

export interface Persona {
  key: FactionKey;
  name: string;
  faction: string;
  bg: string;
  ink: string;
  tags: string[];
  desc: string;
  /** 適合交往的派系 */
  date: FactionKey;
  /** 適合交友的派系 */
  friend: FactionKey;
}

export const PERSONAS: Record<FactionKey, Persona> = {
  soul: {
    key: "soul",
    name: "頻率至上型單身",
    faction: "靈魂共鳴派",
    bg: "#C9BDE8",
    ink: "#42375F",
    tags: ["#懂的都懂", "#尬聊會死", "#頻率不對再帥都沒用", "#聊得來是底線"],
    desc: "對你來說，心動始於「接得住」。外表可以慢慢看，但話不投機半句多。你要的是一個眼神就知道彼此在想什麼的默契、聊到天亮也不累的頻率。遇到對的人你會發光，遇不到——你寧願單身。",
    date: "care",
    friend: "fun",
  },
  safe: {
    key: "safe",
    name: "穩穩的幸福型單身",
    faction: "安全感至上派",
    bg: "#C6D3A5",
    ink: "#4B5732",
    tags: ["#不玩曖昧", "#已讀不回直接出局", "#說到做到", "#穩定是最高級的浪漫"],
    desc: "你不是不浪漫，只是更想要確定感。忽冷忽熱、模糊關係、搞消失，都會被你直接淘汰。你要的是一個說到做到、讓你不用猜的人——因為你很清楚：穩定不是無聊，是最高級的浪漫。",
    date: "life",
    friend: "care",
  },
  life: {
    key: "life",
    name: "日常即浪漫型單身",
    faction: "生活合拍派",
    bg: "#E6D8C3",
    ink: "#5F5238",
    tags: ["#吃得合最重要", "#冷氣溫度是大事", "#一起耍廢也幸福", "#日常即浪漫"],
    desc: "愛不愛是一時的，過不過得下去是一輩子的。你很清楚，激情會退，但每天一起吃飯、一起耍廢的日子不會。能把日常過舒服的人，才是你要找的人。你的愛情觀很務實——但務實得很迷人。",
    date: "safe",
    friend: "free",
  },
  spark: {
    key: "spark",
    name: "一眼淪陷型單身",
    faction: "怦然心動派",
    bg: "#F2C6CF",
    ink: "#7C4050",
    tags: ["#看對眼就是一切", "#視覺系不道歉", "#心動騙不了人", "#在等一眼淪陷"],
    desc: "你承認，你就是視覺系。心動這件事騙不了人——對到眼的那一秒就決定了。但別誤會，你不膚淺，你只是誠實：沒有心動的感情，再合適也走不遠。你在等的，是那個讓你一眼淪陷的人。",
    date: "fun",
    friend: "soul",
  },
  grow: {
    key: "grow",
    name: "並肩前行型單身",
    faction: "上進成長派",
    bg: "#BCCBDE",
    ink: "#37496B",
    tags: ["#慕強但有品味", "#一起變好", "#狀態比條件重要", "#並肩不依靠"],
    desc: "你欣賞的從來不是條件，是狀態。一個對生活有想法、對未來有規劃、讓你越看越佩服的人，比什麼都迷人。你要的不是依靠，是並肩——兩個人都在變好的感情，才是你心中的愛情。",
    date: "free",
    friend: "safe",
  },
  care: {
    key: "care",
    name: "小事最動人型單身",
    faction: "溫柔照顧派",
    bg: "#F3D6B9",
    ink: "#7A5432",
    tags: ["#小事最動人", "#溫柔是本能", "#把我放心上", "#一碗熱湯的勝利"],
    desc: "你嘴上說標準很多，其實你要的很簡單：被放在心上。記得你的小習慣、發現你不對勁、生病時的一碗熱湯——這些小事在你心裡比什麼都重。你值得一個溫柔是本能、不是表演的人。",
    date: "soul",
    friend: "grow",
  },
  free: {
    key: "free",
    name: "自由戀愛型單身",
    faction: "自由尊重派",
    bg: "#BFE0D6",
    ink: "#33594E",
    tags: ["#不查勤", "#做自己還是被愛", "#我們是隊友", "#自由和愛全都要"],
    desc: "你要的愛情不是綁定，是同行。查勤、報備、情緒勒索，對你來說都是感情的毒藥。你相信最好的關係是：我做自己，你做自己，而我們依然選擇彼此。自由和愛——你全都要。",
    date: "grow",
    friend: "spark",
  },
  fun: {
    key: "fun",
    name: "人生玩伴型單身",
    faction: "玩樂冒險派",
    bg: "#F0E2A6",
    ink: "#6B5B24",
    tags: ["#說走就走", "#人生玩伴徵求中", "#無聊是大忌", "#把日常過成冒險"],
    desc: "跟你談戀愛的人有福了——你把生活過成冒險。你要找的不是另一半，是玩伴、隊友、共犯。能陪你說走就走、一起耍笨、把平凡日子玩出花的人，才配得上你的心動。",
    date: "spark",
    friend: "life",
  },
};
