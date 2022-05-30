export interface GraphData {
  data: {
    user?: {
      result: {
        timeline: {
          timeline: {
            instructions:  Array<Data>;
          }
        }
      }
    },
    bookmark_timeline?: {
      timeline: {
        instructions: Array<Data>;
      }
    },
    threaded_conversation_with_injections_v2?: {
      instructions: Array<Data>;
    },
    threaded_conversation_with_injections?: {
      instructions: Array<Data>;
    };
  };
};

interface DataTimelineAddEntries {
  type: 'TimelineAddEntries';
  entries: Array<Entry>;
}
interface DataTimelinePinEntry {
  type: 'TimelinePinEntry';
  entry: Entry;
}
interface DataAny {
  type: 'Timeline';
}

export type Data = DataTimelinePinEntry | DataTimelineAddEntries | DataAny;

export interface Entry {
  entryId: string;
  sortIndex: string;
  content: Content;
};

interface Content {
  entryType: string;
  itemContent?: ItemContent;
  items?: Array<Item>;
};

interface Item {
  entryId: string;
  item: {
    itemContent: ItemContent;
  };
  displayType: string;
  clientEventInfo: any;
};

export interface ItemContent {
  itemType: string;
  tweet_results: TweetResults;
  tweetDisplayType: string;
  hasModeratedReplies: boolean;
};

interface TweetResults {
  result: Result;
};

interface Result {
  __typename: string;
  rest_id: string;
  core: Core;
  legacy: Legacy;
};

interface Core {
  user_results: { result: User };
};

interface User {
  id: string;
  rest_id: string;
  affiliates_highlighted_label: any;
  legacy: UserLegacy;
};

interface UserLegacy {
  blocked_by: boolean;
  blocking: boolean;
  can_dm: boolean;
  can_media_tag: boolean;
  created_at: string;
  default_profile: boolean;
  default_profile_image: boolean;
  description: string;
  entities: {
    description: {
      urls: Array<Urls>;
    };
    url: {
      urls: Array<Urls>;
    }
  };
  fast_followers_count: number;
  favourites_count: number;
  follow_request_sent: boolean;
  followed_by: boolean;
  followers_count: number;
  following: boolean;
  friends_count: number;
  has_custom_timelines: boolean;
  is_translator: boolean;
  listed_count: number;
  location: string; //静岡在住。メタルが好きです。;
  media_count: number;
  muting: boolean;
  name: string; // ケースワベ【K-SUWABE】;
  normal_followers_count: number;
  notifications: boolean;
  pinned_tweet_ids_str: [number] | null;
  profile_banner_url: string | null; //https://pbs.twimg.com/profile_banners/66100180/1624264892;

  profile_image_url_https: string; // https://pbs.twimg.com/profile_images/1120216532833820672/j2OF8NCS_normal.png;
  profile_interstitial_type: string;
  protected: boolean;
  screen_name: string; //KSUWABE;
  statuses_count: number;
  translator_type: string; // none;
  url: string | null; // https://t.co/4tx6z0rl2k;
  verified: boolean;
  want_retweets: boolean;
  withheld_in_countries: Array<any>;
};

interface Urls {
  display_url: string;
  expanded_url: string; // "http://qc.commufa.jp",
  url: string; //"https://t.co/TiYk7n0nET",
  indices: [number, number]
};

interface Variant {
  bitrate?: number;
  content_type: string;
  url: string;
};

interface VideoInfo {
  aspect_ratio: [number, number];
  duration_millis: number;
  variants: Array<Variant>;
};

interface Media {
  display_url: string;
  expanded_url: string;
  id_str: string;
  indices: [number, number];
  media_url_https: string;
  type: string;
  url: string;
  original_info: {
    height: number,
    width: number,
  };
  video_info: VideoInfo;
};

interface Legacy {
  "created_at": string;
  "conversation_id_str": string;
  "display_text_range": [number, number],
  "entities": {
    media?: Array<Media>;
  },
  "extended_entities"?: {
    "media": Array<Media>;
  },
  "favorite_count": number,
  "favorited": boolean,
  "full_text": string,
  "is_quote_status": boolean,
  "lang": string | null,
  "possibly_sensitive": boolean,
  "possibly_sensitive_editable": boolean,
  "quote_count": number,
  "reply_count": number,
  "retweet_count": number,
  "retweeted": boolean
  "source": string | null,
  "user_id_str": string,
  "id_str": string,
  "self_thread": {
    "id_str": string
  } | null
};
