# Payment Reconciliation Runbook

This runbook is for comparing this system's `Order` / `Payment` records with ECPay Sandbox or future production transaction records. It does not enable production payments.

## Scope

Use reconciliation to confirm:

- Order total matches ECPay transaction amount.
- `Payment.merchantTradeNo` matches the ECPay merchant trade number.
- `Payment.transactionId` matches the ECPay transaction number when available.
- `Payment.status` matches the ECPay transaction status.
- `PaymentRefund.amount` and `PaymentRefund.status` match ECPay refund records.
- Duplicate webhook callbacks did not create duplicate paid transitions.

## Daily Reconciliation Steps

1. Export orders from `/admin/orders` with these fields: order ID, payment status, customer name, total amount, created time, updated time.
2. Query ECPay back office or export ECPay transaction records for the same date range.
3. Match records by merchant trade number first, then by amount and transaction time.
4. Confirm paid ECPay transactions have `Payment.status=paid` and `Order.paymentStatus=paid`.
5. Confirm failed, cancelled, expired, or refunded ECPay records are reflected on `Payment.status`.
6. Match refund records by `Payment.merchantTradeNo`, refund amount, and refund processed time.
7. Confirm refund notifications updated the correct `PaymentRefund` record.
8. Review `PaymentWebhookLog` for failed signature checks, amount mismatches, missing payment records, refund callback failures, or duplicate callback handling.
9. Investigate any amount mismatch before shipping orders.

## Field Mapping

Use this table when comparing local records with ECPay back office exports:

| Local field | ECPay field | Notes |
| --- | --- | --- |
| `Payment.merchantTradeNo` | `MerchantTradeNo` | Primary matching key. |
| `Payment.transactionId` | `TradeNo` | Available after successful payment callback. |
| `Order.total` | `TradeAmt` or `TotalAmount` | Compare rounded integer amount. |
| `Payment.status` | ECPay transaction result | `paid`, `failed`, `cancelled`, `expired`, or `refunded`. |
| `Payment.paidAt` | `PaymentDate` | Compare in Taiwan time. |
| `PaymentRefund.providerRefundId` | `MerchantRefundNo` | Primary refund matching key when available. |
| `PaymentRefund.amount` | `RefundAmount` | Compare rounded integer amount. |
| `PaymentWebhookLog.merchantTradeNo` | `MerchantTradeNo` | Audit trail for callback processing. |

## Reconciliation Checklist

- [ ] Export orders for the date range.
- [ ] Export or view ECPay payment transactions for the same date range.
- [ ] Match successful payments by merchant trade number.
- [ ] Match transaction amount to `Order.total`.
- [ ] Match refund amount to `PaymentRefund.amount`.
- [ ] Confirm `Payment.status=paid` for paid transactions.
- [ ] Confirm `Payment.status=refunded` when a full refund is confirmed.
- [ ] Review all failed `PaymentWebhookLog` rows.
- [ ] Escalate any amount mismatch before shipping or refunding.

## Exception Handling

- If ECPay shows paid but this system is pending, check `PaymentWebhookLog` first.
- If `PaymentWebhookLog` has invalid signature entries, do not update the order manually until the callback source is verified.
- If amounts do not match, keep the order unshipped and compare `OrderItem` totals with ECPay transaction amount.
- If duplicate callbacks were received, confirm the order has only one paid transition and stock was not deducted again.
- If refund callback data is encrypted and cannot be parsed, do not update refund status manually until the provider payload is verified in ECPay back office.
- If a local payment is paid but ECPay has no matching `MerchantTradeNo`, hold fulfillment and verify whether the callback payload was from sandbox, replay, or a misconfigured environment.
- If ECPay shows refunded but `PaymentRefund.status` is not `succeeded`, inspect `PaymentWebhookLog` for `refund_callback` rows and retry only after confirming CheckMacValue validity.

## Production Notes

- Store reconciliation exports securely because they contain customer and order data.
- Do not store card numbers or sensitive payment credentials.
- Add monitoring for failed webhook logs before enabling production payments.
- Keep `ENABLE_ECPAY_PRODUCTION=false` until sandbox reconciliation has been completed and signed off.
