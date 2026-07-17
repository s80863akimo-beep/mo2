# Supabase 設定與 migration 順序

## 全新專案

1. 在 Supabase 專案的 **SQL Editor** 執行 `supabase_schema.sql`。
2. 到 **Authentication → Users** 建立或確認管理員 Email。
3. 到專案 API 設定取得 Project URL 與 Publishable key（舊專案可能顯示 anon key）。
4. 在 Render 設定 `SUPABASE_URL`、`SUPABASE_PUBLISHABLE_KEY`、`ALLOWED_ORIGINS` 與 `ENABLE_DOCS=false`。
5. 首次驗證時可暫設 `REQUIRE_AUTH=false`；確認前端登入與同步正常後，改成 `REQUIRE_AUTH=true` 並重新部署。

全新專案不需要再執行個別 migration，主 schema 已包含目前所有欄位、索引、RLS 與資料完整性規則。

## 已有資料的舊專案

先完成一份可下載的 JSON 備份，再依尚未執行過的功能順序補跑：

1. `supabase_payment_channel_migration.sql`
2. `supabase_order_actual_time_migration.sql`
3. `supabase_closeout_summary_migration.sql`
4. `supabase_backup_migration.sql`
5. `supabase_order_correction_slip_migration.sql`
6. `supabase_cash_closeout_csv_safety_migration.sql`
7. **最後執行** `supabase_integrity_hardening_migration.sql`

`supabase_closeout_counts_migration.sql` 的欄位已包含在 closeout summary migration；只有早期已執行 summary、但仍缺少兩個筆數欄位的專案才需要補跑。

完整性強化 migration 可重跑，並刻意放在最後：舊版 backup migration 會建立「每人每日唯一」限制，最後一步會精確移除該限制，讓同一天能保留多個還原點。

## 強化後的資料規則

- 顧客合併不刪除來源顧客；來源列會保留 `merged_into_customer_id` 與 `archived_at`，確保舊訂單和稽核紀錄仍可追溯。
- `prepaid_ledger` 是 append-only。修正只能新增 adjustment 或 reversal，資料庫會拒絕 UPDATE／DELETE。
- 新增 reversal 必須填 `reversal_of_entry_id`，且需與原分錄同顧客、同 bucket、金額完全相反；訂單分錄、系統分錄與合併轉移不可手動沖銷，同一筆原始帳本最多只能被沖銷一次。
- 顧客合併的儲值轉移必須在同一交易寫入兩筆 adjustment：不同顧客、同日期／bucket／來源訂單且金額互抵；單邊轉移會被拒絕。
- `orders`、`prepaid_ledger`、`crm_profiles` 的顧客外鍵會同時核對 `owner_id`，避免跨帳號誤連資料。
- 已有 closeout 的日期視為鎖帳：原訂單不能更新或刪除，也不能新增一般訂單。唯一更新例外是補登 `actual_duration_minutes`；顧客合併不改寫歷史訂單。帳務更正需在尚未鎖帳的日期新增 correction slip，並參照已鎖帳的原訂單與原日期。
- Google Calendar 有效訂單的 `external_order_id` 會以去除前後空白、忽略大小寫的方式維持唯一；Event ID 僅追蹤來源事件。
- `data_backups` 同一天可新增多份快照。既有快照不能覆寫，但保留清理舊快照所需的刪除權限。
- `expenses.payment_method` 明確區分抽屜現金與非現金支出；打烊應有現金採「開店零用金＋現金收入＋現金儲值進帳－抽屜現金支出」。

針對舊資料新增的外鍵與檢查條件使用 `NOT VALID`：migration 不會因歷史瑕疵整批中斷，但所有新寫入都會立即套用。修好舊資料後，可依 `supabase_integrity_hardening_migration.sql` 末尾的指令逐項 `VALIDATE CONSTRAINT`。

## 安全注意

- 不要把 Database Password 或 `service_role` key 放進前端檔案。
- 不要把密碼或秘密金鑰貼到聊天、GitHub 或截圖。
- 所有營運表都已開啟 RLS；anon 沒有資料表權限。
- 正式環境應使用 `REQUIRE_AUTH=true`，並將 `ALLOWED_ORIGINS` 限制為正式前端網址。

## Calendar 入帳格式

每個已完成的營業事件都必須有 Event ID，並在描述中明確填寫：

```text
Order ID: ORDER-20260717-001
Customer ID: cust_xxxxxxxx
Service: 洗＋剪
Amount: 1200
Payment Method: 現金
```

- `Order ID` 是會計去重鍵，不可包含空白備註或 `/` 等額外字元。
- 同名顧客超過一位時，`Customer ID` 必填；ID 與姓名不同時，以 ID 為準並產生警告。
- `Payment Method` 只接受：現金、轉帳、儲值扣款、現金＋儲值扣款、儲值進帳。
- 混合付款另填 `Cash Amount: 600`，且需大於 0、小於總額。
- 儲值進帳需明確使用 `Payment Method: 儲值進帳（現金）` 或 `儲值進帳（轉帳）`。
- 未結束的未來預約、缺漏欄位、重複 Order ID 與無效付款都只進隔離清單，不會提前計入營收。

## 自動測試

GitHub Actions 會執行前後端單元測試、PWA 資產版本檢查、Tailwind 產物漂移檢查，並在拋棄式 PostgreSQL 16 資料庫實際執行主 schema、重跑完整性 migration，再驗證合併鏈、鎖帳、Calendar 去重、儲值沖銷／轉移與備份不可覆寫。

## 上線後確認

1. 開啟後端 `/health`，確認驗證設定正常。
2. 前端登入後做一次行事曆同步，再新增一份雲端備份。
3. 確認同一天連續建立兩份備份時會得到兩個不同的快照，而不是覆蓋第一份。
4. 用測試資料確認：鎖帳日一般訂單會被拒絕、correction slip 可新增、帳本舊列不可修改、同筆帳本不能重複沖銷。
