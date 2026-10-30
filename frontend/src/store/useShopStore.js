import { trackMetaEvent } from "../features/marketing/MetaPixel";
import { create } from "zustand";

const readSaved = (key, fallback) => {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    return saved ?? fallback;
  } catch {
    return fallback;
  }
};

const save = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable in private browsing.
  }
};

export const useShopStore = create((set) => ({
  cart: readSaved("everythingbd_cart", []),
  wishlist: readSaved("everythingbd_wishlist", []),
  cartOpen: false,

  setCartOpen: (cartOpen) => set({ cartOpen }),
  clearCart: () => set(() => {
    save("everythingbd_cart", []);
    return { cart: [], cartOpen: false };
  }),


  addToCart: (product) =>
    set((state) => {
      if (!product?.id || !Number.isFinite(Number(product.price))) {
        return state;
      }

      const stock = Math.max(0, Math.floor(Number(product.stock) || 0));
      if (stock < 1) return state;

      const existing = state.cart.find(item => item.id === product.id);
      const current = Number(existing?.quantity) || 0;

      if (current >= stock) {
        return { cartOpen: true };
      }

      const cart = existing
        ? state.cart.map(item =>
            item.id === product.id
              ? { ...item, stock, quantity: current + 1 }
              : item
          )
        : [...state.cart, { ...product, stock, quantity: 1 }];

      trackMetaEvent("AddToCart", {
        content_ids: [String(product.id)],
        content_type: "product",
        content_name: product.name,
        value: Number(product.price),
        currency: "BDT",
        contents: [{
          id: String(product.id),
          quantity: 1,
          item_price: Number(product.price)
        }]
      });

      save("everythingbd_cart", cart);
      return { cart, cartOpen: true };
    }),

  changeQuantity: (id, delta) =>
    set(state => {
      const cart = state.cart
        .map(item => {
          if (item.id !== id) return item;

          const current = Number(item.quantity) || 0;
          const stock = Math.max(0, Math.floor(Number(item.stock) || 0));
          const next = Math.min(
            stock,
            Math.max(0, current + Number(delta || 0))
          );

          return { ...item, quantity: next };
        })
        .filter(item => item.quantity > 0);

      save("everythingbd_cart", cart);
      return { cart };
    }),

  removeFromCart: (id) =>
    set(state => {
      const cart = state.cart.filter(item => item.id !== id);
      save("everythingbd_cart", cart);
      return { cart };
    }),

  toggleWishlist: (id) =>
    set((state) => {
      const wishlist = state.wishlist.includes(id)
        ? state.wishlist.filter((item) => item !== id)
        : [...state.wishlist, id];

      if (!state.wishlist.includes(id)) {
        trackMetaEvent("AddToWishlist", {
          content_ids: [String(id)],
          content_type: "product"
        });
      }

      save("everythingbd_wishlist", wishlist);
      return { wishlist };
    })
}));
