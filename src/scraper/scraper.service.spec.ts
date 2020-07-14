import { Test, TestingModule } from '@nestjs/testing';
import { TwitterClient } from './twitter.client';
import { AppModule } from '../app.module';
import { Logger } from '@nestjs/common';
import { TweetsStorage } from '../storage/tweets.storage';
import { ScraperService } from './scraper.service';

describe('ScraperService', () => {
  let service: ScraperService;
  let storage: TweetsStorage;

  const logger = new Logger('ScraperService_TEST', true)


  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [TwitterClient, ScraperService, TweetsStorage],
    }).compile();

    // module.useLogger(console)
    Logger.overrideLogger(['verbose']);

    service = module.get<ScraperService>(ScraperService);
    storage = module.get<TweetsStorage>(TweetsStorage);
  });

  test('Test One step forward n steps back approach', async () => {
    jest.setTimeout(6000000);

    jest.spyOn(storage, 'getTopics').mockImplementation( async () => ["war and peace"])
    jest.spyOn(storage, 'getMaxStoredId').mockImplementation( async () => "100")
    jest.spyOn(storage, 'reIndex').mockImplementation( async () => {

    })

    jest.spyOn(storage, 'mergeTweets').mockImplementation( async (tweets, stats) => {
      logger.verbose(tweets)
      logger.verbose(stats)
    })

    await service.start() ;
    await service.stop();

  });

});
