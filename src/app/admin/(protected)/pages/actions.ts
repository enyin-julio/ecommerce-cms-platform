"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
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
  contentBlocks: z.string().min(1),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  isPublished: z.boolean()
});

function parseContentBlocks(value: string): Prisma.InputJsonValue {
  try {
    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      throw new Error("contentBlocks must be an array");
    }

    return parsed as Prisma.InputJsonValue;
  } catch {
    throw new Error("Invalid contentBlocks JSON");
  }
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
    contentBlocks: formData.get("contentBlocks"),
    seoTitle: formData.get("seoTitle") || undefined,
    seoDescription: formData.get("seoDescription") || undefined,
    isPublished: formData.get("isPublished") === "on"
  });

  return {
    ...data,
    contentBlocks: parseContentBlocks(data.contentBlocks)
  };
}

function revalidateCmsPagePaths(type: PageTypeValue, slug: string) {
  revalidatePath("/admin/pages");
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
      isPublished: data.isPublished
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
      isPublished: data.isPublished
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
