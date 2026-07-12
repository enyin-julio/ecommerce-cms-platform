# ECPay Production URL Checklist

All production ECPay URLs must use the official HTTPS domain. Do not use localhost, Vercel preview URLs, temporary deployment URLs, or unverified domains.

Recommended canonical domain:

```text
https://www.aih.tw
```

## Required URLs

| Purpose | Env name | Production URL |
| --- | --- | --- |
| Payment result Server POST | `ECPAY_RETURN_URL` | `https://www.aih.tw/api/payments/ecpay/webhook` |
| Customer return page | `ECPAY_CLIENT_BACK_URL` | `https://www.aih.tw/account/orders` |
| Frontend payment result page | `ECPAY_ORDER_RESULT_URL` | `https://www.aih.tw/checkout/success` |
| Refund notification Server POST | `ECPAY_REFUND_NOTIFY_URL` | `https://www.aih.tw/api/payments/ecpay/refund-webhook` |

## Endpoint Mapping In This Project

- ReturnURL endpoint: `POST /api/payments/ecpay/webhook`
- RefundNotifyURL endpoint: `POST /api/payments/ecpay/refund-webhook`
- OrderResultURL page: `GET /checkout/success`
- ClientBackURL page: `GET /account/orders`

## Manual Checks

- [ ] `https://www.aih.tw` opens with a valid HTTPS certificate.
- [ ] `https://aih.tw` redirects to the intended canonical domain.
- [ ] `www.aih.tw` is connected to the Vercel production deployment.
- [ ] ReturnURL accepts ECPay Server POST and returns provider-compatible text.
- [ ] RefundNotifyURL accepts ECPay Server POST and returns provider-compatible JSON.
- [ ] ReturnURL verifies `CheckMacValue` before updating `Payment` or `Order`.
- [ ] RefundNotifyURL verifies `CheckMacValue` before updating `PaymentRefund`.
- [ ] No callback endpoint requires browser login.
- [ ] No callback endpoint is blocked by Vercel protection, firewall, WAF, or IP restrictions.
- [ ] ECPay official merchant back office has the final HTTPS URLs where required.

## Project Behavior

Payment callback behavior:

- Creates a `PaymentWebhookLog`.
- Verifies `CheckMacValue`.
- Matches `MerchantTradeNo`.
- Recalculates and compares amount from local order data.
- Updates `Payment` and `Order` only after signature and amount checks pass.
- Treats duplicate paid callbacks as already processed.

Refund callback behavior:

- Creates a `PaymentWebhookLog`.
- Supports JSON and form POST payloads.
- Verifies `CheckMacValue`.
- Decrypts or parses encrypted `Data`.
- Matches refund to the local `PaymentRefund`.
- Updates refund status only after signature checks pass.
- Treats duplicate succeeded refund callbacks as already processed.

## Blockers

Do not request final production approval if any of these are true:

- Any URL still contains `localhost`.
- Any URL still contains a Vercel preview deployment hostname.
- Any URL uses `http://`.
- `ENABLE_ECPAY_PRODUCTION` is already `true` before manual sign-off.
- ECPay keys are present in source code, docs, logs, or screenshots.
- ReturnURL or RefundNotifyURL cannot be reached by server POST.
