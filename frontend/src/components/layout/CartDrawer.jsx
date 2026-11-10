import { Link } from "react-router-dom";
import {
  X, Minus, Plus, ShoppingBag, Trash2
} from "lucide-react";
import { money } from "../../features/products/data/products";
import { useShopStore } from "../../store/useShopStore";

export default function CartDrawer() {
  const cart = useShopStore(s => s.cart);
  const cartOpen = useShopStore(s => s.cartOpen);
  const setCartOpen = useShopStore(s => s.setCartOpen);
  const changeQuantity = useShopStore(s => s.changeQuantity);
  const removeFromCart = useShopStore(s => s.removeFromCart);

  const itemCount = cart.reduce(
    (sum, item) => sum + item.quantity, 0
  );

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity, 0
  );

  if (!cartOpen) return null;

  return (
    <div
      className="cart-overlay"
      onClick={() => setCartOpen(false)}
    >
      <aside
        className="cart-drawer ebd-cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        onClick={event => event.stopPropagation()}
      >
        <div className="drawer-header">
          <div>
            <h2>Your Bag ({itemCount})</h2>
            <small>EverythingBD Beauty Collection</small>
          </div>

          <button
            className="icon-btn"
            aria-label="Close shopping cart"
            onClick={() => setCartOpen(false)}
          >
            <X size={20}/>
          </button>
        </div>

        <div className="drawer-items">
          {cart.length === 0 ? (
            <div className="empty-cart">
              <ShoppingBag size={44}/>
              <h3>Your bag is empty</h3>
              <p>Discover your next skincare favourite.</p>
              <Link
                to="/"
                className="primary-btn"
                onClick={() => setCartOpen(false)}
              >
                Continue Shopping
              </Link>
            </div>
          ) : cart.map(item => {
            const stock = Math.max(
              0, Number(item.stock) || 0
            );

            const maxReached = item.quantity >= stock;

            return (
              <div className="cart-item ebd-cart-item" key={`${item.id}::${item.size || ""}`}>
                {item.image ? (
                  <img src={item.image} alt={item.name}/>
                ) : (
                  <div className="ebd-cart-placeholder">
                    <ShoppingBag size={22}/>
                  </div>
                )}

                <div className="cart-item-info">
                  <div className="ebd-cart-item-heading">
                    <h3>{item.name}</h3>
                    <button
                      type="button"
                      className="ebd-remove-item"
                      aria-label={`Remove ${item.name}`}
                      onClick={() => removeFromCart(
                        `${item.id}::${item.size || ""}`
                      )}
                    >
                      <Trash2 size={16}/>
                    </button>
                  </div>

                  {item.size && (
                    <small className="ebd-cart-size">
                      Size: <strong>{item.size}</strong>
                    </small>
                  )}

                  <strong>{money(item.price)}</strong>

                  <div className="quantity">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => changeQuantity(
                        `${item.id}::${item.size || ""}`, -1
                      )}
                    >
                      <Minus size={14}/>
                    </button>

                    <span>{item.quantity}</span>

                    <button
                      type="button"
                      aria-label="Increase quantity"
                      disabled={maxReached}
                      onClick={() => changeQuantity(
                        `${item.id}::${item.size || ""}`, 1
                      )}
                    >
                      <Plus size={14}/>
                    </button>
                  </div>

                  <small className="ebd-stock-note">
                    {stock === 0
                      ? "Currently unavailable"
                      : maxReached
                        ? "Maximum available quantity reached"
                        : `${stock} available in stock`}
                  </small>
                </div>
              </div>
            );
          })}
        </div>

        {cart.length > 0 && (
          <div className="drawer-bottom">
            <div className="subtotal">
              <span>Subtotal ({itemCount} items)</span>
              <strong>{money(subtotal)}</strong>
            </div>

            <p>Shipping is calculated at checkout.</p>

            <Link
              to="/checkout"
              className="primary-btn checkout-btn"
              onClick={() => setCartOpen(false)}
            >
              Proceed to Checkout
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}
