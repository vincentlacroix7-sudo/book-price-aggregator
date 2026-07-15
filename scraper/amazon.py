"""Amazon.ca price scraper.

Amazon actively blocks scrapers. This scraper works best from residential IPs.
On GitHub Actions (datacenter IPs), it may not work without proxies.
We include it anyway — if blocked, the orchestrator handles the error gracefully.
"""
import httpx
import re
from base import HEADERS, fetch, clean_price, rate_limit

STORE = "Amazon"


def scrape(isbn: str, client: httpx.Client) -> list[dict]:
    """Scrape Amazon.ca for a book by ISBN. Returns new and used prices."""
    prices = []
    clean_isbn = isbn.replace("-", "").replace(" ", "")

    # Amazon ISBN search
    url = f"https://www.amazon.ca/s?k={clean_isbn}&i=stripbooks"
    html = fetch(url, client)

    if not html:
        return prices

    rate_limit(3)

    # Look for price patterns
    price_patterns = [
        r'\$(\d+\.?\d*)',  # General dollar amounts
    ]

    all_prices = []
    for pattern in price_patterns:
        all_prices.extend([float(p) for p in re.findall(pattern, html) if 1.0 < float(p) < 500.0])

    if all_prices:
        # Filter out obviously wrong prices (shipping costs, etc.)
        book_prices = [p for p in all_prices if 5.0 < p < 200.0]

        if book_prices:
            # Find product URL
            url_match = re.search(r'href="(/dp/\d+[^"]*)"', html)
            product_url = f"https://www.amazon.ca{url_match.group(1)}" if url_match else url
            if "ref=" in product_url:
                product_url = product_url.split("ref=")[0].rstrip("?&")

            prices.append({
                "store_name": STORE,
                "price": round(book_prices[0], 2),
                "currency": "CAD",
                "condition": "new",
                "url": product_url,
            })

            if len(book_prices) > 1:
                prices.append({
                    "store_name": STORE,
                    "price": round(book_prices[1], 2),
                    "currency": "CAD",
                    "condition": "used",
                    "url": product_url,
                })

    return prices


if __name__ == "__main__":
    client = httpx.Client(follow_redirects=True)
    results = scrape("9780735211292", client)
    print(results)