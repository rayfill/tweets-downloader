// see also
// timeline: https://developer.twitter.com/en/docs/twitter-api/v1/tweets/timelines/api-reference/get-statuses-home_timeline
// user: https://developer.twitter.com/en/docs/twitter-api/v1/data-dictionary/object-model/user

export type Range = [number, number];

export interface Rect {
  x: number;
  y: number;
  h: number;
  w: number;
};

export interface Size {
  w: number;
  h: number;
  resize: 'crop' | 'fit';
};

export type SizeTypeKey = 'thumb' | 'small' | 'large' | 'medium';
export type SizeType = {
  [key in SizeTypeKey]: Size;
};
export interface OriginalInfo {
  width: number;
  height: number;
  forcus_rects?: Array<Rect>;
};

export interface Variant {
  bitrate?: number;
  content_type: string;
  url: string;
};

export interface VideoInfo {
  aspect_ratio: [ number, number ];
  duration_millis: number;
  variants: Array<Variant>;
};

export interface Medium {
  id?: number,
  id_str: string;
  indices: [number, number];
  media_url: string;
  media_url_https: string;
  url: string;
  display_url: string;
  expanded_url: string;
  type: 'photo' | 'animated_gif' | 'video';
  original_info: OriginalInfo;
  video_info?: VideoInfo;
  sizes: SizeType;
  features: {
    [key in 'orig' | 'large' | 'small' | 'medium']: { faces: Array<any> }
  };
};

export interface Entries {
  hashtags: Array<any>;
  symbols: Array<any>;
  user_mentions: Array<any>;
  urls: Array<string>;
  media?: Array<Medium>;
};

export interface ExtendedEntities {
  media: Array<Medium>;
}

export interface GlobalTweet {
  created_at: string;
  id: number;
  id_str: string;
  full_text: string;
  truncated: boolean;
  display_text_range: Range;
  entries: Entries;
  extended_entities: ExtendedEntities;
  source: string;
  in_reply_to_status_id: number | null;
  in_reply_to_status_id_str: string | null;
  in_reply_to_user_id: number | null;
  in_reply_to_user_id_str: string | null;
  in_reply_to_screen_name: any;
  user_id: number;
  user_id_str: string;
  geo: any;
  coordinates: any
  place: any;
  contributors: any
  retweeted_status_id: number | null;
  retweeted_status_id_str: string | null;
  is_quote_status: boolean;
  retweet_count: number;
};

export interface Notifications {
  [key: string]: GlobalTweet
};

export interface Tweets {
  [key: string]: GlobalTweet;
};

export interface Users {
  [key: string]: User
};

export interface User {
  id: number;
  id_str: string;
  name: string;
  screen_name: string;
  description: string | null;
  url: string | null;
  entities: {
    url?: {
      urls: Array<{
        url: string;
        expanded_url: string;
        display_url: string;
        indices: [number, number]
      }>
    }
  };
  protected: boolean;
  floowers_count: number;
  friends_count: number;
  listed_count: number;
  created_at: string;
  favourites_count: number;
  utc_offset: any;
  time_zone: any;
  geo_enabled: boolean;
  verified: boolean;
};

export interface GlobalObjects {
  notifications: Notifications;
  tweets: Tweets;
  users: Users;
};

export interface Tweet {
  id: string;
  displayType: string;
  minSpacing: number;
};

export interface SubContent {
  tweet: Tweet;
};

export type Base64String = string;

export interface TimelinesDetails {
  injectionType: string;
  controllerData: Base64String;
};

export interface Details {
  timelinesDetails: TimelinesDetails;
};

export interface ClientEventInfo {
  component: string;
  details: Details;
};

export interface Item {
  content: SubContent;
  clientEventInfo: ClientEventInfo;
};

export interface Content {
  item: Item
};

export interface Entry {
  entryId: string;
  sortIndex: string;
  content: Content;
};

export interface AddEntries {
  entries: Array<Entry>
};

export interface RemoveEntries {};
export interface ClearEntriesUnreadState {};
export interface ClearCache {};
export interface MarkEntriesUnreadGreaterThanSortIndex {};

export interface Instruction {
  addEntries?: AddEntries;
  removeEntries?: RemoveEntries;
  clearEntriesUnreadState?: ClearEntriesUnreadState;
  clearCache?: ClearCache;
  markEntriesUnreadGreaterThanSortIndex?: MarkEntriesUnreadGreaterThanSortIndex;
};

export interface ResponseObjects {
  feedbackActions: unknown;
};

export interface Timeline {
  id: string;
  instructions: Array<Instruction>;
  responseObjects?: ResponseObjects;
}

export interface XHRTweetObject {
  globalObjects: GlobalObjects;
  timeline: Timeline;
};
