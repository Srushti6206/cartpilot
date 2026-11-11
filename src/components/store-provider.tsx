"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { CartLine } from "@/types/product";

interface StoreState {
  cart: CartLine[];
  comparedProductIds: string[];
  storageWarning: string | null;
}

interface StoreContextValue extends StoreState {
  cartCount: number;
  addToCart: (productId: string) => void;
  clearCart: () => void;
  removeFromCart: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  toggleCompare: (productId: string) => void;
  clearCompare: () => void;
}

const emptyState: StoreState = {
  cart: [],
  comparedProductIds: [],
  storageWarning: null,
};
let clientSnapshot: StoreState | null = null;
const listeners = new Set<() => void>();

function readStoredState(): StoreState {
  try {
    const storedCart = window.localStorage.getItem("cartpilot-cart");
    const storedCompare = window.localStorage.getItem("cartpilot-compare");
    const parsedCart: unknown = storedCart ? JSON.parse(storedCart) : [];
    const parsedCompare: unknown = storedCompare ? JSON.parse(storedCompare) : [];
    if (!Array.isArray(parsedCart) || !Array.isArray(parsedCompare)) {
      throw new Error("Stored shopping data has an invalid shape.");
    }
    return {
      cart: parsedCart.filter(
        (line): line is CartLine =>
          typeof line?.productId === "string" &&
          Number.isInteger(line?.quantity) &&
          line.quantity > 0,
      ),
      comparedProductIds: parsedCompare.filter(
        (id): id is string => typeof id === "string",
      ),
      storageWarning: null,
    };
  } catch {
    return {
      ...emptyState,
      storageWarning: "Saved cart and comparison data could not be read from this browser.",
    };
  }
}

function getSnapshot() {
  if (typeof window === "undefined") return emptyState;
  if (!clientSnapshot) clientSnapshot = readStoredState();
  return clientSnapshot;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const handleStorage = (event: StorageEvent) => {
    if (event.key === "cartpilot-cart" || event.key === "cartpilot-compare" || event.key === null) {
      clientSnapshot = readStoredState();
      listeners.forEach((notify) => notify());
    }
  };
  window.addEventListener("storage", handleStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

function updateStore(updater: (current: StoreState) => StoreState) {
  let next: StoreState = { ...updater(getSnapshot()), storageWarning: null };
  try {
    window.localStorage.setItem("cartpilot-cart", JSON.stringify(next.cart));
    window.localStorage.setItem("cartpilot-compare", JSON.stringify(next.comparedProductIds));
  } catch {
    next = {
      ...next,
      storageWarning: "Your changes are temporary because this browser could not save them.",
    };
  }
  clientSnapshot = next;
  listeners.forEach((listener) => listener());
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: Readonly<{ children: ReactNode }>) {
  const state = useSyncExternalStore(subscribe, getSnapshot, () => emptyState);

  const addToCart = useCallback((productId: string) => {
    updateStore((current) => {
      const existing = current.cart.find((line) => line.productId === productId);
      return {
        ...current,
        cart: existing
          ? current.cart.map((line) =>
              line.productId === productId
                ? { ...line, quantity: line.quantity + 1 }
                : line,
            )
          : [...current.cart, { productId, quantity: 1 }],
      };
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    updateStore((current) => ({
      ...current,
      cart: current.cart.filter((line) => line.productId !== productId),
    }));
  }, []);

  const clearCart = useCallback(() => {
    updateStore((current) => ({ ...current, cart: [] }));
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    updateStore((current) => ({
      ...current,
      cart:
        quantity < 1
          ? current.cart.filter((line) => line.productId !== productId)
          : current.cart.map((line) =>
              line.productId === productId ? { ...line, quantity } : line,
            ),
    }));
  }, []);

  const toggleCompare = useCallback((productId: string) => {
    updateStore((current) => {
      const compared = current.comparedProductIds.includes(productId);
      if (!compared && current.comparedProductIds.length >= 3) return current;
      return {
        ...current,
        comparedProductIds: compared
          ? current.comparedProductIds.filter((id) => id !== productId)
          : [...current.comparedProductIds, productId],
      };
    });
  }, []);

  const clearCompare = useCallback(() => {
    updateStore((current) => ({ ...current, comparedProductIds: [] }));
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      cartCount: state.cart.reduce((total, line) => total + line.quantity, 0),
      addToCart,
      clearCart,
      removeFromCart,
      setQuantity,
      toggleCompare,
      clearCompare,
    }),
    [addToCart, clearCart, clearCompare, removeFromCart, setQuantity, state, toggleCompare],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) {
    throw new Error("useStore must be used within StoreProvider");
  }
  return value;
}
