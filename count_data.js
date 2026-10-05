const fs = require('fs');
const path = require('path');

const files = [
  '10k_appstore_reviews.json',
  '10k_play_reviews.json',
  '50k_play_reviews.json',
  'reddit_results.json',
  'youtube_comments.json',
  'youtube_results.json',
  'relevant_reviews.json',
  'scraped_reviews_sample.json',
  'exploration_results.json'
];

console.log('--- Data Counts ---');
for (const f of files) {
  try {
    const filePath = path.join(__dirname, f);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      if (stats.size === 0) {
        console.log(`${f}: 0 items (Empty file)`);
        continue;
      }
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (Array.isArray(data)) {
        console.log(`${f}: ${data.length} items`);
      } else if (typeof data === 'object') {
         console.log(`${f}: 1 object with ${Object.keys(data).length} keys`);
      } else {
        console.log(`${f}: Not an array or object (${typeof data})`);
      }
    } else {
      console.log(`${f}: File not found`);
    }
  } catch (e) {
    console.log(`${f}: Error reading/parsing`);
  }
}
