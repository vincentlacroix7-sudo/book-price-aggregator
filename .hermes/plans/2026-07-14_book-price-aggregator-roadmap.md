# Book Price Aggregator — Strategic Roadmap & Implementation Plan

> **Inspiration:** gg.deals — but for books (new & used).
> **Goal:** Build a modern, accurate, easy-to-use book price comparison website. Monetize via affiliate links, ads, and future publisher partnerships.
> **Constraint:** $0 budget until monetized. Built with AI-assisted development for a solo founder with no programming experience.

---

## 1. HIGH-LEVEL ARCHITECTURE

```
┌─────────────────────────────────────────────────┐
│                  USERS                          │
│     Browse → Search → Compare → Click ($$$)     │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│            FRONTEND (Next.js)                   │
│    Hosted on Vercel (free tier)                 │
│    - Homepage with trending/featured books      │
│    - Search by title, author, ISBN              │
│    - Book detail page: price grid, history      │
│    - Price alerts (email)                       │
│    - Affiliate link redirection                 │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│         BACKEND / API (Next.js API Routes       │
│         OR Supabase Edge Functions)             │
│    - Book metadata (title, author, cover, ISBN) │
│    - Price data (store, price, condition, URL)  │
│    - Price history & trends                     │
│    - User accounts & alerts                     │
└────────┬───────────────────┬───────────────────┘
         │                   │
┌────────▼────────┐  ┌───────▼───────────────────┐
│    DATABASE     │  │   PRICE SCRAPER (Python)   │
│   Supabase      │  │   GitHub Actions (free)    │
│   (free tier)   │  │   Runs every 4-6 hours     │
│                 │  │   Scrapes store pages      │
│   - books       │  │   Extracts prices          │
│   - prices      │  │   Inserts into Supabase    │
│   - price_hist  │  │                            │
│   - users       │  │   Book metadata sources:   │
│   - alerts      │  │   - Google Books API (free)│
└─────────────────┘  │   - OpenLibrary (free)     │
                     │   - ISBNdb (limited free)  │
                     └────────────────────────────┘
```

---

## 2. TECH STACK (100% Free Tier)

| Layer | Technology | Free Tier Limit | Why |
|-------|-----------|-----------------|-----|
| **Frontend** | Next.js 15 + React + Tailwind CSS | ∞ (Vercel) | Modern, SEO-friendly, huge AI knowledge base |
| **Hosting** | Vercel | 100 GB bandwidth, 100 GB-hours serverless | Best free tier, auto-deploys from Git |
| **Database** | Supabase | 500 MB DB, 2 projects, 50K monthly users | Managed PostgreSQL + auth + realtime |
| **Auth** | Supabase Auth | Included in free tier | Email/password + OAuth, no code needed |
| **Scraper** | Python + httpx + BeautifulSoup | Runs on GitHub Actions | Free 2,000 min/month of CI |
| **Scheduler** | GitHub Actions (cron) OR Vercel Cron | Free tier | Trigger scraper every 4-6 hours |
| **Book metadata** | Google Books API + OpenLibrary API | 1,000 req/day free each | Covers, descriptions, ISBN lookup |
| **Email** | Resend | 100 emails/day free | Price alert notifications |
| **Analytics** | Plausible or Umami (self-hosted) | Free | Privacy-friendly, no cookie banners needed |
| **Domain** | Namecheap / Cloudflare | ~$10-15/year | Only unavoidable cost |

**Total cost before monetization: $10-15/year (domain only).**

---

## 3. STORES TO AGGREGATE (Phase 1 — Canada focus)

These are the stores to scrape for book prices, prioritized:

| Priority | Store | Why |
|----------|-------|-----|
| ⭐⭐⭐ | Amazon.ca | Biggest catalog, largest affiliate program |
| ⭐⭐⭐ | Indigo/Chapters | Canada's #1 bookstore, ships Canada-wide |
| ⭐⭐ | Book Outlet | Deep discounts on remainder books |
| ⭐⭐ | AbeBooks | Huge used book marketplace |
| ⭐⭐ | Better World Books | Free worldwide shipping, used books |
| ⭐ | ThriftBooks | US-based but ships to Canada, massive used catalog |
| ⭐ | eBay (books) | Used deals, some ship to Canada |

