import { Injectable } from '@nestjs/common';
import { TwitterClient } from './twitter.client';
import { TweetsStorage } from '../storage/tweets.storage';

const ONE = BigInt(1);

const rangeStats = result => ({
  minId: result.stats.minId.toString(),
  maxId: result.stats.maxId.toString(),
  maxTime: result.stats.maxTS,
  minTime: result.stats.minTS,
});

@Injectable()
export class ScraperService {

  stopListeners = [];
  running = false;

  constructor(private twitterClient: TwitterClient,
              private tweetsStorage: TweetsStorage) {
  }

  async start() {
    const maxId = await this.tweetsStorage.getMaxStoredId();
    const topics = await this.tweetsStorage.getTopics();
    this.running = true;
    process.nextTick(() => this.scanTopics(topics, maxId || '0'));
  }

  async stop() {
    return new Promise(resolve => {
      this.stopListeners.push(resolve);
    });
  }

  async scanTopics(topics: string[], maxStoredId: string) {

    const currentStepMaxId = BigInt(maxStoredId);

    // search as of now
    let result = await this.twitterClient.search(topics, { afterId: maxStoredId, asap: false });

    // if nothing loaded, try again later
    if (result.tweets.length === 0) {
      return process.nextTick(() => this.scanTopics(topics, maxStoredId));
    }

    // save loaded max id for next iteration
    const nextMaxStoredId = result.stats.maxId.toString();

    // save loaded tweets
    await this.tweetsStorage.mergeTweets(result.tweets, rangeStats(result));

    // load all pages of data between `maxStoredId` and `minId` of previous response
    while (result.stats.minId > currentStepMaxId && result.stats.hasMore) {
      result = await this.twitterClient.search(
        topics,
        { afterId: currentStepMaxId, beforeId: result.stats.minId - ONE, asap: true },
      );

      if (result.tweets.length > 0) {
        await this.tweetsStorage.mergeTweets(result.tweets, rangeStats(result));
      }
    }

    if (!this.isStopRequested()) {
      await this.tweetsStorage.reIndex()
      process.nextTick(() => this.scanTopics(topics, nextMaxStoredId));
    } else {
      this.notifyStopped();
    }
  }

  private isStopRequested() {
    return this.stopListeners.length > 0;
  }

  private notifyStopped() {
    this.running = false;
    while (this.stopListeners.length > 0) {
      process.nextTick(this.stopListeners.shift());
    }
  }

}
