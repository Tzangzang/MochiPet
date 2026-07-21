import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Điều khoản dịch vụ · MochiPet",
  description:
    "Điều khoản dịch vụ của MochiPet: các quy tắc khi sử dụng ứng dụng thú nuôi ảo.",
}

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6 sm:py-16">
      <Link
        href="/login"
        className="inline-block rounded text-sm text-muted-foreground underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        ← Quay lại đăng nhập
      </Link>

      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-foreground">
        Điều khoản dịch vụ
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Ngày hiệu lực: 22/07/2026 · Cập nhật lần cuối: 22/07/2026
      </p>

      <div className="mt-8 space-y-8 text-sm leading-7 text-foreground">
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">1. Chấp nhận điều khoản</h2>
          <p>
            Bằng việc truy cập và sử dụng MochiPet, bạn đồng ý với các điều khoản dịch vụ này. Nếu bạn
            không đồng ý, vui lòng ngừng sử dụng ứng dụng.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">2. Mô tả dịch vụ</h2>
          <p>
            MochiPet là ứng dụng nuôi thú ảo giải trí. Các tính năng có thể thay đổi trong quá trình
            phát triển. MochiPet không phải là dịch vụ chăm sóc thú nuôi thật, không cung cấp dịch vụ
            sức khỏe hay tư vấn y tế.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">3. Tài khoản</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>bạn chịu trách nhiệm với tài khoản Google và thông tin đăng nhập của mình</li>
            <li>không chia sẻ hoặc lạm dụng phiên đăng nhập</li>
            <li>cung cấp thông tin chính xác qua nhà cung cấp đăng nhập</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">4. Quy tắc sử dụng</h2>
          <p>Bạn không được:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>truy cập trái phép vào hệ thống hoặc tài khoản của người khác</li>
            <li>phá hoại hoặc làm gián đoạn dịch vụ</li>
            <li>khai thác lỗi của ứng dụng</li>
            <li>tự động hóa trái phép các thao tác</li>
            <li>cố vượt qua cơ chế phân quyền, Row Level Security hoặc RPC</li>
            <li>sử dụng dịch vụ cho mục đích bất hợp pháp</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">5. Cơ chế gameplay</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>trạng thái pet phụ thuộc vào thời gian và hành động chăm sóc</li>
            <li>pet có thể chết theo quy tắc gameplay</li>
            <li>dữ liệu gameplay có thể thay đổi khi hệ thống được cân bằng lại</li>
            <li>chúng tôi không cam kết khôi phục pet hoặc dữ liệu gameplay</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">6. Chủ nuôi và đồng nuôi</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>chủ nuôi và đồng nuôi cùng chia sẻ một trạng thái pet</li>
            <li>hành động của một người chăm sóc ảnh hưởng đến người còn lại</li>
            <li>bạn chịu trách nhiệm khi cấp quyền đồng nuôi cho người khác</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">7. Tính khả dụng</h2>
          <p>
            Dịch vụ có thể bị gián đoạn, và các tính năng có thể được sửa đổi hoặc ngừng cung cấp.
            Chúng tôi không đảm bảo dịch vụ hoạt động liên tục tuyệt đối.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">8. Quyền sở hữu trí tuệ</h2>
          <p>
            Giao diện, hình ảnh minh họa và mã nguồn của MochiPet thuộc về MochiPet và chủ dự án, trừ
            các phần thuộc về bên thứ ba. Google, Supabase và Vercel giữ quyền đối với tài sản và
            thương hiệu của họ.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">9. Giới hạn trách nhiệm</h2>
          <p>
            Dịch vụ được cung cấp theo hiện trạng. Trong phạm vi pháp luật cho phép, chúng tôi không
            chịu trách nhiệm cho các tổn thất gián tiếp phát sinh từ việc sử dụng dịch vụ. Điều khoản
            này không loại bỏ các quyền bắt buộc của người tiêu dùng theo pháp luật áp dụng.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">10. Chấm dứt</h2>
          <p>
            Bạn có thể ngừng sử dụng và đăng xuất bất kỳ lúc nào. Chúng tôi có thể hạn chế tài khoản
            khi phát hiện vi phạm điều khoản hoặc hành vi gây rủi ro bảo mật.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">11. Thay đổi điều khoản</h2>
          <p>
            Chúng tôi có thể cập nhật các điều khoản này theo thời gian. Ngày cập nhật sẽ được hiển
            thị rõ ở đầu trang.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">12. Liên hệ</h2>
          <p>
            Nếu bạn có câu hỏi về điều khoản này, vui lòng liên hệ:{" "}
            <a
              href="mailto:giangbk1012@gmail.com"
              className="underline underline-offset-4"
            >
              giangbk1012@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  )
}
