"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createHeroStyleBlock } from "@/lib/cms-hero-style";
import { PageType, type PageType as PageTypeValue } from "@/lib/domain-types";
import { prisma } from "@/lib/prisma";
import { assertMerchantAccess, denyAccess, requireAdminSession } from "@/lib/rbac";

const pageSchema = z.object({
  merchantId: z.string().min(1),
  title: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  type: z.nativeEnum(PageType),
  heroTitle: z.string().optional(),
  heroSubtitle: z.string().optional(),
  heroImageUrl: z.string().optional(),
  heroTitleFontFamily: z.string().optional(),
  heroTitleFontSize: z.string().optional(),
  heroSubtitleFontFamily: z.string().optional(),
  heroSubtitleFontSize: z.string().optional(),
  contentTitle: z.string().optional(),
  contentBody: z.string().optional(),
  ctaButtonText: z.string().optional(),
  ctaButtonUrl: z.string().optional(),
  useAdvancedContentBlocks: z.boolean(),
  contentBlocksJson: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  isPublished: z.boolean(),
  showInNavigation: z.boolean(),
  navigationGroup: z.string().optional(),
  navigationOrder: z.coerce.number().int().min(0).default(0)
});

function parseContentBlocks(value: string): Prisma.InputJsonValue {
  try {
    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      throw new Error("Content blocks must be an array");
    }

    return parsed as Prisma.InputJsonValue;
  } catch {
    throw new Error("Invalid content blocks");
  }
}

function buildContentBlocks(data: {
  contentTitle?: string;
  contentBody?: string;
  ctaButtonText?: string;
  ctaButtonUrl?: string;
  useAdvancedContentBlocks?: boolean;
  contentBlocksJson?: string;
  heroTitleFontFamily?: string;
  heroTitleFontSize?: string;
  heroSubtitleFontFamily?: string;
  heroSubtitleFontSize?: string;
}): Prisma.InputJsonValue {
  const advancedJson = data.contentBlocksJson?.trim();

  if (data.useAdvancedContentBlocks && advancedJson) {
    return withHeroStyleBlock(parseContentBlocks(advancedJson), data);
  }

  const blocks: Prisma.InputJsonValue[] = [];
  const contentTitle = data.contentTitle?.trim();
  const contentBody = data.contentBody?.trim();
  const ctaButtonText = data.ctaButtonText?.trim();
  const ctaButtonUrl = data.ctaButtonUrl?.trim();

  if (contentTitle || contentBody) {
    blocks.push({
      type: "text",
      title: contentTitle || "內容",
      body: contentBody || ""
    });
  }

  if (ctaButtonText || ctaButtonUrl) {
    blocks.push({
      type: "cta",
      title: ctaButtonText || "了解更多",
      body: "",
      buttonText: ctaButtonText || "了解更多",
      buttonUrl: ctaButtonUrl || "/products"
    });
  }

  return withHeroStyleBlock(blocks, data);
}

function parsePageForm(formData: FormData) {
  const data = pageSchema.parse({
    merchantId: formData.get("merchantId"),
    title: formData.get("title"),
    slug: formData.get("slug"),
    type: formData.get("type"),
    heroTitle: formData.get("heroTitle") || undefined,
    heroSubtitle: formData.get("heroSubtitle") || undefined,
    heroImageUrl: formData.get("heroImageUrl") || "",
    heroTitleFontFamily: formData.get("heroTitleFontFamily") || undefined,
    heroTitleFontSize: formData.get("heroTitleFontSize") || undefined,
    heroSubtitleFontFamily: formData.get("heroSubtitleFontFamily") || undefined,
    heroSubtitleFontSize: formData.get("heroSubtitleFontSize") || undefined,
    contentTitle: formData.get("contentTitle") || undefined,
    contentBody: formData.get("contentBody") || undefined,
    ctaButtonText: formData.get("ctaButtonText") || undefined,
    ctaButtonUrl: formData.get("ctaButtonUrl") || undefined,
    useAdvancedContentBlocks: formData.get("useAdvancedContentBlocks") === "on",
    contentBlocksJson: formData.get("contentBlocksJson") || undefined,
    seoTitle: formData.get("seoTitle") || undefined,
    seoDescription: formData.get("seoDescription") || undefined,
    isPublished: formData.get("isPublished") === "on",
    showInNavigation: formData.get("showInNavigation") === "on",
    navigationGroup: formData.get("navigationGroup") || undefined,
    navigationOrder: formData.get("navigationOrder") || 0
  });

  return {
    ...data,
    contentBlocks: buildContentBlocks(data)
  };
}

