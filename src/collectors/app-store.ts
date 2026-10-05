import { BaseCollector } from './base';
import { CollectionOptions, CollectionResult } from './interfaces';
import { SOURCES } from '../shared/constants';
// @ts-ignore
import appStore from 'app-store-scraper';

export class AppStoreCollector extends BaseCollector {
  public readonly sourceName = SOURCES.APP_STORE;
  // Google Photos iOS App ID
  private readonly appId = '962194608'; 

  async testConnection(): Promise<boolean> {
    try {
      const appDetails = await appStore.app({ id: this.appId });
      return !!appDetails;
    } catch (error) {
      return false;
    }
  }

  protected async fetchBatch(options: CollectionOptions): Promise<CollectionResult> {
    // App store scraper uses page numbers, usually 1 to 10 max via RSS API
    const page = options.cursor ? parseInt(options.cursor, 10) : 1;
    
    // Safety limit since RSS API usually caps at 10 pages
    if (page > 10) {
      return { records: [], hasMore: false, totalCollected: 0 };
    }

    const reviews = await appStore.reviews({
      id: this.appId,
      sort: appStore.sort.RECENT,
      page: page
    });

    const records = reviews.map((review: any) => {
      // The App Store scraper provides a URL for the review
      const reviewUrl = review.url || `https://apps.apple.com/app/id${this.appId}?action=write-review`;
      
      const fullText = review.title ? `${review.title}\n\n${review.text}` : review.text;

      return this.createRawRecord(
        fullText,
        reviewUrl,
        new Date(review.updated || review.date), // Different versions return different fields
        review.score,
        {
          author: review.userName,
          version: review.version,
          title: review.title
        },
        { reviewId: review.id }
      );
    });

    await this.sleep(1000); // Respect rate limits

    return {
      records,
      nextCursor: records.length > 0 ? (page + 1).toString() : undefined,
      hasMore: records.length > 0 && page < 10,
      totalCollected: records.length
    };
  }
}
