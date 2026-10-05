import { chromium } from 'playwright';
import * as cheerio from 'cheerio';
import fs from 'fs';

async function scrapeReddit(queries: string[], maxPosts = 50) {
    const allRecords: any[] = [];
    const seenUrls = new Set<string>();

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    });
    const page = await context.newPage();

    for (const query of queries) {
        console.log(`Searching Reddit for: ${query}`);
        const searchUrl = `https://www.reddit.com/search/?q=${query.replace(/ /g, '+')}`;
        
        try {
            await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
            await page.waitForTimeout(5000);
            
            // Scroll down to simulate infinite scrolling
            for (let i = 0; i < 10; i++) {
                await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
                await page.waitForTimeout(2000);
            }
            
            const html = await page.content();
            const $ = cheerio.load(html);
            
            const posts = $('shreddit-post');
            
            let count = 0;
            posts.each((_, el) => {
                if (count >= maxPosts) return false;
                
                const url = "https://www.reddit.com" + ($(el).attr('permalink') || "");
                const title = $(el).attr('post-title') || "";
                const author = $(el).attr('author') || "";
                
                // Get inner text
                let text = $(el).text().trim();
                text = text.replace(/\s+/g, ' ').substring(0, 500); // Clean up whitespace and limit length
                
                if (!url || seenUrls.has(url)) return;
                
                seenUrls.add(url);
                allRecords.push({
                    url, title, text, author, query
                });
                count++;
            });
        } catch (e) {
            console.error(`Error scraping ${query}:`, e);
        }
        
        await page.waitForTimeout(3000);
    }
    
    await browser.close();
    
    fs.writeFileSync("reddit_results.json", JSON.stringify(allRecords, null, 2));
    console.log(`Saved ${allRecords.length} Reddit posts to reddit_results.json`);
}

const searchQueries = [
    "Google Photos issue",
    "Google Photos search broken",
    "Google Photos lost photos",
    "Google photos finding pictures"
];

scrapeReddit(searchQueries).catch(console.error);
