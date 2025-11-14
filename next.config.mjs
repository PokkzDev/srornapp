/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  
  // Fix multiple lockfiles warning by explicitly setting the root directory
  turbopack: {
    root: process.cwd(),
  },
  
  // Allow cross-origin requests from the staging domain for HMR
  allowedDevOrigins: [
    'srorn.pokkzpreview.online',
    'localhost:3005',
    '0.0.0.0:3005',
  ],
};

export default nextConfig;
