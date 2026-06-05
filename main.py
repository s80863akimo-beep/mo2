import re
import os
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from googleapiclient.discovery import build
from dotenv import load_dotenv

load_dotenv()

PRICE_TABLE: dict[str, int] = {
    "頭皮初淨調理":       2000,
    "頭皮健康髮浴":         600,
    "頭皮初淨調理+剪髮":  2200,
    "健康髮浴+剪":         1100,
    "孩童洗+剪":            550,
    "洗+剪":                800,
    "孩童剪髮":             400,
    "剪髮":                 600,
    "特長染髮":            3100,
    "長髮染髮":            2800,
    "中長染髮":            2500,
    "短髮染髮":            2200,
    "男生短髮":            1400,
    "特殊色":              5000,
    "結構式護髮":          1800,
    "髮絲水潤修護":        1200,
}

SORTED_KEYS = sorted(PRICE_TABLE.keys(), key=len, reverse=True)
TW = ZoneInfo("Asia/Taipei")

app = FastAPI(title="摸摸頭 momohair 同步 API")

# 【修正 1】：允許所有方法 (METHODS)，包含 POST，網頁才連得進來！
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],  # 改成 "*" 釋放所有權限
    allow_headers=["*"],
)

def parse_order_id(description: str) -> str | None:
    m = re.search(r"Order\s+ID\s*[：:]\s*([A-Z0-9]+)", description, re.IGNORECASE)
    return m.group(1) if m else None

def parse_service_text(description: str) -> str:
    m = re.search(r"Service\s*[：:]\s*(.+)", description)
    return m.group(1).strip() if m else ""

def calc_amount(service_text: str) -> int:
    remaining = service_text
    total = 0
    for key in SORTED_KEYS:
        if key in remaining:
            total += PRICE_TABLE[key]
            remaining = remaining.replace(key, "", 1)
    return total

def get_calendar_service():
    # 安全防呆：如果 Render 後台漏填密碼，立刻報錯提醒
    if "GOOGLE_API_KEY" not in os.environ:
        raise KeyError("Render 後台找不到 GOOGLE_API_KEY，請檢查 Environment 設定！")
    return build(
        "calendar",
        "v3",
        developerKey=os.environ["GOOGLE_API_KEY"],
    )

# 【修正 2】：為了配合網頁的按鈕點擊，把路由改成 @app.post
@app.post("/api/sync") 
def sync_calendar(year: int | None = None, month: int | None = None):
    now = datetime.now(tz=TW)
    y = year  or now.year
    m = month or now.month

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
            continue
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
