import { ISourceCollector } from './interfaces';
import { GooglePlayCollector } from './google-play';
import { AppStoreCollector } from './app-store';
import { RedditCollector } from './reddit';
import { YouTubeCollector } from './youtube';
import { GoogleCommunityCollector } from './google-community';
import { SOURCES } from '../shared/constants';

export class CollectorRegistry {
  private collectors: Map<string, ISourceCollector> = new Map();

  constructor() {
    this.register(new GooglePlayCollector());
    this.register(new AppStoreCollector());
    this.register(new RedditCollector());
    this.register(new YouTubeCollector());
    this.register(new GoogleCommunityCollector());
  }

  public register(collector: ISourceCollector): void {
    this.collectors.set(collector.sourceName, collector);
  }

  public get(sourceName: string): ISourceCollector {
    const collector = this.collectors.get(sourceName);
    if (!collector) {
      throw new Error(`Collector for source '${sourceName}' not found.`);
    }
    return collector;
  }

  public getAll(): ISourceCollector[] {
    return Array.from(this.collectors.values());
  }
}

// Singleton instance
export const registry = new CollectorRegistry();
