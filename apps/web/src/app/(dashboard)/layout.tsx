'use client'

import {
	BarChart3,
	Bot,
	ChevronLeft,
	ChevronRight,
	LogOut,
	MessageSquare,
	Send,
	Settings,
	Users,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { trpc } from '@/lib/trpc/client'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth'

interface NavItem {
	href: string
	icon: React.ComponentType<{ className?: string }>
	label: string
	badge?: number
}

const mainNav: NavItem[] = [
	{ href: '/app', icon: MessageSquare, label: 'แชท' },
	{ href: '/app/contacts', icon: Users, label: 'รายชื่อ' },
	{ href: '/app/broadcast', icon: Send, label: 'Broadcast' },
	{ href: '/app/chatbot', icon: Bot, label: 'Chatbot' },
	{ href: '/app/dashboard', icon: BarChart3, label: 'Dashboard' },
]

const bottomNav: NavItem[] = [{ href: '/app/settings', icon: Settings, label: 'ตั้งค่า' }]

function getInitials(name: string): string {
	const parts = name.trim().split(/\s+/)
	if (parts.length >= 2) return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`
	return name.slice(0, 2)
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	const pathname = usePathname()
	const router = useRouter()
	const [collapsed, setCollapsed] = useState(false)
	const { user, clearAuth } = useAuthStore()

	const signOut = trpc.auth.signOut.useMutation({
		onSuccess: () => {
			clearAuth()
			toast.success('ออกจากระบบสำเร็จ')
			router.push('/login')
		},
		onError: () => {
			clearAuth()
			router.push('/login')
		},
	})

	const isActive = (href: string) =>
		href === '/app' ? pathname === '/app' : pathname.startsWith(href)

	const renderNavItem = (item: NavItem) => {
		const active = isActive(item.href)
		const Icon = item.icon

		return (
			<Link
				key={item.href}
				href={item.href}
				title={collapsed ? item.label : undefined}
				className={cn(
					'relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
					active
						? 'bg-sidebar-active text-white'
						: 'text-sidebar-foreground hover:text-white hover:bg-sidebar-hover',
				)}
			>
				<Icon className="w-5 h-5 shrink-0" />
				{!collapsed && (
					<>
						<span className="truncate">{item.label}</span>
						{item.badge != null && item.badge > 0 && (
							<Badge
								variant="destructive"
								className="ml-auto h-5 min-w-5 px-1.5 text-[10px] flex items-center justify-center"
							>
								{item.badge}
							</Badge>
						)}
					</>
				)}
				{collapsed && item.badge != null && item.badge > 0 && (
					<span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-white text-[9px] font-bold rounded-full flex items-center justify-center">
						{item.badge}
					</span>
				)}
			</Link>
		)
	}

	const displayName = user?.displayName ?? user?.name ?? 'User'
	const initials = getInitials(displayName)
	const role = user?.role ?? 'Agent'

	return (
		<div className="flex h-screen overflow-hidden bg-muted/30">
			{/* Sidebar */}
			<aside
				className={cn(
					'bg-sidebar flex flex-col shrink-0 transition-all duration-200',
					collapsed ? 'w-16' : 'w-56',
				)}
			>
				{/* Logo */}
				<div
					className={cn(
						'flex items-center h-14 border-b border-white/10 shrink-0',
						collapsed ? 'justify-center px-2' : 'px-4 gap-2.5',
					)}
				>
					<div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
						<MessageSquare className="w-4 h-4 text-white" />
					</div>
					{!collapsed && <span className="text-white font-bold text-sm">OHO Chat</span>}
				</div>

				{/* Main nav */}
				<nav className={cn('flex-1 py-3 space-y-1', collapsed ? 'px-2' : 'px-3')}>
					{mainNav.map(renderNavItem)}
				</nav>

				{/* Bottom section */}
				<div className={cn('border-t border-white/10 py-3 space-y-1', collapsed ? 'px-2' : 'px-3')}>
					{bottomNav.map(renderNavItem)}

					{/* Sign out */}
					<button
						type="button"
						onClick={() => signOut.mutate()}
						disabled={signOut.isPending}
						className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground hover:text-white hover:bg-sidebar-hover transition-all duration-150 w-full cursor-pointer"
					>
						<LogOut className="w-5 h-5 shrink-0" />
						{!collapsed && <span className="truncate">ออกจากระบบ</span>}
					</button>

					{/* Collapse toggle */}
					<button
						type="button"
						onClick={() => setCollapsed(!collapsed)}
						className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground hover:text-white hover:bg-sidebar-hover transition-all duration-150 w-full cursor-pointer"
						aria-label={collapsed ? 'ขยายเมนู' : 'ย่อเมนู'}
					>
						{collapsed ? (
							<ChevronRight className="w-5 h-5 shrink-0" />
						) : (
							<>
								<ChevronLeft className="w-5 h-5 shrink-0" />
								<span className="truncate">ย่อเมนู</span>
							</>
						)}
					</button>

					{/* User */}
					<div
						className={cn(
							'flex items-center gap-3 px-3 py-2 rounded-lg',
							collapsed ? 'justify-center' : '',
						)}
					>
						<Avatar className="w-8 h-8">
							<AvatarFallback className="bg-gray-600 text-white text-xs">{initials}</AvatarFallback>
						</Avatar>
						{!collapsed && (
							<div className="flex-1 min-w-0">
								<div className="text-xs font-medium text-white truncate">{displayName}</div>
								<div className="text-[10px] text-sidebar-foreground truncate">{role}</div>
							</div>
						)}
					</div>
				</div>
			</aside>

			{/* Main Content */}
			<main className="flex-1 overflow-hidden">{children}</main>
		</div>
	)
}
