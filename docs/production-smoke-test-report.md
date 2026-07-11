# Production Smoke Test Report

## 測試資訊

- 測試時間：2026-07-11 17:46 +08:00
- Production 網址：https://www.aih.tw
- 測試範圍：正式站上線後 smoke test
- 測試資料標記：使用 `TEST` / `prod-smoke` / `prod-customer` 字樣建立測試訂單與測試會員
- 測試帳號角色：customer 測試會員、admin 後台帳號、merchant 後台帳號
- 密碼紀錄：本文件不記錄任何密碼

## 通過項目

- 首頁可正常開啟：https://www.aih.tw
- 商品列表可正常開啟：https://www.aih.tw/products
- 商品詳情頁可正常開啟：https://www.aih.tw/products/test-smoke-product
- SEO title / description 基本正常
- 商品可加入購物車
- 購物車可調整數量
- checkout 可建立 TEST 訂單
- TEST 訂單成功頁可顯示訂單編號
- customer 可註冊並進入會員中心
- customer 註冊後 reload 可維持登入
- 本機 `npm.cmd run lint` 通過
- 本機 `npm.cmd run build` 通過
- 本機 `npm.cmd run test:e2e` 通過，11 項 Playwright E2E 全數通過

## 失敗項目

- customer 使用 `/login` 登入後可進會員中心，但 production reload 後會回到登入頁。
- customer 完成 checkout 後，進入 `/account/orders` 時被導回 `/login`。
- 商品圖片目前正式 TEST 商品沒有圖片可檢查，因此「商品圖片可正常顯示」需等正式商品或媒體上傳後再次確認。
- 後台 admin / merchant smoke test 尚待正式帳號登入後人工確認。
- Vercel Blob 媒體上傳尚待正式後台登入後人工確認。
- CSV 匯出尚待正式後台登入後人工確認。

## 修正項目

- 已將 customer 登入頁由 `/api/customer/login` route handler 改為既有 `customerLoginAction` server action。
- 修正目的：讓 customer 登入與註冊使用同一套 session cookie 寫入流程，降低 production route handler 與 server action 寫 cookie 行為不一致造成的掉登入風險。
- 已將 admin / customer 登入 cookie 改為使用 `maxAge` 為主，不在登入 cookie 上寫入絕對 `expires`。
- 修正目的：降低 production server 與瀏覽器時鐘差造成 cookie 被立即視為過期的風險。
- 修正後本機 E2E 已驗證 customer register、login、reload、checkout、account orders、logout 流程通過。

## Production Env 檢查

- DATABASE_URL：需在 Vercel Production Environment Variables 確認存在，不可輸出完整值。
- BLOB_READ_WRITE_TOKEN：若專案使用 Vercel Blob OIDC，可能改由 Vercel 管理的 Blob 變數提供；仍需在 Vercel UI 人工確認目前 production media provider 可用。
- SESSION_SECRET：需存在，不可為預設值、空值或短字串。
- COOKIE_SECRET：若保留作為相容別名，需存在且不可為預設值；若系統只使用 SESSION_SECRET，也需確認未使用弱值。
- STORAGE_PROVIDER：production 應為 `vercel-blob`。
- ENABLE_ECPAY_PRODUCTION：目前應維持 `false`，正式金流 production mode 仍禁止。

## 尚待人工確認項目

- 使用正式 admin 登入 `/admin/login`。
- 開啟商品管理、訂單列表、訂單詳情。
- 更新一筆 TEST 訂單狀態。
- 匯出 CSV 並確認瀏覽器下載。
- 在 `/admin/media` 上傳一張 TEST 圖片，確認可在 Vercel Blob Store 看見檔案。
- 將 Blob 圖片套用到商品或 CMS hero 圖片並確認前台可顯示。
- Vercel Dashboard 最後確認 DATABASE_URL、SESSION_SECRET、COOKIE_SECRET、Blob 相關 env 均為 production 安全值。
