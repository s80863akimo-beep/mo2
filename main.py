# main.py  —  摸摸頭 momohair × Google Calendar 同步後端
# 依賴：fastapi uvicorn google-api-python-client python-dotenv
# 啟動：uvicorn main:app --reload --port 8000
# 前提：Google Calendar 行事曆必須設為「公開」才能用 API Key 讀取

import re
import os
import logging
from pathlib import Path
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from collections import defaultdict

import httpx
from fastapi import Body, Depends, FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("momohair.sync")
BASE_DIR = Path(__file__).resolve().parent

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_PUBLISHABLE_KEY = os.getenv(
    "SUPABASE_PUBLISHABLE_KEY",
    os.getenv("SUPABASE_ANON_KEY", ""),
)
# Authentication remains opt-in for local development and scheduled syncs, but
# production can now enforce it through the environment instead of a code edit.
REQUIRE_AUTH = os.getenv("REQUIRE_AUTH", "false").strip().lower() in {
    "1", "true", "yes", "on",
}


def supabase_auth_configured() -> bool:
    return bool(SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY)


def calendar_sync_configured() -> bool:
    return bool(os.getenv("GOOGLE_API_KEY") and os.getenv("CALENDAR_ID"))


async def get_current_user(
    authorization: str | None = Header(default=None),
) -> dict | None:
    """需要時向 Supabase Auth 驗證 Bearer token；未啟用時維持本機相容模式。"""
    if not REQUIRE_AUTH:
        return None
    if not supabase_auth_configured():
        raise HTTPException(status_code=503, detail="Supabase 登入尚未完成伺服器設定")
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="請先登入")

    access_token = authorization.split(" ", 1)[1].strip()
    if not access_token:
        raise HTTPException(status_code=401, detail="登入憑證無效")

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(
                f"{SUPABASE_URL}/auth/v1/user",
                headers={
                    "apikey": SUPABASE_PUBLISHABLE_KEY,
                    "Authorization": f"Bearer {access_token}",
                },
            )
    except httpx.HTTPError as exc:
        logger.warning("Supabase auth verification failed: %s", exc)
        raise HTTPException(status_code=503, detail="登入驗證服務暫時無法連線") from exc

    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="登入已失效，請重新登入")
    return response.json()

# ─────────────────────────────────────────────
# 官方精準價目表（key 長度由長到短，避免短字截斷長字）
# ─────────────────────────────────────────────
PRICE_TABLE: dict[str, int] = {
    # 紓壓調理
    "頭皮初淨調理":       2000,
    "頭皮健康髮浴":         600,
    # 精緻剪髮
    "頭皮初淨調理+剪髮":  2200,
    "健康髮浴+剪":         1100,
    "孩童洗+剪":            550,
    "洗+剪":                800,
    "孩童剪髮":             400,
    "剪髮":                 600,
    # 單色染髮
    "特長染髮":            3100,
    "長髮染髮":            2800,
    "中長染髮":            2500,
    "短髮染髮":            2200,
    "男生短髮":            1400,
    # 特殊色
    "特殊色":              5000,
    # 髮絲保養
    "結構式護髮":          1800,
    "髮絲水潤修護":        1200,
}

SORTED_KEYS = sorted(PRICE_TABLE.keys(), key=len, reverse=True)

PAYMENT_ALIASES = {
    "現金＋儲值扣款": "現金＋儲值扣款",
    "現金+儲值扣款": "現金＋儲值扣款",
    "混合付款": "現金＋儲值扣款",
    "現金": "現金",
    "cash": "現金",
    "轉帳": "轉帳",
    "銀行轉帳": "轉帳",
    "匯款": "轉帳",
    "transfer": "轉帳",
    "儲值扣款": "儲值扣款",
    "儲值付款": "儲值扣款",
    "儲值金扣款": "儲值扣款",
    "prepaid": "儲值扣款",
    "儲值進帳": "儲值進帳",
    "儲值入帳": "儲值進帳",
    "儲值": "儲值進帳",
    "topup": "儲值進帳",
    "top up": "儲值進帳",
}

TW = ZoneInfo("Asia/Taipei")

# ─────────────────────────────────────────────
# 服務大分類對應表
# Service: 欄位值 → 統計用大分類
# ─────────────────────────────────────────────
CATEGORY_MAP = {
    "剪髮": "剪髮",
    "洗髮": "洗護其他",
    "燙髮": "燙髮",
    "染髮": "染髮",
    "護髮": "洗護其他",
    "頭皮": "洗護其他",
    "產品": "洗護其他",
}

def classify_service(service_text: str) -> str:
    """
    根據 Service 欄位的大分類名稱（如「燙髮」、「剪髮」、「染髮」）
    對應到統計用的四大類別：剪髮 / 燙髮 / 染髮 / 洗護其他
    """
    for key, cat in CATEGORY_MAP.items():
        if key in service_text:
            return cat
    return "洗護其他"

app = FastAPI(
    title="摸摸頭 momohair 同步 API",
    version="2.0.0",
    docs_url="/docs" if os.getenv("ENABLE_DOCS", "true").lower() == "true" else None,
)

allowed_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "*").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────
# 工具函式
# ─────────────────────────────────────────────

