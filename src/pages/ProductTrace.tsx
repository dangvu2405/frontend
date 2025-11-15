import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TraceDetails } from '@/components/supply-chain/TraceDetails';
import { supplyChainService, type ProductTraceData } from '@/services/supplyChainService';
import { toast } from 'sonner';

export default function ProductTracePage() {
  const { id } = useParams<{ id: string }>();
  const [trace, setTrace] = useState<ProductTraceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (!id) {
      setTrace(null);
      setLoading(false);
      return;
    }

    const fetchTrace = async () => {
      try {
        setLoading(true);
        const data = await supplyChainService.getProductTrace(id);
        if (isMounted) {
          setTrace(data);
        }
      } catch (error: any) {
        if (!isMounted) return;
        setTrace(null);
        toast.error(error?.message || 'Không thể tải dữ liệu truy vết sản phẩm');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchTrace();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (!id) {
    return (
      <div className="container mx-auto max-w-5xl space-y-6 py-8">
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Không xác định được sản phẩm để truy vết.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl space-y-6 py-8">
      <div className="flex items-center justify-between gap-4">
        <Button asChild variant="ghost">
          <Link to={`/products/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại sản phẩm
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/trace-lookup">Tra cứu bằng QR / Mã lô</Link>
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
            Đang tải thông tin truy vết...
          </CardContent>
        </Card>
      ) : trace ? (
        <TraceDetails trace={trace} />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
            <p>Không tìm thấy dữ liệu truy vết với sản phẩm này.</p>
            <Button asChild>
              <Link to="/trace-lookup">Thử tra cứu bằng mã khác</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

