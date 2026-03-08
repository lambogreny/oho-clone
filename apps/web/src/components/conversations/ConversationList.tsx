'use client'

import { formatDistanceToNow } from 'date-fns'
import { th } from 'date-fns/locale'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, Search } from 'lucide-react'
import { useState } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useSocketEvent } from '@/lib/socket'
import { trpc } from '@/lib/trpc/client'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth'
import { useConversationStore } from '@/stores/conversation'

type StatusTab = 'all' | 'open' | 'pending' | 'resolved'
type AssignTab = 'all' | 'mine' | 'unassigned'

const channelConfig: Record<string, { label: string; color: string; bg: string }> = {
	LINE: { label: 'LINE', color: 'text-white', bg: 'bg-green-500' },
	FACEBOOK: { label: 'FB', color: 'text-white', bg: 'bg-blue-600' },
	INSTAGRAM: {
		label: 'IG',
		color: 'text-white',
		bg: 'bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-400',
	},
	TIKTOK: { label: 'TT', color: 'text-white', bg: 'bg-gray-900' },
	WEBCHAT: { label: 'WEB', color: 'text-white', bg: 'bg-primary' },
	WHATSAPP: { label: 'WA', color: 'text-white', bg: 'bg-green-600' },
	EMAIL: { label: 'EMAIL', color: 'text-white', bg: 'bg-gray-600' },
}

