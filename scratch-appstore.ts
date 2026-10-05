import fs from 'fs';
// @ts-ignore
import store from 'app-store-scraper';

async function runAppStoreScraper() {
  console.log('--- Starting Massive 10k App Store Scrape ---');
  console.log('Because Apple limits single regions to ~5,000 reviews, we will iterate through multiple countries.');
  
  let allRecords: any[] = [];
  const countries = ['us', 'gb', 'ca', 'au', 'in']; // gb is UK in app store
  
  for (const country of countries) {
    if (allRecords.length >= 10000) break;
    
    console.log(`\n--- Starting collection for country: ${country.toUpperCase()} ---`);
    let page = 1;
    let countryCount = 0;
    
    // Apple limits to 10 pages maximum per region.
    while (allRecords.length < 10000 && page <= 10) {
      try {
        const response = await store.reviews({
          id: '962194608', // Google Photos app ID on App Store
          country: country,
          page: page,
          sort: store.sort.RECENT
        });
        
        if (!response || response.length === 0) {
          console.log(`No more reviews on page ${page} in region ${country.toUpperCase()}`);
          break;
        }

        const mapped = response.map((r: any) => ({
          source_date: new Date(r.updated),
          rating: r.score,
          source_url: r.url,
          raw_text: r.text,
          region: country
        }));

        allRecords = [...allRecords, ...mapped];
        countryCount += mapped.length;
        
        console.log(`Fetched ${mapped.length} from ${country.toUpperCase()} (Page ${page})... Total so far: ${allRecords.length}`);
        
        page++;
        await new Promise(resolve => setTimeout(resolve, 1500)); // sleep to avoid rate limiting
      } catch (err) {
        console.log(`Error scraping App Store ${country} on page ${page}: ${(err as any).message}`);
        break;
      }
    }
    
    console.log(`Finished region ${country.toUpperCase()}. Total from region: ${countryCount}`);
  }
  
  // Trim down to exactly 10,000 if we overshot
  allRecords = allRecords.slice(0, 10000);
  
  console.log(`\nSuccessfully scraped ${allRecords.length} reviews from App Store across multiple regions!`);
  
  const fileName = './10k_appstore_reviews.json';
  fs.writeFileSync(fileName, JSON.stringify(allRecords, null, 2));
  console.log(`Data saved to ${fileName} (File size: ${(fs.statSync(fileName).size / 1024 / 1024).toFixed(2)} MB)`);
}

runAppStoreScraper().catch(console.error);
