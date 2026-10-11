import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'pickle',
    short_name: 'pickle',
    description: 'your shared grocery list',
    start_url: '/',
    display: 'standalone',
    background_color: '#F8F7F2',
    theme_color: '#F8F7F2',
    icons: [
      { src: '/apple-touch-icon.png', sizes: '1024x1024', type: 'image/png' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
  };
}
