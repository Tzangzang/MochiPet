import { Alert, AlertDescription } from "@/components/ui/alert"

export function ErrorNotice({ message }: { message: string }) {
  return (
    <Alert variant="destructive" role="alert">
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}
