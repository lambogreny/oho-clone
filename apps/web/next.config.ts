import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { NextConfig } from 'next'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
	output: 'standalone',
	outputFileTracingRoot: path.join(__dirname, '../../'),
	transpilePackages: ['@oho/api', '@oho/db'],
	serverExternalPackages: ['ws', '@prisma/client', 'prisma'],
	compiler: {
		removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
	},
}

export default nextConfig
