import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, ShieldCheck, Truck } from "lucide-react";
import { getCheckoutConfig, submitOrder } from "../../features/checkout/checkoutApi";
import "./landing.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const emptyCustomer = {
  name: "",
  phone: "",
  district: "",
  area: "",
  address: "",
  deliveryZone: "outside_dhaka"
};

export default function LandingPage() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [customer, setCustomer] = useState(emptyCustomer);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const requestId = useRef(null);
  const orderRef = useRef(null);

  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);

    return () => meta.remove();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setPage(null);

    Promise.all([
      fetch(`${API}/landing-pages/${encodeURIComponent(slug)}`, {
        signal: controller.signal
      }).then(async res => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Page unavailable");
        return data.data;
      }),
      getCheckoutConfig(controller.signal).catch(() => null)
    ]).then(([landing, checkout]) => {
      setPage(landing);
      setConfig(checkout);
      document.title = `${landing.name} | EverythingBD`;
    }).catch(err => {
      if (err.name !== "AbortError") setError(err.message);
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });

    return () => controller.abort();
  }, [slug]);

  function update(key, value) {
    setCustomer(prev => ({ ...prev, [key]: value }));
  }

  async function placeOrder(event) {
    event.preventDefault();
    if (!page || !config?.checkoutAvailable || submitting) return;

    if (!requestId.current) {
      requestId.current = crypto.randomUUID();
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await submitOrder({
        requestId: requestId.current,
        customer: {
          name: customer.name,
          phone: customer.phone,
          alternatePhone: "",
          email: ""
        },
        shippingAddress: {
          district: customer.district,
          area: customer.area,
          address: customer.address,
          deliveryZone: customer.deliveryZone
        },
        items: [{
          productId: String(page.productId),
          quantity
        }],
        customerNote: `Landing page: ${page.slug}`,
        paymentMethod: "cod",
        marketingConsent: false
      });

      const created = response.data || response.order || response;
      const number = created.orderNumber || response.orderNumber || "";

      setOrderNumber(number || "Order submitted successfully");
    } catch (err) {
      setError(err.message || "Order could not be placed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <main className="lp-public-state">Loading landing page...</main>;
  }

  if (!page) {
    return <main className="lp-public-state">
      <h1>Page unavailable</h1>
      <p>{error || "This landing page does not exist or is not published."}</p>
    </main>;
  }

  const images = page.images || [];
  const deliveryCharge = config?.delivery?.[customer.deliveryZone];

  return (
    <div className="lp-public">
      <div className="lp-brand">everything<span>bd</span>.</div>

      <main className="lp-public-main">
        <div className="lp-public-visual">
          {images.length > 0 && (
            <>
              <img className="lp-main-photo"
                src={images[selectedImage] || images[0]}
                alt={page.name}
              />
              <div className="lp-thumbnails">
                {images.map((image, index) => (
                  <button key={`${image}-${index}`} type="button"
                    className={selectedImage === index ? "selected" : ""}
                    onClick={() => setSelectedImage(index)}>
                    <img src={image} alt={`${page.name} ${index + 1}`}/>
                  </button>
                ))}
              </div>
            </>
          )}

          {page.videoUrl && (
            <video className="lp-product-video"
              controls playsInline preload="metadata" src={page.videoUrl}/>
          )}
        </div>

        <div className="lp-public-content">
          <span className="lp-kicker">EVERYTHINGBD EXCLUSIVE</span>
          <h1>{page.headline || page.name}</h1>
          <p className="lp-description">{page.description}</p>

          {page.benefits && (
            <div className="lp-benefits">
              <h2>Why you'll love it</h2>
              {page.benefits.split("\n").filter(Boolean).map((item, index) => (
                <div key={index}>
                  <CheckCircle2 size={18}/>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}

          <div className="lp-trust">
            <span><Truck size={18}/> Nationwide Delivery</span>
            <span><ShieldCheck size={18}/> Cash on Delivery</span>
          </div>

          <button className="lp-order-jump"
            onClick={() => orderRef.current?.scrollIntoView({
              behavior: "smooth", block: "start"
            })}>
            {page.buttonText || "Order Now"}
          </button>
        </div>
      </main>

      <section className="lp-checkout" ref={orderRef}>
        <h2>Confirm Your Order</h2>
        <p>Enter your delivery details to place a Cash on Delivery order.</p>

        {orderNumber ? (
          <div className="lp-order-success" role="status">
            <CheckCircle2 size={36}/>
            <h3>Thank you! Your order has been received.</h3>
            <p>{orderNumber}</p>
          </div>
        ) : (
          <form onSubmit={placeOrder}>
            <div className="lp-checkout-grid">
              <label>Full Name
                <input required minLength={2} maxLength={100}
                  value={customer.name}
                  onChange={e => update("name", e.target.value)}/>
              </label>

              <label>Mobile Number
                <input required type="tel" inputMode="tel"
                  pattern="(?:\+?88)?01[3-9][0-9]{8}"
                  placeholder="01XXXXXXXXX"
                  value={customer.phone}
                  onChange={e => update("phone", e.target.value)}/>
              </label>

              <label>District
                <input required minLength={2} maxLength={100}
                  value={customer.district}
                  onChange={e => update("district", e.target.value)}/>
              </label>

              <label>Area / Thana
                <input required minLength={2} maxLength={150}
                  value={customer.area}
                  onChange={e => update("area", e.target.value)}/>
              </label>

              <label className="lp-full">Full Delivery Address
                <textarea required minLength={10} maxLength={500}
                  rows={3} value={customer.address}
                  onChange={e => update("address", e.target.value)}/>
              </label>

              <label>Delivery Location
                <select value={customer.deliveryZone}
                  onChange={e => update("deliveryZone", e.target.value)}>
                  <option value="inside_dhaka">Inside Dhaka</option>
                  <option value="outside_dhaka">Outside Dhaka</option>
                </select>
              </label>

              <label>Quantity
                <input required type="number" min="1" max="20"
                  value={quantity}
                  onChange={e => setQuantity(
                    Math.max(1, Math.min(20, Number(e.target.value) || 1))
                  )}/>
              </label>
            </div>

            {deliveryCharge !== null && deliveryCharge !== undefined && (
              <p>Delivery charge: ৳{deliveryCharge}</p>
            )}

            <p className="lp-checkout-note">
              Product price and stock are verified by the server.
              Please confirm the product's current price before placing your order.
            </p>

            {error && <p className="lp-error" role="alert">{error}</p>}

            <button className="lp-place-order" type="submit"
              disabled={submitting || !config?.checkoutAvailable}>
              {submitting ? "Submitting Order..." :
                !config?.checkoutAvailable ?
                  "Ordering Temporarily Unavailable" :
                  "Place Cash on Delivery Order"}
            </button>
          </form>
        )}
      </section>

      <footer className="lp-public-footer">
        © EverythingBD · Beauty & Skincare
      </footer>
    </div>
  );
}
