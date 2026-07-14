"use client";

import {
  MediaImageField,
  type MediaImageOption
} from "@/components/admin/media-image-field";

type ProductImageFieldProps = {
  defaultValue: string;
  media: MediaImageOption[];
};

export function ProductImageField({ defaultValue, media }: ProductImageFieldProps) {
  return (
    <MediaImageField
      name="imageUrl"
      label="商品圖片 URL"
      defaultValue={defaultValue}
      media={media}
      testId="admin-product-imageUrl"
      helpText="這張圖會顯示在商品列表與商品詳情頁。"
    />
  );
}
