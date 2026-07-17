"""Integration checks for the real PostgreSQL/Supabase integrity rules.

These tests intentionally modify the database named by TEST_DATABASE_URL. Point
that variable at a disposable database only. Without the variable (or psycopg),
the suite is skipped so the normal local test command remains dependency-light.
"""

from __future__ import annotations

import os
import unittest
import uuid
from pathlib import Path
from urllib.parse import urlparse

try:
    import psycopg
    from psycopg.types.json import Jsonb
except ImportError:  # pragma: no cover - exercised by the dependency-light suite
    psycopg = None
    Jsonb = None


ROOT = Path(__file__).resolve().parents[1]
TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL", "").strip()

if TEST_DATABASE_URL and psycopg is None:
    raise RuntimeError("TEST_DATABASE_URL is set but psycopg is not installed")

if TEST_DATABASE_URL:
    database_name = urlparse(TEST_DATABASE_URL).path.lstrip("/").lower()
    disposable_name = database_name.startswith("test_") or database_name.endswith("_test")
    if not disposable_name and os.environ.get("ALLOW_DESTRUCTIVE_DB_TESTS") != "1":
        raise RuntimeError(
            "PostgreSQL integration tests require a disposable database whose name starts "
            "with test_ or ends with _test"
        )


@unittest.skipUnless(
    TEST_DATABASE_URL and psycopg is not None,
    "requires TEST_DATABASE_URL and psycopg (use a disposable PostgreSQL database)",
)
class PostgresIntegrityIntegrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.connection = psycopg.connect(TEST_DATABASE_URL, autocommit=True)
        cls.connection.execute(
            """
            do $$
            begin
              if not exists (select 1 from pg_roles where rolname = 'anon') then
                execute 'create role anon nologin';
              end if;
              if not exists (select 1 from pg_roles where rolname = 'authenticated') then
                execute 'create role authenticated nologin';
              end if;
            end
            $$;

            create schema if not exists auth;
            create table if not exists auth.users (
              id uuid primary key
            );
            create or replace function auth.uid()
            returns uuid
            language sql
            stable
            as $$
              select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
            $$;
            """
        )

        schema_sql = (ROOT / "supabase_schema.sql").read_text(encoding="utf-8")
        migration_sql = (
            ROOT / "supabase_integrity_hardening_migration.sql"
        ).read_text(encoding="utf-8")
        cash_migration_sql = (
            ROOT / "supabase_cash_closeout_csv_safety_migration.sql"
        ).read_text(encoding="utf-8")

        # A clean install and two migration passes prove the migration is rerunnable.
        cls.connection.execute(schema_sql)
        cls.connection.execute(cash_migration_sql)
        cls.connection.execute(cash_migration_sql)
        cls.connection.execute(migration_sql)
        cls.connection.execute(migration_sql)

    @classmethod
    def tearDownClass(cls):
        cls.connection.close()

    def setUp(self):
        self.owner_id = uuid.uuid4()
        self.prefix = uuid.uuid4().hex
        self.connection.execute(
            "insert into auth.users (id) values (%s)", (self.owner_id,)
        )

    def customer_id(self, label: str) -> str:
        return f"{self.prefix}-{label}"

    def order_id(self, label: str) -> str:
        return f"{self.prefix}-order-{label}"

    def ledger_id(self, label: str) -> str:
        return f"{self.prefix}-ledger-{label}"

    def insert_customer(self, label: str, name: str | None = None) -> str:
        customer_id = self.customer_id(label)
        self.connection.execute(
            """
            insert into public.customers (id, owner_id, name, gender)
            values (%s, %s, %s, '其他')
            """,
            (customer_id, self.owner_id, name or label),
        )
        return customer_id

    def insert_order(
        self,
        label: str,
        customer_id: str,
        *,
        order_date: str = "2026-07-01",
        source: str = "manual",
        source_event_id: str | None = None,
        external_order_id: str | None = None,
    ) -> str:
        order_id = self.order_id(label)
        self.connection.execute(
            """
            insert into public.orders (
              id, owner_id, customer_id, order_date, service_name, amount,
              payment_method, source, source_event_id, external_order_id
            ) values (%s, %s, %s, %s, '剪髮', 1200, '現金', %s, %s, %s)
            """,
            (
                order_id,
                self.owner_id,
                customer_id,
                order_date,
                source,
                source_event_id,
                external_order_id,
            ),
        )
        return order_id

    def test_calendar_order_id_is_unique_after_trim_and_case_fold(self):
        customer_id = self.insert_customer("calendar", "Calendar 客人")
        external_id = f"CAL-{self.prefix}"
        self.insert_order(
            "calendar-1",
            customer_id,
            source="google_calendar",
            source_event_id=f"event-{self.prefix}-1",
            external_order_id=external_id,
        )

        with self.assertRaises(psycopg.errors.UniqueViolation):
            self.insert_order(
                "calendar-2",
                customer_id,
                source="google_calendar",
                source_event_id=f"event-{self.prefix}-2",
                external_order_id=f"  {external_id.lower()}  ",
            )

    def test_order_payment_shapes_reject_missing_split_and_topup_channel(self):
        customer_id = self.insert_customer("payment-shape", "付款測試")
        with self.assertRaises(psycopg.errors.CheckViolation):
            self.connection.execute(
                """
                insert into public.orders (
                  id, owner_id, customer_id, order_date, service_name, amount,
                  payment_method, topup_channel
                ) values (%s, %s, %s, '2026-07-01', '儲值', 2000, '儲值進帳', null)
                """,
                (self.order_id("topup-no-channel"), self.owner_id, customer_id),
            )

        with self.assertRaises(psycopg.errors.CheckViolation):
            self.connection.execute(
                """
                insert into public.orders (
                  id, owner_id, customer_id, order_date, service_name, amount,
                  payment_method, cash_amount
                ) values (%s, %s, %s, '2026-07-01', '染髮', 1800, '現金＋儲值扣款', null)
                """,
                (self.order_id("mixed-no-cash"), self.owner_id, customer_id),
            )

    def test_customer_merge_keeps_a_to_b_to_c_history_and_rejects_cycle(self):
        customer_a = self.insert_customer("a", "A")
        customer_b = self.insert_customer("b", "B")
        customer_c = self.insert_customer("c", "C")

        self.connection.execute(
            """
            update public.customers
            set merged_into_customer_id = %s, archived_at = now()
            where owner_id = %s and id = %s
            """,
            (customer_b, self.owner_id, customer_a),
        )
        self.connection.execute(
            """
            update public.customers
            set merged_into_customer_id = %s, archived_at = now()
            where owner_id = %s and id = %s
            """,
            (customer_c, self.owner_id, customer_b),
        )

        chain = self.connection.execute(
            """
            select id, merged_into_customer_id, archived_at is not null
            from public.customers
            where owner_id = %s and id in (%s, %s, %s)
            order by id
            """,
            (self.owner_id, customer_a, customer_b, customer_c),
        ).fetchall()
        self.assertEqual(
            chain,
            [
                (customer_a, customer_b, True),
                (customer_b, customer_c, True),
                (customer_c, None, False),
            ],
        )

        cycle_x = self.customer_id("cycle-x")
        cycle_y = self.customer_id("cycle-y")
        with self.assertRaises(psycopg.Error):
            with self.connection.transaction():
                self.connection.execute(
                    """
                    insert into public.customers (
                      id, owner_id, name, gender, merged_into_customer_id, archived_at
                    ) values (%s, %s, 'Cycle X', '其他', %s, now())
                    """,
                    (cycle_x, self.owner_id, cycle_y),
                )
                self.connection.execute(
                    """
                    insert into public.customers (
                      id, owner_id, name, gender, merged_into_customer_id, archived_at
                    ) values (%s, %s, 'Cycle Y', '其他', %s, now())
                    """,
                    (cycle_y, self.owner_id, cycle_x),
                )
                self.connection.execute("set constraints all immediate")

        cycle_count = self.connection.execute(
            "select count(*) from public.customers where id in (%s, %s)",
            (cycle_x, cycle_y),
        ).fetchone()[0]
        self.assertEqual(cycle_count, 0)

    def test_closed_order_only_allows_actual_duration_update(self):
        customer_id = self.insert_customer("closeout", "鎖帳客人")
        order_id = self.insert_order(
            "closed", customer_id, order_date="2026-07-02"
        )
        self.connection.execute(
            """
            insert into public.closeouts (owner_id, closeout_date)
            values (%s, '2026-07-02')
            """,
            (self.owner_id,),
        )

        self.connection.execute(
            """
            update public.orders set actual_duration_minutes = 75
            where owner_id = %s and id = %s
            """,
            (self.owner_id, order_id),
        )
        actual_minutes = self.connection.execute(
            "select actual_duration_minutes from public.orders where id = %s",
            (order_id,),
        ).fetchone()[0]
        self.assertEqual(actual_minutes, 75)

        with self.assertRaises(psycopg.Error) as context:
            self.connection.execute(
                """
                update public.orders set service_name = '染髮'
                where owner_id = %s and id = %s
                """,
                (self.owner_id, order_id),
            )
        self.assertEqual(context.exception.sqlstate, "55000")

        with self.assertRaises(psycopg.Error):
            self.connection.execute(
                """
                update public.orders
                set actual_duration_minutes = 90, service_name = '染髮'
                where owner_id = %s and id = %s
                """,
                (self.owner_id, order_id),
            )

        correction_id = self.order_id("correction")
        self.connection.execute(
            """
            insert into public.orders (
              id, owner_id, customer_id, order_date, service_name, amount,
              correction_slip, correction_for_order_id, correction_for_date,
              correction_reason, payment_method
            ) values (
              %s, %s, %s, '2026-07-03', '鎖帳修正', -200,
              true, %s, '2026-07-02', '金額更正', '現金'
            )
            """,
            (correction_id, self.owner_id, customer_id, order_id),
        )

    def test_reversal_and_transfer_shapes_are_enforced(self):
        customer_a = self.insert_customer("ledger-a", "Ledger A")
        customer_b = self.insert_customer("ledger-b", "Ledger B")
        original_id = self.ledger_id("original")
        self.connection.execute(
            """
            insert into public.prepaid_ledger (
              id, owner_id, customer_id, signed_amount, kind, bucket,
              effective_date, customer_name_snapshot, note
            ) values (%s, %s, %s, 500, 'adjustment', 'topup',
                      '2026-07-04', 'Ledger A', '人工調整')
            """,
            (original_id, self.owner_id, customer_a),
        )

        with self.assertRaises(psycopg.Error):
            self.connection.execute(
                """
                insert into public.prepaid_ledger (
                  id, owner_id, customer_id, signed_amount, kind, bucket,
                  effective_date, reversal_of_entry_id, customer_name_snapshot
                ) values (%s, %s, %s, -499, 'reversal', 'topup',
                          '2026-07-04', %s, 'Ledger A')
                """,
                (
                    self.ledger_id("bad-reversal"),
                    self.owner_id,
                    customer_a,
                    original_id,
                ),
            )

        reversal_id = self.ledger_id("reversal")
        self.connection.execute(
            """
            insert into public.prepaid_ledger (
              id, owner_id, customer_id, signed_amount, kind, bucket,
              effective_date, reversal_of_entry_id, customer_name_snapshot
            ) values (%s, %s, %s, -500, 'reversal', 'topup',
                      '2026-07-04', %s, 'Ledger A')
            """,
            (reversal_id, self.owner_id, customer_a, original_id),
        )

        with self.assertRaises(psycopg.errors.UniqueViolation):
            self.connection.execute(
                """
                insert into public.prepaid_ledger (
                  id, owner_id, customer_id, signed_amount, kind, bucket,
                  effective_date, reversal_of_entry_id, customer_name_snapshot
                ) values (%s, %s, %s, -500, 'reversal', 'topup',
                          '2026-07-04', %s, 'Ledger A')
                """,
                (
                    self.ledger_id("second-reversal"),
                    self.owner_id,
                    customer_a,
                    original_id,
                ),
            )

        with self.assertRaises(psycopg.Error):
            self.connection.execute(
                "update public.prepaid_ledger set note = '覆寫' where id = %s",
                (original_id,),
            )

        transfer_group = f"{self.prefix}-transfer-valid"
        with self.connection.transaction():
            for entry_id, customer_id, signed_amount, snapshot in (
                (self.ledger_id("transfer-out"), customer_a, -300, "Ledger A"),
                (self.ledger_id("transfer-in"), customer_b, 300, "Ledger B"),
            ):
                self.connection.execute(
                    """
                    insert into public.prepaid_ledger (
                      id, owner_id, customer_id, signed_amount, kind, bucket,
                      effective_date, transfer_group_id, system_managed,
                      customer_name_snapshot, note
                    ) values (%s, %s, %s, %s, 'adjustment', 'topup',
                              '2026-07-04', %s, true, %s, '顧客合併轉移')
                    """,
                    (
                        entry_id,
                        self.owner_id,
                        customer_id,
                        signed_amount,
                        transfer_group,
                        snapshot,
                    ),
                )

        transfer_shape = self.connection.execute(
            """
            select count(*), count(distinct customer_id), sum(signed_amount)
            from public.prepaid_ledger
            where owner_id = %s and transfer_group_id = %s
            """,
            (self.owner_id, transfer_group),
        ).fetchone()
        self.assertEqual(transfer_shape, (2, 2, 0))

        invalid_group = f"{self.prefix}-transfer-single"
        with self.assertRaises(psycopg.Error):
            with self.connection.transaction():
                self.connection.execute(
                    """
                    insert into public.prepaid_ledger (
                      id, owner_id, customer_id, signed_amount, kind, bucket,
                      effective_date, transfer_group_id, system_managed,
                      customer_name_snapshot
                    ) values (%s, %s, %s, -100, 'adjustment', 'topup',
                              '2026-07-04', %s, true, 'Ledger A')
                    """,
                    (
                        self.ledger_id("single-transfer"),
                        self.owner_id,
                        customer_a,
                        invalid_group,
                    ),
                )
                self.connection.execute("set constraints all immediate")

        invalid_count = self.connection.execute(
            """
            select count(*) from public.prepaid_ledger
            where owner_id = %s and transfer_group_id = %s
            """,
            (self.owner_id, invalid_group),
        ).fetchone()[0]
        self.assertEqual(invalid_count, 0)

    def test_same_day_backups_are_multiple_immutable_snapshots(self):
        for sequence in (1, 2):
            self.connection.execute(
                """
                insert into public.data_backups (
                  owner_id, backup_date, schema_version, payload,
                  record_counts, integrity
                ) values (%s, '2026-07-05', 3, %s, %s, %s)
                """,
                (
                    self.owner_id,
                    Jsonb({"sequence": sequence}),
                    Jsonb({"orders": sequence}),
                    Jsonb({"valid": True}),
                ),
            )

        backups = self.connection.execute(
            """
            select id, payload
            from public.data_backups
            where owner_id = %s and backup_date = '2026-07-05'
            order by id
            """,
            (self.owner_id,),
        ).fetchall()
        self.assertEqual(len(backups), 2)
        self.assertEqual([row[1]["sequence"] for row in backups], [1, 2])

        with self.assertRaises(psycopg.Error) as context:
            self.connection.execute(
                "update public.data_backups set payload = %s where id = %s",
                (Jsonb({"sequence": 99}), backups[0][0]),
            )
        self.assertEqual(context.exception.sqlstate, "55000")

    def test_expense_payment_and_closeout_cash_fields_are_constrained(self):
        expense_id = f"{self.prefix}-expense"
        self.connection.execute(
            """
            insert into public.expenses (id, owner_id, expense_date, category, amount)
            values (%s, %s, '2026-07-06', '材料費', 300)
            """,
            (expense_id, self.owner_id),
        )
        payment_method = self.connection.execute(
            "select payment_method from public.expenses where id = %s",
            (expense_id,),
        ).fetchone()[0]
        self.assertEqual(payment_method, "非現金")

        with self.assertRaises(psycopg.Error):
            self.connection.execute(
                """
                insert into public.expenses (
                  id, owner_id, expense_date, category, amount, payment_method
                ) values (%s, %s, '2026-07-06', '材料費', 100, '信用卡')
                """,
                (f"{expense_id}-invalid", self.owner_id),
            )

        self.connection.execute(
            """
            insert into public.closeouts (
              owner_id, closeout_date, opening_cash, cash_expenses,
              expected_cash, counted_cash, difference
            ) values (%s, '2026-07-06', 2000, 300, 3200, 3200, 0)
            """,
            (self.owner_id,),
        )
        cash_fields = self.connection.execute(
            """
            select opening_cash, cash_expenses
            from public.closeouts
            where owner_id = %s and closeout_date = '2026-07-06'
            """,
            (self.owner_id,),
        ).fetchone()
        self.assertEqual(cash_fields, (2000, 300))

        with self.assertRaises(psycopg.Error):
            self.connection.execute(
                """
                insert into public.closeouts (owner_id, closeout_date, opening_cash)
                values (%s, '2026-07-07', -1)
                """,
                (self.owner_id,),
            )


if __name__ == "__main__":
    unittest.main()
