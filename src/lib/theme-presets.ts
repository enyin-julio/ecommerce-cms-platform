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
    id: "unique",
    layout: "one-page",
    name: "獨有風格",
    description: "適合品牌主視覺明確、想用單頁快速呈現重點的網站。",
    primaryColor: "#7c3aed",
    softColor: "#f3e8ff",
    accentColor: "#f59e0b"
  },
  {
    id: "quiet",
    layout: "one-page",
    name: "簡單靜謐",
    description: "乾淨留白、節奏安靜，適合服務介紹與形象官網。",
    primaryColor: "#0f766e",
    softColor: "#ccfbf1",
    accentColor: "#14b8a6"
  },
  {
    id: "romantic",
    layout: "one-page",
    name: "優雅浪漫",
    description: "柔和色調與精緻感，適合生活風格、美感商品與品牌故事。",
    primaryColor: "#be185d",
    softColor: "#fce7f3",
    accentColor: "#f472b6"
  },
  {
    id: "modern",
    layout: "one-page",
    name: "現代簡約",
    description: "俐落、明亮、聚焦行動按鈕，適合新品發表與活動頁。",
    primaryColor: "#2563eb",
    softColor: "#dbeafe",
    accentColor: "#38bdf8"
  },
  {
    id: "professional",
    layout: "multi-page",
    name: "專業風格",
    description: "穩重清楚，適合有商品、內容頁與服務說明的品牌商城。",
    primaryColor: "#1d4ed8",
    softColor: "#eef6ff",
    accentColor: "#0ea5e9"
  },
  {
    id: "playful",
    layout: "multi-page",
    name: "簡約趣味",
    description: "帶一點活潑感，適合較輕鬆的商品型錄與內容經營。",
    primaryColor: "#ea580c",
    softColor: "#ffedd5",
    accentColor: "#facc15"
  },
  {
    id: "aesthetic",
    layout: "multi-page",
    name: "簡約美學",
    description: "低彩度、細緻感，適合重視質感與圖片呈現的品牌。",
    primaryColor: "#475569",
    softColor: "#f1f5f9",
    accentColor: "#94a3b8"
  },
  {
    id: "fashion",
    layout: "multi-page",
    name: "簡約時尚",
    description: "高對比、俐落線條，適合科技、設計與精品感商品。",
    primaryColor: "#111827",
    softColor: "#f3f4f6",
    accentColor: "#6366f1"
  }
];

export function getThemePresetById(id: string | null | undefined) {
  return themePresets.find((theme) => theme.id === id) || themePresets[4];
}

export function getThemePresetsByLayout(layout: ThemeLayout) {
  return themePresets.filter((theme) => theme.layout === layout);
}
