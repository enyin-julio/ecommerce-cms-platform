import { NextResponse, type NextRequest } from "next/server";
import { OrderStatus, type OrderStatus as OrderStatusValue } from "@/lib/domain-types";
import { getCurrentAdminSession } from "@/lib/session";
import { getAdminOrdersForExport } from "@/modules/orders/order.repository";

const exportStatuses: OrderStatusValue[] = [
  OrderStatus.pending,
  OrderStatus.paid,
  OrderStatus.processing,
  OrderStatus.shipped,
  OrderStatus.cancelled
];

const exportFieldMap = {
  orderId: "訂單編號",
  status: "訂單狀態",
  customerName: "客戶姓名",
  customerPhone: "電話",
  customerEmail: "Email",
  address: "地址",
  productName: "商品名稱",
  sku: "SKU",
  quantity: "數量",
  unitPrice: "單價",
  lineSubtotal: "小計",
  total: "總金額",
  createdAt: "建立時間",
  updatedAt: "更新時間"
} as const;

type ExportField = keyof typeof exportFieldMap;

const defaultFields: ExportField[] = [
  "orderId",
  "status",
  "customerName",
  "customerPhone",
  "customerEmail",
  "total",
  "createdAt"
];

const itemFields = new Set<ExportField>([
  "productName",
  "sku",
  "quantity",
  "unitPrice",
  "lineSubtotal"
]);

export async function GET(request: NextRequest) {
  const session = await getCurrentAdminSession();

  if (!session || session.role === "customer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const statusParam = searchParams.get("status");
  const status = exportStatuses.includes(statusParam as OrderStatusValue)
    ? (statusParam as OrderStatusValue)
    : undefined;
  const fields = parseFields(searchParams.getAll("fields"));
  const orders = await getAdminOrdersForExport(session, {
    keyword: searchParams.get("keyword") || undefined,
    status,
    dateFrom: searchParams.get("dateFrom") || undefined,
    dateTo: searchParams.get("dateTo") || undefined
  });

  const shouldExpandItems = fields.some((field) => itemFields.has(field));
  const rows = orders.flatMap((order) => {
    if (!shouldExpandItems) {
      return [buildCsvRow(fields, order, null)];
    }

    if (order.items.length === 0) {
      return [buildCsvRow(fields, order, null)];
    }

    return order.items.map((item) => buildCsvRow(fields, order, item));
  });
  const csv = [[...fields.map((field) => exportFieldMap[field])], ...rows]
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`
    }
  });
}

function parseFields(values: string[]): ExportField[] {
  const fields = values.filter((value): value is ExportField => {
    return Object.prototype.hasOwnProperty.call(exportFieldMap, value);
  });

  return fields.length > 0 ? fields : defaultFields;
}

function buildCsvRow(
  fields: ExportField[],
  order: Awaited<ReturnType<typeof getAdminOrdersForExport>>[number],
  item: Awaited<ReturnType<typeof getAdminOrdersForExport>>[number]["items"][number] | null
) {
  const shippingAddress = order.shippingAddress as { address?: string } | null;

  return fields.map((field) => {
    switch (field) {
      case "orderId":
        return order.id;
      case "status":
        return order.status;
      case "customerName":
        return order.customerName;
      case "customerPhone":
        return order.customerPhone;
      case "customerEmail":
        return order.customerEmail;
      case "address":
        return shippingAddress?.address || "";
      case "productName":
        return item?.productName || "";
      case "sku":
        return item?.product?.sku || "";
      case "quantity":
        return item ? String(item.quantity) : "";
      case "unitPrice":
        return item ? item.unitPrice.toString() : "";
      case "lineSubtotal":
        return item ? String(Number(item.unitPrice) * item.quantity) : "";
      case "total":
        return order.total.toString();
      case "createdAt":
        return order.createdAt.toISOString();
      case "updatedAt":
        return order.updatedAt.toISOString();
      default:
        return "";
    }
  });
}

function escapeCsvCell(value: string) {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}
