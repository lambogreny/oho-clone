import { MessageSquare } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen flex">
			{/* Left panel — branding */}
			<div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
				<div className="relative z-10 flex flex-col justify-between p-12 text-white">
					{/* Logo */}
					<div className="flex items-center gap-2.5">
						<div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
							<MessageSquare className="w-5 h-5 text-white" />
						</div>
						<span className="text-xl font-bold">OHO Chat</span>
					</div>

					{/* Hero copy */}
					<div className="max-w-md">
						<h1 className="text-4xl font-bold leading-tight mb-4">
							รวมทุกแชท
							<br />
							จบในหน้าจอเดียว
						</h1>
						<p className="text-white/80 text-lg leading-relaxed">
							จัดการแชทจาก Facebook, LINE, Instagram, TikTok ในที่เดียว ตอบไว ปิดการขายได้มากขึ้น 200%
						</p>

						{/* Stats */}
						<div className="flex gap-8 mt-8">
							<div>
								<div className="text-2xl font-bold">4,255+</div>
								<div className="text-sm text-white/60">ธุรกิจไว้วางใจ</div>
							</div>
							<div>
								<div className="text-2xl font-bold">193M+</div>
								<div className="text-sm text-white/60">ข้อความที่ส่ง</div>
							</div>
							<div>
								<div className="text-2xl font-bold">200%</div>
								<div className="text-sm text-white/60">เพิ่มยอดตอบแชท</div>
							</div>
						</div>
					</div>

					{/* Testimonial */}
					<div className="max-w-md">
						<blockquote className="text-white/80 text-sm leading-relaxed italic">
							&ldquo;ตั้งแต่ใช้ OHO Chat ทีมเราตอบแชทลูกค้าได้เร็วขึ้น 3 เท่า ไม่มีแชทตกหล่นอีกต่อไป&rdquo;
						</blockquote>
						<div className="mt-3 flex items-center gap-3">
							<div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
								สว
							</div>
							<div>
								<div className="text-sm font-medium">สมวิทย์ การค้า</div>
								<div className="text-xs text-white/50">CEO, FastShip Co.</div>
							</div>
						</div>
					</div>
				</div>

				{/* Background decoration */}
				<div className="absolute inset-0">
					<div className="absolute top-1/4 -right-20 w-80 h-80 bg-white/5 rounded-full" />
					<div className="absolute bottom-1/4 -left-10 w-60 h-60 bg-white/5 rounded-full" />
					<div className="absolute top-1/2 right-1/4 w-40 h-40 bg-white/5 rounded-full" />
				</div>
			</div>

			{/* Right panel — form */}
			<div className="flex-1 flex items-center justify-center p-6 bg-muted/30">{children}</div>
		</div>
	)
}
