import type { Category, Media, Merchant, Product } from "@prisma/client";
import { ProductImageField } from "@/components/admin/product-image-field";

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
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-ink">商家</span>
          <select
            name="merchantId"
            defaultValue={selectedMerchantId}
            className="mt-2 w-full rounded-lg border border-line px-4 py-3 outline-none focus:border-brand-500"
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
          <span className="text-sm font-medium text-ink">商品分類</span>
          <select
            name="categoryId"
            defaultValue={product?.categoryId || ""}
            className="mt-2 w-full rounded-lg border border-line px-4 py-3 outline-none focus:border-brand-500"
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

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="商品名稱" name="name" defaultValue={product?.name} required />
        <TextField label="SKU" name="sku" defaultValue={product?.sku} required />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="網址 Slug" name="slug" defaultValue={product?.slug} required />
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

      <ProductImageField defaultValue={product?.imageUrl || ""} media={mediaOptions} />

      <TextArea
        label="簡短描述"
        name="shortDescription"
        defaultValue={product?.shortDescription}
        required
      />
      <TextArea label="詳細描述" name="description" defaultValue={product?.description} required />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="SEO 標題" name="seoTitle" defaultValue={product?.seoTitle || ""} />
        <TextField
          label="SEO 描述"
          name="seoDescription"
          defaultValue={product?.seoDescription || ""}
        />
      </div>

      <label className="flex items-center gap-3 rounded-lg bg-slate-50 p-4 text-sm font-medium text-ink">
        <input
          name="isPublished"
          type="checkbox"
          defaultChecked={product?.isPublished ?? false}
          className="h-4 w-4 rounded border-line text-brand-600"
          data-testid="admin-product-isPublished"
        />
        商品上架
      </label>

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
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue || ""}
        rows={4}
        className="mt-2 w-full rounded-lg border border-line px-4 py-3 outline-none focus:border-brand-500"
        data-testid={`admin-product-${name}`}
        {...props}
      />
    </label>
  );
}
