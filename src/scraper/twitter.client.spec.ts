import { Test, TestingModule } from '@nestjs/testing';
import { TwitterClient } from './twitter.client';
import { AppModule } from '../app.module';
import { Logger } from '@nestjs/common';

describe('TwitterClient', () => {
  let service: TwitterClient;
  const logger = new Logger('TwitterClientTest', false)


  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [TwitterClient],
    }).compile();
    Logger.overrideLogger(['verbose']);
    service = module.get<TwitterClient>(TwitterClient);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should init client', async () => {
    await service.initClientIfNeeded();
    expect(service.client).toBeDefined();
  });

  test('Simple search', async () => {
    jest.setTimeout(6000000)
    const ONE = BigInt(1);
    const topics = ['war and peace', 'trump'];
    const response = await service.search( topics);
    const tweets = response.tweets;

    let backward = response;
    while (backward.stats.hasMore) {
      backward = await service.search( topics, { afterId: backward.stats.maxId.toString()});
      logger.verbose(`loading more older tweets`)
      // tweets.unshift(...backward.tweets)
    }
    let forward = response;
    while (forward.stats.hasMore) {
      forward = await service.search( topics,  {beforeId: (forward.stats.minId - ONE).toString()});
      tweets.push(...forward.tweets)
    }

    tweets.forEach(s => {
      logger.verbose(`${s._id}: ${s.user.screen_name} => ${s.text}`)
    })
    logger.verbose(`total: ${tweets.length}`)

  });

});
