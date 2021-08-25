import { XHRTweetObject as xhr, Users, User as xhrUser, Tweets, GlobalTweet, Medium, Entries, ExtendedEntities, VideoInfo, Variant } from '../types/xhr';
import { User, Tweet, TweetMedia } from '../types/tweets';

function parse_user(user: xhrUser): User {

  let url = user.entities.url != undefined ? user.entities.url.urls[0].expanded_url : undefined;
  let result: User = {
    id: user.id,
    id_str: user.id_str,
    name: user.name,
    screen_name: user.screen_name,
    description: user.description ? user.description : undefined,
    url: url
  }
  return result;
}

function parse_users(users: Users): Array<User> {
  let results = new Array<User>();

  for (let key of Object.keys(users)) {
    let user = users[key];
    results.push(parse_user(user));
  }
  return results;
}

interface resource_info {
  url: string;
  mime_type: string;
  extension: string;
};

function resource_info(vinfo: VideoInfo): TweetMedia {
  let candidate = vinfo.variants.filter((variant) => {
    return variant.bitrate !== undefined;
  }).reduce((acc: Variant | undefined, cur: Variant): Variant => {
    if (acc === undefined || cur.bitrate! > acc.bitrate!) {
      return cur;
    }
    return acc;
  }, undefined);

  return {
    media_type: 'video',
    url: candidate!.url,
    metadata: candidate!.content_type
  };
}

function parse_medium(medium: Medium): TweetMedia {
  if (medium.type !== 'photo') {
    return resource_info(medium.video_info!);
  }
  let result: TweetMedia = {
    media_type: medium.type,
    url: medium.media_url_https,
  };

  return result;
}

function parse_entries(entries?: Entries): Array<TweetMedia> {
  let results = new Array<TweetMedia>();

  if (entries !== undefined && entries.media !== undefined) {
    for (let medium of entries.media) {
      results.push(parse_medium(medium));
    }
  }
  return results;
}

function parse_extended_entries(entries?: ExtendedEntities): Array<TweetMedia> {
  let results = new Array<TweetMedia>();

  if (entries !== undefined) {
    for (let medium of entries.media) {
      results.push(parse_medium(medium));
    }
  }
  return results;
}

function parse_tweet(tweet: GlobalTweet): Tweet {

  let result: Tweet = {
    user: undefined as unknown as User,
    id: tweet.id,
    id_str: tweet.id_str,
    user_id: tweet.user_id,
    user_id_str: tweet.user_id_str,
    full_text: tweet.full_text,
    retweet_id_str: tweet.retweeted_status_id_str ? tweet.retweeted_status_id_str : undefined,
    media: parse_extended_entries(tweet.extended_entities)
  };

  return result;
}

function parse_tweets(tweets: Tweets): Array<Tweet> {
  let results = new Array<Tweet>();

  for (let key of Object.keys(tweets as any)) {
    let tweet = tweets[key];
    results.push(parse_tweet(tweet));
  }
  return results;
}

function injectUser(tweets: Array<Tweet>, users: Array<User>): Array<Tweet> {
  let userMap = new Map<string, User>();
  users.forEach((user) => {
    userMap.set(user.id_str, user);
  });

  return tweets.map((tweet) => {
    let result = tweet;
    result.user = userMap.get(tweet.user_id_str)!;
    return result;
  });
}

export function parse(json: xhr): Array<Tweet> {

  let users: Array<User> = [];
  if (json.globalObjects.users !== undefined) {
    users = parse_users(json.globalObjects.users);
  }
  if (users.length === 0) {
    return [];
  }

  let tweets: Array<Tweet> = [];
  if (json.globalObjects.tweets !== undefined) {
    tweets = parse_tweets(json.globalObjects.tweets);
  }
  if (tweets.length === 0) {
    return [];
  }

  return injectUser(tweets, users);
}
