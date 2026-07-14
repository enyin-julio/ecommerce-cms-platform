"use client";

import { useMemo, useState } from "react";

export type MediaImageOption = {
  id: string;
  url: string;
  altText: string | null;
  fileName: string | null;
  merchantName?: string;
};

type MediaImageFieldProps = {
  name: string;
  label: string;
  defaultValue: string;
  media: MediaImageOption[];
  testId: string;
  helpText?: string;
  emptyText?: string;
};

export function MediaImageField({
  name,
  label,
  defaultValue,
  media,
  testId,
  helpText,
  emptyText = "目前沒有媒體圖片，請先到媒體庫上傳。"
}: MediaImageFieldProps) {
  const [imageUrl, setImageUrl] = useState(defaultValue);

  const selectedMediaId = useMemo(() => {
    return media.find((item) => item.url === imageUrl)?.id || "";
  }, [imageUrl, media]);

  return (
    <div className="space-y-3">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,360px)]">
        <label className="block">
          <span className="text-sm font-semibold text-ink">{label}</span>
          <input
            name={name}
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            placeholder="可貼上圖片網址，或按右側選擇媒體庫圖片"
            className="mt-2 min-h-12 w-full rounded border border-line px-4 text-sm outline-none focus:border-brand-500"
            data-testid={testId}
          />
          {helpText ? <span className="mt-2 block text-xs text-muted">{helpText}</span> : null}
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-ink">選擇圖檔</span>
          <select
            value={selectedMediaId}
            onChange={(event) => {
              const selected = media.find((item) => item.id === event.target.value);
              setImageUrl(selected?.url || "");
            }}
            className="mt-2 min-h-12 w-full rounded border border-line px-4 text-sm outline-none focus:border-brand-500"
            data-testid={`${testId}-media-select`}
          >
            <option value="">{media.length > 0 ? "從媒體庫選擇圖片" : emptyText}</option>
            {media.map((item) => (
              <option key={item.id} value={item.id}>
                {getMediaLabel(item)}
              </option>
            ))}
          </select>
          <span className="mt-2 block text-xs text-muted">
            圖片若不在清單中，請先到「媒體庫」上傳。
          </span>
        </label>
      </div>

      {imageUrl ? (
        <div className="flex flex-col gap-3 rounded-lg border border-line bg-slate-50 p-3 sm:flex-row sm:items-center">
          <div
            className="h-24 w-24 shrink-0 rounded-md border border-line bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url("${imageUrl}")` }}
            aria-label={`${label}預覽`}
          />
          <div className="min-w-0 text-sm text-muted">
            <p className="font-semibold text-ink">目前圖片</p>
            <p className="mt-1 break-all">{imageUrl}</p>
          </div>
        </div>
      ) : (
        <p className="rounded-lg bg-slate-50 p-3 text-sm text-muted">
          尚未選擇圖片。你可以貼上圖片 URL，或按「選擇圖檔」從媒體庫挑選。
        </p>
      )}
    </div>
  );
}

function getMediaLabel(item: MediaImageOption) {
  const label = item.altText || item.fileName || item.url;
  return item.merchantName ? `${label} / ${item.merchantName}` : label;
}
