import { trackMetaEvent, hasMarketingConsent } from "../../features/marketing/MetaPixel";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, ShoppingBag, Truck,
  ShieldCheck, Banknote, MapPin
} from "lucide-react";
import { getCheckoutConfig, submitOrder } from "../../features/checkout/checkoutApi";
import { validateCheckout } from "../../features/checkout/checkoutValidation";
import "./checkout-simple.css";
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
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

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
    district: "See full address",
    area: "See full address",
    address: "",
    deliveryZone: "",
    customerNote: ""
  });

  const subtotal = cart.reduce(
    (sum, item) =>
      sum + Number(item.price) * item.quantity, 0
  );

  useEffect(() => {
    setAppliedCoupon("");
    setCouponDiscount(0);
    setCouponError("");
  }, [cart]);

  async function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCouponError("Enter a coupon code");
      return;
    }

    setCouponLoading(true);
    setCouponError("");
    setAppliedCoupon("");
    setCouponDiscount(0);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5001/api"}/coupons/validate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, subtotal })
        }
      );

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.message || "Invalid coupon");
      }

      setAppliedCoupon(result.data.code);
      setCouponDiscount(result.data.discount);
    } catch (error) {
      setCouponError(error.message);
    } finally {
      setCouponLoading(false);
    }
  }

  const deliveryRate = form.deliveryZone
    ? config?.delivery?.[form.deliveryZone]
    : null;

  const estimatedTotal = deliveryRate == null
    ? null
    : Math.max(0, subtotal + deliveryRate - couponDiscount);

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
      quantity: Number(item.quantity),
      ...(item.size
        ? { size: String(item.size).trim().toUpperCase() }
        : {})
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
      couponCode: appliedCoupon,
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
              {/* EverythingBD simple three-field checkout */}
              <section className="checkout-panel eb-simple-checkout">
                <h2>01. Customer & Delivery Information</h2>
                <p className="eb-simple-intro">
                  Enter your details to confirm your order.
                </p>

                <div className="checkout-fields eb-simple-fields">
                  <label>
                    Full Name *
                    <input
                      required
                      minLength={2}
                      maxLength={100}
                      autoComplete="name"
                      value={form.name}
                      onChange={e => change("name", e.target.value)}
                      placeholder="আপনার সম্পূর্ণ নাম"
                    />
                  </label>

                  <label>
                    Mobile Number *
                    <input
                      required
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      pattern="(?:[+]88|88)?01[3-9][0-9]{8}"
                      value={form.phone}
                      onChange={e => change("phone", e.target.value)}
                      placeholder="01XXXXXXXXX"
                    />
                  </label>

                  <label className="checkout-wide">
                    Full Delivery Address *
                    <textarea
                      required
                      minLength={10}
                      maxLength={500}
                      rows={4}
                      autoComplete="street-address"
                      value={form.address}
                      onChange={e => change("address", e.target.value)}
                      placeholder="জেলা, থানা, এলাকা, বাসা/রাস্তা এবং সম্পূর্ণ ঠিকানা লিখুন"
                    />
                  </label>

                  <fieldset className="eb-delivery-zone checkout-wide">
                    <legend>Delivery Location *</legend>

                    <div className="eb-delivery-choices">
                      <label
                        className={
                          form.deliveryZone === "inside_dhaka"
                            ? "eb-zone-active" : ""
                        }
                      >
                        <input
                          type="radio"
                          name="deliveryZone"
                          value="inside_dhaka"
                          required
                          checked={form.deliveryZone === "inside_dhaka"}
                          onChange={e =>
                            change("deliveryZone", e.target.value)
                          }
                        />
                        <span>Inside Dhaka</span>
                        <strong>
                          {config?.delivery?.inside_dhaka == null
                            ? "Pending"
                            : money(config.delivery.inside_dhaka)}
                        </strong>
                      </label>

                      <label
                        className={
                          form.deliveryZone === "outside_dhaka"
                            ? "eb-zone-active" : ""
                        }
                      >
                        <input
                          type="radio"
                          name="deliveryZone"
                          value="outside_dhaka"
                          required
                          checked={form.deliveryZone === "outside_dhaka"}
                          onChange={e =>
                            change("deliveryZone", e.target.value)
                          }
                        />
                        <span>Outside Dhaka</span>
                        <strong>
                          {config?.delivery?.outside_dhaka == null
                            ? "Pending"
                            : money(config.delivery.outside_dhaka)}
                        </strong>
                      </label>
                    </div>
                  </fieldset>
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
                    <div className="checkout-item" key={`${item.id}::${item.size || ""}`}>
                      {item.image
                        ? <img src={item.image} alt={item.name}/>
                        : <div className="checkout-image-placeholder">
                            <ShoppingBag size={20}/>
                          </div>}
                      <div>
                        <strong>{item.name}</strong>
                        {item.size && (
                          <span>Size: {item.size}</span>
                        )}
                        <span>Qty: {item.quantity}</span>
                        <b>{money(item.price * item.quantity)}</b>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="eb-checkout-coupon">
                <label htmlFor="coupon-code">Discount Coupon</label>
                <div className="eb-checkout-coupon-row">
                  <input
                    id="coupon-code"
                    type="text"
                    value={couponInput}
                    placeholder="Enter coupon code"
                    maxLength={30}
                    onChange={e => {
                      setCouponInput(e.target.value.toUpperCase());
                      if (appliedCoupon) {
                        setAppliedCoupon("");
                        setCouponDiscount(0);
                      }
                    }}
                  />
                  <button
                    type="button"
                    disabled={couponLoading || !cart.length}
                    onClick={applyCoupon}
                  >
                    {couponLoading ? "Checking..." : "Apply"}
                  </button>
                </div>
                {appliedCoupon && (
                  <p className="eb-coupon-applied">
                    {appliedCoupon} applied! Estimated discount: {money(couponDiscount)}
                  </p>
                )}
                {couponError && (
                  <p className="checkout-order-error">{couponError}</p>
                )}
              </div>

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
                {appliedCoupon && (
                  <div>
                    <span>Coupon Discount ({appliedCoupon})</span>
                    <strong>-{money(couponDiscount)}</strong>
                  </div>
                )}
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
