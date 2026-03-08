'use client'

import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import { AnimatePresence, motion } from 'framer-motion'
import {
	AlertCircle,
	Check,
	CheckCheck,
	CheckCircle2,
	ChevronDown,
	Loader2,
	Paperclip,
	RefreshCw,
	RotateCcw,
	Send,
	Smile,
	UserPlus,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useConversationRoom, useSocketEvent } from '@/lib/socket'
import { trpc } from '@/lib/trpc/client'
import { cn } from '@/lib/utils'
import { useConversationStore } from '@/stores/conversation'

type MessageStatus = 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'

function StatusIcon({ status }: { status?: MessageStatus | string }) {
	if (!status) return null
	if (status === 'SENT') return <Check className="w-3 h-3 text-white/60" />
	if (status === 'DELIVERED') return <CheckCheck className="w-3 h-3 text-white/60" />
	if (status === 'READ') return <CheckCheck className="w-3 h-3 text-white" />
	return null
}

const channelConfig: Record<string, { label: string; bg: string }> = {
	LINE: { label: 'LINE', bg: 'bg-green-500' },
	FACEBOOK: { label: 'Facebook', bg: 'bg-blue-600' },
	INSTAGRAM: {
		label: 'Instagram',
		bg: 'bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-400',
	},
	TIKTOK: { label: 'TikTok', bg: 'bg-gray-900' },
	WEBCHAT: { label: 'WebChat', bg: 'bg-primary' },
}

export function MessageThreadSkeleton() {
	return (
		<div className="flex flex-col h-full">
			<div className="h-14 px-4 flex items-center gap-3 border-b border-border">
				<Skeleton className="h-5 w-24" />
				<Skeleton className="h-5 w-12 rounded" />
			</div>
			<div className="flex-1 p-4 space-y-3">
				{Array.from({ length: 6 }).map((_, i) => (
					<div
						key={`msg-skel-${i.toString()}`}
						className={cn('flex', i % 2 === 0 ? 'justify-start' : 'justify-end')}
					>
						<Skeleton className={cn('h-10 rounded-2xl', i % 3 === 0 ? 'w-48' : 'w-64')} />
					</div>
				))}
			</div>
			<div className="border-t border-border p-3">
				<Skeleton className="h-10 w-full rounded-lg" />
			</div>
		</div>
	)
}

