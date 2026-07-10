import type { Metadata } from "next"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoginForm } from "@/features/auth/components/login-form"
import { getAuthMessage } from "@/features/auth/messages"

export const metadata: Metadata = {
  title: "Đăng nhập · MochiPet",
  description: "Đăng nhập vào MochiPet để chăm sóc thú ảo đồng hành của bạn.",
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const { message } = await searchParams
  const status = getAuthMessage(message)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Đăng nhập</CardTitle>
        <CardDescription>Chào mừng bạn quay lại MochiPet.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status ? (
          <Alert>
            <AlertDescription>{status.text}</AlertDescription>
          </Alert>
        ) : null}
        <LoginForm />
      </CardContent>
    </Card>
  )
}
