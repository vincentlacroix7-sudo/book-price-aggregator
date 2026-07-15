"""AbeBooks price scraper."""
import httpx
import re
from base import HEADERS, fetch, clean_price, rate_limit

STORE = "AbeBooks"
SEARCH_URL = "https://www.abebooks.com/servlet/SearchResults"


def scrape(isbn: str, client: httpx.Client) -> list[dict]:
    """Scrape AbeBooks for used/new book prices by ISBN."""
    prices = []
    clean_isbn = isbn.replace("-", "").replace(" ", "")

    url = f"https://www.abebooks.com/servlet/SearchResults?isbn={clean_isbn}"
    html = fetch(url, client)

    if not html:
        return prices

    rate_limit(2)

    # AbeBooks displays prices in predictable patterns
    price_pattern = r'\$(\d+\.?\d*)'
    all_prices = re.findall(price_pattern, html)
    valid_prices = [float(p) for p in all_prices if 1.0 < float(p) < 500.0]

    if valid_prices:
        # Lowest price = usually used, higher = new
        used_price = min(valid_prices)
        prices.append({
            "store_name": STORE,
            "price": round(used_price, 2),
            "currency": "USD",
            "condition": "used",
            "url": url,
        })

        if len(valid_prices) > 1:
            new_candidates = [p for p in valid_prices if p > used_price * 1.5]
            if new_candidates:
                prices.append({
                    "store_name": STORE,
                    "price": round(min(new_candidates), 2),
                    "currency": "USD",
                    "condition": "new",
                    "url": url,
                })

    return prices


if __name__ == "__main__":
    client = httpx.Client()
    results = scrape("9780735211292", client)
    print(results)