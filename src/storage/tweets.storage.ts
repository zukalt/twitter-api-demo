import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TweetsRangeStats, Tweet } from '../model/interfaces';
import { Connection, EntityManager } from 'typeorm';
import { TweetEntity } from './tweet.entity';
import { TopicsEntity } from './topics.entity';

const TOPIC_AGG_INTERVAL = 60000;

@Injectable()
export class TweetsStorage {
  em: EntityManager;
  logger = new Logger(TweetsStorage.name);
  topics: string[];

  constructor(config: ConfigService, private mongo: Connection) {
    this.topics = config.get('app.topics').map(t => t.toLowerCase()).sort();
    this.em = this.mongo.createEntityManager();
  }

  async mergeTweets(tweets: Tweet[], rangeStats: TweetsRangeStats) {
    const tweetRepo = this.mongo.getMongoRepository(TweetEntity);
    await tweetRepo.insertMany(tweets);

    // index tweets per topic
    const stats : {[key:number]: TopicsEntity} = {};
    tweets.forEach(tweet => {
      const text = tweet.text.toLowerCase();

      const id = (tweet.createdAt - tweet.createdAt  % TOPIC_AGG_INTERVAL);
      const entry: TopicsEntity = stats[id] = stats[id] || {_id: id, counts: {}}

      for (const topic of this.topics) {
        entry.counts[topic] =  (entry.counts[topic] || 0) + (text.includes(topic) ? 1 : 0)
      }
    })

    const topicsRepo = this.mongo.getMongoRepository(TopicsEntity)
    for (const [time,stat] of Object.entries(stats)) {
      const dbEntry = await topicsRepo.findOne({ _id: +time }) ;
      if (dbEntry) {
        for (const topic of this.topics) {
          stat.counts[topic] += (dbEntry.counts[topic] || 0)
        }
        await topicsRepo.replaceOne({ _id: time }, stat);
      }
      else {
        await topicsRepo.insert(stat)
      }
    }

  }

  async getMaxStoredId(): Promise<string> {
    const resp = await this.mongo.getMongoRepository(TweetEntity)
      .createCursor().sort({ _id: -1 }).limit(1);
    let id = '0';
    if (await resp.hasNext()) {
      id = (await resp.next())._id;
      await resp.close();
    }
    return id;
  }

  async getTopics(): Promise<string[]> {
    return this.topics;
  }

  async reIndex() {
    // TODO cache mapreduce calls for older intervals
  }


  async getOccurrenceReport(start: number, pageSize: number): Promise<TopicsEntity[]> {
    const query = {_id: {$gt: start}}
    return this.mongo
      .getMongoRepository(TopicsEntity)
      .createCursor(query)
      .limit(pageSize).toArray()
  }
}
