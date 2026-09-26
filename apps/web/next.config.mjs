import withPWAInit from 'next-pwa';

const API_ORIGIN = process.env.API_ORIGIN ?? 'http://localhost:3000';

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  // A service worker in dev shadows your edits with stale cached assets.
  disable: process.env.NODE_ENV === 'development',
  // Never let the SW serve a stale HTML shell for an authenticated page.
  buildExcludes: [/middleware-manifest\.json$/],
  // Hero photos are served resized by next/image; precaching every original
  // would make each install download ~12 MB up front.
  publicExcludes: ['!noprecache/**/*', '!images/heroes/**/*'],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  /**
   * The API sets HttpOnly auth cookies. Proxying it under the web origin keeps every
   * request same-origin, so the browser attaches those cookies automatically and the
   * API needs no CORS allowance. Change API_ORIGIN per environment.
   */
  async rewrites() {
    return [{ source: '/api/v1/:path*', destination: `${API_ORIGIN}/api/v1/:path*` }];
  },
};

export default withPWA(nextConfig);
