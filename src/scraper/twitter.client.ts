import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Twitter, { TwitterOptions } from 'twitter-lite';
import moment from 'moment';
import { Tweet } from '../model/interfaces';

export type SearchResult = {
  tweets: Tweet[],
  stats: {
    maxId: bigint,
    minId: bigint,
    maxTS: number,
    minTS: number,
    hasMore: boolean
  }
}

export type SearchOptions = {
  afterId?: string | bigint,
  beforeId?: string | bigint,
  asap?: boolean,
}

const MAX_POSSIBLE_SEARCH_RESULTS = 100;
const DEFAULT_SEARCH_PARAMS = {
  result_type: 'mixed',
  include_entities: true,
  count: MAX_POSSIBLE_SEARCH_RESULTS,
};
const twTime = timeStr => moment(timeStr, 'dd MMM DD HH:mm:ss ZZ YYYY', 'en').toDate().getTime();


@Injectable()
export class TwitterClient {

  consumer_key: string;
  consumer_secret: string;
  client: Twitter = null;
  logger = new Logger(TwitterClient.name)
  apiLimits = {
    nextWindowStarts: 0,
    availableCalls: 1,
    windowLimit: 450
  }

  constructor(config: ConfigService) {
    this.consumer_key = config.get('TWITTER_API_KEY');
    this.consumer_secret = config.get('TWITTER_API_SECRET');
  }

  async initClientIfNeeded() {
    if (this.client !== null) {
      return;
    }
    const options: TwitterOptions = {
      consumer_key: this.consumer_key,
      consumer_secret: this.consumer_secret,
    };
    const user = new Twitter(options);

    const response = await user.getBearerToken();
    this.client = new Twitter({
      ...options,
      bearer_token: response.access_token,
    });
  }

  async search(topics: string[], options: SearchOptions = {asap: true}) {
    await this.initClientIfNeeded();
    const searchParams: any = {
      ...DEFAULT_SEARCH_PARAMS,
      q: topics.sort().map(t => `"${t}"`).join(' OR '),
    };
    if (options.afterId) {
      searchParams.since_id = options.afterId.toString();
    }
    if (options.beforeId) {
      searchParams.max_id = options.beforeId.toString();
    }
    return this._search(searchParams, options.asap);
  }

  _search(searchParams, asap = true): Promise<SearchResult> {
    return new Promise((resolve, reject) => {
      const load = async () => {
        try {
          const response = await this.client.get('search/tweets', searchParams);
          this.updateRateLimits(response._headers);

          let maxId: BigInt,minId: BigInt,maxTS: number,minTS: number;
          if (response.statuses.length > 0) {
            minId = maxId = BigInt(response.statuses[0].id_str)
            maxTS = minTS = twTime(response.statuses[0].created_at)
          }

          const hasMore = response.statuses.length === MAX_POSSIBLE_SEARCH_RESULTS;
          // const tweets = [];
          response.statuses.forEach(status => {
            let id = BigInt(status.id_str) ;
            const createdAt = twTime(status.created_at);
            if (minId > id) {
              minId = id;
            }
            if (maxId < id) {
              maxId = id;
            }
            if (minTS > createdAt) {
              minTS  = createdAt;
            }
            if (maxTS < createdAt) {
              maxTS  = createdAt;
            }

            delete status.id;
            status._id = id.toString()
            status.createdAt = createdAt;
          })

          resolve({
            tweets: response.statuses,
            stats: {
             // @ts-ignore
              maxId, minId, maxTS, minTS, hasMore
            }
          })

        } catch (e) {
          if ('errors' in e && e.errors[0].code === 88) {
            this.updateRateLimits(e._headers);
            this.scheduleApiCall(load, false);
          } else {
            reject(e);
          }
        }
      };

      this.scheduleApiCall(load, asap)

    });

  }

  private updateRateLimits(headers) {
    this.apiLimits.availableCalls = +headers.get('x-rate-limit-remaining');
    this.apiLimits.nextWindowStarts = headers.get('x-rate-limit-reset') * 1000;
    this.apiLimits.windowLimit = +headers.get('x-rate-limit-limit');
  }

  private scheduleApiCall(callFunc, asap = false) {
    if (this.apiLimits.availableCalls > 0) {
      if (asap) {
        this.logger.log(`Fast pace api call`)
        callFunc();
      }
      else {
        const wait = Math.max(0,this.apiLimits.nextWindowStarts - Date.now())  / this.apiLimits.availableCalls;
        this.logger.log(`Next API call after ${Math.round(wait/1000)} sec`)
        setTimeout(callFunc, Math.ceil(wait))
      }
    }
    else {
      const wait = Math.max(0,this.apiLimits.nextWindowStarts - Date.now()) ;
      this.logger.warn(`API rate limit reached, next attempt after ${Math.round(wait/1000)} seconds`)
      setTimeout(callFunc, wait);
    }
  }
}
