import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class SqlIntegrityContractTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.schema = (ROOT / "supabase_schema.sql").read_text(encoding="utf-8")
        cls.migration = (ROOT / "supabase_integrity_hardening_migration.sql").read_text(encoding="utf-8")
        cls.cash_migration = (ROOT / "supabase_cash_closeout_csv_safety_migration.sql").read_text(encoding="utf-8")

    def test_migration_is_transactional_and_repeatable(self):
        normalized = self.migration.strip().lower()
        self.assertTrue(normalized.startswith("-- momohair integrity hardening"))
        self.assertIn("begin;", normalized)
        self.assertIn("commit;", normalized)
        self.assertLess(normalized.index("begin;"), normalized.index("commit;"))
        self.assertIn("if not exists", normalized)
        self.assertIn("drop trigger if exists", normalized)

    def test_customer_merge_is_serialized_and_cycle_safe(self):
        for sql in (self.schema, self.migration):
            self.assertIn("function public.validate_customer_merge()", sql)
            self.assertIn("pg_advisory_xact_lock", sql)
            self.assertIn("customer merge would create a cycle", sql)
            self.assertIn("customers_validate_merge", sql)
            self.assertIn("target_customer.merged_into_customer_id is not null", sql)

    def test_closed_dates_and_correction_targets_are_enforced(self):
        for sql in (self.schema, self.migration):
            self.assertRegex(sql, r"if tg_op = 'INSERT' and exists\s*\(")
            self.assertNotRegex(sql, r"if tg_op = 'INSERT'\s+and not new\.correction_slip")
            self.assertIn("correction_for_date is distinct from correction_target_date", sql)
            self.assertIn("correction slips may only reference a closed original date", sql)

    def test_financial_shapes_are_symmetric(self):
        for sql in (self.schema, self.migration):
            self.assertIn("payment_method = '現金＋儲值扣款' and amount > 0", sql)
            self.assertIn("payment_method <> '現金＋儲值扣款' and cash_amount is null", sql)
            self.assertIn("payment_method = '儲值進帳' and topup_channel in ('現金', '轉帳')", sql)
            self.assertIn("payment_method <> '儲值進帳' and topup_channel is null", sql)

    def test_append_only_ledger_and_immutable_backups_remain_enabled(self):
        for sql in (self.schema, self.migration):
            self.assertIn("prepaid_ledger_append_only", sql)
            self.assertIn("prepaid_ledger_reversal_shape_check", sql)
            self.assertIn("prepaid_ledger_transfer_shape_check", sql)
            self.assertIn("data_backups_no_update", sql)
            self.assertIn("before update on public.data_backups", sql)

    def test_cash_closeout_migration_is_repeatable_and_preserves_history(self):
        normalized = self.cash_migration.strip().lower()
        self.assertTrue(normalized.startswith("-- momohair cash closeout"))
        self.assertIn("begin;", normalized)
        self.assertIn("commit;", normalized)
        self.assertIn("add column if not exists payment_method", normalized)
        self.assertIn("default '非現金'", self.cash_migration)
        self.assertIn("add column if not exists opening_cash", normalized)
        self.assertIn("add column if not exists cash_expenses", normalized)
        self.assertNotIn("delete from public.expenses", normalized)
        self.assertIn("update public.expenses", normalized)
        self.assertIn("alter column payment_method set not null", normalized)
        self.assertIn("alter column opening_cash set not null", normalized)
        self.assertIn("alter column cash_expenses set not null", normalized)
        for sql in (self.schema, self.cash_migration):
            self.assertIn("payment_method in ('現金', '非現金')", sql)
            self.assertIn("opening_cash >= 0", sql)
            self.assertIn("cash_expenses >= 0", sql)


class PwaVersionContractTest(unittest.TestCase):
    def test_cached_assets_share_one_version(self):
        expected = "2026.07.17-crm-observation-3"
        index = (ROOT / "index.html").read_text(encoding="utf-8")
        service_worker = (ROOT / "service-worker.js").read_text(encoding="utf-8")
        app = (ROOT / "assets" / "momo-app.js").read_text(encoding="utf-8")

        required_assets = {
            "tailwind.css",
            "vue.global.prod.js",
            "momo-ui.css",
            "momo-core.js",
            "momo-app.js",
        }
        asset_matches = re.findall(
            r"/assets/((?:tailwind|vue\.global\.prod|momo-ui|momo-core|momo-app)\.(?:css|js))\?v=([^\"']+)",
            index,
        )
        self.assertEqual({name for name, _ in asset_matches}, required_assets)
        asset_versions = [version for _, version in asset_matches]
        self.assertEqual(set(asset_versions), {expected})
        self.assertIn(f"const APP_VERSION = '{expected}'", service_worker)
        self.assertIn("const CACHE_NAME = `momohair-shell-${APP_VERSION}`", service_worker)
        for asset in required_assets:
            self.assertIn(f"`/assets/{asset}?v=${{APP_VERSION}}`", service_worker)
        self.assertIn(f"const APP_VERSION = '{expected}'", app)


if __name__ == "__main__":
    unittest.main()
