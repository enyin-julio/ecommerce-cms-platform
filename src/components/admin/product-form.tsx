import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import type { Category, Media, Merchant, Product } from "@prisma/client";
import { MediaImageField } from "@/components/admin/media-image-field";

type ProductWithRelations = Product & {
  category?: Category | null;
  merchant: Merchant;
};

type ProductFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  product?: ProductWithRelations | null;
  merchants: Merchant[];
  categories: Array<Category & { merchant: Merchant }>;
  media: Array<Media & { merchant: Merchant }>;
  submitLabel: string;
};

export function ProductForm({
  action,
  product,
  merchants,
  categories,
  media,
  submitLabel
}: ProductFormProps) {
  const selectedMerchantId = product?.merchantId || merchants[0]?.id || "";
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
      data-testid="admin-product-form"
    >
      <FormSection title="商品歸屬" description="設定商品所屬商家與分類，會影響前台分類與權限範圍。">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-ink">商家</span>
            <select
              name="merchantId"
              defaultValue={selectedMerchantId}
              className="mt-2 min-h-12 w-full rounded border border-line px-4 text-sm outline-none focus:border-brand-500"
              data-testid="admin-product-merchantId"
            >
              {merchants.map((merchant) => (
                <option key={merchant.id} value={merchant.id}>
                  {merchant.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-ink">商品分類</span>
            <select
              name="categoryId"
              defaultValue={product?.categoryId || ""}
              className="mt-2 min-h-12 w-full rounded border border-line px-4 text-sm outline-none focus:border-brand-500"
              data-testid="admin-product-categoryId"
            >
              <option value="">未分類</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} / {category.merchant.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </FormSection>

      <FormSection title="商品基本資料" description="網址代號會出現在商品網址中，建議使用英文小寫與連字號。">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="商品名稱" name="name" defaultValue={product?.name} required />
          <TextField label="SKU" name="sku" defaultValue={product?.sku} required />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="網址代號（Slug）"
            name="slug"
            defaultValue={product?.slug}
            placeholder="例如：smart-lock-u8-pro"
            required
          />
          <TextField
            label="庫存"
            name="stock"
            type="number"
            min="0"
            step="1"
            defaultValue={String(product?.stock ?? 0)}
            required
          />
        </div>
      </FormSection>

      <FormSection title="價格與圖片" description="商品圖片可直接貼 URL，也可按「選擇圖檔」從媒體庫挑選。">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="售價"
            name="price"
            type="number"
            min="0"
            step="1"
            defaultValue={product?.price.toString()}
            required
          />
          <TextField
            label="原價"
            name="originalPrice"
            type="number"
            min="0"
            step="1"
            defaultValue={product?.originalPrice?.toString()}
          />
        </div>

        <MediaImageField
          name="imageUrl"
          label="商品圖片 URL"
          defaultValue={product?.imageUrl || ""}
          media={mediaOptions}
          testId="admin-product-imageUrl"
          helpText="這張圖會顯示在商品列表與商品詳情頁。"
        />
      </FormSection>

      <FormSection title="商品文案" description="簡短描述適合列表摘要，詳細描述會顯示在商品詳情頁。">
        <TextArea
          label="簡短描述"
          name="shortDescription"
          defaultValue={product?.shortDescription}
          required
        />
        <TextArea label="詳細描述" name="description" defaultValue={product?.description} required />
      </FormSection>

      <FormSection title="SEO 與上架" description="SEO 欄位會協助搜尋結果顯示更完整的商品資訊。">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="SEO 標題" name="seoTitle" defaultValue={product?.seoTitle || ""} />
          <TextField
            label="SEO 描述"
            name="seoDescription"
            defaultValue={product?.seoDescription || ""}
          />
        </div>

        <label className="flex items-center gap-3 rounded-lg bg-slate-50 p-4 text-sm font-semibold text-ink">
          <input
            name="isPublished"
            type="checkbox"
            defaultChecked={product?.isPublished ?? false}
            className="h-4 w-4 rounded border-line text-brand-600"
            data-testid="admin-product-isPublished"
          />
          上架此商品
        </label>
      </FormSection>

      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
          data-testid="admin-product-submit"
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
        data-testid={`admin-product-${name}`}
        {...props}
      />
    </label>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  ...props
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
} & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue || ""}
        rows={4}
        className="mt-2 w-full rounded border border-line px-4 py-3 text-sm outline-none focus:border-brand-500"
        data-testid={`admin-product-${name}`}
        {...props}
      />
    </label>
  );
}
