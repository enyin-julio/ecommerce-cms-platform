import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CmsPageContent } from "@/components/public/cms-page-content";
import { SiteHeader } from "@/components/public/site-header";
import { PageType } from "@/lib/domain-types";
import { productImagePlaceholder } from "@/lib/placeholders";
import { getPublishedPageBySlug } from "@/modules/content/page.repository";

type LandingPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: LandingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageSafely(slug);

  if (!page) {
    return {
      title: "形象廣告頁"
    };
  }

  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription || page.heroSubtitle || undefined
  };
}

export default async function LandingPage({ params }: LandingPageProps) {
  const { slug } = await params;
  const page = await getPageSafely(slug);

  if (!page) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white">
      <SiteHeader />
      <section
        className="bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.86), rgba(255,255,255,0.92)), url(${page.heroImageUrl || productImagePlaceholder})`
        }}
      >
        <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
            形象廣告頁 / {page.slug}
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-ink sm:text-6xl">
            {page.heroTitle || page.title}
          </h1>
          {page.heroSubtitle ? (
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-muted">
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
    return await getPublishedPageBySlug(slug, PageType.landing);
  } catch {
    return null;
  }
}
