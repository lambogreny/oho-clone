'use client'

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
				{activeConversationId ? (
					<MessageThread />
				) : (
					<div className="flex-1 flex items-center justify-center">
						<div className="text-center">
							<p className="text-sm text-muted-foreground">เลือกแชทเพื่อเริ่มสนทนา</p>
						</div>
					</div>
				)}
			</div>

			{/* Right: Contact Panel */}
			{activeConversationId && (
				<div className="w-72 border-l border-border bg-white shrink-0 overflow-y-auto">
					<ContactPanel />
				</div>
			)}
		</div>
	)
}
