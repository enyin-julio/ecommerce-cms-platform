import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CmsPageContent } from "@/components/public/cms-page-content";
import { SiteHeader } from "@/components/public/site-header";
import { PageType } from "@/lib/domain-types";
import { productImagePlaceholder } from "@/lib/placeholders";
import { getPublishedPageBySlug } from "@/modules/content/page.repository";

export const dynamic = "force-dynamic";

type PublicContentPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params
}: PublicContentPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageSafely(slug);

  if (!page) {
    return {
      title: "頁面不存在"
    };
  }

  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription || page.heroSubtitle || undefined
  };
}

export default async function PublicContentPage({ params }: PublicContentPageProps) {
  const { slug } = await params;
  const page = await getPageSafely(slug);

  if (!page) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />
      <section
        className="bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.9), rgba(248,250,252,0.96)), url(${page.heroImageUrl || productImagePlaceholder})`
        }}
      >
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
            {page.type === PageType.brand ? "Brand" : "Page"}
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            {page.heroTitle || page.title}
          </h1>
          {page.heroSubtitle ? (
            <p className="mt-6 max-w-3xl text-lg leading-8 text-muted">
              {page.heroSubtitle}
            </p>
          ) : null}
        </div>
      </section>
      <CmsPageContent blocks={page.contentBlocks} />
    </main>
  );
}

async function getPageSafely(slug: string) {
  try {
    return await getPublishedPageBySlug(slug);
  } catch {
    return null;
  }
}
