# main.py  —  摸摸頭 momohair × Google Calendar 同步後端
# 依賴：fastapi uvicorn google-api-python-client python-dotenv
# 啟動：uvicorn main:app --reload --port 8000
# 前提：Google Calendar 行事曆必須設為「公開」才能用 API Key 讀取

import re
import os
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from collections import defaultdict

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from googleapiclient.discovery import build
from dotenv import load_dotenv

load_dotenv()

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

app = FastAPI(title="摸摸頭 momohair 同步 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://coruscating-piroshki-52f23a.netlify.app",  # 正式前端網域
        "http://localhost:3000",   # 本地開發用
        "http://127.0.0.1:5500",   # Live Server 開發用
        "*",                        # 若上線後仍有問題可暫時保留，確認後移除
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────
# 工具函式
# ─────────────────────────────────────────────

def parse_order_id(description: str) -> str | None:
    """從行事曆 description 抓出 Order ID。"""
    m = re.search(r"Order\s+ID\s*[：:]\s*([A-Z0-9]+)", description, re.IGNORECASE)
    return m.group(1) if m else None


def parse_service_text(description: str) -> str:
    """擷取 Service: 後方、下一個換行前的完整文字。"""
    m = re.search(r"Service\s*[：:]\s*(.+)", description)
    return m.group(1).strip() if m else ""


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


def get_event_date(event: dict) -> str | None:
    """
    取得事件的台灣本地日期字串（YYYY-MM-DD）。
    支援全天事件（date）與時間事件（dateTime）。
    """
    start = event.get("start", {})
    if "dateTime" in start:
        dt = datetime.fromisoformat(start["dateTime"])
        dt_tw = dt.astimezone(TW)
        return dt_tw.strftime("%Y-%m-%d")
    elif "date" in start:
        return start["date"]
    return None


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
@app.post("/api/sync")
def sync_calendar(year: int | None = None, month: int | None = None):
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

    # 計算本月起訖（UTC）
    time_min = datetime(y, m, 1, tzinfo=TW).astimezone(timezone.utc).isoformat()
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

    # 每日統計用的資料結構
    # daily_data[date_str] = { total, order_count, categories: {剪髮, 燙髮, 染髮, 洗護其他} }
    daily_data: dict[str, dict] = defaultdict(lambda: {
        "total": 0,
        "order_count": 0,
        "categories": {"剪髮": 0, "燙髮": 0, "染髮": 0, "洗護其他": 0}
    })

    WEEKDAY_ZH = ["一", "二", "三", "四", "五", "六", "日"]

    for event in events:
        desc = event.get("description", "") or ""
        if not desc:
            continue

        order_id = parse_order_id(desc)
        if not order_id:
            continue
        if order_id in seen_orders:
            continue
        seen_orders.add(order_id)

        service_text = parse_service_text(desc)
        amount = calc_amount(service_text)
        category = classify_service(service_text)
        event_date = get_event_date(event)

        # 從事件標題（summary）提取姓名並清理
        summary = event.get("summary", "") or ""
        customer_name = "預約顧客"
        if summary:
            name = re.sub(r"-?[mM][oO][mM][oO]", "", summary).strip()
            name = re.sub(r"[\(（].*?[\)）]", "", name).strip()
            name = re.sub(r"^[mM][oO][mM][oO]", "", name).strip()
            if name:
                customer_name = name

        monthly_revenue += amount

        orders.append({
            "order_id":      order_id,
            "customer_name": customer_name,
            "customerName":  customer_name,  # 前後端相容
            "service":       service_text,
            "category":      category,
            "amount":        amount,
            "date":          event_date,
        })

        if event_date:
            daily_data[event_date]["total"] += amount
            daily_data[event_date]["order_count"] += 1
            daily_data[event_date]["categories"][category] += amount

    # 整理本月每日業績列表（依日期排序）
    daily_revenue = []
    for date_str in sorted(daily_data.keys()):
        try:
            dt = datetime.strptime(date_str, "%Y-%m-%d")
            weekday = WEEKDAY_ZH[dt.weekday()]
            date_label = f"{dt.month}/{dt.day} ({weekday})"
        except Exception:
            date_label = date_str

        day = daily_data[date_str]
        daily_revenue.append({
            "date":        date_str,
            "date_label":  date_label,
            "total":       day["total"],
            "order_count": day["order_count"],
            "categories":  day["categories"],
        })

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
        "monthly_revenue": monthly_revenue,
        "order_count":     len(orders),
        "orders":          orders,
        "daily_revenue":   daily_revenue,
        "today":           today_result,
    }
