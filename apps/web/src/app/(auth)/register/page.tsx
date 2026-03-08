'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Eye, EyeOff, Loader2, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { trpc } from '@/lib/trpc/client'
import { useAuthStore } from '@/stores/auth'

const registerSchema = z
	.object({
		companyName: z.string().min(1, 'กรุณากรอกชื่อบริษัท').min(2, 'ชื่อบริษัทต้องมีอย่างน้อย 2 ตัวอักษร'),
		fullName: z.string().min(1, 'กรุณากรอกชื่อ-นามสกุล').min(2, 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร'),
		email: z.string().min(1, 'กรุณากรอกอีเมล').email('รูปแบบอีเมลไม่ถูกต้อง'),
		phone: z
			.string()
			.min(1, 'กรุณากรอกเบอร์โทร')
			.regex(/^0[0-9]{8,9}$/, 'รูปแบบเบอร์โทรไม่ถูกต้อง'),
		password: z
			.string()
			.min(1, 'กรุณากรอกรหัสผ่าน')
			.min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
			.regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'รหัสผ่านต้องมีตัวพิมพ์เล็ก ตัวพิมพ์ใหญ่ และตัวเลข'),
		confirmPassword: z.string().min(1, 'กรุณายืนยันรหัสผ่าน'),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'รหัสผ่านไม่ตรงกัน',
		path: ['confirmPassword'],
	})

type RegisterFormValues = z.infer<typeof registerSchema>

const trialBenefits = [
	'ทดลองใช้ฟรี 14 วัน',
	'ไม่ต้องผูกบัตรเครดิต',
	'เชื่อมต่อได้ 2 ช่องทาง',
	'สมาชิก 5 คน',
	'รวม Chatbot + Auto-assign',
]