def parse_order_id(description: str) -> str | None:
    """從行事曆 description 抓出 Order ID。"""
    raw = parse_labeled_value(description, ["Order ID"])
    return raw if raw and re.fullmatch(r"[A-Z0-9_-]+", raw, re.IGNORECASE) else None


def parse_customer_id(description: str) -> str | None:
    """讀取完整 Customer ID；格式不完整時不可截斷或猜測。"""
    raw = parse_labeled_value(description, ["Customer ID", "顧客 ID", "顧客ID"])
    return raw if raw and re.fullmatch(r"[A-Z0-9_-]+", raw, re.IGNORECASE) else None


def parse_service_text(description: str) -> str:
    """擷取 Service: 後方、下一個換行前的完整文字。"""
    m = re.search(r"^\s*(?:Service|服務項目|服務)\s*[：:]\s*([^\r\n]+)\s*$", description, re.IGNORECASE | re.MULTILINE)
    return m.group(1).strip() if m else ""


def parse_labeled_value(description: str, labels: list[str]) -> str | None:
    """讀取 description 中指定標籤後方、同一行的值。"""
    pattern = rf"^\s*(?:{'|'.join(re.escape(label) for label in labels)})\s*[：:]\s*([^\r\n]+)\s*$"
    match = re.search(pattern, description, re.IGNORECASE | re.MULTILINE)
    return match.group(1).strip() if match else None


def parse_payment_method(description: str, service_text: str) -> str | None:
    """解析明確標示的付款方式；缺失或無效時回傳 ``None``。

    付款方式會直接影響現金與儲值帳，因此不能再把未填資料默認成現金。
    ``service_text`` 參數保留給既有呼叫端相容，但不會拿服務名稱猜金流。
    """
    raw = parse_labeled_value(
        description,
        ["Payment Method", "Payment", "付款方式", "付款", "金流"],
    )
    candidate = re.sub(r"\s+", "", (raw or "").strip().lower()).replace("＋", "+")
    if not candidate:
        return None
    if re.search(r"(?:非|不是|待確認|待定|未確認|或|/|、|，|,)", candidate):
        return None
    if candidate in {"現金+儲值扣款", "現金+儲值付款", "混合付款"}:
        return "現金＋儲值扣款"
    if re.fullmatch(
        r"(?:儲值進帳|儲值入帳|topup)(?:[（(](?:現金|cash|轉帳|銀行轉帳|匯款|transfer)[）)])?",
        candidate,
    ):
        return "儲值進帳"
    if candidate in {"儲值扣款", "儲值付款", "儲值金扣款", "prepaid", "prepaiddebit"}:
        return "儲值扣款"
    if candidate in {"銀行轉帳", "轉帳", "匯款", "transfer", "banktransfer"}:
        return "轉帳"
    if candidate in {"現金", "cash"}:
        return "現金"

    return None


def parse_topup_channel(description: str, payment_method: str | None) -> str | None:
    """解析儲值進帳收款管道；未明確標示時不猜測。"""
    if payment_method != "儲值進帳":
        return None
    raw = parse_labeled_value(
        description,
        ["Topup Channel", "Payment Channel", "儲值方式", "收款方式", "入帳方式"],
    )
    payment_raw = parse_labeled_value(
        description,
        ["Payment Method", "Payment", "付款方式", "付款", "金流"],
    )
    def canonical_channel(value: str | None) -> str | None:
        candidate = re.sub(r"\s+", "", (value or "").strip().lower())
        if not candidate or re.search(r"(?:非|不是|待確認|待定|未確認|或|/|、|，|,)", candidate):
            return None
        if candidate in {"現金", "cash"}:
            return "現金"
        if candidate in {"轉帳", "銀行轉帳", "匯款", "transfer", "banktransfer"}:
            return "轉帳"
        return None

    if raw is not None:
        return canonical_channel(raw)
    payment_candidate = re.sub(r"\s+", "", (payment_raw or "").strip().lower())
    match = re.fullmatch(
        r"(?:儲值進帳|儲值入帳|topup)[（(]([^）)]+)[）)]",
        payment_candidate,
    )
    if match:
        return canonical_channel(match.group(1))
    return None


def parse_labeled_money(description: str, labels: list[str]) -> tuple[bool, int | None]:
    """Return ``(label_present, amount)`` and reject partial/negative expressions."""
    pattern = rf"^\s*(?:{'|'.join(re.escape(label) for label in labels)})\s*[：:]\s*([^\r\n]*)\s*$"
    match = re.search(pattern, description, re.IGNORECASE | re.MULTILINE)
    if not match:
        return False, None
    raw = match.group(1).strip()
    money_match = re.fullmatch(
        r"(?:NT\$|TWD|\$)?\s*((?:0|[1-9][0-9]*|[1-9][0-9]{0,2}(?:,[0-9]{3})+))\s*(?:元)?",
        raw,
        re.IGNORECASE,
    )
    if not money_match:
        return True, None
    return True, int(money_match.group(1).replace(",", ""))


def parse_explicit_amount(description: str) -> int | None:
    """解析行事曆明確填寫的金額；格式錯誤時不做部分數字猜測。"""
    return parse_labeled_money(description, ["Amount", "Price", "金額", "價格", "收款"])[1]


