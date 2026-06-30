/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Client-side-only app. We do not do server-side data fetching of
  // protected resources; all API calls happen in the browser against
  // the backend via the nginx reverse proxy (NEXT_PUBLIC_API_BASE_URL).
};

module.exports = nextConfig;
