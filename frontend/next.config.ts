import type { NextConfig } from 'next';
const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:4000';

if (process.env.VERCEL && !/^https?:\/\//.test(backendUrl)) {
  throw new Error('BACKEND_URL must be an absolute HTTP(S) URL');
}

const config: NextConfig = {
  async rewrites() {
    return [{
      source: '/api/:path*',
      destination: `${backendUrl.replace(/\/$/, '')}/api/:path*`,
    }];
  },
};
export default config;
