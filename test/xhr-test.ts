import { parse } from '../src/parser/XHRTweetParser';
import { Tweet, User } from '../src/types/tweets';
import { readFileSync } from 'fs';


let all = readFileSync('../twitter.response.sample/all.json');
let home = readFileSync('../twitter.response.sample/home_latest.json');

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

let allTweets = parse(JSON.parse(all.toString()));
console.log(JSON.stringify(allTweets, null, " "));
let homeTweets = parse(JSON.parse(home.toString()));
console.log(JSON.stringify(homeTweets, null, " "));
