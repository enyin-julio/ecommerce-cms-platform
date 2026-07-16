export const storePolicyKeys = [
  "privacyPolicy",
  "serviceTerms",
  "reservationTerms",
  "returnRefundPolicy",
  "paymentShippingPolicy"
] as const;

export type StorePolicyKey = (typeof storePolicyKeys)[number];

export type StorePolicyDefinition = {
  key: StorePolicyKey;
  slug: string;
  title: string;
  description: string;
};

export const storePolicyDefinitions: StorePolicyDefinition[] = [
  {
    key: "privacyPolicy",
    slug: "privacy",
    title: "隱私權政策",
    description: "說明網站如何蒐集、使用、保存與保護消費者個人資料。"
  },
  {
    key: "serviceTerms",
    slug: "terms",
    title: "服務條款",
    description: "說明使用網站、會員服務、商品瀏覽與交易時的基本規範。"
  },
  {
    key: "reservationTerms",
    slug: "reservation",
    title: "預約條款",
    description: "適用於需要預約、安裝、諮詢或到府服務的流程與注意事項。"
  },
  {
    key: "returnRefundPolicy",
    slug: "returns",
    title: "退換貨及退款須知",
    description: "說明退換貨、退款、瑕疵品處理與申請期限。"
  },
  {
    key: "paymentShippingPolicy",
    slug: "payment-shipping",
    title: "付款及運送方式",
    description: "說明付款方式、運送方式、配送時間與相關費用。"
  }
];

export function getStorePolicyDefinitionBySlug(slug: string) {
  return storePolicyDefinitions.find((policy) => policy.slug === slug) || null;
}

export function getStorePolicyDefinitionByKey(key: string) {
  return storePolicyDefinitions.find((policy) => policy.key === key) || null;
}
