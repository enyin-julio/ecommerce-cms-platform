import type { CSSProperties } from "react";
import type { JsonValue } from "@prisma/client/runtime/library";

export const heroFontFamilyOptions = [
  { label: "使用全站字型", value: "system", css: undefined },
  { label: "黑體 / 無襯線", value: "sans", css: 'Arial, "Noto Sans TC", sans-serif' },
  { label: "明體 / 襯線", value: "serif", css: '"Noto Serif TC", "PMingLiU", serif' },
  { label: "等寬字型", value: "mono", css: '"Courier New", monospace' }
] as const;

export const heroTitleFontSizeOptions = [
  { label: "使用預設大小", value: "" },
  { label: "32px", value: "32px" },
  { label: "40px", value: "40px" },
  { label: "48px", value: "48px" },
  { label: "56px", value: "56px" },
  { label: "64px", value: "64px" },
  { label: "72px", value: "72px" }
] as const;

export const heroSubtitleFontSizeOptions = [
  { label: "使用預設大小", value: "" },
  { label: "16px", value: "16px" },
  { label: "18px", value: "18px" },
  { label: "20px", value: "20px" },
  { label: "22px", value: "22px" },
  { label: "24px", value: "24px" },
  { label: "28px", value: "28px" }
] as const;

export type HeroStyle = {
  titleFontFamily?: string;
  titleFontSize?: string;
  subtitleFontFamily?: string;
  subtitleFontSize?: string;
};

type HeroStyleBlock = HeroStyle & {
  type: "heroStyle";
};

export function getHeroStyleFromBlocks(blocks: JsonValue): HeroStyle {
  const block = getHeroStyleBlock(blocks);

  return {
    titleFontFamily: normalizeFontFamily(block?.titleFontFamily),
    titleFontSize: normalizeTitleFontSize(block?.titleFontSize),
    subtitleFontFamily: normalizeFontFamily(block?.subtitleFontFamily),
    subtitleFontSize: normalizeSubtitleFontSize(block?.subtitleFontSize)
  };
}

export function removeHeroStyleBlocks<T extends { type?: string }>(blocks: T[]) {
  return blocks.filter((block) => block && block.type !== "heroStyle");
}

export function createHeroStyleBlock(style: HeroStyle): HeroStyleBlock | null {
  const normalized: HeroStyleBlock = {
    type: "heroStyle",
    titleFontFamily: normalizeFontFamily(style.titleFontFamily),
    titleFontSize: normalizeTitleFontSize(style.titleFontSize),
    subtitleFontFamily: normalizeFontFamily(style.subtitleFontFamily),
    subtitleFontSize: normalizeSubtitleFontSize(style.subtitleFontSize)
  };

  if (
    !normalized.titleFontFamily &&
    !normalized.titleFontSize &&
    !normalized.subtitleFontFamily &&
    !normalized.subtitleFontSize
  ) {
    return null;
  }

  return normalized;
}

export function getHeroTitleStyle(style: HeroStyle): CSSProperties {
  return {
    ...getFontFamilyStyle(style.titleFontFamily),
    ...(style.titleFontSize ? { fontSize: style.titleFontSize } : {})
  };
}

export function getHeroSubtitleStyle(style: HeroStyle): CSSProperties {
  return {
    ...getFontFamilyStyle(style.subtitleFontFamily),
    ...(style.subtitleFontSize ? { fontSize: style.subtitleFontSize } : {})
  };
}

function getHeroStyleBlock(blocks: JsonValue): Partial<HeroStyleBlock> | null {
  if (!Array.isArray(blocks)) {
    return null;
  }

  const block = blocks.find((item) => {
    return item && typeof item === "object" && !Array.isArray(item) && item.type === "heroStyle";
  });

  return block && typeof block === "object" && !Array.isArray(block)
    ? (block as Partial<HeroStyleBlock>)
    : null;
}

function getFontFamilyStyle(value?: string): CSSProperties {
  const option = heroFontFamilyOptions.find((item) => item.value === value);

  return option?.css ? { fontFamily: option.css } : {};
}

function normalizeFontFamily(value: unknown) {
  return heroFontFamilyOptions.some((item) => item.value === value && value !== "system")
    ? String(value)
    : "";
}

function normalizeTitleFontSize(value: unknown) {
  return heroTitleFontSizeOptions.some((item) => item.value === value) ? String(value || "") : "";
}

function normalizeSubtitleFontSize(value: unknown) {
  return heroSubtitleFontSizeOptions.some((item) => item.value === value)
    ? String(value || "")
    : "";
}
