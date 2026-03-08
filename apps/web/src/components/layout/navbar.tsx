'use client'

import { ChevronDown, Menu, X } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface NavChild {
	label: string
	href: string
	description?: string
}

interface NavItem {
	label: string
	href: string
	children?: NavChild[]
}

const navItems: NavItem[] = [
	{
		label: 'ฟีเจอร์',
		href: '/features',
		children: [
			{ label: 'Unified Inbox', href: '/features/inbox', description: 'รวมทุกแชทในหน้าจอเดียว' },
			{ label: 'Chatbot', href: '/features/chatbot', description: 'สร้างบอทตอบอัตโนมัติ' },
			{ label: 'CRM', href: '/features/crm', description: 'จัดการข้อมูลลูกค้า' },
			{ label: 'Dashboard', href: '/features/dashboard', description: 'วิเคราะห์ผลการทำงาน' },
			{ label: 'Auto-Assignment', href: '/features/auto-assign', description: 'กระจายแชทอัตโนมัติ' },
			{ label: 'Broadcast', href: '/features/broadcast', description: 'ส่งข้อความหาลูกค้าพร้อมกัน' },
		],
	},
	{
		label: 'โซลูชัน',
		href: '/solutions',
		children: [
			{ label: 'E-Commerce', href: '/solutions/ecommerce' },
			{ label: 'Healthcare', href: '/solutions/healthcare' },
			{ label: 'Financial Services', href: '/solutions/finance' },
		],
	},
	{ label: 'ราคา', href: '/pricing' },
	{ label: 'บทความ', href: '/blog' },
]

function NavDropdownItem({ item }: { item: NavItem }) {
	const [open, setOpen] = useState(false)

	if (!item.children) {
		return (
			<Link
				href={item.href}
				className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary rounded-lg hover:bg-gray-50 transition-colors"
			>
				{item.label}
			</Link>
		)
	}

	return (
		<button
			type="button"
			className="relative flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
			onMouseEnter={() => setOpen(true)}
			onMouseLeave={() => setOpen(false)}
			onFocus={() => setOpen(true)}
			onBlur={() => setOpen(false)}
			aria-expanded={open}
			aria-haspopup="true"
		>
			{item.label}
			<ChevronDown className="w-3.5 h-3.5" />

			{open && (
				<div className="absolute top-full left-0 pt-1 w-64 z-50">
					<div className="bg-white rounded-xl shadow-lg border border-gray-200 p-2">
						{item.children.map((child) => (
							<Link
								key={child.label}
								href={child.href}
								className="block px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
							>
								<div className="text-sm font-medium text-gray-900">{child.label}</div>
								{child.description && (
									<div className="text-xs text-gray-500 mt-0.5">{child.description}</div>
								)}
							</Link>
						))}
					</div>
				</div>
			)}
		</button>
	)
}

export function Navbar() {
	const [mobileOpen, setMobileOpen] = useState(false)

	return (
		<header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-xs">
			<nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-16">
					{/* Logo */}
					<Link href="/" className="flex items-center gap-2">
						<div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
							<span className="text-white font-bold text-sm">O</span>
						</div>
						<span className="text-xl font-bold text-gray-900">
							oho<span className="text-primary">.chat</span>
						</span>
					</Link>

					{/* Desktop Nav */}
					<div className="hidden lg:flex items-center gap-1">
						{navItems.map((item) => (
							<NavDropdownItem key={item.label} item={item} />
						))}
					</div>

					{/* CTA */}
					<div className="hidden lg:flex items-center gap-3">
						<Link href="/login">
							<Button variant="ghost" size="sm">
								เข้าสู่ระบบ
							</Button>
						</Link>
						<Link href="/register">
							<Button size="sm">ทดลองใช้ฟรี</Button>
						</Link>
					</div>

					{/* Mobile toggle */}
					<button
						type="button"
						className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
						onClick={() => setMobileOpen(!mobileOpen)}
						aria-label={mobileOpen ? 'ปิดเมนู' : 'เปิดเมนู'}
					>
						{mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
					</button>
				</div>

				{/* Mobile menu */}
				{mobileOpen && (
					<div className="lg:hidden border-t border-gray-200 py-4 space-y-2">
						{navItems.map((item) => (
							<div key={item.label}>
								<Link
									href={item.href}
									className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
									onClick={() => setMobileOpen(false)}
								>
									{item.label}
								</Link>
								{item.children && (
									<div className="pl-4 space-y-1">
										{item.children.map((child) => (
											<Link
												key={child.label}
												href={child.href}
												className="block px-3 py-1.5 text-sm text-gray-500 hover:text-gray-900"
												onClick={() => setMobileOpen(false)}
											>
												{child.label}
											</Link>
										))}
									</div>
								)}
							</div>
						))}
						<div className="pt-3 border-t border-gray-200 flex flex-col gap-2 px-3">
							<Link href="/login">
								<Button variant="outline" className="w-full">
									เข้าสู่ระบบ
								</Button>
							</Link>
							<Link href="/register">
								<Button className="w-full">ทดลองใช้ฟรี</Button>
							</Link>
						</div>
					</div>
				)}
			</nav>
		</header>
	)
}
