import { type NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/login', '/register', '/api/webhook', '/api/trpc']

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl

	// Allow public paths
	if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
		return NextResponse.next()
	}

	// Allow static files and landing page
	if (pathname === '/' || pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
		return NextResponse.next()
	}

	// Check auth token from cookie or header
	const token =
		request.cookies.get('auth_token')?.value ??
		request.headers.get('authorization')?.replace('Bearer ', '')

	// For /app routes — redirect to login if no token
	if (pathname.startsWith('/app') && !token) {
		const loginUrl = new URL('/login', request.url)
		loginUrl.searchParams.set('redirect', pathname)
		return NextResponse.redirect(loginUrl)
	}

	return NextResponse.next()
}

export const config = {
	matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
