'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'
import { useConversationStore } from '@/stores/conversation'
import { ContactPanel } from './ContactPanel'
import { ConversationList } from './ConversationList'
import { MessageThread } from './MessageThread'

export function ConversationView() {
	const activeConversationId = useConversationStore((s) => s.activeConversationId)

	return (
		<div className="flex h-full">
			{/* Left: Conversation List */}
			<div className="w-80 border-r border-border bg-white shrink-0 flex flex-col">
				<ConversationList />
			</div>

			{/* Center: Message Thread */}
			<div className="flex-1 flex flex-col bg-white">
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

			{/* Right: Contact Panel */}
			<AnimatePresence>
				{activeConversationId && (
					<motion.div
						initial={{ width: 0, opacity: 0 }}
						animate={{ width: 288, opacity: 1 }}
						exit={{ width: 0, opacity: 0 }}
						transition={{ duration: 0.2, ease: 'easeInOut' }}
						className="border-l border-border bg-white shrink-0 overflow-y-auto overflow-x-hidden"
					>
						<ContactPanel />
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	)
}
