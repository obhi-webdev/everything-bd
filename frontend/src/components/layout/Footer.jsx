import {
  Globe,
  Phone,
  MessageCircle,
  Banknote,
  ShieldCheck,
  Truck
} from "lucide-react";
import { useEffect, useState } from "react";
import "./premiumFooter.css";

export default function Footer() {
  const [favicon, setFavicon] = useState("");

  useEffect(() => {
    let active = true;

    const API = import.meta.env.VITE_API_URL ||
      "http://localhost:5001/api";

    async function loadFavicon() {
      try {
        const response = await fetch(
          `${API}/site-settings`,
          { cache: "no-store" }
        );

        if (!response.ok) return;

        const result = await response.json();
        const url = result.data?.faviconUrl;

        if (active) {
          setFavicon(
            typeof url === "string" &&
            url.startsWith("https://") ? url : ""
          );
        }
      } catch {
        // Preserve the footer when API is unavailable.
      }
    }

    loadFavicon();

    window.addEventListener(
      "everythingbd:settings-updated",
      loadFavicon
    );

    return () => {
      active = false;
      window.removeEventListener(
        "everythingbd:settings-updated",
        loadFavicon
      );
    };
  }, []);

  return (
    <footer id="contact" className="footer ebd-premium-footer">
      <div className="container ebd-footer-grid">

        <div className="ebd-footer-column ebd-footer-about">
          <h3>Everything BD</h3>

          <div className="ebd-footer-logo-lockup">
            {favicon && (
              <img
                className="ebd-footer-favicon"
                src={favicon}
                alt=""
                aria-hidden="true"
              />
            )}

            <div className="brand footer-brand">
              everything<span>bd</span><i>.</i>
            </div>
          </div>

          <p>
            Beauty, Fashion & Lifestyle.
            Quality products delivered with care.
          </p>

          <h4>Follow us</h4>
          <div className="ebd-footer-social">
            <div className="ebd-facebook-embed">
              <iframe
                title="EverythingBD Facebook Page"
                src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fprofile.php%3Fid%3D61593156934281&tabs=&width=300&height=180&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=false"
                width="300"
                height="180"
                style={{ border: "none", overflow: "hidden" }}
                scrolling="no"
                frameBorder="0"
                allow="encrypted-media; picture-in-picture; web-share"
                loading="lazy"
              />
            </div>

            <a
              href="https://www.facebook.com/profile.php?id=61593156934281"
              target="_blank"
              rel="noopener noreferrer"
              className="ebd-facebook-page-link"
            >
              Visit our Facebook Page
            </a>
          </div>
        </div>

        <div className="ebd-footer-column">
          <h3>Contact</h3>
          <p>
            <Phone size={16}/>
            Customer Support
          </p>
          <p>
            <MessageCircle size={16}/>
            WhatsApp Support
          </p>
          <p>
            Contact us through the website
            for product and order assistance.
          </p>
        </div>

        <div className="ebd-footer-column ebd-footer-links">
          <h3>Quick Links</h3>
          <a href="/#home">Home</a>
          <a href="/#products">Shop All</a>
          <a href="/#categories">Categories</a>
          <a href="/#about">About Us</a>
          <a href="/#contact">Contact Us</a>
        </div>

        <div className="ebd-footer-column ebd-footer-payment">
          <h3>Payment Information</h3>

          <div className="ebd-payment-badges">
            <span className="ebd-payment-badge ebd-bkash">
              bKash
            </span>
            <small className="ebd-payment-number">01316804410</small>

            <span className="ebd-payment-badge ebd-nagad">
              Nagad
            </span>
            <small className="ebd-payment-number">01316804410</small>

            <span className="ebd-payment-badge ebd-cod">
              <Banknote size={16}/>
              COD
            </span>
          </div>

          <p className="ebd-payment-note">
            Currently accepting Cash on Delivery.
            Mobile payments are not yet available at checkout.
          </p>

          <div className="ebd-footer-trust">
            <span><ShieldCheck size={16}/> Secure Ordering</span>
            <span><Truck size={16}/> Nationwide Delivery</span>
          </div>
        </div>
      </div>

      <div className="ebd-footer-bottom">
        <div className="container ebd-footer-bottom-inner">
          <span>
            © {new Date().getFullYear()} EverythingBD.
            All Rights Reserved.
          </span>
          <span>Beauty · Fashion · Lifestyle</span>
        </div>
      </div>
    </footer>
  );
}
