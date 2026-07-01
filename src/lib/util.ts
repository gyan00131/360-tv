/**
 * Formats seconds into a HH:MM:SS or MM:SS string
 * @param seconds number of seconds
 * @returns formatted string
 */
export const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h > 0 ? h : null, m, s]
    .filter((v) => v !== null)
    .map((v) => v!.toString().padStart(2, '0'))
    .join(':');
};

/**
 * Common slugifier for IDs
 */
export const slugify = (text: string): string => {
  return text.toLowerCase().replace(/\s/g, '-');
};