def parse_cash_amount(description: str) -> int | None:
    """解析混合付款中的現金金額。"""
    return parse_labeled_money(description, ["Cash Amount", "現金金額", "現金付款"])[1]


def parse_customer_name(summary: str) -> str:
    """清理事件標題中的 MOMO、括號備註與前後分隔符。"""
    if not summary:
        return ""
    name = re.sub(r"momo", " ", summary, flags=re.IGNORECASE)
    name = re.sub(r"[\(（].*?[\)）]", " ", name)
    name = re.sub(r"^[\s\-—_|:：]+|[\s\-—_|:：]+$", "", name)
    name = re.sub(r"\s{2,}", " ", name).strip()
    return name


def calc_amount(service_text: str) -> int:
    """對 service_text 用 SORTED_KEYS 做貪婪比對，累加並回傳總金額。"""
    # 移除中括號及圓括號內容，避免大分類標籤與備註干擾比對
    cleaned = service_text
    cleaned = re.sub(r"\[.*?\]", " ", cleaned)
    cleaned = re.sub(r"（.*?）", " ", cleaned)
    cleaned = re.sub(r"\(.*?\)", " ", cleaned)
    
    remaining = cleaned
    total = 0
    for key in SORTED_KEYS:
        if key in remaining:
            total += PRICE_TABLE[key]
            remaining = remaining.replace(key, "", 1)
    return total


def normalize_service_key(value: str) -> str:
    cleaned = str(value or "")
    cleaned = re.sub(r"\[.*?\]", " ", cleaned)
    cleaned = re.sub(r"（.*?）", " ", cleaned)
    cleaned = re.sub(r"\(.*?\)", " ", cleaned)
    cleaned = re.sub(r"\s*\+\s*", "+", cleaned)
    cleaned = re.sub(r"\s+", "", cleaned)
    return cleaned.strip().lower()


def build_service_price_lookup(service_configs: list[dict] | None) -> dict[str, int]:
    lookup: dict[str, int] = {}
    if not isinstance(service_configs, list):
        return lookup
    for item in service_configs:
        if not isinstance(item, dict):
            continue
        key = normalize_service_key(item.get("name", ""))
        if not key:
            continue
        try:
            price = int(float(item.get("price") or 0))
        except (TypeError, ValueError):
            price = 0
        if price > 0:
            lookup[key] = price
    return lookup


def calc_amount_with_service_config(
    service_text: str,
    lookup: dict[str, int],
    allow_backend_fallback: bool = True,
) -> dict:
    if not lookup:
        if not allow_backend_fallback:
            return {
                "amount": 0,
                "source": "unmatched_service_config",
                "unmatched": [str(service_text or "").strip()] if service_text else [],
            }
        backend_lookup = {
            normalize_service_key(name): price
            for name, price in PRICE_TABLE.items()
            if normalize_service_key(name) and price > 0
        }
        result = calc_amount_with_service_config(
            service_text,
            backend_lookup,
            allow_backend_fallback=False,
        )
        if result["amount"] > 0:
            result["source"] = "backend_price_table_combo" if result["source"] == "service_config_combo" else "backend_price_table"
        else:
            result["source"] = "unmatched_backend_price_table"
        return result

    normalized_full = normalize_service_key(service_text)
    if not normalized_full:
        return {"amount": 0, "source": "unmatched_service_config", "unmatched": []}
    if normalized_full in lookup:
        return {"amount": lookup[normalized_full], "source": "service_config", "unmatched": []}

    remaining = normalized_full
    total = 0
    matched_count = 0
    for key in sorted(lookup.keys(), key=len, reverse=True):
        if key in remaining:
            total += lookup[key]
            matched_count += 1
            remaining = remaining.replace(key, "", 1)
    leftover = re.sub(r"(?:\+|＋|/|、|，|,|;|；|\s)+", "", remaining)
    if matched_count and not leftover:
        return {
            "amount": total,
            "source": "service_config_combo" if matched_count > 1 else "service_config",
            "unmatched": [],
        }
    if matched_count and leftover:
        return {"amount": 0, "source": "unmatched_service_config", "unmatched": [leftover]}

    return {"amount": 0, "source": "unmatched_service_config", "unmatched": [str(service_text or "").strip()]}


def get_event_date(event: dict) -> str | None:
    """
    取得事件的台灣本地日期字串（YYYY-MM-DD）。
    支援全天事件（date）與時間事件（dateTime）。
    """
    start = event.get("start", {})
    if "dateTime" in start:
        try:
            dt = datetime.fromisoformat(str(start["dateTime"]).replace("Z", "+00:00"))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=TW)
            return dt.astimezone(TW).strftime("%Y-%m-%d")
        except (TypeError, ValueError):
            return None
    elif "date" in start:
        try:
            return datetime.strptime(str(start["date"]), "%Y-%m-%d").strftime("%Y-%m-%d")
        except (TypeError, ValueError):
            return None
    return None


