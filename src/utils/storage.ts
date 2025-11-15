// Storage utility cho localStorage
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  CART: 'cart',
} as const;

export const storage = {
  // Token methods
  getToken: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  setToken: (token: string): void => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  },

  removeToken: (): void => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  // Refresh Token methods
  getRefreshToken: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  setRefreshToken: (token: string): void => {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  },

  removeRefreshToken: (): void => {
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  // User methods
  getUser: () => {
    const user = localStorage.getItem(STORAGE_KEYS.USER);
    return user ? JSON.parse(user) : null;
  },

  setUser: (user: any): void => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  removeUser: (): void => {
    localStorage.removeItem(STORAGE_KEYS.USER);
  },
  // Cart basic storage
  getCart: (): CartItem[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CART);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },
  setCart: (cart: CartItem[]): void => {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart || []));
  },
  removeCart: (): void => {
    localStorage.removeItem(STORAGE_KEYS.CART);
  },

  // Cart helpers
  addCartItem: (item: CartItem, quantity: number = 1): CartItem[] => {
    const qty = Number.isFinite(quantity) ? Math.max(1, Math.floor(quantity)) : 1;
    const current = storage.getCart();
    const index = current.findIndex(p => p.id === item.id);
    if (index >= 0) {
      current[index].quantity = Math.max(1, (current[index].quantity || 0) + qty);
    } else {
      current.push({
        id: item.id,
        tenSP: item.tenSP,
        gia: Number(item.gia) || 0,
        giamGia: item.giamGia || 0,
        hinhAnh: item.hinhAnh || '',
        loaiSP: item.loaiSP || '',
        quantity: qty,
      });
    }
    storage.setCart(current);
    return current;
  },

  updateCartItemQuantity: (productId: string, quantity: number): CartItem[] => {
    const current = storage.getCart();
    const idx = current.findIndex(p => p.id === productId);
    if (idx === -1) return current;
    const qty = Math.floor(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      current.splice(idx, 1);
    } else {
      current[idx].quantity = qty;
    }
    storage.setCart(current);
    return current;
  },

  removeCartItem: (productId: string): CartItem[] => {
    const current = storage.getCart().filter(p => p.id !== productId);
    storage.setCart(current);
    return current;
  },

  clearCart: (): void => {
    storage.setCart([]);
  },

  getCartItemCount: (): number => {
    return storage.getCart().reduce((sum, p) => sum + (p.quantity || 0), 0);
  },

  getCartTotal: (): number => {
    return storage.getCart().reduce((sum, p) => {
      const unit = Number(p.gia) || 0;
      const discount = Number(p.giamGia) || 0;
      const finalUnit = discount > 0 ? Math.round(unit * (1 - discount / 100)) : unit;
      return sum + finalUnit * (p.quantity || 0);
    }, 0);
  },

  // Clear all
  clearAll: (): void => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.CART);
  },
};

// Types
export interface CartItem {
  id: string;
  tenSP: string;
  gia: number;
  giamGia?: number;
  hinhAnh?: string;
  loaiSP?: string;
  quantity: number;
}

