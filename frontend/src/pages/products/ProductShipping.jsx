import { useEffect, useState } from "react";
import { Truck, ShieldCheck } from "lucide-react";
import "./productShipping.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5001/api";

const money = value =>
  `৳${Number(value).toLocaleString("en-BD")}`;

function validRate(value) {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0;
}

export default function ProductShipping() {
  const [state, setState] = useState({
    status: "loading",
    delivery: null,
    cod: false
  });

  useEffect(() => {
    const controller = new AbortController();

    async function loadShipping() {
      try {
        const response = await fetch(
          `${API_URL}/checkout/config`,
          {
            signal: controller.signal,
            cache: "no-store"
          }
        );

        if (!response.ok) {
          throw new Error("Shipping unavailable");
        }

        const config = await response.json();

        if (
          !config.success ||
          !config.checkoutAvailable ||
          config.currency !== "BDT" ||
          !validRate(config.delivery?.inside_dhaka) ||
          !validRate(config.delivery?.outside_dhaka)
        ) {
          throw new Error("Invalid shipping configuration");
        }

        if (!controller.signal.aborted) {
          setState({
            status: "ready",
            delivery: config.delivery,
            cod: Array.isArray(config.paymentMethods) &&
              config.paymentMethods.includes("cod")
          });
        }
      } catch {
        if (!controller.signal.aborted) {
          setState({
            status: "unavailable",
            delivery: null,
            cod: false
          });
        }
      }
    }

    loadShipping();

    return () => controller.abort();
  }, []);

  return (
    <section
      className="ebd-product-shipping"
      aria-label="Delivery information"
    >
      <div className="ebd-ps-heading">
        <Truck size={21} />
        <h3>Delivery Information</h3>
      </div>

      <div aria-live="polite">
        {state.status === "loading" ? (
          <p className="ebd-ps-note">
            Loading delivery information...
          </p>
        ) : state.status !== "ready" ? (
          <p className="ebd-ps-note">
            Delivery charges are currently unavailable.
            Please check again before placing your order.
          </p>
        ) : (
          <>
            <div className="ebd-ps-row">
              <div>
                <strong>Inside Dhaka</strong>
                <span>Delivery within 2 days</span>
              </div>
              <b>{money(state.delivery.inside_dhaka)}</b>
            </div>

            <div className="ebd-ps-row">
              <div>
                <strong>Outside Dhaka</strong>
                <span>Delivery within 4 days</span>
              </div>
              <b>{money(state.delivery.outside_dhaka)}</b>
            </div>

            {state.cod && (
              <div className="ebd-ps-cod">
                <ShieldCheck size={17} />
                <span>Cash on Delivery Available</span>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
