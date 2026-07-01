import { Movie, Category, Season, Episode } from './types/common-interface';

export const CATEGORIES: Category[] = [
  { id: 'trending', title: 'Trending Now' },
  { id: 'originals', title: '360 TV Originals' },
  { id: 'action', title: 'Action & Adventure' },
  { id: 'comedy', title: 'Comedy' },
];

const generateEpisodes = (seasonNum: number, count: number): Episode[] => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `s${seasonNum}-e${i + 1}`,
    title: `Episode ${i + 1}: The Discovery`,
    duration: '45m',
    description: 'A deeper look into the mysteries that unfold during this chapter of the journey.',
    image: `https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&q=80`,
    episodeNumber: i + 1
  }));
};

const generateSeasons = (count: number): Season[] => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `season-${i + 1}`,
    title: `Season ${i + 1}`,
    seasonNumber: i + 1,
    episodes: generateEpisodes(i + 1, 8)
  }));
};

export const SERIES: Movie[] = Array.from({ length: 10 }).map((_, i) => ({
  id: `s${i + 1}`,
  title: [
    'Echoes of Time', 'Shadow Realm', 'Neon Legacy', 'The Last Frontier', 
    'Cyber Pulse', 'Void Walker', 'Stellar Storm', 'Binary Souls', 
    'Crystal Skies', 'Ocean Ghost'
  ][i],
  duration: 'Season 1',
  rating: 'TV-MA',
  image: `https://images.unsplash.com/photo-${[
    '1536440136628-849c177e76a1', '1626814026160-2237a95fc5a0', '1550684848-fac1c5b4e853',
    '1446776811953-b23d57bd21aa', '1506318137071-a8e063b4b519', '1478720568477-152d9b164e26',
    '1534447677768-be436bb09401', '1518709268805-4e9042af9f23', '1464802686167-b939a67a06f1',
    '1501533530491-520ac1891911'
  ][i]}?w=800&q=80`,
  description: 'An epic journey across multiple timelines and dimensions.',
  isSeries: true,
  seasons: generateSeasons(3)
}));

export const MOVIES: Movie[] = [
  ...SERIES,
  { id: 'm1', title: 'Nebula Protocol', duration: '2h 15m', rating: 'PG-13', image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=80', description: 'After a mysterious signal originates from the edge of the galaxy, a team of elite specialists is sent to investigate the Nebula Protocol.' },
  { id: 'm2', title: 'Circuit Breaker', duration: '1h 50m', rating: 'R', image: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=800&q=80', description: 'In a world where artificial intelligence has surpassed human control, one man must break the circuit before it is too late.' },
  { id: 'm3', title: 'Desert Ghost', duration: '2h 05m', rating: 'PG-13', image: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&q=80', description: 'A lone wanderer in a post-apocalyptic desert discovers a ghost from the past that holds the key to humanitys future.' },
  { id: 'm4', title: 'Solar Drifter', duration: '1h 45m', rating: 'G', image: 'https://images.unsplash.com/photo-1506318137071-a8e063b4b519?w=800&q=80', description: 'Follow the incredible journey of a solar-powered spacecraft as it drifts across the vast emptiness of the inner solar system.' },
  { id: 'm5', title: 'Neon Nights', duration: '1h 55m', rating: 'R', image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&q=80', description: 'Deep within the neon-lit depths of a futuristic megacity, a detective hunts for a phantom killer.' },
  { id: 'm6', title: 'Arctic Echo', duration: '2h 10m', rating: 'PG', image: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&q=80', description: 'As the arctic ice melts, an ancient sound begins to echo from the depths, threatening to change the world forever.' },
];
