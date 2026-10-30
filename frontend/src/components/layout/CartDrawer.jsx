import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { money } from "../../features/products/data/products";
import { useShopStore } from "../../store/useShopStore";

export default function CartDrawer() {
  const cart = useShopStore((state) => state.cart);
  const cartOpen = useShopStore((state) => state.cartOpen);
  const setCartOpen = useShopStore((state) => state.setCartOpen);
  const changeQuantity = useShopStore((state) => state.changeQuantity);

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity, 0
  );

  if (!cartOpen) return null;

  return (
    <div className="cart-overlay" onClick={() => setCartOpen(false)}>
      <aside
        className="cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drawer-header">
          <h2>Your Bag ({cart.length})</h2>
          <button className="icon-btn" onClick={() => setCartOpen(false)}>
            <X />
          </button>
        </div>

        <div className="drawer-items">
          {cart.length === 0 ? (
            <div className="empty-cart">
              <ShoppingBag size={44}/>
              <h3>Your bag is empty</h3>
              <p>Your next skincare favourite is waiting.</p>
            </div>
          ) : cart.map((item) => (
            <div className="cart-item" key={item.id}>
              <img src={item.image} alt={item.name}/>
              <div className="cart-item-info">
                <h3>{item.name}</h3>
                <strong>{money(item.price)}</strong>
                <div className="quantity">
                  <button onClick={() => changeQuantity(item.id, -1)}>
                    <Minus size={14}/>
                  </button>
                  <span>{item.quantity}</span>
                  <button onClick={() => changeQuantity(item.id, 1)}>
                    <Plus size={14}/>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="drawer-bottom">
          <div className="subtotal">
            <span>Subtotal</span>
            <strong>{money(subtotal)}</strong>
          </div>
          <p>Shipping is calculated at checkout.</p>
          <button className="primary-btn checkout-btn" disabled>
            Checkout – Coming Next
          </button>
        </div>
      </aside>
    </div>
  );
}
