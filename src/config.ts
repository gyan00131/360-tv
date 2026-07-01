export const APP_CONFIG = {
  baseUrl: 'https://dev.e360tv.com/api',
  endpoints: {
    movies: '/v3/movie-list',
    tvShows: '/v3/tvshow-list',
    search: '/v3/get-search-data',
    genres: '/genre-content-list',
    rating: '/get-rating',
    banners: '/banners',
    dashboardDetail: '/v3/dashboard-detail-data',
    liveTvCategories: '/livetv-category-list',
    liveTvDashboard: '/livetv-dashboard',
    channels: '/v3/channel-list',
    videos: '/video-list',
    login: '/login',
  },
} as const;

export const getApiUrl = (endpoint: keyof typeof APP_CONFIG.endpoints) => {
  const path = APP_CONFIG.endpoints[endpoint];
  return `${APP_CONFIG.baseUrl}${path}`;
};
