/**
 * ESPN's variant of a team logo made for dark backgrounds, or the same URL if
 * the pattern isn't recognised. The normal logo stays in the data for the
 * light theme.
 */
export function darkLogo(url: string): string {
  // ESPN's dark Jets logo is a "JETS" wordmark that looks out of place.
  if (/\/nfl\/500\/scoreboard\/nyj\.png$/.test(url)) return url
  return url
    .replace(/\/teamlogos\/nfl\/500\/scoreboard\//, '/teamlogos/nfl/500-dark/')
    .replace(/\/teamlogos\/ncaa\/500\//, '/teamlogos/ncaa/500-dark/')
}
