'use client'

import { Toaster as Sonner } from 'sonner'

export function Toaster() {
	return (
		<Sonner
			position="top-right"
			toastOptions={{
				classNames: {
					toast: 'bg-white border border-border shadow-lg rounded-xl text-sm',
					title: 'font-medium text-gray-900',
					description: 'text-muted-foreground',
					actionButton: 'bg-primary text-primary-foreground',
					cancelButton: 'bg-muted text-gray-600',
					closeButton: 'text-gray-400 hover:text-gray-600',
				},
			}}
			closeButton
			richColors
		/>
	)
}
