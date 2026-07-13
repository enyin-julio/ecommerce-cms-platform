"use client";

import { useMemo, useState } from "react";

type MediaOption = {
  id: string;
  url: string;
  altText: string | null;
  fileName: string | null;
  merchantName: string;
};

type ProductImageFieldProps = {
  defaultValue: string;
  media: MediaOption[];
};

export function ProductImageField({ defaultValue, media }: ProductImageFieldProps) {
  const [imageUrl, setImageUrl] = useState(defaultValue);

  const selectedMediaId = useMemo(() => {
    return media.find((item) => item.url === imageUrl)?.id || "";
  }, [imageUrl, media]);

  return (
    <div className="space-y-3">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,360px)]">
        <label className="block">
          <span className="text-sm font-medium text-ink">商品圖片 URL</span>
          <input
            name="imageUrl"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            placeholder="可手動貼上圖片網址，或從右側媒體庫選擇"
            className="mt-2 w-full rounded-lg border border-line px-4 py-3 outline-none focus:border-brand-500"
            data-testid="admin-product-imageUrl"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-ink">選擇圖檔</span>
          <select
            value={selectedMediaId}
            onChange={(event) => {
              const selected = media.find((item) => item.id === event.target.value);
              setImageUrl(selected?.url || "");
            }}
            className="mt-2 w-full rounded-lg border border-line px-4 py-3 outline-none focus:border-brand-500"
            data-testid="admin-product-media-select"
          >
            <option value="">
              {media.length > 0 ? "從媒體庫選擇圖片" : "媒體庫目前沒有圖片"}
            </option>
            {media.map((item) => (
              <option key={item.id} value={item.id}>
                {item.altText || item.fileName || item.url} / {item.merchantName}
              </option>
            ))}
          </select>
        </label>
      </div>

      {imageUrl ? (
        <div className="flex flex-col gap-3 rounded-lg border border-line bg-slate-50 p-3 sm:flex-row sm:items-center">
          <div
            className="h-24 w-24 shrink-0 rounded-md border border-line bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${imageUrl})` }}
            aria-label="商品圖片預覽"
          />
          <div className="min-w-0 text-sm text-muted">
            <p className="font-medium text-ink">目前圖片</p>
            <p className="mt-1 break-all">{imageUrl}</p>
          </div>
        </div>
      ) : (
        <p className="rounded-lg bg-slate-50 p-3 text-sm text-muted">
          尚未設定商品圖片。可先到「媒體庫」上傳圖片，再回到這裡選擇。
        </p>
      )}
    </div>
  );
}
