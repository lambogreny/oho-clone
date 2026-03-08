export async function register() {
	if (process.env.NEXT_RUNTIME === 'nodejs') {
		const { createSocketServer } = await import('@oho/api')

		// Socket.io needs an HTTP server. In standalone mode, Next.js creates one
		// but doesn't expose it. We create a separate one on WS_PORT (default 3001).
		// nginx proxies /socket.io to this port.
		const { createServer } = await import('node:http')
		const wsPort = parseInt(process.env.WS_PORT || '3001', 10)
		const wsServer = createServer()
		createSocketServer(wsServer)
		wsServer.listen(wsPort, '0.0.0.0', () => {
			console.log(`> Socket.io server on port ${wsPort}`)
		})
	}
}
