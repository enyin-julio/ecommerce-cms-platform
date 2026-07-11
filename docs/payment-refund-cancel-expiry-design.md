# Refund, Cancellation, and Expiry Design

This document records the data and workflow design before production payment integration. It does not connect production ECPay APIs.

## Payment Statuses

The `Payment.status` and `Order.paymentStatus` values are:

- `unpaid`: no payment attempt has been created yet.
- `pending`: payment attempt was created and is waiting for provider result.
- `paid`: provider confirmed successful payment.
- `failed`: provider returned a failed result.
- `cancelled`: customer or provider cancelled the payment attempt.
- `expired`: payment window expired before completion.
- `refunded`: payment was refunded.

## Current MVP Data Fields

`Payment` stores:

- `provider`
- `status`
- `amount`
- `currency`
- `merchantTradeNo`
- `transactionId`
- `rawPayload`
- `failureReason`
- `paidAt`

`PaymentWebhookLog` stores:

- provider and merchant trade number
- request payload
- signature verification result
- processing result
- processing message

## Future Refund Flow

1. Admin requests refund from the order detail page.
2. Server checks role and merchant ownership.
3. Server calls the payment provider refund API.
4. Provider refund notification is received by a dedicated webhook endpoint.
5. Refund notification CheckMacValue must be verified before updating data.
6. Payment is marked `refunded`.
7. Order status is reviewed separately; refund does not automatically imply stock restock unless the order is also cancelled.

## Future Cancellation Flow

1. Pending payment may be cancelled by customer action, provider callback, or admin action.
2. Server marks `Payment.status=cancelled`.
3. If the order is also cancelled, stock is restored using the existing stock movement pattern.
4. Duplicate cancellation callbacks must be idempotent.

## Future Expiry Flow

1. Scheduled job scans pending payments older than the provider payment window.
2. Server marks expired payment attempts as `expired`.
3. The related order can remain pending for manual review or be cancelled by an explicit policy.
4. If cancelled, stock is restored exactly once.

## Production Readiness Requirements

- Confirm provider-specific refund callback format and CheckMacValue rules against official ECPay documentation.
- Add refund request records before calling any production refund API.
- Add alerting for failed refund notifications.
- Add finance approval controls before production refund actions.
