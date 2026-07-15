"""Book Outlet (bookoutlet.ca) price scraper."""
import httpx
import re
from base import HEADERS, fetch, clean_price, rate_limit

STORE = "Book Outlet"
SEARCH_URL = "https://bookoutlet.ca/search"


def scrape(isbn: str, client: httpx.Client) -> list[dict]:
    """Scrape Book Outlet for a book by ISBN."""
    prices = []
    clean_isbn = isbn.replace("-", "").replace(" ", "")

    url = f"https://bookoutlet.ca/search?q={clean_isbn}"
    html = fetch(url, client)

    if not html:
        return prices

    rate_limit(2)

    # Book Outlet shows prices clearly
    price_match = re.search(r'\$(\d+\.?\d*)', html)
    if price_match:
        price = float(price_match.group(1))
        if 1.0 < price < 500.0:
            # Find product URL
            url_match = re.search(r'href="(/products/[^"]*)"', html)
            product_url = f"https://bookoutlet.ca{url_match.group(1)}" if url_match else url

            prices.append({
                "store_name": STORE,
                "price": price,
                "currency": "CAD",
                "condition": "new",
                "url": product_url,
            })

    return prices


if __name__ == "__main__":
    client = httpx.Client()
    results = scrape("9780735211292", client)
    print(results)