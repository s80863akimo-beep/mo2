import re
import os
from datetime import datetime, timedelta, timezone
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests

app = FastAPI(title="摸摸頭 momohair 同步 API")

# 100% 放行所有連線，讓 Netlify 按鈕絕對暢通
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PRICE_TABLE = {
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

@app.get("/")
def home():
    return {"status": "MomoHair Backend is online and safe!"}

@app.post("/api/sync")
def sync_calendar():
    calendar_id = os.getenv("CALENDAR_ID")
    api_key = os.getenv("GOOGLE_API_KEY")

    if not calendar_id or not api_key:
        raise HTTPException(status_code=500, detail="後台密碼設定遺漏！")

    # 手動用 timedelta 計算台灣時間，完全不依賴 zoneinfo 零件
    tz_tw = timezone(timedelta(hours=8))
    now = datetime.now(tz=tz_tw)
    
    # 計算本月起訖的 ISO 時間字串
    start_dt = datetime(now.year, now.month, 1, tzinfo=tz_tw)
    time_min = start_dt.isoformat()
    
    if now.month == 12:
        end_dt = datetime(now.year + 1, 1, 1, tzinfo=tz_tw)
    else:
        end_dt = datetime(now.year, now.month + 1, 1, tzinfo=tz_tw)
    time_max = end_dt.isoformat()

    # 直接用純 requests 呼叫 Google，速度更快且絕不罷工
    url = f"https://www.googleapis.com/calendar/v3/calendars/{calendar_id}/events"
    params = {
        "key": api_key,
        "timeMin": time_min,
        "timeMax": time_max,
        "singleEvents": "true",
        "orderBy": "startTime",
        "maxResults": 500
    }

    try:
        response = requests.get(url, params=params)
        if response.status_code != 200:
            raise HTTPException(status_code=502, detail=f"Google 回報錯誤: {response.text}")
        events_data = response.json()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"連線 Google 失敗: {str(e)}")

    events = events_data.get("items", [])
    seen_orders = set()
    orders = []
    monthly_revenue = 0

    for event in events:
        desc = event.get("description", "") or ""
        if not desc:
            continue

        # 抓取 Order ID
        order_match = re.search(r"Order\s+ID\s*[：:]\s*([A-Z0-9]+)", desc, re.IGNORECASE)
        if not order_match:
            continue
        order_id = order_match.group(1)
        
        if order_id in seen_orders:
            continue
        seen_orders.add(order_id)

        # 抓取 Service 項目文字
        service_match = re.search(r"Service\s*[：:]\s*(.+)", desc)
        service_text = service_match.group(1).strip() if service_match else ""

        # 貪婪計價比對
        remaining = service_text
        amount = 0
        for key in SORTED_KEYS:
            if key in remaining:
                amount += PRICE_TABLE[key]
                remaining = remaining.replace(key, "", 1)

        monthly_revenue += amount
        orders.append({
            "order_id": order_id,
            "service": service_text,
            "amount": amount
        })

    return {
        "year": now.year,
        "month": now.month,
        "monthly_revenue": monthly_revenue,
        "order_count": len(orders),
        "orders": orders
    }