export function MessageThread() {
	const [input, setInput] = useState('')
	const activeConversationId = useConversationStore((s) => s.activeConversationId)
	const messagesEndRef = useRef<HTMLDivElement>(null)
	const utils = trpc.useUtils()

	const { data: conversation } = trpc.conversation.getById.useQuery(
		{ id: activeConversationId! },
		{ enabled: !!activeConversationId },
	)

	const { data: teamMembersData } = trpc.user.list.useQuery(undefined, {
		enabled: !!activeConversationId,
	})
	const teamMembers = teamMembersData ?? ([] as NonNullable<typeof teamMembersData>)

	const {
		data: messagesData,
		isLoading: messagesLoading,
		error: messagesError,
		refetch: refetchMessages,
	} = trpc.message.list.useQuery(
		{ conversationId: activeConversationId!, limit: 100 },
		{ enabled: !!activeConversationId, refetchInterval: 30_000 },
	)

	useConversationRoom(activeConversationId)

	useSocketEvent('message:new', (data) => {
		if (data.conversationId === activeConversationId) {
			utils.message.list.invalidate({ conversationId: activeConversationId! })
		}
	})

	useSocketEvent('message:status', () => {
		if (activeConversationId) {
			utils.message.list.invalidate({ conversationId: activeConversationId })
		}
	})

	const sendMessage = trpc.message.send.useMutation({
		onSuccess: () => {
			utils.message.list.invalidate({ conversationId: activeConversationId! })
			utils.conversation.list.invalidate()
		},
		onError: () => {
			toast.error('ส่งข้อความไม่สำเร็จ กรุณาลองใหม่')
		},
	})

	const assignConversation = trpc.conversation.assign.useMutation({
		onSuccess: (data) => {
			utils.conversation.getById.invalidate({ id: activeConversationId! })
			utils.conversation.list.invalidate()
			const name = data.assignee?.displayName ?? data.assignee?.name ?? 'ไม่มี'
			toast.success(`มอบหมายให้ ${name} แล้ว`)
		},
		onError: () => toast.error('มอบหมายไม่สำเร็จ'),
	})

	const updateStatus = trpc.conversation.updateStatus.useMutation({
		onSuccess: () => {
			utils.conversation.getById.invalidate({ id: activeConversationId! })
			utils.conversation.list.invalidate()
		},
		onError: () => toast.error('เปลี่ยนสถานะไม่สำเร็จ'),
	})

	type MessageItem = NonNullable<typeof messagesData>['items'][number]
	const messages: MessageItem[] = [...(messagesData?.items ?? [])].reverse()
	const messageCount = messages.length

	useEffect(() => {
		if (messageCount > 0) {
			messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
		}
	}, [messageCount])

	if (!activeConversationId) return null

	const contactName = conversation?.contact?.name ?? 'Loading...'
	const channelType = conversation?.inbox?.channelType ?? 'WEBCHAT'
	const channel = channelConfig[channelType] ?? channelConfig.WEBCHAT
	const isResolved = conversation?.status === 'RESOLVED'

	const handleSend = () => {
		if (!input.trim() || !activeConversationId) return
		sendMessage.mutate({
			conversationId: activeConversationId,
			content: input.trim(),
			contentType: 'TEXT',
		})
		setInput('')
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault()
			handleSend()
		}
	}

	const handleAssign = (assigneeId: string | null) => {
		if (!activeConversationId) return
		assignConversation.mutate({ id: activeConversationId, assigneeId })
	}

	const handleToggleStatus = () => {
		if (!activeConversationId) return
		const newStatus = isResolved ? 'OPEN' : 'RESOLVED'
		updateStatus.mutate({ id: activeConversationId, status: newStatus })
		toast.success(newStatus === 'RESOLVED' ? 'ปิดแชทแล้ว' : 'เปิดแชทอีกครั้ง')
	}

	const groupedByDate = new Map<string, typeof messages>()
	for (const msg of messages) {
		const dateKey = format(new Date(msg.createdAt), 'yyyy-MM-dd')
		const group = groupedByDate.get(dateKey) ?? []
		group.push(msg)
		groupedByDate.set(dateKey, group)
	}

	return (
		<>
			{/* Header */}
			<div className="h-14 px-4 flex items-center justify-between border-b border-border shrink-0">
				<div className="flex items-center gap-3 min-w-0">
					<h3 className="text-sm font-semibold text-gray-900 truncate">{contactName}</h3>
					<span
						className={cn(
							'px-2 py-0.5 text-[10px] font-bold rounded text-white shrink-0',
							channel?.bg,
						)}
					>
						{channel?.label}
					</span>
				</div>
				<div className="flex items-center gap-2 shrink-0">
					{/* Assign dropdown */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
								<UserPlus className="w-3.5 h-3.5" />
								<span className="hidden sm:inline truncate max-w-20">
									{conversation?.assignee?.displayName ?? conversation?.assignee?.name ?? 'มอบหมาย'}
								</span>
								<ChevronDown className="w-3 h-3" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-48">
							{teamMembers?.map((member) => (
								<DropdownMenuItem
									key={member.id}
									onClick={() => handleAssign(member.id)}
									className={cn(
										'text-xs',
										conversation?.assignee?.id === member.id && 'bg-primary/5 font-medium',
									)}
								>
									<div className="flex items-center gap-2 w-full">
										<div
											className={cn(
												'w-2 h-2 rounded-full',
												member.presence === 'ONLINE' ? 'bg-green-500' : 'bg-gray-300',
											)}
										/>
										<span className="truncate">{member.displayName ?? member.name}</span>
										{conversation?.assignee?.id === member.id && (
											<Check className="w-3 h-3 ml-auto text-primary" />
										)}
									</div>
								</DropdownMenuItem>
							))}
							{conversation?.assigneeId && (
								<>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={() => handleAssign(null)}
										className="text-xs text-muted-foreground"
									>
										ยกเลิกการมอบหมาย
									</DropdownMenuItem>
								</>
							)}
						</DropdownMenuContent>
					</DropdownMenu>

					{/* Resolve / Reopen */}
					<Button
						variant={isResolved ? 'outline' : 'default'}
						size="sm"
						className="h-7 gap-1.5 text-xs"
						onClick={handleToggleStatus}
						disabled={updateStatus.isPending}
					>
						{updateStatus.isPending ? (
							<Loader2 className="w-3.5 h-3.5 animate-spin" />
						) : isResolved ? (
							<RotateCcw className="w-3.5 h-3.5" />
						) : (
							<CheckCircle2 className="w-3.5 h-3.5" />
						)}
						<span className="hidden sm:inline">{isResolved ? 'เปิดอีกครั้ง' : 'ปิดแชท'}</span>
					</Button>
				</div>
			</div>

			{/* Messages */}
			<div className="flex-1 overflow-y-auto p-4 space-y-3">
				{messagesLoading ? (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
					</div>
				) : messagesError ? (
					<div className="flex flex-col items-center justify-center py-12 gap-3">
						<AlertCircle className="w-8 h-8 text-destructive/60" />
						<p className="text-sm text-destructive">โหลดข้อความไม่สำเร็จ</p>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => refetchMessages()}
							className="gap-2"
						>
							<RefreshCw className="w-3.5 h-3.5" />
							ลองใหม่
						</Button>
					</div>
				) : messages.length === 0 ? (
					<div className="flex items-center justify-center py-12">
						<p className="text-sm text-muted-foreground">ยังไม่มีข้อความ — เริ่มสนทนาได้เลย</p>
					</div>
				) : (
					Array.from(groupedByDate.entries()).map(([dateKey, msgs]) => (
						<div key={dateKey}>
							<div className="flex items-center gap-3 my-4">
								<div className="flex-1 h-px bg-border" />
								<span className="text-[11px] text-muted-foreground font-medium">
									{format(new Date(dateKey), 'd MMMM yyyy', { locale: th })}
								</span>
								<div className="flex-1 h-px bg-border" />
							</div>
							<AnimatePresence initial={false}>
								{msgs.map((msg) => (
									<motion.div
										key={msg.id}
										initial={{ opacity: 0, y: 12, scale: 0.95 }}
										animate={{ opacity: 1, y: 0, scale: 1 }}
										transition={{ duration: 0.2, ease: 'easeOut' }}
										className={cn(
											'flex mb-2',
											msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start',
										)}
									>
										<div
											className={cn(
												'max-w-[70%] px-3.5 py-2 rounded-2xl',
												msg.direction === 'OUTBOUND'
													? 'bg-primary text-primary-foreground rounded-br-md'
													: 'bg-gray-100 text-gray-900 rounded-bl-md',
											)}
										>
											<p className="text-sm leading-relaxed">{msg.content}</p>
											<div
												className={cn(
													'flex items-center gap-1 mt-1',
													msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start',
												)}
											>
												<span
													className={cn(
														'text-[10px]',
														msg.direction === 'OUTBOUND'
															? 'text-white/70'
															: 'text-muted-foreground',
													)}
												>
													{format(new Date(msg.createdAt), 'HH:mm')}
												</span>
												{msg.direction === 'OUTBOUND' && <StatusIcon status={msg.status} />}
											</div>
										</div>
									</motion.div>
								))}
							</AnimatePresence>
						</div>
					))
				)}
				<div ref={messagesEndRef} />
			</div>

			{/* Input Area */}
			<div className="border-t border-border p-3 shrink-0">
				{isResolved ? (
					<div className="flex items-center justify-center py-2 text-xs text-muted-foreground">
						แชทนี้ถูกปิดแล้ว —{' '}
						<button
							type="button"
							onClick={handleToggleStatus}
							className="text-primary hover:underline ml-1"
						>
							เปิดอีกครั้ง
						</button>
					</div>
				) : (
					<div className="flex items-end gap-2">
						<div className="hidden sm:flex items-center gap-0.5">
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="h-8 w-8 text-muted-foreground"
							>
								<Paperclip className="w-4 h-4" />
							</Button>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="h-8 w-8 text-muted-foreground"
							>
								<Smile className="w-4 h-4" />
							</Button>
						</div>
						<Input
							type="text"
							placeholder="พิมพ์ข้อความ..."
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyDown={handleKeyDown}
							className="flex-1"
						/>
						<Button
							type="button"
							size="icon"
							onClick={handleSend}
							disabled={!input.trim() || sendMessage.isPending}
							className="h-9 w-9 shrink-0"
						>
							{sendMessage.isPending ? (
								<Loader2 className="w-4 h-4 animate-spin" />
							) : (
								<Send className="w-4 h-4" />
							)}
						</Button>
					</div>
				)}
			</div>
		</>
	)
}
