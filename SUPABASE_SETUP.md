# Supabase 設定步驟

1. 在 Supabase 專案的 **SQL Editor** 執行 `supabase_schema.sql`。
2. 到 **Authentication → Users**，確認管理員 Email 已存在。
3. 到專案 API 設定取得：
   - Project URL
   - Publishable key（舊專案可能顯示 anon key）
4. 在 Render 後端加入環境變數：
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
   - `REQUIRE_AUTH=false`
   - `ALLOWED_ORIGINS=你的前端正式網址`
   - `ENABLE_DOCS=false`
5. 重新部署 Render，開啟 `/health`，確認 `auth_configured: true`。
6. 用前端登入一次，確認 Email／密碼可用且行事曆同步成功。
7. 最後把 Render 的 `REQUIRE_AUTH` 改成 `true` 並再次部署。

## 安全注意

- 不要把 Database Password 或 `service_role` key 放進 `index.html`。
- 不要把密碼或秘密金鑰貼到聊天、GitHub 或截圖。
- `supabase_schema.sql` 已為所有營運表開啟 RLS。
- `prepaid_ledger` 只允許新增與讀取，禁止修改與刪除。

## 目前階段

本階段完成資料表、RLS、登入與後端權杖驗證。營運資料仍以 LocalStorage 為主；下一階段才執行首次雲端匯入與雙向同步。
