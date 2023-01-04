export function scrollBottomTweet() {
  const articles = Array.from(document.querySelectorAll('article'));
  //console.log(articles.length);
  if (articles.length > 0) {
    const button = articles.slice(-1)[0].querySelector('button');
    //console.log(button);
    if (button !== null) {
      button.scrollIntoView({ behavior: 'smooth', block: 'start', });
    }
  }
}
