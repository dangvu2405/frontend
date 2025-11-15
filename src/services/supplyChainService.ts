import axiosInstance from './axios';

export interface TraceProduct {
  id: string;
  name: string;
  sku?: string | null;
  category?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  batchId?: string | null;
}

export interface TraceEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  location?: string | null;
  actor?: string | null;
  timestamp?: string | null;
  transactionHash?: string | null;
  blockNumber?: number | null;
}

export interface TraceCertificate {
  id: string;
  name: string;
  issuer: string;
  issuedAt?: string | null;
  expiresAt?: string | null;
  ipfsHash?: string | null;
  verificationUrl?: string | null;
}

export interface TraceTransportHistoryEntry {
  id: string;
  status: string;
  description?: string | null;
  location?: string | null;
  timestamp?: string | null;
}

export interface TraceTransportInfo {
  status?: string | null;
  carrier?: string | null;
  trackingCode?: string | null;
  lastUpdated?: string | null;
  pickupTime?: string | null;
  eta?: string | null;
  deliveredAt?: string | null;
  history: TraceTransportHistoryEntry[];
}

export interface TraceOnChainProof {
  latestTransaction?: string | null;
  latestBlock?: number | null;
  merkleRoot?: string | null;
  explorerUrl?: string | null;
}

export interface TraceQrPayload {
  productId?: string | null;
  batchId?: string | null;
  checksum?: string | null;
}

export interface TraceQrInfo {
  url: string;
  payload: TraceQrPayload;
}

export interface ProductTraceData {
  product: TraceProduct;
  transport: TraceTransportInfo | null;
  certificates: TraceCertificate[];
  events: TraceEvent[];
  onChainProof: TraceOnChainProof;
  qr: TraceQrInfo;
}

export interface InitProductPayload {
  batchId?: string;
  sku?: string;
}

export interface RecordEventPayload {
  eventType: string;
  description: string;
  location?: string;
  ipfsHash?: string;
}

export interface IssueCertificatePayload {
  name: string;
  issuer: string;
  ipfsHash?: string;
  expiresAt?: number; // Unix timestamp in seconds
}

export const supplyChainService = {
  getProductTrace: async (productId: string): Promise<ProductTraceData> => {
    const response = await axiosInstance.get(`/api/supply-chain/products/${productId}/trace`);
    return (response as any)?.data;
  },

  lookupTrace: async (params: { productCode?: string; batchCode?: string }): Promise<ProductTraceData> => {
    const response = await axiosInstance.get('/api/supply-chain/lookup', { params });
    return (response as any)?.data;
  },

  // Admin functions
  initProduct: async (productId: string, payload: InitProductPayload) => {
    const response = await axiosInstance.post(`/api/supply-chain/admin/products/${productId}/init`, payload);
    return (response as any)?.data;
  },

  recordEvent: async (productId: string, payload: RecordEventPayload) => {
    const response = await axiosInstance.post(`/api/supply-chain/admin/products/${productId}/events`, payload);
    return (response as any)?.data;
  },

  issueCertificate: async (productId: string, payload: IssueCertificatePayload) => {
    const response = await axiosInstance.post(`/api/supply-chain/admin/products/${productId}/certificates`, payload);
    return (response as any)?.data;
  },
};

