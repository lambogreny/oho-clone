import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	output: 'standalone',
	transpilePackages: ['@oho/api', '@oho/db'],
	compiler: {
		removeConsole: process.env.NODE_ENV === 'production',
	},
}

export default nextConfig
