import { Check } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Plan {
	name: string
	price: string
	period: string
	description: string
	features: string[]
	popular?: boolean
	cta: string
}

const plans: Plan[] = [
	{
		name: 'Free Trial',
		price: '฿0',
		period: '14 วัน',
		description: 'ทดลองใช้ฟรี ไม่ต้องผูกบัตร',
		features: ['2 ช่องทาง', '5 สมาชิก', '5 ทีม', 'ประวัติแชท 14 วัน', 'Chatbot พื้นฐาน'],
		cta: 'เริ่มทดลองใช้ฟรี',
	},
	{
		name: 'Pro',
		price: '฿1,000',
		period: '/เดือน',
		description: 'สำหรับธุรกิจขนาดเล็ก',
		features: ['2 ช่องทาง', '5 สมาชิก', '3 ทีม', 'ประวัติแชท 1 ปี', 'Chatbot + Auto-assign', 'Dashboard'],
		cta: 'ซื้อเลย',
	},
	{
		name: 'Corporate',
		price: '฿4,000',
		period: '/เดือน',
		description: 'สำหรับธุรกิจที่กำลังเติบโต',
		features: [
			'4 ช่องทาง',
			'15 สมาชิก',
			'10 ทีม',
			'ประวัติแชท 1 ปี',
			'ทุกฟีเจอร์ใน Pro',
			'Broadcast',
			'Order Management',
			'Priority Support',
		],
		popular: true,
		cta: 'ซื้อเลย',
	},
	{
		name: 'Enterprise',
		price: '฿15,000',
		period: '/เดือน',
		description: 'สำหรับองค์กรขนาดใหญ่',
		features: [
			'40 ช่องทาง+สมาชิก',
			'10 ทีม',
			'ประวัติแชท 3 ปี',
			'ทุกฟีเจอร์',
			'API Integration',
			'Custom Setup',
			'Dedicated Support',
		],
		cta: 'ติดต่อเรา',
	},
]

export function Pricing() {
	return (
		<section className="py-20 lg:py-28 bg-white">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="text-center max-w-2xl mx-auto mb-16">
					<span className="inline-block text-sm font-semibold text-primary uppercase tracking-wider mb-3">
						ราคา
					</span>
					<h2 className="text-3xl sm:text-4xl font-bold text-dark mb-4">เลือกแพ็กเกจที่เหมาะกับคุณ</h2>
					<p className="text-gray-600 text-lg">เริ่มต้นฟรี ไม่ต้องผูกบัตร อัปเกรดเมื่อพร้อม</p>
				</div>

				{/* Hick's Law: 4 options max, clear differentiation */}
				<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
					{plans.map((plan) => (
						<div
							key={plan.name}
							className={`relative flex flex-col p-6 rounded-[--radius-xl] border transition-shadow duration-200 ${
								plan.popular
									? 'border-primary shadow-lg ring-1 ring-primary/20'
									: 'border-gray-200 hover:shadow-md'
							}`}
						>
							{plan.popular && (
								<div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
									ยอดนิยม
								</div>
							)}

							<div className="mb-6">
								<h3 className="text-lg font-semibold text-dark">{plan.name}</h3>
								<p className="text-sm text-gray-500 mt-1">{plan.description}</p>
							</div>

							<div className="mb-6">
								<span className="text-4xl font-bold text-dark font-[family-name:var(--font-ubuntu)]">
									{plan.price}
								</span>
								<span className="text-sm text-gray-500">{plan.period}</span>
							</div>

							<ul className="space-y-3 mb-8 flex-1">
								{plan.features.map((feature) => (
									<li key={feature} className="flex items-start gap-2">
										<Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
										<span className="text-sm text-gray-600">{feature}</span>
									</li>
								))}
							</ul>

							<Link href={plan.name === 'Enterprise' ? '/contact' : '/register'}>
								<Button variant={plan.popular ? 'default' : 'outline'} className="w-full">
									{plan.cta}
								</Button>
							</Link>
						</div>
					))}
				</div>

				<p className="text-center text-sm text-gray-400 mt-8">
					ราคายังไม่รวม VAT · เรียกเก็บรายไตรมาส (4 เดือน) หรือรายปี (ลด 10%)
				</p>
			</div>
		</section>
	)
}
