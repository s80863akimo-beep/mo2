import unittest
from datetime import datetime, timedelta
from unittest.mock import patch

import main


class CalendarSyncRulesTest(unittest.TestCase):
    def setUp(self):
        self.now = datetime.now(tz=main.TW)
        self.completed_start = (self.now - timedelta(days=2)).replace(
            hour=10, minute=0, second=0, microsecond=0
        )

    def make_event(
        self,
        *,
        event_id="event-1",
        order_id="ORDER-001",
        start=None,
        service="剪髮",
        amount=600,
        payment="現金",
        summary="小美",
        customer_id=None,
        description=None,
        status="confirmed",
    ):
        start = start or self.completed_start
        if description is None:
            lines = []
            if order_id is not None:
                lines.append(f"Order ID: {order_id}")
            if customer_id is not None:
                lines.append(f"Customer ID: {customer_id}")
            if service is not None:
                lines.append(f"Service: {service}")
            if amount is not None:
                lines.append(f"Amount: {amount}")
            if payment is not None:
                lines.append(f"Payment Method: {payment}")
            description = "\n".join(lines)
        return {
            "id": event_id,
            "status": status,
            "summary": summary,
            "description": description,
            "start": {"dateTime": start.isoformat()},
            "end": {"dateTime": (start + timedelta(minutes=60)).isoformat()},
        }

    def sync(self, events, selected=None):
        selected = selected or self.completed_start
        with (
            patch.object(main, "get_calendar_service", return_value=object()),
            patch.object(main, "get_calendar_id", return_value="calendar-id"),
            patch.object(main, "fetch_calendar_events", return_value=events),
        ):
            return main.sync_calendar(
                payload={},
                year=selected.year,
                month=selected.month,
                _current_user=None,
            )

    def test_valid_event_is_accounted_once_and_calendar_time_is_not_actual_time(self):
        result = self.sync([self.make_event()])

        self.assertEqual(result["monthly_revenue"], 600)
        self.assertEqual(result["order_count"], 1)
        self.assertEqual(result["diagnostics"]["orders_parsed"], 1)
        order = result["orders"][0]
        self.assertEqual(order["orderId"], "ORDER-001")
        self.assertEqual(order["sourceEventId"], "event-1")
        self.assertEqual(order["calendarDurationMinutes"], 60)
        self.assertIsNone(order["actualDurationMinutes"])

    def test_optional_customer_id_is_returned_without_name_guessing(self):
        result = self.sync([self.make_event(customer_id="cust_a1b2c3")])

        self.assertEqual(result["orders"][0]["customerId"], "cust_a1b2c3")
        self.assertEqual(result["orders"][0]["customerName"], "小美")

    def test_invalid_customer_id_and_blank_customer_name_are_quarantined(self):
        invalid_id = self.make_event(
            event_id="bad-customer-id",
            order_id="ORDER-CUSTOMER-1",
            customer_id="cust_1/2",
        )
        missing_name = self.make_event(
            event_id="missing-customer-name",
            order_id="ORDER-CUSTOMER-2",
            summary="",
        )

        result = self.sync([invalid_id, missing_name])

        self.assertEqual(result["orders"], [])
        self.assertEqual(result["diagnostics"]["invalid_customer_id"], 1)
        self.assertEqual(result["diagnostics"]["missing_customer"], 1)
        self.assertEqual(
            {item["type"] for item in result["quarantinedEvents"]},
            {"invalid_customer_id", "missing_customer"},
        )

    def test_order_id_must_match_the_entire_labeled_value(self):
        for index, order_id in enumerate(("ORD-1/2", "ORD-1 待確認"), start=1):
            with self.subTest(order_id=order_id):
                result = self.sync([
                    self.make_event(event_id=f"bad-order-{index}", order_id=order_id)
                ])
                self.assertEqual(result["orders"], [])
                self.assertEqual(result["diagnostics"]["invalid_order_id"], 1)
                self.assertEqual(result["quarantinedEvents"][0]["type"], "invalid_order_id")

    def test_same_order_id_across_event_ids_is_deduplicated_by_order_id(self):
        events = [
            self.make_event(event_id="event-a", order_id="order-001"),
            self.make_event(event_id="event-b", order_id="ORDER-001"),
        ]

        result = self.sync(events)

        self.assertEqual(result["monthly_revenue"], 600)
        self.assertEqual(result["order_count"], 1)
        self.assertEqual(len(result["orders"]), 1)
        self.assertEqual(result["diagnostics"]["duplicates"], 1)
        self.assertEqual(result["diagnostics"]["quarantined"], 1)
        self.assertEqual(result["quarantinedEvents"][0]["type"], "duplicate_order_id")

    def test_invalid_duplicate_does_not_block_later_valid_order(self):
        events = [
            self.make_event(event_id="event-invalid", order_id="ORDER-009", amount=0),
            self.make_event(event_id="event-valid", order_id="order-009", amount=900),
        ]

        result = self.sync(events)

        self.assertEqual(result["monthly_revenue"], 900)
        self.assertEqual(len(result["orders"]), 1)
        self.assertEqual(result["orders"][0]["sourceEventId"], "event-valid")
        self.assertEqual(result["diagnostics"]["zero_amount"], 1)
        self.assertEqual(result["diagnostics"]["duplicates"], 0)

    def test_missing_event_id_is_quarantined(self):
        result = self.sync([self.make_event(event_id=None, order_id="ORDER-010")])

        self.assertEqual(result["orders"], [])
        self.assertEqual(result["monthly_revenue"], 0)
        self.assertEqual(result["diagnostics"]["missing_event_id"], 1)
        self.assertEqual(result["quarantinedEvents"][0]["type"], "missing_event_id")

    def test_future_event_is_quarantined_and_not_accounted(self):
        future_start = (self.now + timedelta(days=1)).replace(
            hour=10, minute=0, second=0, microsecond=0
        )
        result = self.sync(
            [self.make_event(start=future_start)],
            selected=future_start,
        )

        self.assertEqual(result["monthly_revenue"], 0)
        self.assertEqual(result["order_count"], 0)
        self.assertEqual(result["orders"], [])
        self.assertEqual(result["diagnostics"]["future_or_incomplete"], 1)
        self.assertEqual(result["quarantinedEvents"][0]["type"], "event_not_finished")

    def test_missing_or_unknown_payment_is_never_treated_as_cash(self):
        self.assertIsNone(main.parse_payment_method("Order ID: A\nService: 剪髮", "剪髮"))
        self.assertIsNone(
            main.parse_payment_method(
                "Order ID: A\nService: 剪髮\nPayment Method: 待確認",
                "剪髮",
            )
        )
        self.assertEqual(
            main.parse_payment_method(
                "Order ID: A\nService: 剪髮\nPayment Method: 轉帳",
                "剪髮",
            ),
            "轉帳",
        )

        result = self.sync([self.make_event(payment=None)])
        self.assertEqual(result["orders"], [])
        self.assertEqual(result["monthly_revenue"], 0)
        self.assertEqual(result["diagnostics"]["invalid_payment"], 1)
        self.assertEqual(result["quarantinedEvents"][0]["type"], "invalid_payment")

    def test_ambiguous_or_negated_payment_words_are_rejected(self):
        for value in ("非現金", "現金或轉帳", "現金/轉帳", "待確認現金"):
            with self.subTest(value=value):
                description = f"Order ID: A\nService: 剪髮\nPayment Method: {value}"
                self.assertIsNone(main.parse_payment_method(description, "剪髮"))

        self.assertIsNone(main.parse_topup_channel(
            "Payment Method: 儲值進帳\nTopup Channel: 非現金",
            "儲值進帳",
        ))
        self.assertIsNone(main.parse_topup_channel(
            "Payment Method: 儲值進帳\nTopup Channel: 現金或轉帳",
            "儲值進帳",
        ))

    def test_topup_payment_is_not_misclassified_by_channel_words(self):
        cash_description = "Order ID: A\nService: 儲值\nAmount: 1000\nPayment Method: 儲值進帳（現金）"
        transfer_description = "Order ID: B\nService: 儲值\nAmount: 1000\nPayment Method: 儲值進帳（轉帳）"

        self.assertEqual(main.parse_payment_method(cash_description, "儲值"), "儲值進帳")
        self.assertEqual(main.parse_topup_channel(cash_description, "儲值進帳"), "現金")
        self.assertEqual(main.parse_payment_method(transfer_description, "儲值"), "儲值進帳")
        self.assertEqual(main.parse_topup_channel(transfer_description, "儲值進帳"), "轉帳")

        missing_channel = self.make_event(order_id="ORDER-011", service="儲值", amount=1000, payment="儲值進帳")
        result = self.sync([missing_channel])
        self.assertEqual(result["orders"], [])
        self.assertEqual(result["diagnostics"]["missing_topup_channel"], 1)

    def test_mixed_payment_and_topup_channels_have_exact_cashflow_totals(self):
        mixed = self.make_event(
            event_id="mixed-payment",
            order_id="ORDER-MIXED",
            description=(
                "Order ID: ORDER-MIXED\nService: 染髮\nAmount: 1800\n"
                "Payment Method: 現金＋儲值扣款\nCash Amount: 600"
            ),
        )
        cash_topup = self.make_event(
            event_id="cash-topup",
            order_id="ORDER-TOPUP-CASH",
            service="儲值",
            amount=2000,
            payment="儲值進帳（現金）",
        )
        transfer_topup = self.make_event(
            event_id="transfer-topup",
            order_id="ORDER-TOPUP-TRANSFER",
            service="儲值",
            amount=3000,
            payment="儲值進帳（轉帳）",
        )

        result = self.sync([mixed, cash_topup, transfer_topup])

        self.assertEqual(result["monthly_revenue"], 1800)
        self.assertEqual(result["monthly_cash_in"], 2600)
        self.assertEqual(result["payment_summary"]["現金"], 600)
        self.assertEqual(result["payment_summary"]["儲值扣款"], 1200)
        self.assertEqual(result["payment_summary"]["儲值進帳"], 5000)
        self.assertEqual(result["order_count"], 1)
        self.assertEqual(len(result["orders"]), 3)

    def test_cancelled_event_is_returned_for_frontend_deactivation(self):
        cancelled = self.make_event(
            event_id="cancelled-event",
            order_id="ORDER-CANCELLED",
            status="cancelled",
        )

        result = self.sync([cancelled])

        self.assertEqual(result["orders"], [])
        self.assertEqual(result["cancelledEventIds"], ["cancelled-event"])
        self.assertEqual(result["monthly_revenue"], 0)

    def test_missing_required_accounting_fields_are_quarantined(self):
        events = [
            self.make_event(event_id="missing-id", order_id=None),
            self.make_event(event_id="missing-service", order_id="ORDER-002", service=None),
            self.make_event(event_id="zero-amount", order_id="ORDER-003", amount=0),
        ]
        result = self.sync(events)

        self.assertEqual(result["orders"], [])
        self.assertEqual(result["monthly_revenue"], 0)
        self.assertEqual(result["diagnostics"]["missing_order_id"], 1)
        self.assertEqual(result["diagnostics"]["missing_service"], 1)
        self.assertEqual(result["diagnostics"]["zero_amount"], 1)
        self.assertEqual(result["diagnostics"]["quarantined"], 3)

    def test_partial_backend_price_match_is_not_silently_accounted(self):
        pricing = main.calc_amount_with_service_config("剪髮＋不存在", {}, allow_backend_fallback=True)
        self.assertEqual(pricing["amount"], 0)
        self.assertTrue(pricing["unmatched"])

        result = self.sync([
            self.make_event(order_id="ORDER-014", service="剪髮＋不存在", amount=None)
        ])
        self.assertEqual(result["orders"], [])
        self.assertEqual(result["diagnostics"]["zero_amount"], 1)

    def test_invalid_explicit_money_is_quarantined_without_price_fallback(self):
        events = []
        for index, value in enumerate(("-500", "600+200", "待確認600"), start=1):
            events.append(self.make_event(
                event_id=f"bad-money-{index}",
                order_id=f"ORDER-MONEY-{index}",
                description=(
                    f"Order ID: ORDER-MONEY-{index}\n"
                    "Service: 剪髮\n"
                    f"Amount: {value}\n"
                    "Payment Method: 現金"
                ),
            ))

        result = self.sync(events)
        self.assertEqual(result["orders"], [])
        self.assertEqual(result["monthly_revenue"], 0)
        self.assertEqual(result["diagnostics"]["invalid_amount"], 3)
        self.assertTrue(all(item["type"] == "invalid_amount" for item in result["quarantinedEvents"]))

    def test_money_parser_accepts_only_complete_nonnegative_values(self):
        self.assertEqual(main.parse_explicit_amount("Amount: NT$ 1,200 元"), 1200)
        self.assertEqual(main.parse_explicit_amount("Amount: 0"), 0)
        self.assertIsNone(main.parse_explicit_amount("Amount: -500"))
        self.assertIsNone(main.parse_explicit_amount("Amount: 600+200"))
        self.assertIsNone(main.parse_cash_amount("Cash Amount: 待確認600"))
        self.assertEqual(main.parse_explicit_amount("Cash Amount: 400\nAmount: 1000"), 1000)
        self.assertEqual(main.parse_explicit_amount("Amount: 1000\nCash Amount: 400"), 1000)
        self.assertEqual(main.parse_cash_amount("Amount: 1000\nCash Amount: 400"), 400)

    def test_blocked_slot_is_ignored_without_accounting_issue(self):
        event = self.make_event(
            event_id="blocked",
            order_id=None,
            service=None,
            amount=None,
            payment=None,
            summary="不約｜休息",
            description="",
        )
        result = self.sync([event])

        self.assertEqual(result["orders"], [])
        self.assertEqual(result["issues"], [])
        self.assertEqual(result["quarantinedEvents"], [])
        self.assertEqual(result["diagnostics"]["blocked_slots"], 1)

    def test_customer_name_containing_block_keyword_is_not_ignored(self):
        result = self.sync([self.make_event(summary="卡卡")])

        self.assertEqual(len(result["orders"]), 1)
        self.assertEqual(result["diagnostics"]["blocked_slots"], 0)

    def test_malformed_calendar_times_are_quarantined_instead_of_crashing_sync(self):
        invalid_start = self.make_event(event_id="bad-start", order_id="ORDER-012")
        invalid_start["start"] = {"dateTime": "not-a-time"}
        invalid_end = self.make_event(event_id="bad-end", order_id="ORDER-013")
        invalid_end["end"] = {"dateTime": "not-a-time"}

        result = self.sync([invalid_start, invalid_end])

        self.assertEqual(result["orders"], [])
        self.assertEqual(result["diagnostics"]["missing_date"], 1)
        self.assertEqual(result["diagnostics"]["future_or_incomplete"], 1)


if __name__ == "__main__":
    unittest.main()