def get_event_time_info(event: dict) -> dict:
    """取得 Google Calendar 實際開始、結束與占用分鐘數。"""
    start = event.get("start", {})
    end = event.get("end", {})
    if "dateTime" not in start or "dateTime" not in end:
        return {
            "calendarStart": None,
            "calendarEnd": None,
            "calendarDurationMinutes": None,
        }

    try:
        start_dt = datetime.fromisoformat(str(start["dateTime"]).replace("Z", "+00:00"))
        end_dt = datetime.fromisoformat(str(end["dateTime"]).replace("Z", "+00:00"))
    except (TypeError, ValueError):
        return {
            "calendarStart": None,
            "calendarEnd": None,
            "calendarDurationMinutes": None,
        }
    if start_dt.tzinfo is None:
        start_dt = start_dt.replace(tzinfo=TW)
    if end_dt.tzinfo is None:
        end_dt = end_dt.replace(tzinfo=TW)
    duration_minutes = max(0, round((end_dt - start_dt).total_seconds() / 60))
    return {
        "calendarStart": start_dt.astimezone(TW).isoformat(),
        "calendarEnd": end_dt.astimezone(TW).isoformat(),
        "calendarDurationMinutes": duration_minutes or None,
    }


def is_blocked_calendar_slot(event: dict) -> bool:
    """辨識只用來保留時間、不應進會計帳的行事曆事件。"""
    summary = str(event.get("summary") or "").strip()
    if not summary:
        return False
    return bool(re.match(r"^(?:不約|卡)(?:$|[\s｜|：:\-—_/])", summary))


def get_event_completion_issue(event: dict, now: datetime) -> str | None:
    """回傳事件尚未完成的原因；完成則回傳 ``None``。

    Calendar 的 ``confirmed`` 只代表預約沒有被取消，不代表服務已完成，
    因此以結束時間為入帳界線；全天事件則以 Google 的結束日（不含）判斷。
    """
    if event.get("status") == "tentative":
        return "tentative_event"

    end = event.get("end") or {}
    if end.get("dateTime"):
        try:
            end_dt = datetime.fromisoformat(str(end["dateTime"]).replace("Z", "+00:00"))
        except (TypeError, ValueError):
            return "invalid_end_time"
        if end_dt.tzinfo is None:
            end_dt = end_dt.replace(tzinfo=TW)
        if end_dt.astimezone(TW) > now.astimezone(TW):
            return "event_not_finished"
        return None

    if end.get("date"):
        try:
            end_date = datetime.strptime(str(end["date"]), "%Y-%m-%d").date()
        except (TypeError, ValueError):
            return "invalid_end_time"
        # Google all-day end dates are exclusive. An event ending tomorrow is
        # still in progress today; one ending today has already completed.
        if end_date > now.astimezone(TW).date():
            return "event_not_finished"
        return None

    return "missing_end_time"


def get_calendar_service():
    """建立 Google Calendar API 服務（API Key，行事曆需設為公開）。"""
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise RuntimeError("缺少 GOOGLE_API_KEY 環境變數")
    return build(
        "calendar",
        "v3",
        developerKey=api_key,
        cache_discovery=False,
    )


def get_calendar_id() -> str:
    calendar_id = os.getenv("CALENDAR_ID")
    if not calendar_id:
        raise RuntimeError("缺少 CALENDAR_ID 環境變數")
    return calendar_id


def fetch_calendar_events(service, calendar_id: str, time_min: str, time_max: str) -> list[dict]:
    """逐頁抓取指定時間範圍的所有 Calendar 事件。"""
    events: list[dict] = []
    page_token: str | None = None
    while True:
        result = (
            service.events()
            .list(
                calendarId=calendar_id,
                timeMin=time_min,
                timeMax=time_max,
                singleEvents=True,
                showDeleted=True,
                orderBy="startTime",
                maxResults=2500,
                pageToken=page_token,
            )
            .execute()
        )
        events.extend(result.get("items", []))
        page_token = result.get("nextPageToken")
        if not page_token:
            return events


# ─────────────────────────────────────────────
# API 路由
# ─────────────────────────────────────────────

@app.get("/api/config")
def public_config():
    """前端登入所需的公開設定；絕不回傳 service_role 或資料庫密碼。"""
    return {
        "supabase_url": SUPABASE_URL if supabase_auth_configured() else "",
        "supabase_publishable_key": SUPABASE_PUBLISHABLE_KEY if supabase_auth_configured() else "",
        "auth_configured": supabase_auth_configured(),
        "auth_required": REQUIRE_AUTH,
        "calendar_configured": calendar_sync_configured(),
    }

