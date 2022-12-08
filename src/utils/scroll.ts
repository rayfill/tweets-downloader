export function scrollBottomTweet() {
  const articles = Array.from(document.querySelectorAll('article'));
  if (articles.length > 0) {
    articles.slice(-1)[0].scrollIntoView({ behavior: 'smooth' });
  }
}
