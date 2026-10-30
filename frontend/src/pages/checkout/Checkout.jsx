import { trackMetaEvent, hasMarketingConsent } from "../../features/marketing/MetaPixel";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, ShoppingBag, Truck,
  ShieldCheck, Banknote, MapPin
} from "lucide-react";
import { getCheckoutConfig, submitOrder } from "../../features/checkout/checkoutApi";
import { validateCheckout } from "../../features/checkout/checkoutValidation";
import Header from "../../components/layout/Header";
import CartDrawer from "../../components/layout/CartDrawer";
import { useShopStore } from "../../store/useShopStore";

const money = amount =>
  `৳${Number(amount).toLocaleString("en-BD")}`;

export default function Checkout() {
  const cart = useShopStore(s => s.cart);
  const clearCart = useShopStore(s => s.clearCart);
  const navigate = useNavigate();
  const submittingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState("");

  const [config, setConfig] = useState(null);
  const [configError, setConfigError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    getCheckoutConfig(controller.signal)
      .then(setConfig)
      .catch(error => {
        if (!controller.signal.aborted) {
          setConfigError(error.message);
        }
      });

    return () => controller.abort();
  }, []);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    alternatePhone: "",
    email: "",
    district: "",
    area: "",
    address: "",
    deliveryZone: "",
    customerNote: ""
  });

  const subtotal = cart.reduce(
    (sum, item) =>
      sum + Number(item.price) * item.quantity, 0
  );

  const deliveryRate = form.deliveryZone
    ? config?.delivery?.[form.deliveryZone]
    : null;

  const estimatedTotal = deliveryRate == null
    ? null
    : subtotal + deliveryRate;

  const totalItems = cart.reduce(
    (sum, item) => sum + item.quantity, 0
  );

  useEffect(() => {
    if (cart.length === 0) return;

    const subtotal = cart.reduce(
      (sum, item) =>
        sum + Number(item.price || 0) * Number(item.quantity || 0),
      0
    );

    trackMetaEvent("InitiateCheckout", {
      currency: "BDT",
      value: Number(subtotal.toFixed(2)),
      num_items: cart.reduce(
        (sum, item) => sum + Number(item.quantity || 0), 0
      ),
      content_type: "product",
      content_ids: cart.map(item => String(item.id)),
      contents: cart.map(item => ({
        id: String(item.id),
        quantity: item.quantity,
        item_price: Number(item.price)
      }))
    });
  }, []);

  function change(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (submittingRef.current ||
        !config?.checkoutAvailable ||
        deliveryRate == null ||
        cart.length === 0) return;

    const validationError = validateCheckout(form);
    if (validationError) {
      setOrderError(validationError);
      return;
    }

    const items = cart.map(item => ({
      productId: String(item.id),
      quantity: Number(item.quantity)
    }));

    if (!items.every(item =>
      /^[a-fA-F0-9]{24}$/.test(item.productId) &&
      Number.isInteger(item.quantity) &&
      item.quantity >= 1 &&
      item.quantity <= 20
    )) {
      setOrderError("Cart contains invalid or demo products.");
      return;
    }

    const payload = {
      customer: {
        name: form.name.trim(),
        phone: form.phone.trim(),
        alternatePhone: form.alternatePhone.trim(),
        email: form.email.trim()
      },
      shippingAddress: {
        district: form.district.trim(),
        area: form.area.trim(),
        address: form.address.trim(),
        deliveryZone: form.deliveryZone
      },
      items,
      customerNote: form.customerNote.trim(),
      paymentMethod: "cod",
      marketingConsent: hasMarketingConsent()
    };

    const fingerprint = JSON.stringify(payload);
    const key = "everythingbd_pending_checkout";

    let pending = null;

    try {
      pending = JSON.parse(sessionStorage.getItem(key) || "null");
    } catch {
      pending = null;
    }

    if (!pending || pending.fingerprint !== fingerprint) {
      pending = {
        fingerprint,
        requestId: crypto.randomUUID()
      };
      sessionStorage.setItem(key, JSON.stringify(pending));
    }

    submittingRef.current = true;
    setSubmitting(true);
    setOrderError("");

    try {
      const result = await submitOrder({
        ...payload,
        requestId: pending.requestId
      });

      sessionStorage.removeItem(key);

      const confirmation = {
        orderNumber: result.data.orderNumber,
        total: result.data.total,
        orderStatus: result.data.orderStatus || "pending"
      };

      try {
        sessionStorage.setItem(
          "everythingbd_last_order",
          JSON.stringify(confirmation)
        );
      } catch {
        // Confirmation still works through navigation state.
      }

      trackMetaEvent(
        "Purchase",
        {
          value: Number(result.data.total),
          currency: "BDT",
          order_id: result.data.orderNumber,
          content_type: "product",
          content_ids: cart.map(item => String(item.id)),
          contents: cart.map(item => ({
            id: String(item.id),
            quantity: item.quantity,
            item_price: Number(item.price)
          }))
        },
        `purchase_${result.data.orderNumber}`
      );

      clearCart();

      navigate("/order-success", {
        replace: true,
        state: { order: result.data }
      });
    } catch (error) {
      setOrderError(error.message || "Order submission failed");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <>
      <Header search="" setSearch={() => {}} />

      <main className="checkout-page">
        <div className="container">
          <div className="checkout-heading">
            <Link to="/" className="checkout-back">
              <ArrowLeft size={16} /> Continue Shopping
            </Link>
            <p className="section-kicker">EVERYTHINGBD</p>
            <h1>Secure <em>Checkout</em></h1>
            <p>You're just one step away from your beauty essentials.</p>
          </div>

          <div className="checkout-layout">
            <form
              id="checkout-form"
              className="checkout-form"
              onSubmit={handleSubmit}
            >
              <section className="checkout-panel">
                <h2>01. Contact Information</h2>

                <div className="checkout-fields">
                  <label>
                    Full Name *
                    <input required minLength={2}
                      autoComplete="name"
                      value={form.name}
                      onChange={e => change("name", e.target.value)}
                      placeholder="Your full name" />
                  </label>

                  <label>
                    Mobile Number *
                    <input required type="tel"
                      inputMode="tel"
                      pattern="(\+?88)?01[3-9][0-9]{8}"
                      value={form.phone}
                      onChange={e => change("phone", e.target.value)}
                      placeholder="01XXXXXXXXX" />
                  </label>

                  <label>
                    Alternative Phone
                    <input type="tel" inputMode="tel"
                      value={form.alternatePhone}
                      onChange={e => change("alternatePhone", e.target.value)}
                      placeholder="Optional" />
                  </label>

                  <label>
                    Email Address
                    <input type="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={e => change("email", e.target.value)}
                      placeholder="Optional" />
                  </label>
                </div>
              </section>

              <section className="checkout-panel">
                <h2><MapPin size={19}/> 02. Delivery Address</h2>

                <div className="checkout-fields">
                  <label>
                    District *
                    <input required
                      value={form.district}
                      onChange={e => change("district", e.target.value)}
                      placeholder="e.g. Mymensingh" />
                  </label>

                  <label>
                    Area / Thana *
                    <input required
                      value={form.area}
                      onChange={e => change("area", e.target.value)}
                      placeholder="Your area or thana" />
                  </label>

                  <label className="checkout-wide">
                    Full Address *
                    <textarea required minLength={10} rows={3}
                      autoComplete="street-address"
                      value={form.address}
                      onChange={e => change("address", e.target.value)}
                      placeholder="House, road, village or landmark" />
                  </label>

                  <label className="checkout-wide">
                    Delivery Zone *
                    <select required value={form.deliveryZone}
                      onChange={e => change("deliveryZone", e.target.value)}>
                      <option value="">Select delivery zone</option>
                      <option value="inside_dhaka">Inside Dhaka</option>
                      <option value="outside_dhaka">Outside Dhaka</option>
                    </select>
                  </label>

                  <label className="checkout-wide">
                    Order Note
                    <textarea rows={2} maxLength={500}
                      value={form.customerNote}
                      onChange={e => change("customerNote", e.target.value)}
                      placeholder="Any special instructions? (Optional)" />
                  </label>
                </div>
              </section>

              <section className="checkout-panel">
                <h2><Banknote size={20}/> 03. Payment Method</h2>
                <div className="checkout-payment">
                  <Banknote size={24}/>
                  <div>
                    <strong>Cash on Delivery</strong>
                    <p>Pay when your parcel arrives.</p>
                  </div>
                  <span className="checkout-selected">Selected</span>
                </div>
              </section>
            </form>

            <aside className="checkout-summary">
              <h2>Your Order ({totalItems})</h2>

              {cart.length === 0 ? (
                <div className="checkout-empty">
                  <ShoppingBag size={35}/>
                  <p>Your shopping bag is empty.</p>
                  <Link to="/">Explore Products</Link>
                </div>
              ) : (
                <div className="checkout-items">
                  {cart.map(item => (
                    <div className="checkout-item" key={item.id}>
                      {item.image
                        ? <img src={item.image} alt={item.name}/>
                        : <div className="checkout-image-placeholder">
                            <ShoppingBag size={20}/>
                          </div>}
                      <div>
                        <strong>{item.name}</strong>
                        <span>Qty: {item.quantity}</span>
                        <b>{money(item.price * item.quantity)}</b>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="checkout-totals">
                <div><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
                <div>
                  <span>Delivery Charge</span>
                  <strong>
                    {deliveryRate == null
                      ? "To be confirmed"
                      : money(deliveryRate)}
                  </strong>
                </div>
                <div className="checkout-total">
                  <span>Grand Total</span>
                  <strong>
                    {estimatedTotal === null
                      ? "Pending delivery rate"
                      : money(estimatedTotal)}
                  </strong>
                </div>
              </div>

              <button
                className="checkout-place-order"
                type="submit"
                form="checkout-form"
                disabled={
                  submitting ||
                  !config?.checkoutAvailable ||
                  deliveryRate == null ||
                  cart.length === 0
                }>
                {submitting
                  ? "Placing Order..."
                  : config?.checkoutAvailable
                    ? "Place Cash on Delivery Order"
                    : "Delivery Charges Pending"}
              </button>

              {orderError && (
                <p className="checkout-order-error" role="alert">
                  {orderError}
                </p>
              )}

              {configError && (
                <p className="checkout-pending" role="alert">
                  {configError}
                </p>
              )}

              <p className="checkout-pending">
                Order placement will be enabled after
                delivery charges and checkout verification.
              </p>

              <div className="checkout-trust">
                <span><ShieldCheck size={16}/> Secure Checkout</span>
                <span><Truck size={16}/> Nationwide Delivery</span>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <CartDrawer />
    </>
  );
}
