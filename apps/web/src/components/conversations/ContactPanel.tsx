'use client'

import { motion } from 'framer-motion'
import { Mail, MessageSquare, Phone, Tag, User } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'
import { cn } from '@/lib/utils'
import { useConversationStore } from '@/stores/conversation'

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
]

function getAvatarColor(id: string): string {
	let hash = 0
	for (const char of id) hash = char.charCodeAt(0) + ((hash << 5) - hash)
	return avatarColors[Math.abs(hash) % avatarColors.length] ?? 'bg-gray-500'
}

const sectionVariants = {
	hidden: { opacity: 0, y: 8 },
	visible: (i: number) => ({
		opacity: 1,
		y: 0,
		transition: { delay: i * 0.08, duration: 0.25, ease: [0.25, 0.1, 0.25, 1] as const },
	}),
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

export function ContactPanelSkeleton() {
	return (
		<div className="p-4 space-y-4">
			<div className="flex flex-col items-center pb-4 border-b border-border">
				<Skeleton className="w-16 h-16 rounded-full" />
				<Skeleton className="h-4 w-24 mt-3" />
				<Skeleton className="h-3 w-32 mt-1.5" />
			</div>
			<div className="space-y-2.5">
				<Skeleton className="h-3 w-16" />
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-full" />
			</div>
		</div>
	)
}

export function ContactPanel() {
	const activeConversationId = useConversationStore((s) => s.activeConversationId)

	const { data: conversation } = trpc.conversation.getById.useQuery(
		{ id: activeConversationId! },
		{ enabled: !!activeConversationId },
	)

	if (!conversation) return <ContactPanelSkeleton />

	const contact = conversation.contact
	if (!contact) return null

	const channelType = conversation.inbox?.channelType ?? 'WEBCHAT'
	const channel = channelConfig[channelType] ?? channelConfig.WEBCHAT
	const initials = getInitials(contact.name ?? '')
	const avatarColor = getAvatarColor(contact.id)

	return (
		<div className="p-4">
			{/* Avatar & Name */}
			<motion.div
				custom={0}
				variants={sectionVariants}
				initial="hidden"
				animate="visible"
				className="flex flex-col items-center pb-4 border-b border-border"
			>
				<Avatar className={cn('w-16 h-16', avatarColor)}>
					<AvatarFallback className={cn('text-white text-lg font-medium', avatarColor)}>
						{initials}
					</AvatarFallback>
				</Avatar>
				<h3 className="text-sm font-semibold text-gray-900 mt-3">{contact.name}</h3>
				{contact.email && <p className="text-xs text-muted-foreground mt-0.5">{contact.email}</p>}
			</motion.div>

			{/* Contact Info */}
			<motion.div
				custom={1}
				variants={sectionVariants}
				initial="hidden"
				animate="visible"
				className="py-4 border-b border-border"
			>
				<h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
					ข้อมูลติดต่อ
				</h4>
				<div className="space-y-2.5">
					{contact.phone && (
						<div className="flex items-center gap-2.5">
							<Phone className="w-3.5 h-3.5 text-muted-foreground" />
							<span className="text-sm text-gray-700">{contact.phone}</span>
						</div>
					)}
					{contact.email && (
						<div className="flex items-center gap-2.5">
							<Mail className="w-3.5 h-3.5 text-muted-foreground" />
							<span className="text-sm text-gray-700">{contact.email}</span>
						</div>
					)}
					<div className="flex items-center gap-2.5">
						<MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
						<span
							className={cn('px-2 py-0.5 text-[10px] font-bold rounded text-white', channel?.bg)}
						>
							{channel?.label}
						</span>
					</div>
				</div>
			</motion.div>

			{/* Status */}
			<motion.div
				custom={2}
				variants={sectionVariants}
				initial="hidden"
				animate="visible"
				className="py-4 border-b border-border"
			>
				<h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
					<Tag className="w-3 h-3" />
					สถานะ
				</h4>
				<div className="flex flex-wrap gap-1.5">
					<Badge
						variant={conversation.status === 'OPEN' ? 'success' : 'secondary'}
						className="rounded-full text-[10px]"
					>
						{conversation.status}
					</Badge>
					{conversation.assignee && (
						<Badge variant="outline" className="rounded-full text-[10px]">
							<User className="w-2.5 h-2.5 mr-1" />
							{conversation.assignee.displayName ?? conversation.assignee.name}
						</Badge>
					)}
				</div>
			</motion.div>

			{/* Team */}
			{conversation.team && (
				<motion.div
					custom={3}
					variants={sectionVariants}
					initial="hidden"
					animate="visible"
					className="py-4"
				>
					<h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">ทีม</h4>
					<Badge variant="outline" className="rounded-full text-[10px]">
						{conversation.team.name}
					</Badge>
				</motion.div>
			)}
		</div>
	)
}
