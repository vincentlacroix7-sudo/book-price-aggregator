"""Base scraper with shared utilities."""
import time
import httpx
from typing import Optional

# Real browser User-Agent to avoid blocking
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-CA,en;q=0.9,fr-CA;q=0.8,fr;q=0.7",
    "Accept-Encoding": "gzip, deflate, br",
    "DNT": "1",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
}

def fetch(url: str, client: httpx.Client, retries: int = 2) -> Optional[str]:
    """Fetch a URL with retry logic and rate limiting."""
    for attempt in range(retries + 1):
        try:
            resp = client.get(url, headers=HEADERS, timeout=15)
            if resp.status_code == 200:
                return resp.text
            elif resp.status_code == 429:
                wait = (attempt + 1) * 5
                print(f"  ⚠️ Rate limited, waiting {wait}s...")
                time.sleep(wait)
            elif resp.status_code == 404:
                return None
            elif resp.status_code == 503:
                time.sleep(3)
            else:
                print(f"  ⚠️ HTTP {resp.status_code} for {url[:80]}")
        except Exception as e:
            print(f"  ⚠️ Error: {e}")
            time.sleep(2)
    return None

def clean_price(text: str) -> Optional[float]:
    """Extract a price from text like '$12.99' or '12,99 $'."""
    import re
    text = text.replace(",", "").replace("$", "").replace("CAD", "").replace("USD", "").strip()
    match = re.search(r'(\d+\.?\d*)', text)
    return float(match.group(1)) if match else None

def rate_limit(delay: float = 2.0):
    """Sleep to avoid hitting servers too fast."""
    time.sleep(delay)