@app.get("/api/sync")
@app.post("/api/sync")
def sync_calendar(
    payload: dict | None = Body(default=None),
    year: int | None = Query(default=None, ge=2020, le=2100),
    month: int | None = Query(default=None, ge=1, le=12),
    _current_user: dict | None = Depends(get_current_user),
):
    """
    拉取指定年月（預設本月）的 Google Calendar 事件，
    解析每筆 Order，回傳：

    1. 月度總業績與訂單列表
    2. 本月每日業績明細（按日期分類）
    3. 今日業績與各服務大分類金額

    回傳格式：
    {
        "year": 2026,
        "month": 6,
        "monthly_revenue": 36800,
        "order_count": 12,
        "orders": [...],

        // 本月每日業績（日期分類）
        "daily_revenue": [
            {
                "date": "2026-06-01",
                "date_label": "6/1 (一)",
                "total": 4500,
                "order_count": 2,
                "categories": {
                    "剪髮": 600,
                    "燙髮": 3900,
                    "染髮": 0,
                    "洗護其他": 0
                }
            },
            ...
        ],

        // 今日業績
        "today": {
            "date": "2026-06-06",
            "total": 7800,
            "order_count": 3,
            "categories": {
                "剪髮": 800,
                "燙髮": 4500,
                "染髮": 2500,
                "洗護其他": 0
            }
        }
    }
    """
    now = datetime.now(tz=TW)
    y = year  or now.year
    m = month or now.month
    today_str = now.strftime("%Y-%m-%d")
    service_configs = payload.get("serviceConfigs") if isinstance(payload, dict) else None
    service_price_lookup = build_service_price_lookup(service_configs if isinstance(service_configs, list) else None)
    use_service_config_pricing = isinstance(service_configs, list)
    service_config_updated_at = (
        payload.get("serviceConfigUpdatedAt") if isinstance(payload, dict) else None
    )

    # 計算同步範圍：包含指定月份與前一個月（共兩個月，利於跨月對帳）
    if m == 1:
        prev_y = y - 1
        prev_m = 12
    else:
        prev_y = y
        prev_m = m - 1

    time_min = datetime(prev_y, prev_m, 1, tzinfo=TW).astimezone(timezone.utc).isoformat()
    if m == 12:
        time_max = datetime(y + 1, 1, 1, tzinfo=TW).astimezone(timezone.utc).isoformat()
    else:
        time_max = datetime(y, m + 1, 1, tzinfo=TW).astimezone(timezone.utc).isoformat()

    try:
        service = get_calendar_service()
        events = fetch_calendar_events(service, get_calendar_id(), time_min, time_max)
    except RuntimeError as exc:
        logger.error("Calendar configuration error: %s", exc)
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except HttpError as exc:
        logger.exception("Google Calendar API error")
        raise HTTPException(status_code=502, detail="Google Calendar API 回應失敗，請檢查金鑰與行事曆權限") from exc
    except Exception as exc:
        logger.exception("Unexpected Google Calendar sync error")
        raise HTTPException(status_code=502, detail="Google Calendar 連線失敗，請稍後再試") from exc

    seen_orders: set[str] = set()
    orders: list[dict] = []
    issues: list[dict] = []
    quarantined_events: list[dict] = []
    cancelled_event_ids: list[str] = []
    selected_month_revenue = 0
    selected_month_cash_in = 0
    range_revenue = 0
    range_cash_in = 0
    diagnostics = {
        "events_received": len(events),
        "orders_parsed": 0,
        "missing_description": 0,
        "missing_order_id": 0,
        "invalid_order_id": 0,
        "missing_customer": 0,
        "invalid_customer_id": 0,
        "missing_service": 0,
        "missing_event_id": 0,
        "duplicates": 0,
        "cancelled": 0,
        "blocked_slots": 0,
        "future_or_incomplete": 0,
        "missing_date": 0,
        "invalid_amount": 0,
        "zero_amount": 0,
        "invalid_payment": 0,
        "missing_topup_channel": 0,
        "invalid_mixed_payment": 0,
        "quarantined": 0,
        "service_price_items": len(service_price_lookup),
        "unmatched_price_table": 0,
    }

    # 每日統計用的資料結構
    # daily_data[date_str] = { total, order_count, categories: {剪髮, 燙髮, 染髮, 洗護其他} }
    daily_data: dict[str, dict] = defaultdict(lambda: {
        "total": 0,
        "order_count": 0,
        "categories": {"剪髮": 0, "燙髮": 0, "染髮": 0, "洗護其他": 0}
    })

    WEEKDAY_ZH = ["一", "二", "三", "四", "五", "六", "日"]

    payment_summary = {"現金": 0, "轉帳": 0, "儲值扣款": 0, "儲值進帳": 0}
    selected_month_prefix = f"{y:04d}-{m:02d}"

    def quarantine(
        event: dict,
        code: str,
        message: str,
        *,
        order_id: str | None = None,
        event_date: str | None = None,
        severity: str = "warning",
    ) -> None:
        """將不可入帳事件留下可追蹤摘要，但不納入任何金流統計。"""
        source_event_id = event.get("id")
        issue = {
            "type": code,
            "severity": severity,
            "message": message,
            "sourceEventId": source_event_id,
            "orderId": order_id,
            "date": event_date,
        }
        issues.append(issue)
        quarantined_events.append({
            **issue,
            "summary": str(event.get("summary") or "").strip(),
        })
        diagnostics["quarantined"] += 1

    for event in events:
        if event.get("status") == "cancelled":
            diagnostics["cancelled"] += 1
            if event.get("id"):
                cancelled_event_ids.append(event["id"])
            continue

        # 「不約／卡」只是保留時段，不是異常訂單，也不應污染會計警報。
        if is_blocked_calendar_slot(event):
            diagnostics["blocked_slots"] += 1
            continue

        desc = event.get("description", "") or ""
        if not desc:
            diagnostics["missing_description"] += 1
            quarantine(event, "missing_description", "行事曆事件缺少描述，未入帳。", severity="error")
            continue

        order_id_raw = parse_labeled_value(desc, ["Order ID"])
        order_id = parse_order_id(desc)
        if not order_id:
            issue_code = "invalid_order_id" if order_id_raw is not None else "missing_order_id"
            diagnostics[issue_code] += 1
            quarantine(
                event,
                issue_code,
                "行事曆 Order ID 格式無效，僅可使用英數字、底線與連字號，未入帳。"
                if order_id_raw is not None
                else "行事曆事件缺少 Order ID，未入帳。",
                severity="error",
            )
            continue
        order_id = order_id.strip().upper()

        customer_id_raw = parse_labeled_value(desc, ["Customer ID", "顧客 ID", "顧客ID"])
        customer_id = parse_customer_id(desc)
        if customer_id_raw is not None and customer_id is None:
            diagnostics["invalid_customer_id"] += 1
            quarantine(
                event,
                "invalid_customer_id",
                "Calendar Customer ID 格式無效，未入帳。",
                order_id=order_id,
                severity="error",
            )
            continue

        source_event_id = event.get("id")
        if not source_event_id:
            diagnostics["missing_event_id"] += 1
            quarantine(
                event,
                "missing_event_id",
                "行事曆事件缺少 Event ID，無法可靠追蹤來源，未入帳。",
                order_id=order_id,
                severity="error",
            )
            continue

        event_date = get_event_date(event)
        if not event_date:
            diagnostics["missing_date"] += 1
            quarantine(
                event,
                "missing_date",
                "行事曆事件缺少有效日期，未入帳。",
                order_id=order_id,
                severity="error",
            )
            continue

        completion_issue = get_event_completion_issue(event, now)
        if completion_issue:
            diagnostics["future_or_incomplete"] += 1
            quarantine(
                event,
                completion_issue,
                "服務尚未結束或事件時間無法確認，暫不入帳。",
                order_id=order_id,
                event_date=event_date,
            )
            continue

        summary = event.get("summary", "") or ""
        customer_name = parse_customer_name(summary)
        if not customer_name:
            diagnostics["missing_customer"] += 1
            quarantine(
                event,
                "missing_customer",
                "行事曆事件缺少顧客姓名，未入帳。",
                order_id=order_id,
                event_date=event_date,
                severity="error",
            )
            continue

        service_text = parse_service_text(desc)
        if not service_text:
            diagnostics["missing_service"] += 1
            quarantine(
                event,
                "missing_service",
                "行事曆事件缺少服務項目，未入帳。",
                order_id=order_id,
                event_date=event_date,
                severity="error",
            )
            continue

        explicit_amount_present, explicit_amount = parse_labeled_money(
            desc,
            ["Amount", "Price", "金額", "價格", "收款"],
        )
        if explicit_amount_present and explicit_amount is None:
            diagnostics["invalid_amount"] += 1
            quarantine(
                event,
                "invalid_amount",
                "行事曆金額格式無效；不可使用負數、算式或待確認文字，未入帳。",
                order_id=order_id,
                event_date=event_date,
                severity="error",
            )
            continue
        if explicit_amount is not None:
            amount = explicit_amount
            pricing_source = "calendar_explicit_amount"
            pricing_unmatched_services: list[str] = []
        else:
            pricing_result = calc_amount_with_service_config(
                service_text,
                service_price_lookup,
                allow_backend_fallback=not use_service_config_pricing,
            )
            amount = pricing_result["amount"]
            pricing_source = pricing_result["source"]
            pricing_unmatched_services = pricing_result["unmatched"]
            if pricing_unmatched_services:
                diagnostics["unmatched_price_table"] += 1
        payment_method = parse_payment_method(desc, service_text)
        if payment_method is None:
            diagnostics["invalid_payment"] += 1
            quarantine(
                event,
                "invalid_payment",
                "行事曆事件缺少有效付款方式，未入帳。",
                order_id=order_id,
                event_date=event_date,
                severity="error",
            )
            continue

        topup_channel = parse_topup_channel(desc, payment_method)
        if payment_method == "儲值進帳" and topup_channel is None:
            diagnostics["missing_topup_channel"] += 1
            quarantine(
                event,
                "missing_topup_channel",
                "儲值進帳必須明確標示現金或轉帳收款，未入帳。",
                order_id=order_id,
                event_date=event_date,
                severity="error",
            )
            continue
        parsed_cash_amount = None
        if payment_method == "現金＋儲值扣款":
            _, parsed_cash_amount = parse_labeled_money(
                desc,
                ["Cash Amount", "現金金額", "現金付款"],
            )
        cash_amount = min(amount, max(0, parsed_cash_amount or 0))
        prepaid_amount = amount - cash_amount if payment_method == "現金＋儲值扣款" else 0
        if payment_method == "現金＋儲值扣款" and (
            parsed_cash_amount is None or cash_amount <= 0 or cash_amount >= amount
        ):
            diagnostics["invalid_mixed_payment"] += 1
            quarantine(
                event,
                "invalid_mixed_payment",
                "混合付款的現金金額必須大於 0 且小於總額，未入帳。",
                order_id=order_id,
                event_date=event_date,
                severity="error",
            )
            continue
        category = classify_service(service_text)
        if amount <= 0:
            diagnostics["zero_amount"] += 1
            quarantine(
                event,
                "zero_amount",
                "行事曆事件缺少正確金額或服務定價，未入帳。",
                order_id=order_id,
                event_date=event_date,
                severity="error",
            )
            continue

        # 只讓通過完整會計驗證的事件占用 Order ID；避免第一筆壞資料
        # 擋掉同一 Order ID 後續的完整事件。
        if order_id in seen_orders:
            diagnostics["duplicates"] += 1
            quarantine(
                event,
                "duplicate_order_id",
                f"Order ID {order_id} 重複，已保留同步範圍內第一筆有效事件。",
                order_id=order_id,
                event_date=event_date,
            )
            continue
        seen_orders.add(order_id)
        time_info = get_event_time_info(event)

        if payment_method != "儲值進帳":
            range_revenue += amount
        if payment_method == "現金＋儲值扣款":
            range_cash_in += cash_amount
        elif payment_method == "現金" or (payment_method == "儲值進帳" and topup_channel == "現金"):
            range_cash_in += amount
        is_selected_month = event_date.startswith(selected_month_prefix)
        if is_selected_month:
            if payment_method == "現金＋儲值扣款":
                payment_summary["現金"] += cash_amount
                payment_summary["儲值扣款"] += prepaid_amount
            else:
                payment_summary[payment_method] += amount
            if payment_method != "儲值進帳":
                selected_month_revenue += amount
            if payment_method == "現金＋儲值扣款":
                selected_month_cash_in += cash_amount
            elif payment_method == "現金" or (payment_method == "儲值進帳" and topup_channel == "現金"):
                selected_month_cash_in += amount

        orders.append({
            "sourceEventId": source_event_id,
            "order_id":      order_id,
            "orderId":       order_id,
            "customer_name": customer_name,
            "customerName":  customer_name,  # 前後端相容
            "customer_id":   customer_id,
            "customerId":    customer_id,
            "service":       service_text,
            "serviceName":   service_text,
            "category":      category,
            "amount":        amount,
            "date":          event_date,
            "paymentMethod": payment_method,
            "cashAmount":    cash_amount if payment_method == "現金＋儲值扣款" else None,
            "topupChannel":  topup_channel,
            "calendarStart":  time_info["calendarStart"],
            "calendarEnd":    time_info["calendarEnd"],
            "calendarDurationMinutes": time_info["calendarDurationMinutes"],
            # Calendar 只知道排程占用時間；實際施作時間需由現場另行填寫。
            "actualDurationMinutes":   None,
            "pricingSource": pricing_source,
            "pricingUnmatchedServices": pricing_unmatched_services,
            "serviceConfigUpdatedAt": service_config_updated_at,
        })
        diagnostics["orders_parsed"] += 1

        if event_date and payment_method != "儲值進帳":
            daily_data[event_date]["total"] += amount
            daily_data[event_date]["order_count"] += 1
            daily_data[event_date]["categories"][category] += amount

    # 整理同步範圍每日業績，再切出指定月份資料。
    range_daily_revenue = []
    for date_str in sorted(daily_data.keys()):
        try:
            dt = datetime.strptime(date_str, "%Y-%m-%d")
            weekday = WEEKDAY_ZH[dt.weekday()]
            date_label = f"{dt.month}/{dt.day} ({weekday})"
        except Exception:
            date_label = date_str

        day = daily_data[date_str]
        range_daily_revenue.append({
            "date":        date_str,
            "date_label":  date_label,
            "total":       day["total"],
            "order_count": day["order_count"],
            "categories":  day["categories"],
        })

    daily_revenue = [
        day for day in range_daily_revenue
        if day["date"].startswith(selected_month_prefix)
    ]

    # 整理今日業績
    today_day = daily_data.get(today_str, {
        "total": 0,
        "order_count": 0,
        "categories": {"剪髮": 0, "燙髮": 0, "染髮": 0, "洗護其他": 0}
    })
    today_result = {
        "date":        today_str,
        "total":       today_day["total"],
        "order_count": today_day["order_count"],
        "categories":  today_day["categories"],
    }

    return {
        "year":            y,
        "month":           m,
        "range": {
            "from": f"{prev_y:04d}-{prev_m:02d}-01",
            "to_exclusive": f"{y + 1:04d}-01-01" if m == 12 else f"{y:04d}-{m + 1:02d}-01",
        },
        "monthly_revenue": selected_month_revenue,
        "monthly_cash_in": selected_month_cash_in,
        "range_revenue":   range_revenue,
        "range_cash_in":   range_cash_in,
        "order_count":     sum(
            1 for order in orders
            if order["date"].startswith(selected_month_prefix)
            and order["paymentMethod"] != "儲值進帳"
        ),
        "range_order_count": len(orders),
        "orders":          orders,
        "issues":          issues,
        "quarantinedEvents": quarantined_events,
        "cancelledEventIds": cancelled_event_ids,
        "daily_revenue":   daily_revenue,
        "range_daily_revenue": range_daily_revenue,
        "payment_summary": payment_summary,
        "today":           today_result,
        "diagnostics":     diagnostics,
    }


