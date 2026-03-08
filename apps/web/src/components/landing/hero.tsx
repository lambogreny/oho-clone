import { Play } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function Hero() {
	return (
		<section className="relative overflow-hidden bg-gradient-to-b from-primary-50 to-white">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
				<div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
					{/* Copy — left side */}
					<div className="max-w-xl">
						{/* Social proof badge */}
						<div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-1.5 shadow-sm border border-gray-200 mb-6">
							<span className="w-2 h-2 rounded-full bg-success animate-pulse" />
							<span className="text-xs font-medium text-gray-600">4,255+ ธุรกิจไว้วางใจ</span>
						</div>

						<h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold leading-[1.1] text-dark mb-6">
							รวมทุกแชท
							<br />
							<span className="text-primary">ในหน้าจอเดียว</span>
						</h1>

						<p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-[50ch]">
							จัดการแชทจาก Facebook, LINE, Instagram, TikTok ในที่เดียว ตอบไว ปิดการขายได้มากขึ้น 200%
						</p>

						{/* CTA group — Fitts's Law: large, prominent primary action */}
						<div className="flex flex-wrap items-center gap-4">
							<Link href="/register">
								<Button variant="default" size="lg">
									ทดลองใช้ฟรี 14 วัน
								</Button>
							</Link>
							<button
								type="button"
								className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors cursor-pointer"
							>
								<span className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-md border border-gray-200">
									<Play className="w-4 h-4 text-primary ml-0.5" />
								</span>
								ดูวิดีโอแนะนำ
							</button>
						</div>

						{/* Channel logos */}
						<div className="mt-10 pt-8 border-t border-gray-200">
							<p className="text-xs text-gray-400 uppercase tracking-wider mb-4">รองรับทุกช่องทาง</p>
							<div className="flex items-center gap-6">
								{['Facebook', 'LINE', 'Instagram', 'TikTok', 'Web Chat'].map((channel) => (
									<div
										key={channel}
										className="flex items-center justify-center w-10 h-10 rounded-[--radius-md] bg-white shadow-xs border border-gray-100"
										title={channel}
									>
										<span className="text-xs font-bold text-gray-400">{channel[0]}</span>
									</div>
								))}
							</div>
						</div>
					</div>

					{/* Hero image — right side */}
					<div className="relative">
						<div className="relative rounded-[--radius-xl] shadow-xl overflow-hidden border border-gray-200 bg-white">
							{/* Dashboard mockup placeholder */}
							<div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
								<div className="w-full max-w-md p-6 space-y-4">
									{/* Fake inbox UI */}
									<div className="flex items-center gap-3 p-3 bg-white rounded-[--radius-md] shadow-xs border border-gray-100">
										<div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
											FB
										</div>
										<div className="flex-1 min-w-0">
											<div className="text-sm font-medium text-gray-900 truncate">สมชาย ใจดี</div>
											<div className="text-xs text-gray-500 truncate">
												สนใจสินค้าตัวนี้ครับ ราคาเท่าไหร่...
											</div>
										</div>
										<span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">
											3
										</span>
									</div>

									<div className="flex items-center gap-3 p-3 bg-primary-50 rounded-[--radius-md] border border-primary/20">
										<div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-600">
											LN
										</div>
										<div className="flex-1 min-w-0">
											<div className="text-sm font-medium text-gray-900 truncate">วิภา รักงาน</div>
											<div className="text-xs text-gray-500 truncate">
												อยากสั่งซื้อ 5 ชิ้นค่ะ ส่งได้เมื่อไหร่...
											</div>
										</div>
										<span className="flex-shrink-0 w-5 h-5 rounded-full bg-success text-white text-[10px] font-bold flex items-center justify-center">
											1
										</span>
									</div>

									<div className="flex items-center gap-3 p-3 bg-white rounded-[--radius-md] shadow-xs border border-gray-100">
										<div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-xs font-bold text-pink-600">
											IG
										</div>
										<div className="flex-1 min-w-0">
											<div className="text-sm font-medium text-gray-900 truncate">ณัฐพล Shop</div>
											<div className="text-xs text-gray-500 truncate">
												รีวิวสินค้าดีมากเลยครับ ขอบคุณ...
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Floating stat cards */}
						<div className="absolute -bottom-4 -left-4 bg-white rounded-[--radius-lg] shadow-lg border border-gray-200 px-4 py-3">
							<div className="text-2xl font-bold text-primary">200%</div>
							<div className="text-xs text-gray-500">เพิ่มยอดตอบแชท</div>
						</div>
						<div className="absolute -top-4 -right-4 bg-white rounded-[--radius-lg] shadow-lg border border-gray-200 px-4 py-3">
							<div className="text-2xl font-bold text-success">193M+</div>
							<div className="text-xs text-gray-500">ข้อความที่ส่งผ่านระบบ</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	)
}
