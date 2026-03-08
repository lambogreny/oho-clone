'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useConversationStore } from '@/stores/conversation'
import { ContactPanel } from './ContactPanel'
import { ConversationList } from './ConversationList'
import { MessageThread } from './MessageThread'

export function ConversationView() {
	const { activeConversationId, setActiveConversation } = useConversationStore()

	return (
		<div className="flex h-full">
			{/* Left: Conversation List */}
			<div
				className={cn(
					'w-full md:w-80 border-r border-border bg-white shrink-0 flex flex-col',
					activeConversationId ? 'hidden md:flex' : 'flex',
				)}
			>
				<ConversationList />
			</div>

			{/* Center: Message Thread */}
			<div
				className={cn(
					'flex-1 flex flex-col bg-white',
					activeConversationId ? 'flex' : 'hidden md:flex',
				)}
			>
				<AnimatePresence mode="wait">
					{activeConversationId ? (
						<motion.div
							key={activeConversationId}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.15 }}
							className="flex-1 flex flex-col"
						>
							{/* Mobile back button */}
							<div className="flex items-center gap-2 px-3 py-2 border-b border-border md:hidden">
								<button
									type="button"
									onClick={() => setActiveConversation(null)}
									className="p-1 -ml-1 text-muted-foreground hover:text-foreground"
									aria-label="กลับไปรายการแชท"
								>
									<ArrowLeft className="w-5 h-5" />
								</button>
								<span className="text-sm font-medium text-gray-700">กลับ</span>
							</div>
							<MessageThread />
						</motion.div>
					) : (
						<motion.div
							key="empty"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className="flex-1 flex items-center justify-center"
						>
							<div className="text-center">
								<div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
									<MessageCircle className="w-7 h-7 text-muted-foreground/60" />
								</div>
								<p className="text-sm font-medium text-gray-700">เลือกแชทเพื่อเริ่มสนทนา</p>
								<p className="text-xs text-muted-foreground mt-1">เลือกจากรายการแชทด้านซ้าย</p>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{/* Right: Contact Panel — hidden on mobile/tablet */}
			<AnimatePresence>
				{activeConversationId && (
					<motion.div
						initial={{ width: 0, opacity: 0 }}
						animate={{ width: 288, opacity: 1 }}
						exit={{ width: 0, opacity: 0 }}
						transition={{ duration: 0.2, ease: 'easeInOut' }}
						className="border-l border-border bg-white shrink-0 overflow-y-auto overflow-x-hidden hidden xl:block"
					>
						<ContactPanel />
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	)
}