function getInitials(name: string): string {
	const parts = name.trim().split(/\s+/)
	if (parts.length >= 2) return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`
	return name.slice(0, 2)
}

const avatarColors = [
	'bg-blue-500',
	'bg-pink-500',
	'bg-emerald-500',
	'bg-amber-500',
	'bg-violet-500',
	'bg-cyan-500',
	'bg-rose-500',
	'bg-indigo-500',
]

function getAvatarColor(id: string): string {
	let hash = 0
	for (const char of id) {
		hash = char.charCodeAt(0) + ((hash << 5) - hash)
	}
	return avatarColors[Math.abs(hash) % avatarColors.length] ?? 'bg-gray-500'
}

export function ConversationListSkeleton() {
	return (
		<div className="flex flex-col h-full">
			<div className="p-4 border-b border-border space-y-3">
				<Skeleton className="h-5 w-16" />
				<Skeleton className="h-9 w-full" />
				<div className="flex gap-1">
					<Skeleton className="h-7 w-16" />
					<Skeleton className="h-7 w-16" />
					<Skeleton className="h-7 w-24" />
				</div>
			</div>
			<div className="flex-1 p-2 space-y-1">
				{Array.from({ length: 5 }).map((_, i) => (
					<div key={`skel-${i.toString()}`} className="flex items-start gap-3 p-3">
						<Skeleton className="w-10 h-10 rounded-full" />
						<div className="flex-1 space-y-2">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-3 w-full" />
						</div>
					</div>
				))}
			</div>
		</div>
	)
}

export function ConversationList() {
	const [search, setSearch] = useState('')
	const [statusTab, setStatusTab] = useState<StatusTab>('all')
	const [assignTab, setAssignTab] = useState<AssignTab>('all')
	const { activeConversationId, setActiveConversation } = useConversationStore()
	const user = useAuthStore((s) => s.user)
	const utils = trpc.useUtils()

	const statusMap: Record<StatusTab, string | undefined> = {
		all: undefined,
		open: 'OPEN',
		pending: 'PENDING',
		resolved: 'RESOLVED',
	}

	const { data, isLoading, error } = trpc.conversation.list.useQuery(
		{
			...(statusMap[statusTab]
				? { status: statusMap[statusTab] as 'OPEN' | 'PENDING' | 'RESOLVED' | 'SNOOZED' }
				: {}),
			...(assignTab === 'mine' && user ? { assigneeId: user.id } : {}),
			limit: 50,
		},
		{ refetchInterval: 30_000 },
	)

	// Real-time: refresh conversation list on WebSocket events
	useSocketEvent('conversation:update', () => {
		utils.conversation.list.invalidate()
	})

	useSocketEvent('conversation:new', () => {
		utils.conversation.list.invalidate()
	})

	useSocketEvent('message:new', () => {
		utils.conversation.list.invalidate()
	})

	type ConversationItem = NonNullable<typeof data>['items'][number]
	const conversations: ConversationItem[] = data?.items ?? []

	const filteredConversations: ConversationItem[] = search
		? conversations.filter((conv: ConversationItem) => {
				const contactName = conv.contact?.name ?? ''
				const lastMsg = conv.messages?.[0]?.content ?? ''
				return contactName.includes(search) || lastMsg.includes(search)
			})
		: assignTab === 'unassigned'
			? conversations.filter((conv: ConversationItem) => !conv.assigneeId)
			: conversations

	const statusTabs: { key: StatusTab; label: string }[] = [
		{ key: 'all', label: 'ทั้งหมด' },
		{ key: 'open', label: 'เปิดอยู่' },
		{ key: 'pending', label: 'รอดำเนินการ' },
		{ key: 'resolved', label: 'แก้ไขแล้ว' },
	]

	const assignTabs: { key: AssignTab; label: string }[] = [
		{ key: 'all', label: 'ทั้งหมด' },
		{ key: 'mine', label: 'ของฉัน' },
		{ key: 'unassigned', label: 'ยังไม่มอบหมาย' },
	]

	return (
		<>
			{/* Header */}
			<div className="p-4 border-b border-border">
				<h2 className="text-base font-semibold text-gray-900 mb-3">แชท</h2>

				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
					<Input
						type="text"
						placeholder="ค้นหาชื่อหรือข้อความ..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="pl-9"
					/>
				</div>

				{/* Status filter tabs */}
				<div className="flex gap-1 mt-3">
					{statusTabs.map((tab) => (
						<button
							key={tab.key}
							type="button"
							onClick={() => setStatusTab(tab.key)}
							className={cn(
								'px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer',
								statusTab === tab.key
									? 'bg-primary text-primary-foreground'
									: 'text-muted-foreground hover:bg-muted',
							)}
						>
							{tab.label}
						</button>
					))}
				</div>

				{/* Assign filter tabs */}
				<div className="flex gap-1 mt-1.5">
					{assignTabs.map((tab) => (
						<button
							key={tab.key}
							type="button"
							onClick={() => setAssignTab(tab.key)}
							className={cn(
								'px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer',
								assignTab === tab.key
									? 'bg-secondary text-secondary-foreground'
									: 'text-muted-foreground hover:bg-muted',
							)}
						>
							{tab.label}
						</button>
					))}
				</div>
			</div>

			{/* Conversation Items */}
			<div className="flex-1 overflow-y-auto">
				{isLoading ? (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
					</div>
				) : error ? (
					<div className="flex flex-col items-center justify-center py-12 px-4">
						<p className="text-sm text-destructive text-center">ไม่สามารถโหลดแชทได้</p>
						<p className="text-xs text-muted-foreground mt-1">{error.message}</p>
					</div>
				) : (
					<AnimatePresence mode="popLayout">
						{filteredConversations.length === 0 ? (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								className="flex flex-col items-center justify-center py-12 px-4"
							>
								<Search className="w-8 h-8 text-muted-foreground/40 mb-3" />
								<p className="text-sm text-muted-foreground text-center">ไม่พบแชท</p>
							</motion.div>
						) : (
							filteredConversations.map((conv) => {
								const contactName = conv.contact?.name ?? 'ไม่ทราบชื่อ'
								const initials = getInitials(contactName)
								const channelType = conv.inbox?.channelType ?? 'WEBCHAT'
								const channel = channelConfig[channelType] ?? channelConfig.WEBCHAT
								const lastMessage = conv.messages?.[0]?.content ?? ''
								const lastMessageAt = conv.lastMessageAt ?? conv.createdAt
								const avatarColor = getAvatarColor(conv.id)

								return (
									<motion.button
										key={conv.id}
										type="button"
										layout
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -10 }}
										transition={{ duration: 0.15 }}
										onClick={() => setActiveConversation(conv.id)}
										className={cn(
											'w-full px-4 py-3 flex items-start gap-3 text-left hover:bg-gray-50 transition-colors border-b border-border/50 cursor-pointer',
											activeConversationId === conv.id &&
												'bg-primary/5 hover:bg-primary/5 border-l-2 border-l-primary',
										)}
									>
										<Avatar className={cn('w-10 h-10', avatarColor)}>
											<AvatarFallback className={cn('text-white text-xs font-medium', avatarColor)}>
												{initials}
											</AvatarFallback>
										</Avatar>

										<div className="flex-1 min-w-0">
											<div className="flex items-center justify-between gap-2">
												<span
													className={cn(
														'text-sm truncate',
														conv.unreadCount > 0
															? 'font-semibold text-gray-900'
															: 'font-medium text-gray-700',
													)}
												>
													{contactName}
												</span>
												<span className="text-[11px] text-muted-foreground shrink-0">
													{formatDistanceToNow(new Date(lastMessageAt), {
														addSuffix: false,
														locale: th,
													})}
												</span>
											</div>
											<div className="flex items-center justify-between gap-2 mt-0.5">
												<p
													className={cn(
														'text-xs truncate',
														conv.unreadCount > 0 ? 'text-gray-700' : 'text-muted-foreground',
													)}
												>
													{lastMessage}
												</p>
												<div className="flex items-center gap-1.5 shrink-0">
													<span
														className={cn(
															'px-1.5 py-0.5 text-[9px] font-bold rounded',
															channel?.bg,
															channel?.color,
														)}
													>
														{channel?.label}
													</span>
													{conv.unreadCount > 0 && (
														<Badge
															variant="destructive"
															className="h-5 min-w-5 px-1 text-[10px] flex items-center justify-center rounded-full"
														>
															{conv.unreadCount}
														</Badge>
													)}
												</div>
											</div>
										</div>
									</motion.button>
								)
							})
						)}
					</AnimatePresence>
				)}
			</div>
		</>
	)
}
