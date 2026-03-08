import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	output: 'standalone',
	transpilePackages: ['@oho/api', '@oho/db'],
	serverExternalPackages: ['ws', '@prisma/client', 'prisma'],
	compiler: {
		removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
	},
}

export default nextConfig
