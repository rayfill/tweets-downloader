import { GraphData as Graph, Data } from '../types/graphql';
import { Tweet, TweetMedia } from '../types/tweets';

function parseData(data: Data): Tweet | undefined {

  if (data.type !== 'TimelineAddEntries') {
    return undefined;
  }

  for (let entry of data.entries) {
    if (entry.content.entryType !== 'TimelineTimelineItem') {
      continue;
    }

    if (entry.content.itemContent.itemType !== 'TimelineTweet') {
      continue;
    }

    let tweet_results = entry.content.itemContent.tweet_results;
    if (tweet_results.result.__typename !== 'Tweet') {
      continue;
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
}

export function parse(json: Graph): Array<Tweet> {
  let results = new Array<Tweet>();

  if (json.data.user !== undefined) {
    for (let data of json.data.user.result.timeline.timeline.instructions) {
      let tweet = parseData(data);
      if (tweet != undefined) {
        results.push(tweet);
      }
    }
  }

  if (json.data.threaded_conversation_with_injections !== undefined) {
    for (let data of json.data.threaded_conversation_with_injections.instructions) {
      let tweet = parseData(data);
      if (tweet !== undefined) {
        results.push(tweet);
      }
    }
  }

  return results;
}
