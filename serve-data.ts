import express from 'express';
import fs from 'fs';
import path from 'path';

const app = express();
const port = 3333;

app.get('/', (req, res) => {
  let reviews = [];
  try {
    const data = fs.readFileSync(path.join(__dirname, 'relevant_reviews.json'), 'utf8');
    reviews = JSON.parse(data);
  } catch (error) {
    return res.status(500).send('Could not load relevant_reviews.json');
  }

  // Show only the first 100 to avoid crashing the browser with 17k rows at once
  const displayLimit = 500;
  const displayReviews = reviews.slice(0, displayLimit);

  let html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Cleaned & Filtered Reviews</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 20px; background: #f4f4f9; color: #333; }
        h1 { color: #111; }
        p.stats { font-size: 1.1em; color: #555; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        th, td { text-align: left; padding: 12px 15px; border-bottom: 1px solid #ddd; }
        th { background-color: #2c3e50; color: #fff; position: sticky; top: 0; }
        tr:hover { background-color: #f1f1f1; }
        .rating { font-weight: bold; color: #f39c12; }
      </style>
    </head>
    <body>
      <h1>Pipeline Results: Cleaned & Filtered Reviews</h1>
      <p class="stats">Showing the first <strong>${displayLimit}</strong> out of <strong>${reviews.length}</strong> potentially relevant reviews ready for the LLM.</p>
      <table>
        <thead>
          <tr>
            <th style="width: 5%">#</th>
            <th style="width: 10%">Region</th>
            <th style="width: 10%">Rating</th>
            <th style="width: 75%">Cleaned Review Text</th>
          </tr>
        </thead>
        <tbody>
  `;

  displayReviews.forEach((r: any, index: number) => {
    html += `
          <tr>
            <td>${index + 1}</td>
            <td>${(r.region || 'Unknown').toUpperCase()}</td>
            <td class="rating">${r.rating} Stars</td>
            <td>${r.cleaned_text}</td>
          </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </body>
    </html>
  `;

  res.send(html);
});

app.listen(port, () => {
  console.log(`\nLocal data viewer is running!`);
  console.log(`Click here to view the cleaned data: http://localhost:${port}`);
});
