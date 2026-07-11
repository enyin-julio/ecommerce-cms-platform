# 綠界 ECPay 正式上線人工確認清單

目前仍禁止啟用 production mode。請勿在所有人工項目確認完成前設定 `ENABLE_ECPAY_PRODUCTION=true`。

## 1. 綠界正式金鑰確認

請到綠界廠商後台的系統介接設定確認正式環境金鑰：

- [ ] production `ECPAY_MERCHANT_ID`
- [ ] production `ECPAY_HASH_KEY`
- [ ] production `ECPAY_HASH_IV`

注意事項：

- 綠界商店代號、HashKey、HashIV 通常可在廠商後台的系統介接設定取得。
- 不可把正式金鑰寫死在程式碼。
- 不可把正式金鑰提交到 Git。
- 不可把完整金鑰貼到文件、Issue、客服工單、截圖或聊天紀錄。
- 正式金鑰只能放在 Vercel Production Environment Variables。

參考資料：https://www.grnet.com.tw/web-design/ecpay-hashkey-hashiv-guide-n320

## 2. Vercel Production Env 確認

請到 Vercel Project Settings -> Environment Variables -> Production 確認：

- [ ] `ECPAY_MERCHANT_ID`
- [ ] `ECPAY_HASH_KEY`
- [ ] `ECPAY_HASH_IV`
- [ ] `PAYMENT_PROVIDER=ecpay`
- [ ] `PAYMENT_MODE=production`
- [ ] `ENABLE_ECPAY_PRODUCTION=false`

重要規則：

- `ENABLE_ECPAY_PRODUCTION=false` 是目前必要預設值，代表正式金流仍被禁止。
- 設定 production env 時，不可順手改成 `ENABLE_ECPAY_PRODUCTION=true`。
- Preview / Development 環境不可誤用 production 綠界金鑰。

## 3. 正式網域確認

請確認正式網站網域：

- [ ] 必須是 HTTPS。
- [ ] 必須是正式 DNS 網域。
- [ ] 不可使用 `localhost`。
- [ ] 不可使用 ngrok 或其他臨時測試網址。
- [ ] 不可使用 Vercel Preview URL。
- [ ] 必須與 Vercel Production env 的 `NEXT_PUBLIC_SITE_URL` 一致。

範例：

- 可用：`https://www.your-production-domain.com`
- 不可用：`http://localhost:3000`
- 不可用：`https://random-preview-url.vercel.app`
- 不可用：臨時 tunnel / ngrok 網址

## 4. 綠界後台 URL 設定

請在綠界正式廠商後台人工確認以下 URL：

- [ ] ReturnURL  
  `https://your-production-domain.com/api/payments/ecpay/webhook`

- [ ] ClientBackURL  
  `https://your-production-domain.com/account/orders`

- [ ] OrderResultURL  
  `https://your-production-domain.com/checkout/success`

- [ ] RefundNotifyURL  
  `https://your-production-domain.com/api/payments/ecpay/refund-webhook`

URL 規則：

- 全部都必須使用 HTTPS。
- 全部都必須使用正式網域。
- 不可設定 localhost。
- 不可設定 Vercel Preview URL。
- 不可設定臨時測試網址。

## 5. RefundNotifyURL 檢查

啟用退款通知前，請向綠界確認：

- [ ] `RefundNotifyURL` 是否需要申請網域白名單。
- [ ] 綠界是否需要開通防火牆或來源存取權限。
- [ ] 綠界 Server POST 是否可連到正式 endpoint。
- [ ] endpoint 可接受 `POST /api/payments/ecpay/refund-webhook`。
- [ ] endpoint 在 CheckMacValue 驗證通過後會回傳綠界相容格式。

營運檢查：

- [ ] Vercel logs 可看到退款通知 request。
- [ ] `PaymentWebhookLog` 有退款 callback 紀錄。
- [ ] CheckMacValue 驗證失敗時，不會更新退款狀態。

## 6. Production 開關規則

只有以上所有人工項目都確認完成後，才允許最後核准人設定：

```env
ENABLE_ECPAY_PRODUCTION=true
```

目前必須維持：

```env
ENABLE_ECPAY_PRODUCTION=false
```

最終啟用前還必須確認：

- [ ] production database 已備份。
- [ ] Sandbox 付款成功流程已演練。
- [ ] Sandbox 退款成功流程已演練。
- [ ] webhook 重複送測試已完成。
- [ ] 對帳流程已有負責人。
- [ ] webhook 失敗監控與告警已準備。

在這些項目完成前，production mode 一律視為禁止。