function withHeroStyleBlock(
  blocks: Prisma.InputJsonValue,
  data: {
    heroTitleFontFamily?: string;
    heroTitleFontSize?: string;
    heroSubtitleFontFamily?: string;
    heroSubtitleFontSize?: string;
  }
): Prisma.InputJsonValue {
  const contentBlocks = Array.isArray(blocks)
    ? blocks.filter((block) => {
        return !(
          block &&
          typeof block === "object" &&
          !Array.isArray(block) &&
          "type" in block &&
          block.type === "heroStyle"
        );
      })
    : [];
  const heroStyleBlock = createHeroStyleBlock({
    titleFontFamily: data.heroTitleFontFamily,
    titleFontSize: data.heroTitleFontSize,
    subtitleFontFamily: data.heroSubtitleFontFamily,
    subtitleFontSize: data.heroSubtitleFontSize
  });

  return heroStyleBlock ? [heroStyleBlock, ...contentBlocks] : contentBlocks;
}

function revalidateCmsPagePaths(type: PageTypeValue, slug: string) {
  revalidatePath("/admin/pages");
  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath(`/landing/${slug}`);
  revalidatePath(`/pages/${slug}`);

  if (type === PageType.landing) {
    revalidatePath("/landing/[slug]", "page");
  }

  if (type === PageType.content || type === PageType.brand) {
    revalidatePath("/pages/[slug]", "page");
  }
}

export async function createPageAction(formData: FormData) {
  const session = await requireAdminSession();
  const data = parsePageForm(formData);

  assertMerchantAccess(session, data.merchantId);

  await prisma.page.create({
    data: {
      merchantId: data.merchantId,
      title: data.title,
      slug: data.slug,
      type: data.type,
      heroTitle: data.heroTitle || null,
      heroSubtitle: data.heroSubtitle || null,
      heroImageUrl: data.heroImageUrl || null,
      contentBlocks: data.contentBlocks,
      seoTitle: data.seoTitle || null,
      seoDescription: data.seoDescription || null,
      isPublished: data.isPublished,
      showInNavigation: data.showInNavigation,
      navigationGroup: data.showInNavigation ? data.navigationGroup || null : null,
      navigationOrder: data.navigationOrder
    }
  });

  revalidateCmsPagePaths(data.type, data.slug);
  redirect("/admin/pages");
}

export async function updatePageAction(pageId: string, formData: FormData) {
  const session = await requireAdminSession();
  const existingPage = await prisma.page.findUnique({
    where: {
      id: pageId
    },
    select: {
      merchantId: true,
      slug: true,
      type: true
    }
  });

  if (!existingPage) {
    denyAccess();
  }

  assertMerchantAccess(session, existingPage.merchantId);

  const data = parsePageForm(formData);
  assertMerchantAccess(session, data.merchantId);

  await prisma.page.update({
    where: {
      id: pageId
    },
    data: {
      merchantId: data.merchantId,
      title: data.title,
      slug: data.slug,
      type: data.type,
      heroTitle: data.heroTitle || null,
      heroSubtitle: data.heroSubtitle || null,
      heroImageUrl: data.heroImageUrl || null,
      contentBlocks: data.contentBlocks,
      seoTitle: data.seoTitle || null,
      seoDescription: data.seoDescription || null,
      isPublished: data.isPublished,
      showInNavigation: data.showInNavigation,
      navigationGroup: data.showInNavigation ? data.navigationGroup || null : null,
      navigationOrder: data.navigationOrder
    }
  });

  revalidateCmsPagePaths(existingPage.type as PageTypeValue, existingPage.slug);
  revalidateCmsPagePaths(data.type, data.slug);
  redirect("/admin/pages");
}

export async function togglePagePublishedAction(pageId: string) {
  const session = await requireAdminSession();
  const page = await prisma.page.findUnique({
    where: {
      id: pageId
    },
    select: {
      merchantId: true,
      slug: true,
      type: true,
      isPublished: true
    }
  });

  if (!page) {
    denyAccess();
  }

  assertMerchantAccess(session, page.merchantId);

  await prisma.page.update({
    where: {
      id: pageId
    },
    data: {
      isPublished: !page.isPublished
    }
  });

  revalidateCmsPagePaths(page.type as PageTypeValue, page.slug);
}

export async function deletePageAction(pageId: string) {
  const session = await requireAdminSession();
  const page = await prisma.page.findUnique({
    where: {
      id: pageId
    },
    select: {
      merchantId: true,
      slug: true,
      type: true
    }
  });

  if (!page) {
    denyAccess();
  }

  assertMerchantAccess(session, page.merchantId);

  await prisma.page.delete({
    where: {
      id: pageId
    }
  });

  revalidateCmsPagePaths(page.type as PageTypeValue, page.slug);
}
