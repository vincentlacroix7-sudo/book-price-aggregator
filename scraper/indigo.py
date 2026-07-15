"""Indigo scraper — uses selectolax for precise price extraction."""
import httpx
from selectolax.parser import HTMLParser
from base import HEADERS, fetch, rate_limit

STORE = "Indigo"


def scrape(isbn: str, client: httpx.Client) -> list[dict]:
    """Scrape Indigo for a book by ISBN. Returns precise price data."""
    prices = []
    clean_isbn = isbn.replace("-", "").replace(" ", "")

    url = f"https://www.indigo.ca/en-ca/search/?q={clean_isbn}&searchType=products"
    html = fetch(url, client)
    if not html:
        return prices

    rate_limit(2)
    tree = HTMLParser(html)

    # Find product cards
    products = tree.css('[data-product-card], .product-list__product, .product-item')
    if not products:
        products = tree.css('a[href*="/en-ca/"]')

    for product in products[:1]:  # First match only
        # Try multiple selectors for price
        price_el = (
            product.css_first('[data-price]') or
            product.css_first('.product-item__price--sale') or
            product.css_first('.price--sale') or
            product.css_first('[class*="price"]')
        )

        if price_el:
            price_text = price_el.text(strip=True)
            import re
            match = re.search(r'(\d+\.?\d*)', price_text.replace(",", "").replace("$", ""))
            if match:
                price = float(match.group(1))
                if 1.0 < price < 500.0:
                    # Try to get MSRP / list price
                    msrp_el = (
                        product.css_first('[data-original-price]') or
                        product.css_first('.product-item__price--original') or
                        product.css_first('.price--original') or
                        product.css_first('[class*="list-price"]')
                    )
                    msrp = None
                    if msrp_el:
                        msrp_text = msrp_el.text(strip=True)
                        msrp_match = re.search(r'(\d+\.?\d*)', msrp_text.replace(",", "").replace("$", ""))
                        if msrp_match:
                            msrp = float(msrp_match.group(1))

                    # Get product URL
                    link = product.css_first('a[href*="/en-ca/"]')
                    product_url = link.attributes.get("href", url) if link else url
                    if product_url.startswith("/"):
                        product_url = "https://www.indigo.ca" + product_url

                    prices.append({
                        "store_name": STORE,
                        "price": price,
                        "msrp": msrp,
                        "currency": "CAD",
                        "condition": "new",
                        "format": "paperback",
                        "url": product_url,
                    })
                    break

    return prices


if __name__ == "__main__":
    client = httpx.Client()
    results = scrape("9780735211292", client)
    print(results)