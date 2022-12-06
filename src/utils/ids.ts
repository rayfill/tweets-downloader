const pattern = new RegExp('^(?:https://twitter.com)?/(?:[^/]+)/status/([0-9]+)(?:(?:[?]|\/).*)?$');
export function getId(link: string): string | undefined {
  let match = pattern.exec(link);
  if (match !== null) {
    return match[1];
  }
  return undefined;
}
