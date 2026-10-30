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

  addToCart: (product) =>
    set((state) => {
      const existing = state.cart.find(
        (item) => item.id === product.id
      );

      const cart = existing
        ? state.cart.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        : [...state.cart, { ...product, quantity: 1 }];

      save("everythingbd_cart", cart);
      return { cart, cartOpen: true };
    }),

  changeQuantity: (id, delta) =>
    set((state) => {
      const cart = state.cart
        .map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0);

      save("everythingbd_cart", cart);
      return { cart };
    }),

  toggleWishlist: (id) =>
    set((state) => {
      const wishlist = state.wishlist.includes(id)
        ? state.wishlist.filter((item) => item !== id)
        : [...state.wishlist, id];

      save("everythingbd_wishlist", wishlist);
      return { wishlist };
    })
}));
