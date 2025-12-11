/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  
  // Enable standalone output for Docker deployment
  output: 'standalone',
  
  // Fix multiple lockfiles warning by explicitly setting the root directory
  turbopack: {
    root: process.cwd(),
  },
  
  // Allow cross-origin requests from the staging domain for HMR
  // Include both HTTP and HTTPS since the app may be accessed via reverse proxy
  allowedDevOrigins: [
    'http://srorn.pokkzpreview.online',
    'https://srorn.pokkzpreview.online',
    'http://localhost:3005',
    'http://0.0.0.0:3005',
    'http://127.0.0.1:3005',
  ],
};

export default nextConfig;