> **Important:** Scraping legality — we only scrape PUBLICLY AVAILABLE prices. No login walls. Rate-limit to 1 request every 2-3 seconds per site. Respect robots.txt. This is standard practice for price aggregators (Kayak, Google Shopping, gg.deals all do it).

---

## 4. MONETIZATION STRATEGY

### Phase 1: Affiliate Links (Day 1)
- **Amazon Associates** — 4-10% commission on books. User clicks through, buys anything in 24h, you get commission on the *entire cart*. This is the golden goose.
- **Indigo Affiliate** — Check if they have a program (Rakuten/ShareASale often has it)
- **Book Outlet Affiliate** — Check ShareASale
- **AbeBooks Affiliate** — They have a program via Commission Junction
- **Better World Books** — They have an affiliate program

**Implementation:** Every price link on the site is an affiliate link. When user clicks "View Deal", they go through your affiliate redirect.

### Phase 2: Display Ads (when traffic > 10K monthly visitors)
- **Google AdSense** — Low barrier, auto-targeted
- **Mediavine / Raptive** — Higher payouts but require 50K+ sessions/month

### Phase 3: Premium Features (when traffic > 50K)
- Price drop alerts via push notification (not just email)
- Advanced filtering (edition, binding, signed copies)
- Price prediction / "best time to buy"

### Phase 4: Publisher Partnerships
- Featured placement for new releases
- Sponsored "book of the week"
- Co-branded landing pages for book launches

---

## 5. DEVELOPMENT PHASES

### 🟢 PHASE 0: SETUP (Week 1)
**Goal:** All accounts created, tools installed, hello-world running.

