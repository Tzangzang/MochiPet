"use client"

import { useState, type ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"

/**
 * Tạo QueryClient với cấu hình mặc định hợp lý cho MVP.
 */
function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Dữ liệu được coi là "tươi" trong 1 phút -> giảm refetch không cần thiết.
        staleTime: 60 * 1000,
        // Giới hạn retry để tránh vòng lặp gọi lại vô hạn khi lỗi.
        retry: 1,
        // Không refetch mỗi khi focus lại cửa sổ (tránh gọi API liên tục).
        refetchOnWindowFocus: false,
        // Refetch khi khôi phục kết nối mạng là hành vi hợp lý.
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 0,
      },
    },
  })
}

export function Providers({ children }: { children: ReactNode }) {
  // Tạo QueryClient MỘT LẦN cho mỗi browser session bằng useState initializer.
  // useState chỉ chạy initializer ở lần render đầu -> client không bị tạo lại
  // ở mỗi lần render.
  const [queryClient] = useState(makeQueryClient)

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" ? (
        <ReactQueryDevtools initialIsOpen={false} />
      ) : null}
    </QueryClientProvider>
  )
}
