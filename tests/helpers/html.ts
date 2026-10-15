/** Shared test helpers */

/** Counts non-overlapping occurrences of `needle` in `haystack` */
// I love this function sm, my life in a nutshell here
export function countOccurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}
