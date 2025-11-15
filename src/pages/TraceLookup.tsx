import { useState } from 'react';
import type { FormEvent } from 'react';
import { TraceDetails } from '@/components/supply-chain/TraceDetails';
import { supplyChainService, type ProductTraceData } from '@/services/supplyChainService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TraceLookupPage() {
  const [productCode, setProductCode] = useState('');
  const [batchCode, setBatchCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [trace, setTrace] = useState<ProductTraceData | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!productCode.trim() && !batchCode.trim()) {
      toast.warning('Vui lòng nhập ít nhất một trường tra cứu');
      return;
    }

    try {
      setLoading(true);
      const data = await supplyChainService.lookupTrace({
        productCode: productCode.trim() || undefined,
        batchCode: batchCode.trim() || undefined,
      });
      setTrace(data);
    } catch (error: any) {
      setTrace(null);
      toast.error(error?.message || 'Không tìm thấy dữ liệu truy vết phù hợp');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-5xl space-y-6 py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tra cứu chuỗi cung ứng</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Nhập mã sản phẩm hoặc mã lô/QR để lấy lịch sử truy vết trên blockchain.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/products">Xem tất cả sản phẩm</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin tra cứu</CardTitle>
          <CardDescription>Nhập ít nhất một trong hai trường dưới đây.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-6 md:grid-cols-2" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="productCode">Mã sản phẩm / SKU</Label>
              <Input
                id="productCode"
                placeholder="Ví dụ: SP-001"
                value={productCode}
                onChange={(event) => setProductCode(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="batchCode">Mã lô / QR Code</Label>
              <Input
                id="batchCode"
                placeholder="Ví dụ: BATCH-ABC-123"
                value={batchCode}
                onChange={(event) => setBatchCode(event.target.value)}
              />
            </div>
            <div className="md:col-span-2 flex items-center justify-end gap-3">
              <Button type="submit" disabled={loading} className="inline-flex items-center gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Tra cứu ngay
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
            Đang tra cứu dữ liệu...
          </CardContent>
        </Card>
      ) : trace ? (
        <TraceDetails trace={trace} isLookup />
      ) : null}
    </div>
  );
}

