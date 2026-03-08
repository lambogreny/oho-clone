import type { LucideIcon } from 'lucide-react'
import {
	BarChart3,
	Bot,
	FolderOpen,
	MessageSquare,
	MessagesSquare,
	Send,
	ShoppingCart,
	Shuffle,
	Users,
	Zap,
} from 'lucide-react'

interface Feature {
	icon: LucideIcon
	title: string
	description: string
}

const features: Feature[] = [
	{
		icon: MessageSquare,
		title: 'Unified Inbox',
		description: 'รวมแชทจากทุกช่องทางในหน้าจอเดียว รู้ทันทีว่าข้อความมาจากไหน',
	},
	{
		icon: Bot,
		title: 'Chatbot Builder',
		description: 'สร้างบอทตอบอัตโนมัติแบบไม่ต้องเขียนโค้ด พร้อมส่งต่อให้คนได้ทันที',
	},
	{
		icon: Users,
		title: 'CRM & Contact',
		description: 'จัดเก็บข้อมูลลูกค้าอัตโนมัติ แท็ก แบ่งกลุ่ม ไม่มีข้อมูลหาย',
	},
	{
		icon: BarChart3,
		title: 'Dashboard & Analytics',
		description: 'ดูสถิติแชท เวลาตอบ ผลงานทีม real-time พร้อมออกรายงาน',
	},
	{
		icon: Shuffle,
		title: 'Auto-Assignment',
		description: 'กระจายแชทให้ทีมอัตโนมัติ ไม่ต้องแจกงานเอง ทุกคนได้แชทเท่ากัน',
	},
	{
		icon: Send,
		title: 'Broadcast',
		description: 'ส่งข้อความหาลูกค้าพร้อมกันทุกช่องทาง ประหยัดเวลา เข้าถึงเร็ว',
	},
	{
		icon: ShoppingCart,
		title: 'Order Management',
		description: 'สร้างและติดตามออเดอร์ภายในระบบ ไม่ต้องสลับแอปไปมา',
	},
	{
		icon: MessagesSquare,
		title: 'Group Chat Monitor',
		description: 'ติดตามกลุ่มแชทหลายกลุ่มจากหน้าจอเดียว ไม่พลาดทุกข้อความ',
	},
	{
		icon: FolderOpen,
		title: 'Media Library',
		description: 'คลังสื่อบน Cloud ใช้ร่วมกันทั้งทีม ส่งรูป วิดีโอ ไฟล์ได้ทันที',
	},
	{
		icon: Zap,
		title: 'Case Management',
		description: 'ติดตามสถานะเคสแบบ real-time มอบหมาย โอนย้าย ไม่มีตกหล่น',
	},
]

export function Features() {
	return (
		<section className="py-20 lg:py-28 bg-white">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* Section header — visual hierarchy: large title, muted subtitle */}
				<div className="text-center max-w-2xl mx-auto mb-16">
					<span className="inline-block text-sm font-semibold text-primary uppercase tracking-wider mb-3">
						ฟีเจอร์ครบจบในที่เดียว
					</span>
					<h2 className="text-3xl sm:text-4xl font-bold text-dark mb-4">ทุกเครื่องมือที่คุณต้องการ</h2>
					<p className="text-gray-600 text-lg">
						ครอบคลุมทุกขั้นตอนการจัดการแชทลูกค้า ตั้งแต่รับข้อความจนปิดการขาย
					</p>
				</div>

				{/* Feature grid — Gestalt proximity: grouped in consistent grid */}
				<div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
					{features.map((feature) => {
						const Icon = feature.icon
						return (
							<div
								key={feature.title}
								className="group p-6 rounded-[--radius-lg] border border-gray-200 bg-white hover:border-primary/30 hover:shadow-md transition-all duration-200"
							>
								<div className="w-12 h-12 rounded-[--radius-md] bg-primary-50 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors duration-200">
									<Icon className="w-6 h-6 text-primary group-hover:text-white transition-colors duration-200" />
								</div>
								<h3 className="text-sm font-semibold text-dark mb-2">{feature.title}</h3>
								<p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
							</div>
						)
					})}
				</div>
			</div>
		</section>
	)
}
