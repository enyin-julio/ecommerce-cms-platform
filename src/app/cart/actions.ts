"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentCustomerSession, setCustomerSessionCookie } from "@/lib/customer-session";
import {
  addProductToCart,
  createOrderFromCart,
  removeCartItem,
  updateCartItemQuantity
} from "@/modules/cart/cart.service";

const addToCartSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1)
});

export async function addToCartAction(formData: FormData) {
  const parsed = addToCartSchema.parse({
    productId: formData.get("productId"),
    quantity: formData.get("quantity") || 1
  });

  await addProductToCart(parsed.productId, parsed.quantity);
  revalidatePath("/cart");
  redirect("/cart");
}

export async function updateCartItemQuantityAction(cartItemId: string, formData: FormData) {
  const quantity = z.coerce.number().int().min(1).parse(formData.get("quantity"));

  await updateCartItemQuantity(cartItemId, quantity);
  revalidatePath("/cart");
}

export async function removeCartItemAction(cartItemId: string) {
  await removeCartItem(cartItemId);
  revalidatePath("/cart");
}

const checkoutSchema = z.object({
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  customerEmail: z.string().email(),
  address: z.string().min(1),
  note: z.string().optional()
});

export async function checkoutAction(formData: FormData) {
  const session = await getCurrentCustomerSession();
  const data = checkoutSchema.parse({
    customerName: formData.get("customerName"),
    customerPhone: formData.get("customerPhone"),
    customerEmail: formData.get("customerEmail"),
    address: formData.get("address"),
    note: formData.get("note") || undefined
  });

  const order = await createOrderFromCart({
    ...data,
    userId: session?.userId
  });

  if (session) {
    await setCustomerSessionCookie(session);
  }

  revalidatePath("/cart");
  redirect(`/checkout/success?orderId=${order.id}`);
}
