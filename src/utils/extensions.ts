const extPattern = new RegExp('^.*[.]([^.?]+)(?:[?].*)?$');
export function extension(url: string): string {
  let match = extPattern.exec(url);
  if (match === null) {
    throw new TypeError(`ext pattern not found: ${url}`);
  }

  return match[1];
}
