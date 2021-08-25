export interface User {
  id: number;
  id_str: string;
  name: string;
  screen_name: string;
  description?: string;
  url?: string;
}

export interface Metadata {
  bitrate?: number;
  content_type: string;
  url: string;
};

export interface TweetMedia {
  media_type: "photo" | "video" | "animated_gif";
  url: string;
  metadata?: any;
};

export interface Tweet {
  user: User;
  id: number;
  id_str: string;
  user_id: number;
  user_id_str: string;
  full_text: string;
  retweet_id_str?: string;
  media: Array<TweetMedia>;
};
