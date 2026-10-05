import { chromium } from 'playwright';
import fs from 'fs';

async function scrapeYoutube(queries: string[], maxVideos = 3, maxComments = 20) {
    const allRecords: any[] = [];
    const seenVids = new Set<string>();

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    });
    const page = await context.newPage();

    for (const query of queries) {
        console.log(`Searching YouTube for: ${query}`);
        const searchUrl = `https://www.youtube.com/results?search_query=${query.replace(/ /g, '+')}`;
        
        try {
            await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
            await page.waitForTimeout(3000);
            
            // Extract video IDs from search results
            const videoLinks = await page.locator('ytd-video-renderer a#video-title').evaluateAll(
                (elements: HTMLAnchorElement[]) => elements.map(el => ({
                    title: el.innerText,
                    url: el.href
                }))
            );
            
            let vidsProcessed = 0;
            for (const vid of videoLinks) {
                if (vidsProcessed >= maxVideos) break;
                if (!vid.url.includes('watch?v=') || seenVids.has(vid.url)) continue;
                
                seenVids.add(vid.url);
                console.log(`Fetching comments for video: ${vid.title}`);
                
                const vidPage = await context.newPage();
                try {
                    await vidPage.goto(vid.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
                    
                    // Scroll down specifically to trigger the YouTube comments lazy-load
                    await vidPage.evaluate(() => window.scrollBy(0, 600));
                    await vidPage.waitForTimeout(4000);
                    await vidPage.evaluate(() => window.scrollBy(0, 1000));
                    await vidPage.waitForTimeout(4000);
                    
                    // Extract comments
                    const comments = await vidPage.locator('ytd-comment-thread-renderer').evaluateAll(
                        (elements: any[], limit: number) => {
                            return elements.slice(0, limit).map(el => {
                                const author = el.querySelector('#author-text')?.textContent?.trim() || "";
                                const text = el.querySelector('#content-text')?.textContent?.trim() || "";
                                return { author, text };
                            });
                        },
                        maxComments
                    );
                    
                    for (const c of comments) {
                        if (c.text) {
                            allRecords.push({
                                video_title: vid.title,
                                video_url: vid.url,
                                author: c.author,
                                comment_text: c.text,
                                query
                            });
                        }
                    }
                } catch (e) {
                    console.error(`Error on video ${vid.url}:`, e);
                }
                await vidPage.close();
                vidsProcessed++;
            }
            
        } catch (e) {
            console.error(`Error searching YouTube for ${query}:`, e);
        }
    }
    
    await browser.close();
    
    fs.writeFileSync("youtube_results.json", JSON.stringify(allRecords, null, 2));
    console.log(`Saved ${allRecords.length} YouTube comments to youtube_results.json`);
}

const searchQueries = [
    "Google Photos app review",
    "Google Photos missing photos"
];

scrapeYoutube(searchQueries).catch(console.error);