@app.get("/api/recovery", response_class=HTMLResponse, include_in_schema=False)
def app_recovery():
    """Clear only PWA workers and caches, preserving all business data in localStorage."""
    content = """<!doctype html>
<html lang="zh-TW">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#FFF9F6">
  <title>摸摸頭 App 修復</title>
  <style>
    *{box-sizing:border-box}body{margin:0;min-height:100dvh;display:grid;place-items:center;padding:24px;background:#f4f6f8;color:#1f2937;font-family:-apple-system,BlinkMacSystemFont,"Noto Sans TC",sans-serif}
    main{width:min(100%,420px);padding:28px 24px;border:1px solid #dce3ea;border-radius:12px;background:#fff;box-shadow:0 20px 44px -34px rgba(15,23,42,.45);text-align:center}
    .mark{display:grid;width:48px;height:48px;margin:0 auto 16px;place-items:center;border-radius:10px;background:#f0f8f3;color:#16805d;font-size:24px;font-weight:900}
    h1{margin:0;font-size:22px;line-height:1.3}p{margin:10px 0 0;color:#64748b;font-size:14px;font-weight:700;line-height:1.6}
    .note{margin-top:18px;padding:12px;border:1px solid #bcdcc9;border-radius:8px;background:#f0f8f3;color:#347052;font-size:12px;font-weight:800;line-height:1.6}
    button{width:100%;min-height:48px;margin-top:18px;border:0;border-radius:8px;background:#16805d;color:#fff;font-size:14px;font-weight:900}button[hidden]{display:none}
  </style>
</head>
<body>
  <main>
    <div class="mark" aria-hidden="true">✓</div>
    <h1>正在修復 App</h1>
    <p id="status" role="status" aria-live="polite">正在移除舊版更新程式與快取，請稍候。</p>
    <div class="note">業績、顧客、儲值、配方與本機備份都會保留。</div>
    <button id="retry" type="button" hidden>重新開啟摸摸頭</button>
  </main>
  <script>
    const statusNode=document.getElementById('status');
    const retryButton=document.getElementById('retry');
    const openApp=()=>location.replace('/?recovered='+Date.now());
    retryButton.addEventListener('click',openApp);
    (async()=>{
      const warnings=[];
      try{
        if('serviceWorker' in navigator){
          const registrations=await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map(item=>item.unregister()));
        }
      }catch(error){warnings.push('更新程式');}
      try{
        if('caches' in window){
          const names=await caches.keys();
          await Promise.all(names.map(name=>caches.delete(name)));
        }
      }catch(error){warnings.push('網頁快取');}
      statusNode.textContent=warnings.length?'主要修復已完成，正在重新開啟 App。':'修復完成，正在重新開啟 App。';
      retryButton.hidden=false;
      setTimeout(openApp,900);
    })();
  </script>
</body>
</html>"""
    return HTMLResponse(
        content=content,
        headers={
            "Cache-Control": "no-store, max-age=0",
            "Pragma": "no-cache",
        },
    )


