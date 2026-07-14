import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import type { Media, Merchant, Page } from "@prisma/client";
import { MediaImageField } from "@/components/admin/media-image-field";
import { PageType } from "@/lib/domain-types";

type PageWithMerchant = Page & {
  merchant: Merchant;
};

type PageFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  page?: PageWithMerchant | null;
  merchants: Merchant[];
  media: Array<Media & { merchant: Merchant }>;
  submitLabel: string;
};

type ContentBlock = {
  type?: string;
  title?: string;
  body?: string;
  buttonText?: string;
  buttonUrl?: string;
  imageUrl?: string;
};

export function PageForm({ action, page, merchants, media, submitLabel }: PageFormProps) {
  const selectedMerchantId = page?.merchantId || merchants[0]?.id || "";
  const contentBlocks = Array.isArray(page?.contentBlocks)
    ? (page.contentBlocks as ContentBlock[])
    : [];
  const primaryTextBlock =
    contentBlocks.find((block) => block.type === "text") || contentBlocks[0] || {};
  const ctaBlock = contentBlocks.find((block) => block.type === "cta") || {};
  const mediaOptions = media.map((item) => ({
    id: item.id,
    url: item.url,
    altText: item.altText,
    fileName: item.fileName,
    merchantName: item.merchant.name
  }));

  return (
    <form
      action={action}
      className="space-y-6 rounded-lg border border-line bg-white p-6 shadow-sm"
      data-testid="admin-page-form"
    >
      <FormSection
        title="頁面歸屬"
        description="選擇這個頁面屬於哪一個商家，以及它在前台要用哪一種頁面型態顯示。"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-ink">商家</span>
            <select
              name="merchantId"
              defaultValue={selectedMerchantId}
              className="mt-2 min-h-12 w-full rounded border border-line px-4 text-sm outline-none focus:border-brand-500"
              data-testid="admin-page-merchantId"
            >
              {merchants.map((merchant) => (
                <option key={merchant.id} value={merchant.id}>
                  {merchant.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-ink">頁面類型</span>
            <select
              name="type"
              defaultValue={page?.type || PageType.content}
              className="mt-2 min-h-12 w-full rounded border border-line px-4 text-sm outline-none focus:border-brand-500"
              data-testid="admin-page-type"
            >
              <option value={PageType.brand}>品牌形象頁</option>
              <option value={PageType.landing}>形象廣告頁</option>
              <option value={PageType.content}>一般內容頁</option>
            </select>
          </label>
        </div>
      </FormSection>

      <FormSection
        title="基本資料"
        description="頁面標題會顯示在後台列表與前台頁面。網址代號只使用英文小寫、數字與減號。"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="頁面標題" name="title" defaultValue={page?.title} required />
          <TextField
            label="網址代號（Slug）"
            name="slug"
            defaultValue={page?.slug}
            placeholder="例如：service-info"
            required
          />
        </div>
      </FormSection>

      <FormSection
        title="Hero 主視覺"
        description="頁面最上方的大標題、副標題與圖片。圖片可以貼網址，也可以從媒體庫選擇。"
      >
        <TextField label="Hero 標題" name="heroTitle" defaultValue={page?.heroTitle || ""} />
        <TextArea
          label="Hero 副標題"
          name="heroSubtitle"
          rows={3}
          defaultValue={page?.heroSubtitle || ""}
        />
        <MediaImageField
          name="heroImageUrl"
          label="Hero 圖片 URL"
          defaultValue={page?.heroImageUrl || ""}
          media={mediaOptions}
          testId="admin-page-heroImageUrl"
          helpText="可從媒體庫選擇圖片，或直接貼上圖片網址。"
        />
      </FormSection>

      <FormSection
        title="頁面內容"
        description="不用寫 JSON。直接填內容標題與內文，系統會自動轉成前台可顯示的內容區塊。"
      >
        <TextField
          label="內容標題"
          name="contentTitle"
          defaultValue={primaryTextBlock.title || ""}
          placeholder="例如：服務說明"
        />
        <TextArea
          label="內容文字"
          name="contentBody"
          rows={8}
          defaultValue={primaryTextBlock.body || ""}
          placeholder="直接輸入你想讓前台顯示的文字。換行會保留。"
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="按鈕文字（選填）"
            name="ctaButtonText"
            defaultValue={ctaBlock.buttonText || ""}
            placeholder="例如：查看商品"
          />
          <TextField
            label="按鈕連結（選填）"
            name="ctaButtonUrl"
            defaultValue={ctaBlock.buttonUrl || ""}
            placeholder="例如：/products"
          />
        </div>

        <details className="rounded-lg border border-dashed border-line bg-slate-50 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-ink">
            進階：直接編輯 JSON
          </summary>
          <p className="mt-2 text-xs leading-5 text-muted">
            一般情況不用填。只有需要多段內容、圖片區塊或特殊排版時才使用。
          </p>
          <label className="mt-4 flex items-center gap-3 text-sm font-semibold text-ink">
            <input
              name="useAdvancedContentBlocks"
              type="checkbox"
              className="h-4 w-4 rounded border-line text-brand-600"
              data-testid="admin-page-useAdvancedContentBlocks"
            />
            使用下方 JSON 內容覆蓋一般文字欄位
          </label>
          <TextArea
            label="內容區塊 JSON（進階選填）"
            name="contentBlocksJson"
            rows={10}
            defaultValue={contentBlocks.length > 0 ? JSON.stringify(contentBlocks, null, 2) : ""}
            monospace
          />
        </details>
      </FormSection>

      <FormSection
        title="SEO 與發布"
        description="SEO 標題與描述會提供搜尋引擎使用。勾選發布後，前台才會顯示這個頁面。"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="SEO 標題" name="seoTitle" defaultValue={page?.seoTitle || ""} />
          <TextField
            label="SEO 描述"
            name="seoDescription"
            defaultValue={page?.seoDescription || ""}
          />
        </div>

        <label className="flex items-center gap-3 rounded-lg bg-slate-50 p-4 text-sm font-semibold text-ink">
          <input
            name="isPublished"
            type="checkbox"
            defaultChecked={page?.isPublished ?? false}
            className="h-4 w-4 rounded border-line text-brand-600"
            data-testid="admin-page-isPublished"
          />
          發布到前台
        </label>
      </FormSection>

      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
          data-testid="admin-page-submit"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function FormSection({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 border-b border-line pb-6 last:border-b-0 last:pb-0">
      <div>
        <h3 className="text-lg font-bold text-ink">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
      </div>
      <div className="grid gap-5">{children}</div>
    </section>
  );
}

function TextField({
  label,
  name,
  defaultValue,
  ...props
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue || ""}
        className="mt-2 min-h-12 w-full rounded border border-line px-4 text-sm outline-none focus:border-brand-500"
        data-testid={`admin-page-${name}`}
        {...props}
      />
    </label>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  rows = 4,
  monospace = false,
  ...props
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  rows?: number;
  monospace?: boolean;
} & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue || ""}
        rows={rows}
        className={`mt-2 w-full rounded border border-line px-4 py-3 text-sm outline-none focus:border-brand-500 ${
          monospace ? "font-mono" : ""
        }`}
        data-testid={`admin-page-${name}`}
        {...props}
      />
    </label>
  );
}
