import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import PaymentSuccess from '@/components/payment-sucess';
import PaymentFail from '@/components/payment-fail';
import { Loader2 } from 'lucide-react';

export default function VNPayReturnPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'fail'>('loading');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const statusParam = searchParams.get('status');
    const code = searchParams.get('code');
    const msg = searchParams.get('message') || '';

    if (statusParam === 'success') {
      setStatus('success');
      setMessage('Thanh toán thành công');
    } else if (statusParam === 'fail') {
      setStatus('fail');
      setMessage(msg || `Thanh toán thất bại${code ? ` (Mã lỗi: ${code})` : ''}`);
    } else {
      // Nếu không có status, có thể là callback trực tiếp từ VNPay
      // Backend đã xử lý và redirect, nên chỉ cần hiển thị loading
      setStatus('loading');
      setTimeout(() => {
        setStatus('fail');
        setMessage('Không thể xác định trạng thái thanh toán');
      }, 3000);
    }
  }, [searchParams]);

  if (status === 'loading') {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Đang xử lý kết quả thanh toán...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (status === 'success') {
    return (
      <MainLayout>
        <PaymentSuccess />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-4">
        <PaymentFail />
        {message && (
          <p className="text-center text-sm text-muted-foreground px-4">
            {message}
          </p>
        )}
      </div>
    </MainLayout>
  );
}

