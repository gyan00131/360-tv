import React from 'react';

export interface Episode {
  id: string;
  title: string;
  duration: string;
  description: string;
  image: string;
  episodeNumber: number;
}

export interface Season {
  id: string;
  title: string;
  seasonNumber: number;
  episodes: Episode[];
}

export interface Movie {
  id: string;
  title: string;
  duration: string;
  rating: string;
  image: string;
  description: string;
  isSeries?: boolean;
  seasons?: Season[];
  slug?: string;
  poster_image?: string;
  thumbnail_url?: string;
  type?: string;
}

export interface Category {
  id: string;
  title: string;
}

export type ViewState = {
  view: 'dashboard' | 'details' | 'player' | 'category-detail' | 'series-season';
  params?: any;
};
