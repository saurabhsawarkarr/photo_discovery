import { BaseCollector } from './base';
import { CollectionOptions, CollectionResult } from './interfaces';
import { SOURCES } from '../shared/constants';
// @ts-ignore
import gplay from 'google-play-scraper';

export class GooglePlayCollector extends BaseCollector {
  public readonly sourceName = SOURCES.GOOGLE_PLAY;
  private readonly appId = 'com.google.android.apps.photos';

  async testConnection(): Promise<boolean> {
    try {
      const appDetails = await gplay.app({ appId: this.appId });
      return !!appDetails;
    } catch (error) {
      return false;
    }
  }

  protected async fetchBatch(options: CollectionOptions): Promise<CollectionResult> {
    const batchSize = options.batchSize || 100;
    // gplay scraper uses pagination tokens
    const nextPaginationToken = options.cursor;

    const gplayOptions: any = {
      appId: this.appId,
      sort: 2, // 2 is NEWEST
      num: batchSize,
      paginate: true,
    };

    if (nextPaginationToken) {
      gplayOptions.nextPaginationToken = nextPaginationToken;
    }

    const response = await gplay.reviews(gplayOptions);
    const reviews = response.data || [];
    const newCursor = response.nextPaginationToken;

    const records = reviews.map((review: any) => {
      // In gplay scraper, URL to the specific review is often generated based on ID
      const reviewUrl = review.url || `https://play.google.com/store/apps/details?id=${this.appId}&reviewId=${review.id}`;
      
      return this.createRawRecord(
        review.text,
        reviewUrl,
        new Date(review.date),
        review.score,
        {
          reviewerName: review.userName,
          thumbsUp: review.thumbsUp,
          replyText: review.replyText,
          replyDate: review.replyDate
        },
        { 
          reviewId: review.id, 
          appVersion: review.version 
        }
      );
    });

    // Random delay to avoid rate limits
    await this.sleep(1000 + Math.random() * 1000);

    return {
      records,
      nextCursor: newCursor,
      hasMore: !!newCursor,
      totalCollected: records.length
    };
  }
}
