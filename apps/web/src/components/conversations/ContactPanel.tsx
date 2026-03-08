'use client'

import { motion } from 'framer-motion'
import { Mail, MessageSquare, Phone, Tag } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useConversationStore } from '@/stores/conversation'

interface ContactData {
	name: string
	initials: string
	avatarColor: string
	email: string
	phone: string
	channel: string
	channelBg: string
	labels: {
		text: string
		variant: 'default' | 'success' | 'warning' | 'destructive' | 'secondary' | 'outline'
	}[]
	previousConversations: { id: string; summary: string; date: string }[]
}

const mockContacts: Record<string, ContactData> = {
	'1': {
		name: 'สมชาย ใจดี',
		initials: 'สช',
		avatarColor: 'bg-blue-500',
		email: 'somchai@example.com',
		phone: '081-234-5678',
		channel: 'LINE',
		channelBg: 'bg-green-500',
		labels: [
			{ text: 'VIP', variant: 'warning' },
			{ text: 'ลูกค้าประจำ', variant: 'default' },
		],
		previousConversations: [
			{ id: 'prev1', summary: 'สอบถามสินค้ารุ่น Basic', date: '5 มี.ค.' },
			{ id: 'prev2', summary: 'แจ้งปัญหาการจัดส่ง', date: '28 ก.พ.' },
		],
	},
	'2': {
		name: 'วิภาดา สุขสม',
		initials: 'วภ',
		avatarColor: 'bg-pink-500',
		email: 'wipada@example.com',
		phone: '089-876-5432',
		channel: 'Facebook',
		channelBg: 'bg-blue-600',
		labels: [{ text: 'ติดตามงาน', variant: 'destructive' }],
		previousConversations: [{ id: 'prev3', summary: 'สั่งซื้อสินค้า 2 ชิ้น', date: '1 มี.ค.' }],
	},
	'3': {
		name: 'ธนพล เจริญสุข',
		initials: 'ธพ',
		avatarColor: 'bg-emerald-500',
		email: 'thanapon@example.com',
		phone: '092-111-2222',
		channel: 'Instagram',
		channelBg: 'bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-400',
		labels: [{ text: 'ลูกค้าใหม่', variant: 'success' }],
		previousConversations: [],
	},
	'4': {
		name: 'พิมพ์ใจ รักไทย',
		initials: 'พจ',
		avatarColor: 'bg-amber-500',
		email: 'pimjai@example.com',
		phone: '085-333-4444',
		channel: 'LINE',
		channelBg: 'bg-green-500',
		labels: [{ text: 'ลูกค้าประจำ', variant: 'default' }],
		previousConversations: [{ id: 'prev4', summary: 'สอบถามโปรโมชั่น', date: '3 มี.ค.' }],
	},
	'5': {
		name: 'อนุชา มั่นคง',
		initials: 'อช',
		avatarColor: 'bg-violet-500',
		email: 'anucha@example.com',
		phone: '063-555-6666',
		channel: 'Facebook',
		channelBg: 'bg-blue-600',
		labels: [],
		previousConversations: [{ id: 'prev5', summary: 'สอบถามนโยบายคืนสินค้า', date: '25 ก.พ.' }],
	},
}

const sectionVariants = {
	hidden: { opacity: 0, y: 8 },
	visible: (i: number) => ({
		opacity: 1,
		y: 0,
		transition: { delay: i * 0.08, duration: 0.25, ease: 'easeOut' },
	}),
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
				<Skeleton className="h-4 w-24" />
			</div>
			<div className="space-y-2">
				<Skeleton className="h-3 w-12" />
				<div className="flex gap-1.5">
					<Skeleton className="h-5 w-12 rounded-full" />
					<Skeleton className="h-5 w-16 rounded-full" />
				</div>
			</div>
		</div>
	)
}

export function ContactPanel() {
	const activeConversationId = useConversationStore((s) => s.activeConversationId)
	const contact = activeConversationId ? mockContacts[activeConversationId] : null

	if (!contact) return null

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
				<Avatar className={cn('w-16 h-16', contact.avatarColor)}>
					<AvatarFallback className={cn('text-white text-lg font-medium', contact.avatarColor)}>
						{contact.initials}
					</AvatarFallback>
				</Avatar>
				<h3 className="text-sm font-semibold text-gray-900 mt-3">{contact.name}</h3>
				<p className="text-xs text-muted-foreground mt-0.5">{contact.email}</p>
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
					<div className="flex items-center gap-2.5">
						<Phone className="w-3.5 h-3.5 text-muted-foreground" />
						<span className="text-sm text-gray-700">{contact.phone}</span>
					</div>
					<div className="flex items-center gap-2.5">
						<Mail className="w-3.5 h-3.5 text-muted-foreground" />
						<span className="text-sm text-gray-700">{contact.email}</span>
					</div>
					<div className="flex items-center gap-2.5">
						<MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
						<span
							className={cn(
								'px-2 py-0.5 text-[10px] font-bold rounded text-white',
								contact.channelBg,
							)}
						>
							{contact.channel}
						</span>
					</div>
				</div>
			</motion.div>

			{/* Labels */}
			<motion.div
				custom={2}
				variants={sectionVariants}
				initial="hidden"
				animate="visible"
				className="py-4 border-b border-border"
			>
				<h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
					<Tag className="w-3 h-3" />
					แท็ก
				</h4>
				{contact.labels.length > 0 ? (
					<div className="flex flex-wrap gap-1.5">
						{contact.labels.map((label) => (
							<Badge key={label.text} variant={label.variant} className="rounded-full text-[10px]">
								{label.text}
							</Badge>
						))}
					</div>
				) : (
					<p className="text-xs text-muted-foreground">ยังไม่มีแท็ก</p>
				)}
			</motion.div>

			{/* Previous Conversations */}
			<motion.div
				custom={3}
				variants={sectionVariants}
				initial="hidden"
				animate="visible"
				className="py-4"
			>
				<h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
					สนทนาก่อนหน้า
				</h4>
				{contact.previousConversations.length > 0 ? (
					<div className="space-y-2">
						{contact.previousConversations.map((conv) => (
							<button
								key={conv.id}
								type="button"
								className="w-full text-left p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer"
							>
								<p className="text-xs text-gray-700 truncate">{conv.summary}</p>
								<p className="text-[10px] text-muted-foreground mt-0.5">{conv.date}</p>
							</button>
						))}
					</div>
				) : (
					<p className="text-xs text-muted-foreground">ไม่มีสนทนาก่อนหน้า</p>
				)}
			</motion.div>
		</div>
	)
}
