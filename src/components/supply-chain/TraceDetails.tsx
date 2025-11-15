import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Calendar, CheckCircle2, Copy, ExternalLink, MapPin, QrCode, Truck } from 'lucide-react';
import type { ProductTraceData, TraceEvent } from '@/services/supplyChainService';

interface TraceDetailsProps {
  trace: ProductTraceData;
  isLookup?: boolean;
}

const formatDateTime = (value?: string | null) => {
  if (!value) return 'Không xác định';
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const buildQrImageUrl = (url: string) => {
  const encoded = encodeURIComponent(url);
  return `https://api.qrserver.com/v1/create-qr-code/?data=${encoded}&size=200x200`;
};

const eventAccent: Record<string, string> = {
  harvest: 'bg-emerald-500/10 text-emerald-600',
  manufacturing: 'bg-blue-500/10 text-blue-600',
  quality_control: 'bg-amber-500/10 text-amber-600',
  distribution: 'bg-purple-500/10 text-purple-600',
  retail: 'bg-pink-500/10 text-pink-600',
};

const getEventAccent = (event: TraceEvent) => eventAccent[event.type] ?? 'bg-slate-500/10 text-slate-600';

export function TraceDetails({ trace, isLookup = false }: TraceDetailsProps) {
  const qrImage = useMemo(() => buildQrImageUrl(trace.qr?.url ?? ''), [trace.qr?.url]);

  const handleCopy = async (value?: string | null, successMessage?: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      if (successMessage) {
        toast.success(successMessage);
      }
    } catch {
      toast.error('Không thể sao chép nội dung. Vui lòng thử lại.');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl">{trace.product?.name ?? 'Sản phẩm không xác định'}</CardTitle>
            <CardDescription>
              {trace.product?.category ? `Danh mục: ${trace.product.category}` : 'Chưa có danh mục'}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {trace.product?.sku && (
              <Badge variant="secondary" className="text-sm font-medium">
                SKU: {trace.product.sku}
              </Badge>
            )}
            {trace.product?.batchId && (
              <Badge variant="outline" className="text-sm font-medium">
                Lô: {trace.product.batchId}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="mt-1 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Ngày khởi tạo</p>
                <p className="font-medium">{formatDateTime(trace.product?.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-1 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Cập nhật gần nhất</p>
                <p className="font-medium">{formatDateTime(trace.product?.updatedAt)}</p>
              </div>
            </div>
            {trace.transport?.status && (
              <div className="flex items-start gap-3">
                <Truck className="mt-1 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Trạng thái vận chuyển</p>
                  <p className="font-medium">
                    {trace.transport.status}
                    {trace.transport.carrier ? ` · ${trace.transport.carrier}` : ''}
                  </p>
                  {trace.transport.trackingCode && (
                    <Button
                      variant="link"
                      className="px-0 text-primary"
                      onClick={() => handleCopy(trace.transport?.trackingCode, 'Đã sao chép mã vận đơn')}
                    >
                      Mã vận đơn: {trace.transport.trackingCode}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-6">
            <QrCode className="h-6 w-6 text-primary" />
            <img src={qrImage} alt="QR truy vết" className="h-40 w-40 rounded-md border border-border bg-white p-2" />
            <div className="text-center text-sm text-muted-foreground">
              Quét mã để truy cập nhanh: <span className="font-medium text-foreground">{trace.qr?.url}</span>
            </div>
            {trace.qr?.url && (
              <Button size="sm" onClick={() => handleCopy(trace.qr?.url, 'Đã sao chép liên kết truy vết')}>
                Sao chép liên kết
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lịch sử sự kiện</CardTitle>
          <CardDescription>Chuỗi các mốc quan trọng đã được ghi nhận trên blockchain.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="absolute left-[14px] top-2 bottom-2 w-px bg-border" />
            <div className="space-y-6">
              {trace.events.map((event) => (
                <div key={event.id} className="relative pl-10">
                  <span
                    className={`absolute left-0 top-1 flex h-7 w-7 items-center justify-center rounded-full border border-background ${getEventAccent(
                      event,
                    )}`}
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-current" />
                  </span>
                  <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold text-foreground">{event.title}</h3>
                      <Badge variant="outline">{formatDateTime(event.timestamp)}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{event.description}</p>
                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {event.location && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4" /> {event.location}
                        </span>
                      )}
                      {event.actor && (
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4" /> {event.actor}
                        </span>
                      )}
                    </div>
                    <Separator className="my-3" />
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {event.transactionHash && (
                        <Button
                          variant="link"
                          className="px-0 text-primary"
                          onClick={() => handleCopy(event.transactionHash, 'Đã sao chép hash giao dịch')}
                        >
                          Tx: {event.transactionHash.slice(0, 10)}...
                        </Button>
                      )}
                      {typeof event.blockNumber === 'number' && (
                        <span>Block #{event.blockNumber}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Chứng nhận</CardTitle>
            <CardDescription>Hồ sơ kiểm định và chứng thực nguồn gốc sản phẩm.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {trace.certificates.map((certificate) => (
              <div key={certificate.id} className="rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-base font-semibold text-foreground">{certificate.name}</p>
                  <Badge variant="secondary">ID: {certificate.id}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">Cấp bởi: {certificate.issuer}</p>
                <div className="mt-3 grid grid-cols-1 gap-3 text-sm text-muted-foreground lg:grid-cols-2">
                  <div>
                    <span className="block text-xs uppercase tracking-wide">Ngày cấp</span>
                    <span className="font-medium text-foreground">{formatDateTime(certificate.issuedAt)}</span>
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-wide">Hiệu lực đến</span>
                    <span className="font-medium text-foreground">{formatDateTime(certificate.expiresAt)}</span>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {certificate.ipfsHash && (
                    <Button
                      variant="link"
                      className="px-0 text-primary"
                      onClick={() => handleCopy(certificate.ipfsHash, 'Đã sao chép IPFS hash')}
                    >
                      IPFS: {certificate.ipfsHash.slice(0, 12)}...
                    </Button>
                  )}
                  {certificate.verificationUrl && (
                    <a
                      className="inline-flex items-center gap-1 text-primary"
                      href={certificate.verificationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Xem trên explorer <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Bằng chứng on-chain</CardTitle>
            <CardDescription>Thông tin đối chiếu trực tiếp trên mạng blockchain.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground/70">Merkle Root</p>
              <p className="mt-1 font-medium text-foreground break-all">
                {trace.onChainProof?.merkleRoot ?? 'Không có dữ liệu'}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground/70">Giao dịch mới nhất</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-foreground">
                {trace.onChainProof?.latestTransaction ? (
                  <>
                    <span className="break-all">{trace.onChainProof.latestTransaction}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() =>
                        handleCopy(trace.onChainProof?.latestTransaction, 'Đã sao chép hash giao dịch')
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <span>Không có dữ liệu</span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[160px] rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground/70">Block mới nhất</p>
                <p className="mt-1 font-medium text-foreground">
                  {typeof trace.onChainProof?.latestBlock === 'number'
                    ? `#${trace.onChainProof.latestBlock}`
                    : 'Không có dữ liệu'}
                </p>
              </div>
              <div className="flex-1 min-w-[160px] rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground/70">Liên kết explorer</p>
                {trace.onChainProof?.explorerUrl ? (
                  <a
                    href={trace.onChainProof.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-primary"
                  >
                    Mở explorer <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <p className="mt-1">Không có dữ liệu</p>
                )}
              </div>
            </div>
            {isLookup && trace.qr?.payload?.checksum && (
              <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4 text-xs">
                <p className="font-semibold text-primary">Thông tin tra cứu</p>
                <p className="mt-1 text-muted-foreground">
                  Checksum: <span className="font-medium text-foreground">{trace.qr.payload.checksum}</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {trace.transport?.history?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Lịch sử vận chuyển</CardTitle>
            <CardDescription>Nhật ký cập nhật từ đơn vị vận chuyển.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {trace.transport.history.map((entry) => (
              <div key={entry.id} className="rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-base font-semibold text-foreground">{entry.status}</p>
                  <Badge variant="outline">{formatDateTime(entry.timestamp)}</Badge>
                </div>
                {entry.description && <p className="mt-2 text-sm text-muted-foreground">{entry.description}</p>}
                <div className="mt-2 text-xs uppercase tracking-wide text-muted-foreground/70">
                  {entry.location ?? 'Không rõ vị trí'}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

