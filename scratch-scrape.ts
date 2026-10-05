import { GooglePlayCollector } from './src/collectors/google-play';
import fs from 'fs';
import gplay from 'google-play-scraper';

async function runScraper() {
  console.log('--- Starting Massive 50k Scrape ---');
  
  const playCollector = new GooglePlayCollector();
  console.log('Testing Google Play connection (com.google.android.apps.photos)...');
  const playConnected = await playCollector.testConnection();
  
  if (playConnected) {
    console.log('Connected successfully! Attempting to scrape 50,000 reviews from Google Play...');
    console.log('Because Google Play hard-caps a single region at ~8,000 reviews, we will iterate through multiple countries to reach 50k. This will take ~15-20 minutes...');
    
    let allRecords: any[] = [];
    
    // List of countries to cycle through to bypass the 8k hard limit per region
    const countries = ['us', 'uk', 'ca', 'au', 'in', 'nz', 'ie', 'za', 'sg', 'ph'];
    
    for (const country of countries) {
      if (allRecords.length >= 50000) break;
      
      console.log(`\n--- Starting collection for country: ${country.toUpperCase()} ---`);
      let currentCursor: string | undefined = undefined;
      let countryCount = 0;
      
      while (allRecords.length < 50000) {

        
        const gplayOptions: any = {
          appId: 'com.google.android.apps.photos',
          sort: 2, // 2 = NEWEST
          num: 150,
          paginate: true,
          country: country,
          lang: 'en'
        };
        
        if (currentCursor) {
          gplayOptions.nextPaginationToken = currentCursor;
        }

        try {
          const response = await gplay.reviews(gplayOptions);
          const reviews = response.data || [];
          currentCursor = response.nextPaginationToken;
          
          const mapped = reviews.map((r: any) => ({
            source_date: new Date(r.date),
            rating: r.score,
            source_url: r.url || `https://play.google.com/store/apps/details?id=com.google.android.apps.photos&reviewId=${r.id}`,
            raw_text: r.text,
            region: country
          }));

          allRecords = [...allRecords, ...mapped];
          countryCount += mapped.length;
          
          console.log(`Fetched ${mapped.length} from ${country.toUpperCase()}... Total so far: ${allRecords.length}`);
          
          if (!currentCursor || reviews.length === 0) {
            console.log(`No more reviews available in region ${country.toUpperCase()} (Total from region: ${countryCount})`);
            break;
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (err) {
          console.log(`Error scraping ${country}: ${(err as any).message}`);
          break;
        }
      }
    }
    
    // Trim down to exactly 50,000 if we slightly overshot
    allRecords = allRecords.slice(0, 50000);
    
    console.log(`\nSuccessfully scraped ${allRecords.length} reviews from Google Play across multiple regions!`);
    
    const fileName = './50k_play_reviews.json';
    fs.writeFileSync(fileName, JSON.stringify(allRecords, null, 2));
    console.log(`Data saved to ${fileName} (File size: ${(fs.statSync(fileName).size / 1024 / 1024).toFixed(2)} MB)`);
    
  } else {
    console.log('Failed to connect to Google Play.');
  }
}

runScraper().catch(console.error);
