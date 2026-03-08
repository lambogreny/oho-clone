import { authRouter } from './routers/auth'
import { contactRouter } from './routers/contact'
import { conversationRouter } from './routers/conversation'
import { inboxRouter } from './routers/inbox'
import { messageRouter } from './routers/message'
import { noteRouter } from './routers/note'
import { teamRouter } from './routers/team'
import { userRouter } from './routers/user'
import { router } from './trpc'

export const appRouter = router({
	auth: authRouter,
	conversation: conversationRouter,
	message: messageRouter,
	contact: contactRouter,
	inbox: inboxRouter,
	note: noteRouter,
	team: teamRouter,
	user: userRouter,
})

export type AppRouter = typeof appRouter