export default function RegisterPage() {
	const router = useRouter()
	const [showPassword, setShowPassword] = useState(false)
	const setAuth = useAuthStore((s) => s.setAuth)

	const registerMutation = trpc.auth.register.useMutation({
		onSuccess: (data) => {
			setAuth(data.token, data.user)
			toast.success('สร้างบัญชีสำเร็จ ยินดีต้อนรับ!')
			router.push('/app')
		},
		onError: (error) => {
			if (error.data?.code === 'CONFLICT') {
				toast.error('อีเมลนี้ถูกใช้งานแล้ว')
			} else {
				toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง')
			}
		},
	})

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<RegisterFormValues>({
		resolver: zodResolver(registerSchema),
		defaultValues: {
			companyName: '',
			fullName: '',
			email: '',
			phone: '',
			password: '',
			confirmPassword: '',
		},
	})

	const onSubmit = (data: RegisterFormValues) => {
		registerMutation.mutate({
			accountName: data.companyName,
			name: data.fullName,
			email: data.email,
			password: data.password,
		})
	}

	return (
		<div className="w-full max-w-md">
			{/* Mobile logo */}
			<div className="flex flex-col items-center mb-6 lg:hidden">
				<div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-3">
					<MessageSquare className="w-6 h-6 text-primary-foreground" />
				</div>
				<h1 className="text-xl font-bold text-gray-900">OHO Chat</h1>
			</div>

			<Card className="border-0 shadow-md lg:shadow-lg">
				<CardHeader className="text-center pb-2">
					<h2 className="text-xl font-bold text-gray-900">สร้างบัญชีใหม่</h2>
					<p className="text-sm text-muted-foreground mt-1">เริ่มต้นใช้งานฟรี 14 วัน ไม่ต้องผูกบัตร</p>
				</CardHeader>

				<CardContent>
					{/* Trial benefits */}
					<div className="bg-primary/5 rounded-lg p-3 mb-6">
						<ul className="space-y-1.5">
							{trialBenefits.map((benefit) => (
								<li key={benefit} className="flex items-center gap-2 text-xs text-gray-700">
									<Check className="w-3.5 h-3.5 text-success flex-shrink-0" />
									{benefit}
								</li>
							))}
						</ul>
					</div>

					<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
						{/* Company + Name row */}
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-2">
								<Label htmlFor="companyName">ชื่อบริษัท</Label>
								<Input
									id="companyName"
									placeholder="บริษัท ABC จำกัด"
									aria-invalid={!!errors.companyName}
									{...register('companyName')}
								/>
								{errors.companyName && (
									<p className="text-xs text-destructive">{errors.companyName.message}</p>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor="fullName">ชื่อ-นามสกุล</Label>
								<Input
									id="fullName"
									placeholder="สมชาย ใจดี"
									aria-invalid={!!errors.fullName}
									{...register('fullName')}
								/>
								{errors.fullName && (
									<p className="text-xs text-destructive">{errors.fullName.message}</p>
								)}
							</div>
						</div>

						{/* Email */}
						<div className="space-y-2">
							<Label htmlFor="email">อีเมล</Label>
							<Input
								id="email"
								type="email"
								placeholder="you@company.com"
								autoComplete="email"
								aria-invalid={!!errors.email}
								{...register('email')}
							/>
							{errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
						</div>

						{/* Phone */}
						<div className="space-y-2">
							<Label htmlFor="phone">เบอร์โทรศัพท์</Label>
							<Input
								id="phone"
								type="tel"
								placeholder="0812345678"
								autoComplete="tel"
								aria-invalid={!!errors.phone}
								{...register('phone')}
							/>
							{errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
						</div>

						{/* Password */}
						<div className="space-y-2">
							<Label htmlFor="password">รหัสผ่าน</Label>
							<div className="relative">
								<Input
									id="password"
									type={showPassword ? 'text' : 'password'}
									placeholder="อย่างน้อย 8 ตัวอักษร"
									autoComplete="new-password"
									aria-invalid={!!errors.password}
									className="pr-10"
									{...register('password')}
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gray-600 transition-colors"
									aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
								>
									{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
								</button>
							</div>
							{errors.password && (
								<p className="text-xs text-destructive">{errors.password.message}</p>
							)}
						</div>

						{/* Confirm Password */}
						<div className="space-y-2">
							<Label htmlFor="confirmPassword">ยืนยันรหัสผ่าน</Label>
							<Input
								id="confirmPassword"
								type="password"
								placeholder="กรอกรหัสผ่านอีกครั้ง"
								autoComplete="new-password"
								aria-invalid={!!errors.confirmPassword}
								{...register('confirmPassword')}
							/>
							{errors.confirmPassword && (
								<p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
							)}
						</div>

						{/* Submit */}
						<Button type="submit" className="w-full" disabled={registerMutation.isPending}>
							{registerMutation.isPending ? (
								<>
									<Loader2 className="w-4 h-4 animate-spin" />
									กำลังสร้างบัญชี...
								</>
							) : (
								'เริ่มทดลองใช้ฟรี'
							)}
						</Button>
					</form>

					<div className="relative my-6">
						<Separator />
						<span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs text-muted-foreground">
							หรือ
						</span>
					</div>

					<Button variant="outline" className="w-full" type="button">
						<svg className="w-4 h-4" viewBox="0 0 24 24">
							<path
								d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
								fill="#4285F4"
							/>
							<path
								d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
								fill="#34A853"
							/>
							<path
								d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
								fill="#FBBC05"
							/>
							<path
								d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
								fill="#EA4335"
							/>
						</svg>
						สมัครด้วย Google
					</Button>

					<p className="text-sm text-center text-muted-foreground mt-6">
						มีบัญชีอยู่แล้ว?{' '}
						<Link href="/login" className="text-primary font-medium hover:underline">
							เข้าสู่ระบบ
						</Link>
					</p>

					<p className="text-[10px] text-center text-muted-foreground mt-4 leading-relaxed">
						การสมัครใช้งานหมายความว่าคุณยอมรับ{' '}
						<Link href="/terms" className="underline hover:text-gray-600">
							เงื่อนไขการใช้งาน
						</Link>{' '}
						และ{' '}
						<Link href="/privacy" className="underline hover:text-gray-600">
							นโยบายความเป็นส่วนตัว
						</Link>
					</p>
				</CardContent>
			</Card>
		</div>
	)
}
