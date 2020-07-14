import { Injectable } from '@nestjs/common';
import { ScraperService } from './scraper/scraper.service';
import { TweetsStorage } from './storage/tweets.storage';

@Injectable()
export class AppService {

  constructor(private scraperService: ScraperService, private storageService: TweetsStorage) {
    process.nextTick(() => scraperService.start())
  }


}
