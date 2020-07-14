import { Injectable } from '@nestjs/common';
import { ScraperService } from './scraper/scraper.service';
import { TweetsStorage } from './storage/tweets.storage';
import { TopicsEntity } from './storage/topics.entity';

@Injectable()
export class AppService {

  constructor(private scraperService: ScraperService, private storageService: TweetsStorage) {
    process.nextTick(() => scraperService.start())
  }


  async getOccurrenceReport(start: number, pageSize: number): Promise<TopicsEntity[]> {
    return this.storageService.getOccurrenceReport(start, pageSize);
  }


}