| Step | Action | Tool/Resource |
|------|--------|---------------|
| 0.1 | Buy a domain (e.g., bookwatch.ca, pricedpages.ca, bookdeal.ca) | Namecheap (~$12/yr) |
| 0.2 | Install Cursor (AI code editor — free tier) | [cursor.com](https://cursor.com) |
| 0.3 | Install Node.js 22 LTS | [nodejs.org](https://nodejs.org) |
| 0.4 | Install Python 3.12 | [python.org](https://python.org) |
| 0.5 | Create GitHub account | [github.com](https://github.com) |
| 0.6 | Create Vercel account (login with GitHub) | [vercel.com](https://vercel.com) |
| 0.7 | Create Supabase account | [supabase.com](https://supabase.com) |
| 0.8 | Create Resend account (for email alerts) | [resend.com](https://resend.com) |
| 0.9 | Sign up for Amazon Associates (Canada) | [associates.amazon.ca](https://associates.amazon.ca) |
| 0.10 | Get Google Books API key | [console.cloud.google.com](https://console.cloud.google.com) |

**Deliverable:** GitHub repo exists, Next.js "hello world" deployed to Vercel at your domain.

---

### 🟡 PHASE 1: BOOK DATABASE & SEARCH (Weeks 2-4)
**Goal:** Users can search for books and see book details.

| Step | What to Build | AI Prompt (in Cursor) |
|------|---------------|----------------------|
| 1.1 | Supabase schema: `books` table (isbn, title, author, cover_url, description, publisher, pages, published_date) | "Create a SQL migration for a books table in Supabase with columns for ISBN, title, author, cover URL, description, publisher, page count, and published date." |
| 1.2 | Next.js API route: `GET /api/books/search?q=harry+potter` — searches Google Books API + OpenLibrary | "Create a Next.js API route that searches books using the Google Books API. It should return title, author, cover image, ISBN, and description." |
| 1.3 | Homepage with search bar and trending books section | "Build a Next.js homepage with a centered search bar (like Google/gg.deals) and a grid of trending books below it." |
| 1.4 | Search results page — grid of book cards | "Build a search results page in Next.js that shows a grid of book cards with cover image, title, author, and a placeholder for price." |
| 1.5 | Book detail page (`/book/[isbn]`) — shows full book info | "Build a book detail page in Next.js showing cover, title, author, description, publisher info, and a placeholder price comparison section." |

**Deliverable:** Functional book search and detail pages at your domain. No prices yet.

---

### 🟠 PHASE 2: PRICE SCRAPER & COMPARISON (Weeks 5-8)
**Goal:** Scrape prices from stores, display comparison grid.

| Step | What to Build | Details |
|------|---------------|---------|
| 2.1 | Supabase schema: `prices` table (book_isbn, store_name, price, currency, condition, url, scraped_at) | New/used condition, direct link to store page |
| 2.2 | Supabase schema: `price_history` table | Same columns but with `recorded_at` for time-series |
| 2.3 | Python scraper script for Amazon.ca | Search by ISBN, extract new & used prices. Use `httpx` + `selectolax` or BeautifulSoup |
| 2.4 | Python scraper for Indigo | ISBN search, extract price |
| 2.5 | Python scraper for AbeBooks | ISBN search, extract used prices |
| 2.6 | Python scraper for Book Outlet | Extract prices where ISBN matches |
| 2.7 | Master scraper orchestrator | Runs all scrapers for a list of ISBNs, inserts into Supabase |
| 2.8 | GitHub Action workflow — runs scraper every 6 hours | `.github/workflows/scrape.yml` |
| 2.9 | Next.js API route: `GET /api/books/[isbn]/prices` | Returns latest prices from each store, sorted by price |
| 2.10 | Price comparison grid on book detail page | Table showing Store, Price (New), Price (Used), Condition, "View Deal" button with affiliate link |
| 2.11 | Affiliate link redirect system | `/out/[store]/[isbn]` → redirects to store with affiliate tag appended |

**Deliverable:** Book detail pages show real prices from 4+ stores. Clicking "View Deal" goes through your affiliate link.

---

### 🔵 PHASE 3: POLISH & UX (Weeks 9-10)
**Goal:** Make it beautiful, fast, and useful — beat the ugly competitors.

| Step | What to Build |
|------|---------------|
| 3.1 | Price history chart (line graph showing price over last 90 days per store) |
| 3.2 | "Best deal" badge that highlights the cheapest option |
| 3.3 | Filter by condition (New / Used / Any) |
| 3.4 | Sort by price, store, condition |
| 3.5 | Mobile-responsive polish (it already works but make it *good*) |
| 3.6 | SEO: meta tags, sitemap.xml, robots.txt |
| 3.7 | Loading skeletons while data loads |
| 3.8 | Dark mode (toggle) |

**Deliverable:** Polished, fast, mobile-friendly website that looks better than any existing book price comparison tool.

---

### 🟣 PHASE 4: USER ACCOUNTS & ALERTS (Weeks 11-12)
**Goal:** Users can create accounts, save books, and get price drop emails.

| Step | What to Build |
|------|---------------|
| 4.1 | Supabase Auth — sign up / log in (email + password) |
| 4.2 | "Watch this book" button — saves to user's watchlist |
| 4.3 | User dashboard — shows watched books with current prices |
| 4.4 | Price drop detection (scraper compares new price to previous) |
| 4.5 | Email alert via Resend when a watched book drops in price |
| 4.6 | Alert settings (threshold: alert if drops by X% or below $Y) |

**Deliverable:** Users can register, track books, and receive price drop emails.

---

### 🟤 PHASE 5: GROWTH & MONETIZATION UPGRADE (Ongoing)
**Goal:** Traffic, revenue, and more stores.

| Step | Action |
|------|--------|
| 5.1 | Apply to Google AdSense once traffic hits ~10K monthly |
| 5.2 | Add more stores: ThriftBooks, Better World Books, eBay |
| 5.3 | Add US stores (Amazon.com, Barnes & Noble) for cross-border comparison |
| 5.4 | Create content: "Best book deals this week" blog (SEO magnet) |
| 5.5 | Social media: post deals on X/Twitter, Reddit r/BookDeals |
| 5.6 | French language support (for Quebec market) |
| 5.7 | Price prediction: "Should you buy now or wait?" |

---

## 6. SOFTWARE & TOOLS YOU'LL USE

### Essential (Install Now)
| Tool | What It Does | Cost |
|------|-------------|------|
| **Cursor** | AI-powered code editor — you describe what you want, it writes the code | Free tier (2,000 completions/month) |
| **Node.js 22** | Runs JavaScript/Next.js | Free |
| **Python 3.12** | Runs the price scraper | Free |
| **Git** | Version control (save your code history) | Free |
| **GitHub Desktop** | Visual Git interface (no command line needed) | Free |

### Web Services (Create Accounts)
| Service | What It Does | Free Tier |
|---------|-------------|-----------|
| **Vercel** | Hosts the website, auto-deploys from GitHub | ✅ Generous free tier |
| **Supabase** | Database + user authentication | ✅ 500 MB, 50K monthly users |
| **GitHub** | Stores code, runs scraper on schedule | ✅ Unlimited public repos |
| **Resend** | Sends price alert emails | ✅ 100/day |
| **Google Books API** | Book covers, descriptions, metadata | ✅ 1,000/day |
| **OpenLibrary** | Backup book metadata source | ✅ Unlimited |

### AI Assistants (Your Dev Team)
| Tool | Best For | Cost |
|------|----------|------|
| **Cursor** (with Claude) | Day-to-day coding | Free tier, then $20/mo |
| **v0.dev** | Rapid UI prototyping (describe → get React code) | Free tier |
| **Claude.ai / ChatGPT** | Planning, debugging, learning concepts | Free tiers |

### Learning Resources
- **Next.js Tutorial**: [nextjs.org/learn](https://nextjs.org/learn) — official, free, excellent
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs) — very beginner-friendly
- **Fireship.io** (YouTube): Quick 100-second explanations of every tech concept

---

## 7. HOW TO WORK WITH AI (Your Secret Weapon)

You don't need to learn to code. You need to learn to **direct AI to code for you.** Here's the workflow:

### The Loop:
```
1. Open Cursor
2. Describe what you want in plain English
3. AI generates the code
4. Test it (open the browser, see if it works)
5. If broken → paste the error into Cursor, AI fixes it
6. If works → commit to GitHub
7. Repeat
```

### Example Prompt You'd Type in Cursor:
> "Create a Next.js page at /search that takes a query parameter ?q=harry+potter and displays a grid of book cards with the cover image, title, and author from the Google Books API. Use Tailwind CSS for styling. Make it look modern like gg.deals but for books."

### Critical Rules:
- **One small feature at a time.** Don't ask AI to "build the whole website."
- **Always test after every change.** Open `localhost:3000` and click around.
- **Commit after every working feature.** `git commit -m "search page working"`
- **When stuck, paste the error into AI.** Don't debug manually — AI is faster.

---

## 8. COST BREAKDOWN SUMMARY

| Item | Pre-Launch | Post-Launch (growing) | At Scale |
|------|-----------|----------------------|----------|
| Domain | $12/year | $12/year | $12/year |
| Vercel hosting | $0 | $0 | $20/mo (Pro) |
| Supabase | $0 | $0 | $25/mo (Pro) |
| GitHub | $0 | $0 | $0 |
| Resend | $0 | $0 | $20/mo |
| Cursor AI | $0 | $20/mo | $20/mo |
| **TOTAL** | **$12/year** | **$32/mo** | **$85/mo** |

Pre-launch: literally just the domain name. Everything else runs on free tiers until you have enough traffic/users to need more.

---

## 9. RISKS & MITIGATIONS

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| **Amazon blocks scraper IP** | High | Rotate user agents, rate limit, use residential proxies only if needed ($$$) |
| **Stores change HTML structure** | Medium | Monitor scraper success rate, alert on failures, easy to fix with AI |
| **Stores send cease & desist** | Low | We only scrape public prices (legal precedent: Kayak, Google Shopping). If asked to stop, we stop for that specific store. |
| **Amazon Associates rejected** | Medium | Need 3 qualifying sales in 180 days. Drive initial traffic from Reddit/forums. Have a backup plan (other affiliates). |
| **Google Books API rate limit** | Medium | Cache all metadata in Supabase. Only hit API for new books. OpenLibrary as fallback. |
| **Project is too complex for a beginner** | High | This is why we use Cursor + AI. Each phase is broken into tiny steps. You're not coding — you're directing. Thousands of non-coders have built SaaS this way in 2025-2026. |

---

## 10. FIRST ACTION: DO THIS TODAY

1. **Buy a domain** — Go to Namecheap, search for a catchy name related to book deals. Suggestions:
   - `bookwatch.ca`
   - `pricedpages.ca`
   - `bookdeal.ca`
   - `paperprices.ca`
   - `bookspy.ca`

2. **Install Cursor** — Download from [cursor.com](https://cursor.com), install, sign in with GitHub.

3. **Install Node.js** — Download the LTS version from [nodejs.org](https://nodejs.org).

4. **Come back here** and tell me which domain you bought. Then I'll generate the exact code for Phase 0 setup and you paste it into Cursor.

---

> **This is 100% doable. gg.deals started as a one-person project too. The difference is you have AI tools that didn't exist when they started. You can move 10x faster.**