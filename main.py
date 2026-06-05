# main.py  —  摸摸頭 momohair × Google Calendar 同步後端
# 依賴：fastapi uvicorn google-api-python-client python-dotenv
# 啟動：uvicorn main:app --reload --port 8000
# 前提：Google Calendar 行事曆必須設為「公開」才能用 API Key 讀取

import re
import os
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from googleapiclient.discovery import build
from dotenv import load_dotenv

load_dotenv()   # 讀取 .env（GOOGLE_SERVICE_ACCOUNT_JSON、CALENDAR_ID）

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

# key 依字元長度由長到短排序，確保貪婪比對優先
SORTED_KEYS = sorted(PRICE_TABLE.keys(), key=len, reverse=True)

TW = ZoneInfo("Asia/Taipei")

app = FastAPI(title="摸摸頭 momohair 同步 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # 正式上線請改成你的前端網域
    allow_methods=["GET"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────
# 工具函式
# ─────────────────────────────────────────────

def parse_order_id(description: str) -> str | None:
    """從行事曆 description 抓出 Order ID（如 PMIK1V）。"""
    m = re.search(r"Order\s+ID\s*[：:]\s*([A-Z0-9]+)", description, re.IGNORECASE)
    return m.group(1) if m else None


def parse_service_text(description: str) -> str:
    """擷取 Service: 後方、下一個換行前的完整文字。"""
    m = re.search(r"Service\s*[：:]\s*(.+)", description)
    return m.group(1).strip() if m else ""


def calc_amount(service_text: str) -> int:
    """
    對 service_text 用 SORTED_KEYS 做貪婪比對，
    每個關鍵字只計一次，累加並回傳總金額。
    """
    remaining = service_text
    total = 0
    for key in SORTED_KEYS:
        if key in remaining:
            total += PRICE_TABLE[key]
            remaining = remaining.replace(key, "", 1)  # 消耗掉，避免雙重計算
    return total


def get_calendar_service():
    """建立 Google Calendar API 服務（API Key，行事曆需設為公開）。"""
    return build(
        "calendar",
        "v3",
        developerKey=os.environ["GOOGLE_API_KEY"],
    )


# ─────────────────────────────────────────────
# API 路由
# ─────────────────────────────────────────────

@app.get("/api/sync")
def sync_calendar(year: int | None = None, month: int | None = None):
    """
    拉取指定年月（預設本月）的 Google Calendar 事件，
    解析每筆 Order，回傳去重後的月度總業績。

    回傳格式：
    {
        "year": 2026,
        "month": 5,
        "monthly_revenue": 36800,
        "order_count": 12,
        "orders": [
            { "order_id": "PMIK1V", "service": "...", "amount": 3100 },
            ...
        ]
    }
    """
    now = datetime.now(tz=TW)
    y = year  or now.year
    m = month or now.month

    # 計算本月起訖（UTC）
    time_min = datetime(y, m, 1,  tzinfo=TW).astimezone(timezone.utc).isoformat()
    if m == 12:
        time_max = datetime(y + 1, 1, 1, tzinfo=TW).astimezone(timezone.utc).isoformat()
    else:
        time_max = datetime(y, m + 1, 1, tzinfo=TW).astimezone(timezone.utc).isoformat()

    try:
        service = get_calendar_service()
        events_result = (
            service.events()
            .list(
                calendarId=os.environ["CALENDAR_ID"],
                timeMin=time_min,
                timeMax=time_max,
                singleEvents=True,
                orderBy="startTime",
                maxResults=500,
            )
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Google Calendar 連線失敗：{e}")

    events = events_result.get("items", [])
    seen_orders: set[str] = set()
    orders: list[dict] = []
    monthly_revenue = 0

    for event in events:
        desc = event.get("description", "") or ""
        if not desc:
            continue

        order_id = parse_order_id(desc)
        if not order_id:
            continue
        if order_id in seen_orders:
            continue          # 防重複入帳
        seen_orders.add(order_id)

        service_text = parse_service_text(desc)
        amount = calc_amount(service_text)
        monthly_revenue += amount

        orders.append({
            "order_id":    order_id,
            "service":     service_text,
            "amount":      amount,
        })

    return {
        "year":            y,
        "month":           m,
        "monthly_revenue": monthly_revenue,
        "order_count":     len(orders),
        "orders":          orders,
    }
