import { BaseCollector } from './base';
import { CollectionOptions, CollectionResult } from './interfaces';
import { SOURCES } from '../shared/constants';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execFileAsync = promisify(execFile);

export class RedditCollector extends BaseCollector {
  public readonly sourceName = SOURCES.REDDIT;

  private readonly queries = [
    "google photos search tips", 
    "find old photos google photos", 
    "google photos can't find", 
    "google photos AI search",
    "search doesn't work google photos"
  ];

  async testConnection(): Promise<boolean> {
    try {
      await execFileAsync('python', ['--version']);
      return true;
    } catch (error) {
      return false;
    }
  }

  protected async fetchBatch(options: CollectionOptions): Promise<CollectionResult> {
    const query = options.searchTerm || this.queries[Math.floor(Math.random() * this.queries.length)];
    const limit = options.batchSize || 25;
    
    const scriptPath = path.join(__dirname, 'scripts', 'reddit_scraper.py');
    const { stdout, stderr } = await execFileAsync('python', [scriptPath, query, limit.toString()], {
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer just in case
    });

    if (stderr) {
      console.warn(`Reddit Scraper Warnings: ${stderr}`);
    }

    const searchResults: any[] = JSON.parse(stdout);
    const records: import('../shared/types').RawRecord[] = [];

    for (const post of searchResults) {
      records.push(this.createRawRecord(
        post.text ? `${post.title}\n\n${post.text}` : post.title,
        post.url,
        new Date(), // we don't have accurate time from scraper, use now
        null,
        { author: post.author },
        { type: 'post', subreddit: 'unknown' }
      ));
    }

    return {
      records,
      hasMore: false, // script doesn't support pagination
      totalCollected: records.length
    };
  }
}
