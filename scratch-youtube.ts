import fs from 'fs';
const ytcm = require('@freetube/yt-comment-scraper');

async function runYouTubeScraper() {
  console.log('--- Starting YouTube Comment Scrape (No API Key) ---');
  
  const videoIds = ['pRtou8UlXk0', '4hnn1DQJBJY', 'EbUOFX_-Nsc'];
  let allComments: any[] = [];
  
  for (const videoId of videoIds) {
    console.log(`\nExtracting comments from video ID: ${videoId}...`);
    
    try {
      const payload = { videoId: videoId };
      const data = await ytcm.getComments(payload);
      
      console.log(`Successfully extracted ${data.comments ? data.comments.length : 0} comments!`);
      
      if (data.comments && data.comments.length > 0) {
          allComments = [...allComments, ...data.comments];
          console.log('\n--- First YouTube Comment ---');
          console.log(`Author: ${data.comments[0].author}`);
          console.log(`Text: "${data.comments[0].text}"`);
      }
    } catch (err) {
      console.error(`Error fetching comments for ${videoId}:`, (err as any).message);
    }
    
    // Wait a bit before next request
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  const fileName = './youtube_comments.json';
  fs.writeFileSync(fileName, JSON.stringify(allComments, null, 2));
  console.log(`\nSaved a total of ${allComments.length} comments to ${fileName}`);
}

runYouTubeScraper();
