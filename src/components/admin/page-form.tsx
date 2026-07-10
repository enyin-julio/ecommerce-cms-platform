import type { Media, Merchant, Page } from "@prisma/client";
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

  return (
    <form
      action={action}
      className="space-y-6 rounded-lg border border-line bg-white p-6 shadow-sm"
      data-testid="admin-page-form"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-ink">商家</span>
          <select
            name="merchantId"
            defaultValue={selectedMerchantId}
            className="mt-2 w-full rounded-lg border border-line px-4 py-3 outline-none focus:border-brand-500"
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
          <span className="text-sm font-medium text-ink">頁面類型</span>
          <select
            name="type"
            defaultValue={page?.type || PageType.content}
            className="mt-2 w-full rounded-lg border border-line px-4 py-3 outline-none focus:border-brand-500"
            data-testid="admin-page-type"
          >
            <option value={PageType.brand}>品牌形象頁</option>
            <option value={PageType.landing}>Landing Page</option>
            <option value={PageType.content}>一般內容頁</option>
          </select>
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="頁面標題" name="title" defaultValue={page?.title} required />
        <TextField label="網址 Slug" name="slug" defaultValue={page?.slug} required />
      </div>

      <TextField label="Hero 標題" name="heroTitle" defaultValue={page?.heroTitle || ""} />
      <TextArea
        label="Hero 副標題"
        name="heroSubtitle"
        rows={3}
        defaultValue={page?.heroSubtitle || ""}
      />
      <TextField
        label="Hero 圖片 URL"
        name="heroImageUrl"
        list="page-media-urls"
        defaultValue={page?.heroImageUrl || ""}
      />
      <datalist id="page-media-urls">
        {media.map((item) => (
          <option key={item.id} value={item.url}>
            {item.altText || item.url}
          </option>
        ))}
      </datalist>

      <TextArea
        label="內容區塊 JSON"
        name="contentBlocks"
        rows={10}
        defaultValue={JSON.stringify(page?.contentBlocks || [], null, 2)}
        required
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="SEO 標題" name="seoTitle" defaultValue={page?.seoTitle || ""} />
        <TextField label="SEO 描述" name="seoDescription" defaultValue={page?.seoDescription || ""} />
      </div>

      <label className="flex items-center gap-3 rounded-lg bg-slate-50 p-4 text-sm font-medium text-ink">
        <input
          name="isPublished"
          type="checkbox"
          defaultChecked={page?.isPublished ?? false}
          className="h-4 w-4 rounded border-line text-brand-600"
          data-testid="admin-page-isPublished"
        />
        發布頁面
      </label>

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

function TextField({
  label,
  name,
  defaultValue,
  ...props
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue || ""}
        className="mt-2 w-full rounded-lg border border-line px-4 py-3 outline-none focus:border-brand-500"
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
  ...props
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  rows?: number;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue || ""}
        rows={rows}
        className="mt-2 w-full rounded-lg border border-line px-4 py-3 font-mono text-sm outline-none focus:border-brand-500"
        data-testid={`admin-page-${name}`}
        {...props}
      />
    </label>
  );
}