@app.get("/health")
def health_check():
    """Render 與人工檢查使用，不呼叫 Google API。"""
    return {
        "status": "ok",
        "service": "momohair-calendar-sync",
        "timezone": str(TW),
        "configured": calendar_sync_configured(),
        "auth_configured": supabase_auth_configured(),
        "auth_required": REQUIRE_AUTH,
        "time": datetime.now(tz=TW).isoformat(),
    }


@app.get("/", include_in_schema=False)
def frontend():
    return FileResponse(BASE_DIR / "index.html", media_type="text/html")


@app.get("/manifest.webmanifest", include_in_schema=False)
def pwa_manifest():
    return FileResponse(
        BASE_DIR / "manifest.webmanifest",
        media_type="application/manifest+json",
    )


@app.get("/service-worker.js", include_in_schema=False)
def service_worker():
    return FileResponse(
        BASE_DIR / "service-worker.js",
        media_type="application/javascript",
        headers={"Cache-Control": "no-cache"},
    )


@app.get("/assets/{filename:path}", include_in_schema=False)
def frontend_asset(filename: str):
    assets_dir = (BASE_DIR / "assets").resolve()
    asset_path = (assets_dir / filename).resolve()
    if assets_dir not in asset_path.parents or not asset_path.is_file():
        raise HTTPException(status_code=404, detail="Asset not found")
    media_types = {
        ".css": "text/css",
        ".js": "application/javascript",
        ".json": "application/json",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".svg": "image/svg+xml",
        ".webp": "image/webp",
    }
    return FileResponse(
        asset_path,
        media_type=media_types.get(asset_path.suffix.lower(), "application/octet-stream"),
    )


@app.get("/icons/{filename}", include_in_schema=False)
def pwa_icon(filename: str):
    allowed = {"icon-192.png", "icon-512.png", "apple-touch-icon.png", "momo-logo-mark.png"}
    if filename not in allowed:
        raise HTTPException(status_code=404, detail="Icon not found")
    return FileResponse(BASE_DIR / "icons" / filename, media_type="image/png")
