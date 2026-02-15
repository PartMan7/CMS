import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	serverExternalPackages: ['better-sqlite3'],
	experimental: {
		serverActions: {
			bodySizeLimit: '100mb',
		},
	},
};

export default nextConfig;
