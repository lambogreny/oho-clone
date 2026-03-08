import { Facebook, Globe, Instagram, MessageCircle } from 'lucide-react'

const channels = [
	{
		name: 'Facebook Messenger',
		icon: Facebook,
		color: 'bg-blue-500',
		description: 'Messenger & Comments',
	},
	{
		name: 'LINE Official',
		icon: MessageCircle,
		color: 'bg-green-500',
		description: 'LINE OA Chat',
	},
	{
		name: 'Instagram',
		icon: Instagram,
		color: 'bg-pink-500',
		description: 'DM & Story Reply',
	},
	{
		name: 'TikTok',
		icon: MessageCircle,
		color: 'bg-gray-900',
		description: 'TikTok Messages',
	},
	{
		name: 'Website Chat',
		icon: Globe,
		color: 'bg-primary',
		description: 'Live Chat Widget',
	},
]

export function Channels() {
	return (
		<section className="py-20 lg:py-28 bg-gray-50">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="text-center max-w-2xl mx-auto mb-16">
					<span className="inline-block text-sm font-semibold text-primary uppercase tracking-wider mb-3">
						ช่องทางที่รองรับ
					</span>
					<h2 className="text-3xl sm:text-4xl font-bold text-dark mb-4">เชื่อมต่อทุกแพลตฟอร์ม</h2>
					<p className="text-gray-600 text-lg">รองรับทุกช่องทางยอดนิยมในไทย เชื่อมต่อง่ายภายในไม่กี่นาที</p>
				</div>

				{/* Channel cards — centered, evenly spaced */}
				<div className="flex flex-wrap justify-center gap-6">
					{channels.map((channel) => {
						const Icon = channel.icon
						return (
							<div
								key={channel.name}
								className="flex flex-col items-center gap-3 p-6 bg-white rounded-[--radius-xl] shadow-sm border border-gray-200 hover:shadow-md hover:border-primary/20 transition-all duration-200 w-40"
							>
								<div
									className={`w-14 h-14 rounded-[--radius-lg] ${channel.color} flex items-center justify-center`}
								>
									<Icon className="w-7 h-7 text-white" />
								</div>
								<div className="text-center">
									<div className="text-sm font-semibold text-dark">{channel.name}</div>
									<div className="text-xs text-gray-400 mt-0.5">{channel.description}</div>
								</div>
							</div>
						)
					})}
				</div>
			</div>
		</section>
	)
}
