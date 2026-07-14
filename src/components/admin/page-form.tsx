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

export function PageForm({ action, page, merchants, media, submitLabel }: PageFormProps) {
  const selectedMerchantId = page?.merchantId || merchants[0]?.id || "";
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
      <FormSection title="頁面歸屬" description="設定頁面所屬商家與頁面類型，會影響前台顯示位置。">
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

      <FormSection title="頁面基本資料" description="網址代號會出現在前台網址中，請使用英文小寫與連字號。">
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

      <FormSection title="Hero 區塊" description="Hero 是前台頁面最上方的主視覺區塊。">
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
          helpText="這張圖會顯示在 Landing Page 或內容頁的主視覺區塊。"
        />
      </FormSection>

      <FormSection title="內容與 SEO" description="第一版先用 JSON 管理內容區塊，之後再升級成拖拉編輯器。">
        <TextArea
          label="內容區塊 JSON"
          name="contentBlocks"
          rows={10}
          defaultValue={JSON.stringify(page?.contentBlocks || [], null, 2)}
          required
          monospace
        />

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
          發布此頁面
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
