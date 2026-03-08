import { Users } from 'lucide-react'

export default function ContactsPage() {
	return (
		<div className="flex items-center justify-center h-full bg-white">
			<div className="text-center">
				<div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
					<Users className="w-8 h-8 text-muted-foreground" />
				</div>
				<h2 className="text-lg font-semibold text-gray-900">รายชื่อผู้ติดต่อ</h2>
				<p className="text-sm text-muted-foreground mt-1">จัดการรายชื่อผู้ติดต่อทั้งหมดของคุณ</p>
			</div>
		</div>
	)
}
