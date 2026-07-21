import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Chính sách quyền riêng tư · MochiPet",
  description:
    "Chính sách quyền riêng tư của MochiPet: dữ liệu được xử lý khi bạn sử dụng ứng dụng thú nuôi ảo.",
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6 sm:py-16">
      <Link
        href="/login"
        className="inline-block rounded text-sm text-muted-foreground underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        ← Quay lại đăng nhập
      </Link>

      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-foreground">
        Chính sách quyền riêng tư
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Ngày hiệu lực: 22/07/2026 · Cập nhật lần cuối: 22/07/2026
      </p>

      <div className="mt-8 space-y-8 text-sm leading-7 text-foreground">
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">1. Giới thiệu</h2>
          <p>
            MochiPet là ứng dụng nuôi thú ảo đồng hành. Chính sách này giải thích những dữ liệu
            được xử lý khi bạn tạo tài khoản và sử dụng ứng dụng, cũng như cách chúng tôi sử dụng
            và bảo vệ dữ liệu đó.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">2. Dữ liệu tài khoản</h2>
          <p>Khi bạn đăng nhập, chúng tôi có thể xử lý:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>tên hiển thị</li>
            <li>địa chỉ email</li>
            <li>ảnh đại diện, nếu Google cung cấp qua đăng nhập Google</li>
            <li>mã định danh tài khoản do hệ thống tạo</li>
            <li>thông tin phiên đăng nhập để duy trì trạng thái đăng nhập</li>
          </ul>
          <p>
            Khi bạn đăng nhập bằng Google, chúng tôi không thu thập hay lưu trữ mật khẩu Google của
            bạn. Với đăng nhập bằng email và mật khẩu, mật khẩu được nhà cung cấp xác thực quản lý và
            lưu ở dạng đã băm; ứng dụng không lưu mật khẩu ở dạng văn bản thô.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">3. Dữ liệu sử dụng MochiPet</h2>
          <p>Trong quá trình chơi, chúng tôi lưu trạng thái gameplay gắn với tài khoản của bạn:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>thú nuôi (pet) và trạng thái vòng đời của pet</li>
            <li>vai trò người chăm sóc (chủ nuôi hoặc đồng nuôi)</li>
            <li>lịch sử cho ăn và tiến độ bữa ăn trong ngày</li>
            <li>phiên ngủ của pet</li>
            <li>chỉ số sức khỏe và vệ sinh</li>
            <li>trạng thái chất thải trong phòng</li>
            <li>các mốc thời gian của hành động chăm sóc</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">4. Mục đích sử dụng dữ liệu</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>xác thực người dùng</li>
            <li>duy trì tài khoản và phiên đăng nhập</li>
            <li>lưu và đồng bộ trạng thái pet</li>
            <li>vận hành trạng thái dùng chung giữa chủ nuôi và đồng nuôi</li>
            <li>bảo mật, chống lỗi và xử lý idempotency cho các hành động</li>
            <li>cải thiện độ ổn định của ứng dụng</li>
          </ul>
          <p>Chúng tôi không sử dụng dữ liệu của bạn cho quảng cáo và không bán dữ liệu cá nhân.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">5. Nhà cung cấp dịch vụ</h2>
          <p>Ứng dụng dựa trên một số nhà cung cấp hạ tầng để hoạt động:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Google Identity Services: xác thực đăng nhập Google</li>
            <li>Supabase: xác thực, cơ sở dữ liệu PostgreSQL, RPC và lưu trạng thái ứng dụng</li>
            <li>Vercel: lưu trữ và phân phối giao diện web</li>
          </ul>
          <p>
            Mỗi nhà cung cấp xử lý dữ liệu theo chính sách riêng của họ nhằm phục vụ vận hành ứng
            dụng.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">6. Cookie và phiên đăng nhập</h2>
          <p>
            Ứng dụng sử dụng cookie và phiên kỹ thuật cần thiết để duy trì trạng thái đăng nhập của
            bạn. Chúng tôi không sử dụng cookie phục vụ quảng cáo.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">7. Chia sẻ dữ liệu</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>chúng tôi không bán dữ liệu cá nhân của bạn</li>
            <li>dữ liệu chỉ được chia sẻ với các nhà cung cấp hạ tầng cần thiết để vận hành dịch vụ</li>
            <li>chúng tôi có thể cung cấp dữ liệu khi pháp luật áp dụng yêu cầu</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">8. Lưu trữ và bảo mật</h2>
          <p>
            Dữ liệu của bạn được lưu trên hạ tầng Supabase. Ứng dụng áp dụng Row Level Security, RPC
            và kiểm soát quyền phía máy chủ theo kiến trúc hiện tại để hạn chế truy cập trái phép.
            Không có hệ thống nào an toàn tuyệt đối, và chúng tôi không cam kết an toàn tuyệt đối.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">9. Quyền của người dùng</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>bạn có thể đăng xuất khỏi ứng dụng bất kỳ lúc nào</li>
            <li>bạn có thể liên hệ để được hỗ trợ về tài khoản hoặc dữ liệu</li>
            <li>yêu cầu xóa dữ liệu, nếu có, sẽ được xử lý qua email hỗ trợ khi phù hợp</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">10. Trẻ em</h2>
          <p>
            MochiPet không chủ đích thu thập dữ liệu của trẻ em chưa đủ tuổi tự đồng ý theo pháp luật
            áp dụng. Nếu phụ huynh hoặc người giám hộ cho rằng trẻ đã cung cấp dữ liệu cho chúng tôi,
            vui lòng liên hệ để chúng tôi hỗ trợ xử lý.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">11. Thay đổi chính sách</h2>
          <p>
            Chúng tôi có thể cập nhật chính sách này theo thời gian. Ngày cập nhật sẽ được hiển thị rõ
            ở đầu trang.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">12. Liên hệ</h2>
          <p>
            Nếu bạn có câu hỏi về chính sách này, vui lòng liên hệ:{" "}
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
