import { Movie } from '../types/common-interface';
import { APP_CONFIG } from '../config';
import { apiRequest, post } from './common-util';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=80';

const stripHtml = (value: string = '') =>
  value
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeMediaItem = (item: any, fallbackTitle = 'Untitled'): Movie => ({
  id: String(item?.id ?? `${fallbackTitle}-${Math.random().toString(36).slice(2, 8)}`),
  title: item?.name || item?.title || fallbackTitle,
  duration: item?.duration || item?.release_date || 'N/A',
  rating: item?.imdb_rating || item?.movie_access || 'Free',
  image: item?.thumbnail_url || item?.poster_image || item?.image || FALLBACK_IMAGE,
  description: stripHtml(item?.description || item?.short_desc || 'No description available.'),
  isSeries: item?.type === 'tvshow' || item?.type === 'season',
  slug: item?.slug,
  poster_image: item?.poster_image,
  thumbnail_url: item?.thumbnail_url,
  type: item?.type,
});

const requestJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  return apiRequest<T>(path, {
    baseUrl: APP_CONFIG.baseUrl,
    headers: init?.headers,
    method: init?.method,
    body: init?.body,
  });
};

export const fetchMovies = async (): Promise<Movie[]> => {
  const payload = await requestJson<any>(APP_CONFIG.endpoints.movies);
  const items = Array.isArray(payload?.data) ? payload.data : [];
  return items.map((item: any) => normalizeMediaItem(item, 'Movie'));
};

export const fetchTvShows = async (): Promise<Movie[]> => {
  const payload = await requestJson<any>(APP_CONFIG.endpoints.tvShows);
  const items = Array.isArray(payload?.data) ? payload.data : [];
  return items.map((item: any) => normalizeMediaItem(item, 'TV Show'));
};

export const fetchSearchResults = async (query: string): Promise<Movie[]> => {
  if (!query.trim()) {
    return [];
  }

  const payload = await requestJson<any>(`${APP_CONFIG.endpoints.search}?search=${encodeURIComponent(query)}`);
  const items = [
    ...(Array.isArray(payload?.movieList) ? payload.movieList : []),
    ...(Array.isArray(payload?.tvshowList) ? payload.tvshowList : []),
    ...(Array.isArray(payload?.videoList) ? payload.videoList : []),
  ];

  return items.map((item: any) => normalizeMediaItem(item, 'Result')).slice(0, 12);
};

export const fetchGenres = async () => requestJson<any>(APP_CONFIG.endpoints.genres);
export const fetchRating = async () => requestJson<any>(APP_CONFIG.endpoints.rating);
export const fetchBanners = async () => {
  const payload = await requestJson<any>(APP_CONFIG.endpoints.banners);
  const items = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];

  return items.map((item: any) => ({
    id: String(item?.id ?? `banner-${Math.random().toString(36).slice(2, 8)}`),
    title: item?.title || item?.name || 'Featured',
    description: stripHtml(item?.description || item?.short_desc || item?.details || 'No description available.'),
    image: item?.image || item?.poster_image || item?.thumbnail_url || item?.banner_image || FALLBACK_IMAGE,
  }));
};
export const fetchDashboardDetail = async () => requestJson<any>(APP_CONFIG.endpoints.dashboardDetail);
export const fetchLiveTvCategories = async () => requestJson<any>(APP_CONFIG.endpoints.liveTvCategories);
export const fetchLiveTvDashboard = async () => requestJson<any>(APP_CONFIG.endpoints.liveTvDashboard);
export const fetchChannels = async () => requestJson<any>(APP_CONFIG.endpoints.channels);
export const fetchVideos = async () => requestJson<any>(APP_CONFIG.endpoints.videos);

export const login = async (email: string, password: string) =>
  post<any>(APP_CONFIG.endpoints.login, new URLSearchParams({ email, password }).toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    baseUrl: APP_CONFIG.baseUrl,
  });
