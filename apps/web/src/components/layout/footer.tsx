import Link from 'next/link'

const footerSections = [
	{
		title: 'ผลิตภัณฑ์',
		links: [
			{ label: 'Unified Inbox', href: '/features/inbox' },
			{ label: 'Chatbot', href: '/features/chatbot' },
			{ label: 'CRM', href: '/features/crm' },
			{ label: 'Dashboard', href: '/features/dashboard' },
			{ label: 'Broadcast', href: '/features/broadcast' },
		],
	},
	{
		title: 'โซลูชัน',
		links: [
			{ label: 'E-Commerce', href: '/solutions/ecommerce' },
			{ label: 'Healthcare', href: '/solutions/healthcare' },
			{ label: 'Finance', href: '/solutions/finance' },
			{ label: 'Logistics', href: '/solutions/logistics' },
		],
	},
	{
		title: 'ทรัพยากร',
		links: [
			{ label: 'บทความ', href: '/blog' },
			{ label: 'ราคา', href: '/pricing' },
			{ label: 'คู่มือการใช้งาน', href: '/docs' },
			{ label: 'API Documentation', href: '/api-docs' },
		],
	},
	{
		title: 'บริษัท',
		links: [
			{ label: 'เกี่ยวกับเรา', href: '/about' },
			{ label: 'ติดต่อเรา', href: '/contact' },
			{ label: 'นโยบายความเป็นส่วนตัว', href: '/privacy' },
			{ label: 'เงื่อนไขการใช้งาน', href: '/terms' },
		],
	},
]

export function Footer() {
	return (
		<footer className="bg-dark text-white">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
				<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
					{/* Brand column */}
					<div className="col-span-2 md:col-span-4 lg:col-span-1 mb-4 lg:mb-0">
						<div className="flex items-center gap-2 mb-4">
							<div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
								<span className="text-white font-bold text-sm">O</span>
							</div>
							<span className="text-xl font-bold font-[family-name:var(--font-ubuntu)]">
								oho<span className="text-primary-light">.chat</span>
							</span>
						</div>
						<p className="text-sm text-gray-400 leading-relaxed">
							รวมทุกแชทไว้ในที่เดียว
							<br />
							จัดการง่าย ตอบไว ปิดการขายได้มากขึ้น
						</p>
					</div>

					{footerSections.map((section) => (
						<div key={section.title}>
							<h3 className="text-sm font-semibold mb-4">{section.title}</h3>
							<ul className="space-y-2.5">
								{section.links.map((link) => (
									<li key={link.label}>
										<Link
											href={link.href}
											className="text-sm text-gray-400 hover:text-white transition-colors"
										>
											{link.label}
										</Link>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>

				<div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
					<p className="text-sm text-gray-500">© 2026 Oho Chat. All rights reserved.</p>
					<div className="flex items-center gap-6">
						<Link
							href="/privacy"
							className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
						>
							Privacy
						</Link>
						<Link
							href="/terms"
							className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
						>
							Terms
						</Link>
					</div>
				</div>
			</div>
		</footer>
	)
}
