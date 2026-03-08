import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	output: 'standalone',
	outputFileTracingRoot: import.meta.dirname ? `${import.meta.dirname}/../..` : undefined,
	transpilePackages: ['@oho/api', '@oho/db'],
	serverExternalPackages: ['ws', '@prisma/client', 'prisma', 'bcryptjs'],
	typescript: {
		ignoreBuildErrors: true,
	},
	compiler: {
		removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
	},
}

export default nextConfig
