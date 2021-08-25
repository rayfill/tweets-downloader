import { parse } from '../src/parser/GraphTweetParser';
import { readFileSync } from 'fs';


let graph1 = readFileSync('../twitter.response.sample/TweetDetail.json');
let graph2 = readFileSync('../twitter.response.sample/TweetDetail2.json');
let graph3 = readFileSync('../twitter.response.sample/TweetDetail3.json');
let graph4 = readFileSync('../twitter.response.sample/TweetDetail4.json');


console.log(JSON.stringify(parse(JSON.parse(graph1.toString())), null, " "));
console.log(JSON.stringify(parse(JSON.parse(graph2.toString())), null, " "));
console.log(JSON.stringify(parse(JSON.parse(graph3.toString())), null, " "));
console.log(JSON.stringify(parse(JSON.parse(graph4.toString())), null, " "));
