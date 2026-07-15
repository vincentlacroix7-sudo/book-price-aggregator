"""Indigo (chapters.indigo.ca) price scraper."""
import httpx
import re
from base import HEADERS, fetch, clean_price, rate_limit

STORE = "Indigo"
BASE_URL = "https://www.indigo.ca"
SEARCH_URL = "https://www.indigo.ca/en-ca/search/"


def scrape(isbn: str, client: httpx.Client) -> list[dict]:
    """Scrape Indigo for a book by ISBN. Returns list of price dicts."""
    prices = []

    # Format ISBN for URL (remove hyphens)
    clean_isbn = isbn.replace("-", "").replace(" ", "")

    # Try direct ISBN lookup first
    url = f"https://www.indigo.ca/en-ca/search/?q={clean_isbn}&searchType=products"
    html = fetch(url, client)

    if not html:
        return prices

    rate_limit(2)

    # Indigo loads prices in a script tag or data attributes
    # Try to find price in the page
    price_patterns = [
        r'"price"\s*:\s*"?(\d+\.?\d*)"?',
        r'"salePrice"\s*:\s*"?(\d+\.?\d*)"?',
        r'"listPrice"\s*:\s*"?(\d+\.?\d*)"?',
        r'data-price\s*=\s*"?(\d+\.?\d*)"?',
        r'\$(\d+\.?\d*)',
    ]

    found_price = None
    for pattern in price_patterns:
        matches = re.findall(pattern, html)
        if matches:
            # Take the first reasonable price (between $1 and $500)
            for m in matches:
                p = float(m)
                if 1.0 < p < 500.0:
                    found_price = p
                    break
        if found_price:
            break

    if found_price:
        # Try to get the product URL
        url_match = re.search(rf'href="(/en-ca/[^"]*{clean_isbn[:6]}[^"]*)"', html, re.IGNORECASE)
        product_url = BASE_URL + url_match.group(1) if url_match else url

        prices.append({
            "store_name": STORE,
            "price": found_price,
            "currency": "CAD",
            "condition": "new",
            "url": product_url,
        })

    return prices


if __name__ == "__main__":
    client = httpx.Client()
    results = scrape("9780735211292", client)  # Atomic Habits
    print(results)