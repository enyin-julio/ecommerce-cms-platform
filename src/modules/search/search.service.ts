import { getPublishedProducts } from "@/modules/catalog/product.repository";

export async function searchProductsByKeyword(keyword: string) {
  const products = await getPublishedProducts();
  const normalizedKeyword = keyword.trim().toLowerCase();

  if (!normalizedKeyword) {
    return products;
  }

  return products.filter((product) => {
    const text = [
      product.name,
      product.shortDescription,
      product.description,
      product.category?.name
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return text.includes(normalizedKeyword);
  });
}
