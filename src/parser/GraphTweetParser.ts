import { GraphData as Graph, Data, Entry, ItemContent } from '../types/graphql';
import { Tweet, TweetMedia } from '../types/tweets';

function getItemContent(entry: Entry): Array<ItemContent> {
  const result: Array<ItemContent> = [];

  if (entry.content.itemContent !== undefined) {
    result.push(entry.content.itemContent);
  } else if (entry.content.items !== undefined) {
    entry.content.items.forEach((item) => {
      result.push(item.item.itemContent);
    });
  }

  return result;
}

function parseEntry(entry: Entry): Array<Tweet> {

  const result: Array<Tweet> = [];
  const itemContents = getItemContent(entry);
  if (itemContents.length === 0) {
    return result;
  }

  itemContents.forEach((itemContent) => {

    let tweet_results = itemContent.tweet_results;
    if (tweet_results === undefined ||
      tweet_results.result === undefined) {
      return;
    }
    //console.log('tweet', itemContent);

    const userResult = tweet_results.result.__typename === 'Tweet' ? tweet_results.result.core.user_results.result : tweet_results.result.tweet.core.user_results.result;
    const legacyRef = tweet_results.result.__typename === 'Tweet' ? tweet_results.result.legacy : tweet_results.result.tweet.legacy;
    const tweet_id_str = legacyRef.id_str;
    const user_id_str = userResult.rest_id;
    const display_name = userResult.core.name;

    let media = Array<TweetMedia>();
    if (legacyRef.extended_entities !== undefined) {
      for (let medium of legacyRef.extended_entities.media) {
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
        name: display_name,
        screen_name: display_name,
        description: '',
        url: ''
      },
      id: parseInt(tweet_id_str),
      id_str: tweet_id_str,
      user_id: parseInt(user_id_str),
      user_id_str: user_id_str,
      full_text: legacyRef.full_text,
      media: media
    };

    result.push(tweet);
  });


  return result;
}

function parseData(data: Data): Array<Tweet> {

  let results = new Array<Tweet>();

  if (data.type === 'TimelinePinEntry') {
    let mayBeTweet = parseEntry(data.entry);
    if (mayBeTweet !== undefined) {
      results = results.concat(mayBeTweet);
    }
  }

  if (data.type === 'TimelineAddEntries') {
    for (let entry of data.entries) {
      let mayBeTweet = parseEntry(entry);
      if (mayBeTweet !== undefined) {
        results = results.concat(mayBeTweet);
      }
    }
  }

  return results;
}

export function parse(json: Graph): Array<Tweet> {
  let results = new Array<Tweet>();

  if (json.data.user !== undefined) {
    if (json.data.user.result.timeline !== undefined) {
      for (let data of json.data.user.result.timeline.timeline.instructions) {
        let tweets = parseData(data);
        if (tweets.length > 0) {
          results = results.concat(tweets);
        }
      }
    }
    if (json.data.user.result.timeline_v2 !== undefined) {
      for (let data of json.data.user.result.timeline_v2.timeline.instructions) {
        let tweets = parseData(data);
        if (tweets.length > 0) {
          results = results.concat(tweets);
        }
      }
    }
  }

  if (json.data.home !== undefined) {
    for (let data of json.data.home.home_timeline_urt.instructions) {
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

  if (json.data.threaded_conversation_with_injections_v2 !== undefined) {
    for (let data of json.data.threaded_conversation_with_injections_v2.instructions) {
      let tweets = parseData(data);
      if (tweets.length > 0) {
        results = results.concat(tweets);
      }
    }
  }

  const timeline = json.data.bookmark_timeline ?? json.data.bookmark_timeline_v2;
  if (timeline !== undefined) {
    const instructions = timeline.timeline.instructions;
    for (let data of instructions) {
      let tweets = parseData(data);
      if (tweets.length > 0) {
        results = results.concat(tweets);
      }
    }
  }

  if (json.data.list?.tweets_timeline.timeline !== undefined) {
    for (let data of json.data.list.tweets_timeline.timeline.instructions) {
      let tweets = parseData(data);
      if (tweets.length > 0) {
        results = results.concat(tweets);
      }
    }
  }

  return results;
}
