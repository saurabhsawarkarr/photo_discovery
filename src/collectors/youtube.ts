import { BaseCollector } from './base';
import { CollectionOptions, CollectionResult } from './interfaces';
import { SOURCES } from '../shared/constants';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execFileAsync = promisify(execFile);

export class YouTubeCollector extends BaseCollector {
  public readonly sourceName = SOURCES.YOUTUBE;

  private readonly queries = [
    "google photos search tips", 
    "find old photos google photos", 
    "google photos can't find", 
    "google photos AI search"
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
    const limit = options.batchSize || 10;
    
    const scriptPath = path.join(__dirname, 'scripts', 'youtube_scraper.py');
    const { stdout, stderr } = await execFileAsync('python', [scriptPath, query, '5', limit.toString()], {
      maxBuffer: 1024 * 1024 * 10
    });

    if (stderr) {
      console.warn(`YouTube Scraper Warnings: ${stderr}`);
    }

    const comments: any[] = JSON.parse(stdout);
    const records: import('../shared/types').RawRecord[] = [];

    for (const comment of comments) {
      records.push(this.createRawRecord(
        comment.comment_text,
        `https://www.youtube.com/watch?v=${comment.video_id}`,
        new Date(), // we don't have accurate parsed time from scraper
        null, // No rating
        { 
          author: comment.author,
          votes: comment.votes
        },
        { 
          videoId: comment.video_id, 
          videoTitle: comment.video_title,
        }
      ));
    }

    return {
      records,
      hasMore: false,
      totalCollected: records.length
    };
  }
}
