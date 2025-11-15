import { XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function PaymentFail() {
  return (
    <div className="min-h-dvh grid place-items-center px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center shadow-md animate-pop-in">
        <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-50 dark:bg-red-900/20 grid place-items-center animate-shake">
          <XCircle className="h-10 w-10 text-red-600" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Thanh toán thất bại</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Rất tiếc, giao dịch của bạn không thành công. Vui lòng thử lại hoặc chọn phương thức khác.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <Link
            to="/checkout"
            className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            Thử lại thanh toán
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  )
}



