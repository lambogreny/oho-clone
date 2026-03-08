const stats = [
	{ value: '4,255+', label: 'ธุรกิจที่ใช้งาน', suffix: '' },
	{ value: '193M+', label: 'ข้อความที่ส่งผ่านระบบ', suffix: '' },
	{ value: '39,134+', label: 'Chatbot ที่สร้าง', suffix: '' },
	{ value: '200%', label: 'เพิ่มการตอบแชทต่อวัน', suffix: '' },
]

export function Stats() {
	return (
		<section className="py-16 bg-dark">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
					{stats.map((stat) => (
						<div key={stat.label} className="text-center">
							<div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 font-[family-name:var(--font-ubuntu)]">
								{stat.value}
							</div>
							<div className="text-sm text-gray-400">{stat.label}</div>
						</div>
					))}
				</div>
			</div>
		</section>
	)
}
