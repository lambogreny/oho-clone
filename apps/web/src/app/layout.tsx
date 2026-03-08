import type { Metadata } from 'next'
import './globals.css'
import { TRPCProvider } from '@/lib/trpc/provider'

export const metadata: Metadata = {
	title: 'OHO Chat',
	description: 'Omnichannel chat platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="th">
			<body className="antialiased">
				<TRPCProvider>{children}</TRPCProvider>
			</body>
		</html>
	)
}
