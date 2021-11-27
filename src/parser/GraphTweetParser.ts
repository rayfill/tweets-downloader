import { GraphData as Graph, Data, Entry } from '../types/graphql';
import { Tweet, TweetMedia } from '../types/tweets';

function parseEntry(entry: Entry): Tweet | undefined {

  if (entry.content.itemContent === undefined ||
    entry.content.itemContent.itemType !== 'TimelineTweet') {
    return undefined;
  }

  let tweet_results = entry.content.itemContent.tweet_results;
  if (tweet_results.result.__typename !== 'Tweet') {
    undefined;
  }

  const tweetRef = tweet_results.result;
  const userRef = tweet_results.result.core.user_results.result;
  const tweet_id_str = tweetRef.rest_id;
  const user_id_str = userRef.rest_id;

  let url = userRef.legacy.entities.description.urls.length > 0 ? userRef.legacy.entities.description.urls[0].expanded_url : undefined;

  let media = Array<TweetMedia>();
  if (tweetRef.legacy.extended_entities !== undefined) {
    for (let medium of tweetRef.legacy.extended_entities.media) {
      if (medium.type === 'photo') {
        media.push({
          media_type: "photo",
          url: medium.media_url_https,
        });
      } else if (['animated_gif', 'video'].includes(medium.type)) {
        let mediumInfo = medium.video_info.variants.filter((variant) => {
          return variant.bitrate !== undefined;
        }).sort((rhs, lhs) => {
          if (rhs.bitrate! > lhs.bitrate!) {
            return -1;
          } else if (rhs.bitrate! < lhs.bitrate!) {
            return 1;
          }
          return 0;
        })[0];
        media.push({
          media_type: medium.type as 'animated_gif' | 'video',
          url: mediumInfo.url,
          metadata: mediumInfo.content_type
        });
      } else {
        throw new TypeError(`unknown media type: ${medium.type}`);
      }
    }
  }

  let tweet: Tweet = {
    user: {
      id: parseInt(user_id_str),
      id_str: user_id_str,
      name: userRef.legacy.name,
      screen_name: userRef.legacy.screen_name,
      description: userRef.legacy.description,
      url: url
    },
    id: parseInt(tweet_id_str),
    id_str: tweet_id_str,
    user_id: parseInt(user_id_str),
    user_id_str: user_id_str,
    full_text: tweetRef.legacy.full_text,
    media: media
  };

  console.log(`tweet id: ${tweet.id_str}`);
  return tweet;
}

function parseData(data: Data): Array<Tweet> {

  let results = new Array<Tweet>();

  if (data.type === 'TimelinePinEntry') {
    let mayBeTweet = parseEntry(data.entry);
    if (mayBeTweet !== undefined) {
      results.push(mayBeTweet);
    }
  }

  if (data.type === 'TimelineAddEntries') {
    for (let entry of data.entries) {
      let mayBeTweet = parseEntry(entry);
      if (mayBeTweet != undefined) {
        results.push(mayBeTweet);
      }
    }
  }

  return results;
}

export function parse(json: Graph): Array<Tweet> {
  let results = new Array<Tweet>();

  if (json.data.user !== undefined) {
    for (let data of json.data.user.result.timeline.timeline.instructions) {
      let tweets = parseData(data);
      if (tweets.length > 0) {
        results = results.concat(tweets);
      }
    }
  }

  if (json.data.threaded_conversation_with_injections !== undefined) {
    for (let data of json.data.threaded_conversation_with_injections.instructions) {
      let tweets = parseData(data);
      if (tweets.length > 0) {
        results = results.concat(tweets);
      }
    }
  }

  return results;
}
