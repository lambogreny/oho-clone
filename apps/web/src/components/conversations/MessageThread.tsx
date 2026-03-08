'use client'

import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, CheckCheck, Paperclip, Send, Smile } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useConversationStore } from '@/stores/conversation'

type MessageDirection = 'inbound' | 'outbound'
type MessageStatus = 'sent' | 'delivered' | 'read'

interface Message {
	id: string
	text: string
	direction: MessageDirection
	timestamp: Date
	status?: MessageStatus
}

const contactInfo: Record<
	string,
	{ name: string; channel: string; channelColor: string; channelBg: string }
> = {
	'1': {
		name: 'สมชาย ใจดี',
		channel: 'LINE',
		channelColor: 'text-white',
		channelBg: 'bg-green-500',
	},
	'2': {
		name: 'วิภาดา สุขสม',
		channel: 'Facebook',
		channelColor: 'text-white',
		channelBg: 'bg-blue-600',
	},
	'3': {
		name: 'ธนพล เจริญสุข',
		channel: 'Instagram',
		channelColor: 'text-white',
		channelBg: 'bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-400',
	},
	'4': {
		name: 'พิมพ์ใจ รักไทย',
		channel: 'LINE',
		channelColor: 'text-white',
		channelBg: 'bg-green-500',
	},
	'5': {
		name: 'อนุชา มั่นคง',
		channel: 'Facebook',
		channelColor: 'text-white',
		channelBg: 'bg-blue-600',
	},
}

const today = new Date()

const mockMessages: Message[] = [
	{
		id: 'm1',
		text: 'สวัสดีครับ สนใจสินค้าตัวนี้',
		direction: 'inbound',
		timestamp: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 15),
	},
	{
		id: 'm2',
		text: 'สวัสดีค่ะ ยินดีให้บริการค่ะ สินค้าตัวไหนคะ?',
		direction: 'outbound',
		timestamp: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 16),
		status: 'read',
	},
	{
		id: 'm3',
		text: 'รุ่น Premium ครับ ราคาเท่าไหร่?',
		direction: 'inbound',
		timestamp: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 18),
	},
	{
		id: 'm4',
		text: 'รุ่น Premium ราคา 2,990 บาทค่ะ ตอนนี้มีโปรลด 10% ด้วยนะคะ',
		direction: 'outbound',
		timestamp: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 20),
		status: 'read',
	},
	{
		id: 'm5',
		text: 'มีสีอะไรบ้างครับ?',
		direction: 'inbound',
		timestamp: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 5),
	},
	{
		id: 'm6',
		text: 'มีสีดำ ขาว และน้ำเงินค่ะ',
		direction: 'outbound',
		timestamp: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 7),
		status: 'delivered',
	},
	{
		id: 'm7',
		text: 'ส่งฟรีไหมครับ?',
		direction: 'inbound',
		timestamp: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 30),
	},
	{
		id: 'm8',
		text: 'สนใจสินค้าตัวนี้ครับ ราคาเท่าไหร่?',
		direction: 'inbound',
		timestamp: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 32),
	},
]

function StatusIcon({ status }: { status?: MessageStatus }) {
	if (!status) return null
	if (status === 'sent') return <Check className="w-3 h-3 text-white/60" />
	if (status === 'delivered') return <CheckCheck className="w-3 h-3 text-white/60" />
	return <CheckCheck className="w-3 h-3 text-white" />
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

	const contact = activeConversationId ? contactInfo[activeConversationId] : null

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [])

	if (!contact) return null

	const handleSend = () => {
		if (!input.trim()) return
		setInput('')
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault()
			handleSend()
		}
	}

	const dateLabel = format(today, 'd MMMM yyyy', { locale: th })

	return (
		<>
			{/* Header */}
			<div className="h-14 px-4 flex items-center justify-between border-b border-border shrink-0">
				<div className="flex items-center gap-3">
					<h3 className="text-sm font-semibold text-gray-900">{contact.name}</h3>
					<span
						className={cn(
							'px-2 py-0.5 text-[10px] font-bold rounded',
							contact.channelBg,
							contact.channelColor,
						)}
					>
						{contact.channel}
					</span>
				</div>
				<Badge variant="success" className="rounded-full text-[10px]">
					เปิดอยู่
				</Badge>
			</div>

			{/* Messages */}
			<div className="flex-1 overflow-y-auto p-4 space-y-3">
				{/* Date separator */}
				<div className="flex items-center gap-3 my-4">
					<div className="flex-1 h-px bg-border" />
					<span className="text-[11px] text-muted-foreground font-medium">{dateLabel}</span>
					<div className="flex-1 h-px bg-border" />
				</div>

				<AnimatePresence initial={false}>
					{mockMessages.map((msg) => (
						<motion.div
							key={msg.id}
							initial={{ opacity: 0, y: 12, scale: 0.95 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							transition={{ duration: 0.2, ease: 'easeOut' }}
							className={cn('flex', msg.direction === 'outbound' ? 'justify-end' : 'justify-start')}
						>
							<div
								className={cn(
									'max-w-[70%] px-3.5 py-2 rounded-2xl',
									msg.direction === 'outbound'
										? 'bg-primary text-primary-foreground rounded-br-md'
										: 'bg-gray-100 text-gray-900 rounded-bl-md',
								)}
							>
								<p className="text-sm leading-relaxed">{msg.text}</p>
								<div
									className={cn(
										'flex items-center gap-1 mt-1',
										msg.direction === 'outbound' ? 'justify-end' : 'justify-start',
									)}
								>
									<span
										className={cn(
											'text-[10px]',
											msg.direction === 'outbound' ? 'text-white/70' : 'text-muted-foreground',
										)}
									>
										{format(msg.timestamp, 'HH:mm')}
									</span>
									{msg.direction === 'outbound' && <StatusIcon status={msg.status} />}
								</div>
							</div>
						</motion.div>
					))}
				</AnimatePresence>
				<div ref={messagesEndRef} />
			</div>

			{/* Input Area */}
			<div className="border-t border-border p-3 shrink-0">
				<div className="flex items-end gap-2">
					<div className="flex items-center gap-0.5">
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
						disabled={!input.trim()}
						className="h-9 w-9 shrink-0"
					>
						<Send className="w-4 h-4" />
					</Button>
				</div>
			</div>
		</>
	)
}
