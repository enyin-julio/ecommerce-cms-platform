export const navigationGroups = [
  {
    value: "brand",
    label: "關於品牌",
    description: "品牌故事、品牌理念、團隊介紹、門市資訊等。"
  },
  {
    value: "services",
    label: "服務與說明",
    description: "服務說明、安裝說明、常見問題、聯絡資訊等。"
  },
  {
    value: "campaigns",
    label: "活動專區",
    description: "新品上市、限時優惠、廣告活動、企業採購等。"
  }
] as const;

export type NavigationGroupValue = (typeof navigationGroups)[number]["value"];

export function getNavigationGroupLabel(value?: string | null) {
  return navigationGroups.find((group) => group.value === value)?.label || "未分組";
}

export function getDefaultNavigationGroup(type: string) {
  if (type === "brand") {
    return "brand";
  }

  if (type === "landing") {
    return "campaigns";
  }

  return "services";
}
