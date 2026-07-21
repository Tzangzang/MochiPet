"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Script from "next/script"
import { useRouter } from "next/navigation"

import { getSupabaseBrowserClient } from "@/services/supabase/client"

type GoogleCredentialResponse = { credential?: string }

type GoogleIdApi = {
  initialize: (config: {
    client_id: string
    callback: (response: GoogleCredentialResponse) => void
    nonce?: string
    ux_mode?: "popup" | "redirect"
    auto_select?: boolean
    itp_support?: boolean
  }) => void
  renderButton: (
    parent: HTMLElement,
    options: {
      type?: "standard" | "icon"
      theme?: "outline" | "filled_blue" | "filled_black"
      size?: "large" | "medium" | "small"
      text?: "signin_with" | "signup_with" | "continue_with"
      shape?: "rectangular" | "pill"
      logo_alignment?: "left" | "center"
      width?: number
      locale?: string
    },
  ) => void
  cancel: () => void
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdApi } }
  }
}

async function createNonce(): Promise<{ raw: string; hashed: string }> {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  const raw = btoa(String.fromCharCode(...bytes))
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw))
  const hashed = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
  return { raw, hashed }
}

export function GoogleSignInButton({ onSignedIn }: { onSignedIn?: () => void } = {}) {
  const router = useRouter()
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const containerRef = useRef<HTMLDivElement | null>(null)
  const nonceRef = useRef<string | null>(null)
  const initializedRef = useRef(false)
  const processingRef = useRef(false)
  const [ready, setReady] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCredential = useCallback(
    async (response: GoogleCredentialResponse) => {
      const token = response.credential
      const nonce = nonceRef.current
      if (!token || !nonce || processingRef.current) return
      processingRef.current = true
      setProcessing(true)
      setError(null)
      try {
        const supabase = getSupabaseBrowserClient()
        const { error: signInError } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token,
          nonce,
        })
        if (signInError) {
          setError("Không thể đăng nhập với Google. Vui lòng thử lại.")
          processingRef.current = false
          setProcessing(false)
          return
        }
        if (onSignedIn) {
          processingRef.current = false
          setProcessing(false)
          onSignedIn()
          return
        }
        router.replace("/dashboard")
        router.refresh()
      } catch {
        setError("Không thể đăng nhập với Google. Vui lòng thử lại.")
        processingRef.current = false
        setProcessing(false)
      }
    },
    [router, onSignedIn],
  )

  useEffect(() => {
    if (!ready || !clientId || initializedRef.current) return
    const container = containerRef.current
    const api = window.google?.accounts.id
    if (!container || !api) return
    initializedRef.current = true
    let cancelled = false
    void createNonce().then(({ raw, hashed }) => {
      if (cancelled) return
      nonceRef.current = raw
      api.initialize({
        client_id: clientId,
        callback: handleCredential,
        nonce: hashed,
        ux_mode: "popup",
        itp_support: true,
      })
      api.renderButton(container, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "pill",
        logo_alignment: "left",
        width: 280,
        locale: "vi",
      })
    })
    return () => {
      cancelled = true
    }
  }, [ready, clientId, handleCredential])

  if (!clientId) {
    return (
      <p className="text-sm text-muted-foreground" role="alert">
        Đăng nhập Google chưa được cấu hình.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setReady(true)}
      />
      <div className="flex justify-center" ref={containerRef} aria-busy={processing} />
      {processing ? (
        <p className="text-center text-sm text-muted-foreground">Đang đăng nhập...</p>
      ) : null}
      {error ? (
        <p className="text-center text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
