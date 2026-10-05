import json
import sys
import time
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

def scrape_reddit(query, max_posts=50):
    all_records = []
    seen_urls = set()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # Pretend to be a real browser
        page.set_extra_http_headers({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })

        search_url = f"https://www.reddit.com/search/?q={query.replace(' ', '+')}"
        
        try:
            page.goto(search_url, wait_until="domcontentloaded", timeout=60000)
            page.wait_for_timeout(5000) 
            
            # Scroll down to load more results
            for _ in range(10): # Adjust scroll count as needed
                page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                page.wait_for_timeout(2000)
                
            html = page.content()
            soup = BeautifulSoup(html, "html.parser")
            
            # Reddit's custom web elements for posts
            posts = soup.find_all("shreddit-post")
            
            count = 0
            for post in posts:
                if count >= max_posts:
                    break
                
                url = "https://www.reddit.com" + post.get("permalink", "")
                title = post.get("post-title", "")
                author = post.get("author", "")
                text = post.get_text(strip=True)[:500]
                    
                if not url or url in seen_urls:
                    continue
                    
                seen_urls.add(url)
                all_records.append({
                    "url": url,
                    "title": title,
                    "text": text,
                    "author": author,
                    "query": query
                })
                count += 1
                
        except Exception as e:
            print(f"Error scraping {query}: {e}", file=sys.stderr)
            
        time.sleep(3)
        browser.close()
        
    print(json.dumps(all_records))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python reddit_scraper.py <query> [max_posts]", file=sys.stderr)
        sys.exit(1)
        
    query = sys.argv[1]
    max_posts = int(sys.argv[2]) if len(sys.argv) > 2 else 25
    scrape_reddit(query, max_posts)
