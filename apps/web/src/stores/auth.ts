import { create } from 'zustand'

interface User {
	id: string
	accountId: string
	email: string
	name: string
	displayName: string | null
	role: string
}

interface AuthState {
	token: string | null
	user: User | null
	setAuth: (token: string, user: User) => void
	clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
	token: typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null,
	user:
		typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('auth_user') ?? 'null') : null,
	setAuth: (token, user) => {
		localStorage.setItem('auth_token', token)
		localStorage.setItem('auth_user', JSON.stringify(user))
		document.cookie = `auth_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; samesite=lax`
		set({ token, user })
	},
	clearAuth: () => {
		localStorage.removeItem('auth_token')
		localStorage.removeItem('auth_user')
		document.cookie = 'auth_token=; path=/; max-age=0'
		set({ token: null, user: null })
	},
}))
