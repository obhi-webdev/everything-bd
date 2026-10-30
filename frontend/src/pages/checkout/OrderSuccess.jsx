import { Link, useLocation } from "react-router-dom";
import { CheckCircle2, ShoppingBag, ShieldCheck } from "lucide-react";
import Header from "../../components/layout/Header";
import "../../styles/order-success.css";

export default function OrderSuccess() {
  const { state } = useLocation();

  let savedOrder = null;
  try {
    savedOrder = JSON.parse(
      sessionStorage.getItem("everythingbd_last_order") || "null"
    );
  } catch {
    savedOrder = null;
  }

  const order = state?.order || savedOrder;

  return (
    <>
      <Header search="" setSearch={() => {}} />
      <main className="ebd-success-page">
        <section className="ebd-success-card">
          {order ? (
            <>
              <CheckCircle2 className="ebd-success-icon" size={58} />
              <span className="ebd-success-label">ORDER CONFIRMED</span>
              <h1>Thank you for your order!</h1>
              <p>Your EverythingBD order has been received.</p>

              <div className="ebd-success-info">
                <div>
                  <span>Order Number</span>
                  <strong>{order.orderNumber}</strong>
                </div>
                <div>
                  <span>Order Total</span>
                  <strong>৳{Number(order.total).toLocaleString("en-BD")}</strong>
                </div>
                <div>
                  <span>Payment Method</span>
                  <strong>Cash on Delivery</strong>
                </div>
                <div>
                  <span>Status</span>
                  <strong>{order.orderStatus || "pending"}</strong>
                </div>
              </div>

              <p className="ebd-success-note">
                Please keep your order number for future reference.
              </p>
            </>
          ) : (
            <>
              <ShieldCheck className="ebd-success-icon" size={50} />
              <h1>Order details unavailable</h1>
              <p>
                This page shows order details immediately after
                a successful checkout. Please check your order
                confirmation before placing another order.
              </p>
            </>
          )}

          <Link to="/" className="ebd-success-shop">
            <ShoppingBag size={18} /> Continue Shopping
          </Link>
        </section>
      </main>
    </>
  );
}
