/**
 * ESPN's variant of a team logo made for dark backgrounds, or the same URL if
 * the pattern isn't recognised. The normal logo stays in the data for the
 * light theme.
 */
export function darkLogo(url: string): string {
  return url
    .replace(/\/teamlogos\/nfl\/500\/scoreboard\//, '/teamlogos/nfl/500-dark/')
    .replace(/\/teamlogos\/ncaa\/500\//, '/teamlogos/ncaa/500-dark/')
}
