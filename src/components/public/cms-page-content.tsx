/* eslint-disable @next/next/no-img-element */
import type { JsonValue } from "@prisma/client/runtime/library";
import Link from "next/link";

type ContentBlock = {
  type?: string;
  title?: string;
  body?: string;
  buttonText?: string;
  buttonUrl?: string;
  imageUrl?: string;
};

type CmsPageContentProps = {
  blocks: JsonValue;
};

export function CmsPageContent({ blocks }: CmsPageContentProps) {
  const contentBlocks = Array.isArray(blocks) ? (blocks as ContentBlock[]) : [];

  if (contentBlocks.length === 0) {
    return null;
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-5 px-4 py-12 sm:px-6">
      {contentBlocks.map((block, index) => (
        <section key={`${block.title || block.type || "block"}-${index}`} className="rounded-lg border border-line bg-white p-6 shadow-sm">
          {block.title ? <h2 className="text-2xl font-bold text-ink">{block.title}</h2> : null}
          {block.imageUrl ? (
            <img
              src={block.imageUrl}
              alt={block.title || "頁面圖片"}
              className="mt-5 aspect-[16/9] w-full rounded-lg object-cover"
            />
          ) : null}
          {block.body ? <p className="mt-3 whitespace-pre-line leading-8 text-muted">{block.body}</p> : null}
          {block.buttonText && block.buttonUrl ? (
            <Link
              href={block.buttonUrl}
              className="mt-5 inline-flex rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700"
            >
              {block.buttonText}
            </Link>
          ) : null}
        </section>
      ))}
    </div>
  );
}
