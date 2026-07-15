"""AbeBooks scraper — uses selectolax for precise extraction."""
import httpx
from selectolax.parser import HTMLParser
from base import HEADERS, fetch, clean_price, rate_limit

STORE = "AbeBooks"


def scrape(isbn: str, client: httpx.Client) -> list[dict]:
    """Scrape AbeBooks for used/new book prices by ISBN."""
    prices = []
    clean_isbn = isbn.replace("-", "").replace(" ", "")

    url = f"https://www.abebooks.com/servlet/SearchResults?isbn={clean_isbn}"
    html = fetch(url, client)
    if not html:
        return prices

    rate_limit(2)
    tree = HTMLParser(html)

    # Find price elements on results page
    price_items = tree.css('.item-price, [class*="price"], .srp-item-price')

    found_prices = []
    for item in price_items[:10]:
        text = item.text(strip=True)
        price = clean_price(text)
        if price and 1.0 < price < 500.0:
            # Try to determine condition from nearby elements
            parent = item.parent
            condition = "used"
            if parent:
                parent_text = parent.text(strip=True).lower()
                if "new" in parent_text and "used" not in parent_text.replace("new", ""):
                    condition = "new"

            # Get shipping info
            shipping_el = parent.css_first('[class*="shipping"]') if parent else None
            found_prices.append({"price": price, "condition": condition})

    if found_prices:
        # Separate new vs used
        used = [p for p in found_prices if p["condition"] == "used"]
        new = [p for p in found_prices if p["condition"] == "new"]

        if used:
            prices.append({
                "store_name": STORE,
                "price": round(min(p["price"] for p in used), 2),
                "msrp": None,
                "currency": "USD",
                "condition": "used",
                "format": None,
                "url": url,
            })

        if new:
            prices.append({
                "store_name": STORE,
                "price": round(min(p["price"] for p in new), 2),
                "msrp": None,
                "currency": "USD",
                "condition": "new",
                "format": None,
                "url": url,
            })
        elif used:
            # If all are used, take the cheapest
            prices = [{
                "store_name": STORE,
                "price": round(min(p["price"] for p in found_prices), 2),
                "msrp": None,
                "currency": "USD",
                "condition": "used",
                "format": None,
                "url": url,
            }]

    return prices


if __name__ == "__main__":
    client = httpx.Client()
    results = scrape("9780735211292", client)
    print(results)