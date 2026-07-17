export type ThemeLayout = "one-page" | "multi-page";

export type ThemePreset = {
  id: string;
  layout: ThemeLayout;
  name: string;
  description: string;
  primaryColor: string;
  softColor: string;
  accentColor: string;
};

export const themePresets: ThemePreset[] = [
  {
    id: "brand-focus",
    layout: "one-page",
    name: "品牌焦點",
    description: "適合品牌形象、服務介紹與單頁式活動頁，讓訪客快速理解品牌價值。",
    primaryColor: "#2563eb",
    softColor: "#dbeafe",
    accentColor: "#38bdf8"
  },
  {
    id: "minimal-clean",
    layout: "one-page",
    name: "極簡留白",
    description: "大量留白、簡潔排版，適合精品、顧問服務、設計感品牌。",
    primaryColor: "#111827",
    softColor: "#f3f4f6",
    accentColor: "#94a3b8"
  },
  {
    id: "warm-story",
    layout: "one-page",
    name: "溫潤故事",
    description: "柔和配色與較親切的視覺節奏，適合生活風格、手作與內容型品牌。",
    primaryColor: "#b45309",
    softColor: "#fef3c7",
    accentColor: "#f59e0b"
  },
  {
    id: "professional",
    layout: "multi-page",
    name: "專業品牌商城",
    description: "適合正式營運的品牌電商，首頁、商品、內容頁與購物流程分工清楚。",
    primaryColor: "#1d4ed8",
    softColor: "#eef6ff",
    accentColor: "#0ea5e9"
  },
  {
    id: "catalog-first",
    layout: "multi-page",
    name: "商品型錄優先",
    description: "把商品分類與商品列表放在較明顯的位置，適合多品項型錄與詢價型網站。",
    primaryColor: "#0f766e",
    softColor: "#ccfbf1",
    accentColor: "#14b8a6"
  },
  {
    id: "campaign-bold",
    layout: "multi-page",
    name: "活動銷售強化",
    description: "較強烈的視覺對比與行動按鈕，適合新品上市、檔期活動與銷售導向頁面。",
    primaryColor: "#dc2626",
    softColor: "#fee2e2",
    accentColor: "#f97316"
  },
  {
    id: "tech-blue",
    layout: "multi-page",
    name: "科技藍調",
    description: "乾淨、穩定、偏科技感的配色，適合電子產品、SaaS 與 B2B 品牌。",
    primaryColor: "#0284c7",
    softColor: "#e0f2fe",
    accentColor: "#22d3ee"
  },
  {
    id: "editorial",
    layout: "multi-page",
    name: "雜誌內容風",
    description: "適合內容量較多的品牌，把服務說明、品牌故事與商品資訊整理成清楚入口。",
    primaryColor: "#475569",
    softColor: "#f1f5f9",
    accentColor: "#6366f1"
  }
];

export function getThemePresetById(id: string | null | undefined) {
  return themePresets.find((theme) => theme.id === id) || themePresets[3];
}

export function getThemePresetsByLayout(layout: ThemeLayout) {
  return themePresets.filter((theme) => theme.layout === layout);
}
