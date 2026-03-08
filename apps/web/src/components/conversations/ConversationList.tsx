'use client'

import { formatDistanceToNow } from 'date-fns'
import { th } from 'date-fns/locale'
import { Search } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useConversationStore } from '@/stores/conversation'

type Channel = 'line' | 'facebook' | 'instagram'
type FilterTab = 'all' | 'mine' | 'unassigned'

interface Conversation {
	id: string
	contactName: string
	contactInitials: string
	avatarColor: string
	lastMessage: string
	timestamp: Date
	channel: Channel
	unreadCount: number
	assignedTo: string | null
}

const channelConfig: Record<Channel, { label: string; color: string; bg: string }> = {
	line: { label: 'LINE', color: 'text-white', bg: 'bg-green-500' },
	facebook: { label: 'FB', color: 'text-white', bg: 'bg-blue-600' },
	instagram: {
		label: 'IG',
		color: 'text-white',
		bg: 'bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-400',
	},
}

const mockConversations: Conversation[] = [
	{
		id: '1',
		contactName: 'สมชาย ใจดี',
		contactInitials: 'สช',
		avatarColor: 'bg-blue-500',
		lastMessage: 'สนใจสินค้าตัวนี้ครับ ราคาเท่าไหร่?',
		timestamp: new Date(Date.now() - 2 * 60 * 1000),
		channel: 'line',
		unreadCount: 3,
		assignedTo: 'me',
	},
	{
		id: '2',
		contactName: 'วิภาดา สุขสม',
		contactInitials: 'วภ',
		avatarColor: 'bg-pink-500',
		lastMessage: 'ส่งของวันไหนคะ? รอมา 3 วันแล้ว',
		timestamp: new Date(Date.now() - 15 * 60 * 1000),
		channel: 'facebook',
		unreadCount: 1,
		assignedTo: 'me',
	},
	{
		id: '3',
		contactName: 'ธนพล เจริญสุข',
		contactInitials: 'ธพ',
		avatarColor: 'bg-emerald-500',
		lastMessage: 'มีสีอื่นไหมครับ?',
		timestamp: new Date(Date.now() - 45 * 60 * 1000),
		channel: 'instagram',
		unreadCount: 0,
		assignedTo: null,
	},
	{
		id: '4',
		contactName: 'พิมพ์ใจ รักไทย',
		contactInitials: 'พจ',
		avatarColor: 'bg-amber-500',
		lastMessage: 'ขอบคุณค่ะ ได้รับของเรียบร้อย',
		timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
		channel: 'line',
		unreadCount: 0,
		assignedTo: 'me',
	},
	{
		id: '5',
		contactName: 'อนุชา มั่นคง',
		contactInitials: 'อช',
		avatarColor: 'bg-violet-500',
		lastMessage: 'สอบถามเรื่องการรับประกันสินค้าครับ',
		timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
		channel: 'facebook',
		unreadCount: 2,
		assignedTo: null,
	},
]

export function ConversationList() {
	const [search, setSearch] = useState('')
	const [activeTab, setActiveTab] = useState<FilterTab>('all')
	const { activeConversationId, setActiveConversation } = useConversationStore()

	const filteredConversations = mockConversations.filter((conv) => {
		if (search && !conv.contactName.includes(search) && !conv.lastMessage.includes(search)) {
			return false
		}
		if (activeTab === 'mine') return conv.assignedTo === 'me'
		if (activeTab === 'unassigned') return conv.assignedTo === null
		return true
	})

	const tabs: { key: FilterTab; label: string }[] = [
		{ key: 'all', label: 'ทั้งหมด' },
		{ key: 'mine', label: 'ของฉัน' },
		{ key: 'unassigned', label: 'ยังไม่มอบหมาย' },
	]

	return (
		<>
			{/* Header */}
			<div className="p-4 border-b border-border">
				<h2 className="text-base font-semibold text-gray-900 mb-3">แชท</h2>

				{/* Search */}
				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
					<input
						type="text"
						placeholder="ค้นหา..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
					/>
				</div>

				{/* Filter Tabs */}
				<div className="flex gap-1 mt-3">
					{tabs.map((tab) => (
						<button
							key={tab.key}
							onClick={() => setActiveTab(tab.key)}
							className={cn(
								'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
								activeTab === tab.key
									? 'bg-primary text-primary-foreground'
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
				{filteredConversations.map((conv) => (
					<button
						key={conv.id}
						onClick={() => setActiveConversation(conv.id)}
						className={cn(
							'w-full px-4 py-3 flex items-start gap-3 text-left hover:bg-gray-50 transition-colors border-b border-border/50',
							activeConversationId === conv.id && 'bg-blue-50 hover:bg-blue-50',
						)}
					>
						{/* Avatar */}
						<div
							className={cn(
								'w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0',
								conv.avatarColor,
							)}
						>
							{conv.contactInitials}
						</div>

						{/* Content */}
						<div className="flex-1 min-w-0">
							<div className="flex items-center justify-between gap-2">
								<span className="text-sm font-medium text-gray-900 truncate">
									{conv.contactName}
								</span>
								<span className="text-[11px] text-muted-foreground shrink-0">
									{formatDistanceToNow(conv.timestamp, { addSuffix: false, locale: th })}
								</span>
							</div>
							<div className="flex items-center justify-between gap-2 mt-0.5">
								<p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
								<div className="flex items-center gap-1.5 shrink-0">
									{/* Channel Badge */}
									<span
										className={cn(
											'px-1.5 py-0.5 text-[9px] font-bold rounded',
											channelConfig[conv.channel].bg,
											channelConfig[conv.channel].color,
										)}
									>
										{channelConfig[conv.channel].label}
									</span>
									{/* Unread Badge */}
									{conv.unreadCount > 0 && (
										<span className="w-5 h-5 bg-primary text-primary-foreground text-[10px] font-medium rounded-full flex items-center justify-center">
											{conv.unreadCount}
										</span>
									)}
								</div>
							</div>
						</div>
					</button>
				))}
			</div>
		</>
	)
}
