import { useEffect } from "react";
import {
  Sparkles,
  Shirt,
  Baby,
  Wallet,
  Smartphone,
  ShieldCheck,
  Truck,
  Headphones,
  ArrowRight
} from "lucide-react";

import SEO from "../components/seo/SEO";
import { buildBreadcrumb } from "../components/seo/seoUtils";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import CartDrawer from "../components/layout/CartDrawer";
import "../styles/about-page.css";

const collections = [
  {
    icon: Sparkles,
    title: "100% Authentic Korean Skincare & Beauty",
    description:
      "Sourced carefully to ensure genuine quality for your skin."
  },
  {
    icon: Shirt,
    title: "Trendy Women's Fashion",
    description:
      "Comfortable and stylish Ladies Kurtis and Two-Piece sets for everyday wear and special occasions."
  },
  {
    icon: Baby,
    title: "Adorable Kids' Collection",
    description:
      "Soft, comfortable, and fashionable outfits designed with care for your little ones."
  },
  {
    icon: Wallet,
    title: "Premium Leather Items",
    description:
      "Durable wallets and everyday leather accessories."
  },
  {
    icon: Smartphone,
    title: "Smart Gadgets & Unique Finds",
    description:
      "Handy, trendy, and problem-solving Chinese gadgets and daily lifestyle essentials that make your life easier."
  }
];

const benefits = [
  {
    icon: ShieldCheck,
    title: "Guaranteed Quality",
    description:
      "Every product goes through a quality check before it reaches you."
  },
  {
    icon: Truck,
    title: "Easy Cash on Delivery",
    description:
      "Pay only when you receive your product at your doorstep anywhere in Bangladesh."
  },
  {
    icon: Headphones,
    title: "Customer-First Support",
    description:
      "Have a question about size, fabric, or product features? Our team is just a message away on WhatsApp or phone."
  }
];

export default function About() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <SEO
        title="About Us | EverythingBD - Beauty, Fashion & Lifestyle"
        description="Discover EverythingBD, your trusted destination for authentic Korean skincare, women's fashion, kids' clothing, leather items and smart gadgets in Bangladesh."
        path="/about"
        schemas={[
          buildBreadcrumb([
            { name: "Home", path: "/" },
            { name: "About Us", path: "/about" }
          ])
        ]}
      />
      <Header />

      <main className="ebd-about">

        <section className="ebd-about-hero">
          <div className="ebd-about-container">

            <nav
              className="ebd-about-breadcrumb"
              aria-label="Breadcrumb"
            >
              <a href="/">Home</a>
              <span>/</span>
              <span aria-current="page">About Us</span>
            </nav>

            <div className="ebd-about-hero-content">

              <span className="ebd-about-eyebrow">
                OUR STORY
              </span>

              <h1>
                Welcome to
                <span> EverythingBD.</span>
              </h1>

              <h2>
                Your Trusted Lifestyle, Fashion
                &amp; Gadget Destination!
              </h2>

              <p>
                At EverythingBD, we believe that online
                shopping in Bangladesh should be simple,
                reliable, and enjoyable. We started with
                a clear mission: to bring authentic,
                high-quality, and useful products for you
                and your family together under one roof.
              </p>

              <div className="ebd-about-actions">
                <a
                  className="ebd-about-primary"
                  href="/shop"
                >
                  Explore Our Store
                  <ArrowRight size={18} />
                </a>

                <a
                  className="ebd-about-secondary"
                  href="#contact"
                >
                  Contact Us
                </a>
              </div>

            </div>

            <div className="ebd-about-hero-trust">
              <span>
                <ShieldCheck size={20} />
                Quality Products
              </span>
              <span>
                <Truck size={20} />
                Nationwide Delivery
              </span>
              <span>
                <Headphones size={20} />
                Customer Support
              </span>
            </div>

          </div>
        </section>

        <section className="ebd-about-section">
          <div className="ebd-about-container">

            <div className="ebd-about-heading">
              <span className="ebd-about-eyebrow">
                OUR COLLECTIONS
              </span>

              <h2>What We Offer</h2>

              <p>
                Discover quality products for every
                part of your everyday life.
              </p>
            </div>

            <div className="ebd-about-collections">

              {collections.map(item => {
                const Icon = item.icon;

                return (
                  <article
                    className="ebd-about-collection"
                    key={item.title}
                  >
                    <div className="ebd-about-icon">
                      <Icon size={26} strokeWidth={1.7} />
                    </div>

                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </article>
                );
              })}

            </div>
          </div>
        </section>

        <section className="ebd-about-section ebd-about-benefits">
          <div className="ebd-about-container">

            <div className="ebd-about-heading">
              <span className="ebd-about-eyebrow">
                THE EVERYTHINGBD PROMISE
              </span>

              <h2>Why Shop With Us?</h2>

              <p>
                A better shopping experience,
                built around your needs.
              </p>
            </div>

            <div className="ebd-about-benefit-grid">

              {benefits.map(item => {
                const Icon = item.icon;

                return (
                  <article
                    className="ebd-about-benefit"
                    key={item.title}
                  >
                    <div className="ebd-about-icon">
                      <Icon size={28} strokeWidth={1.7} />
                    </div>

                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </article>
                );
              })}

            </div>
          </div>
        </section>

        <section className="ebd-about-section">
          <div className="ebd-about-container">

            <div className="ebd-about-cta">

              <span className="ebd-about-cta-label">
                EVERYTHING YOU LOVE, IN ONE PLACE.
              </span>

              <h2>
                Thank you for trusting EverythingBD.
              </h2>

              <p>Happy Shopping!</p>

              <a href="/shop">
                Shop Now
                <ArrowRight size={18} />
              </a>

            </div>

          </div>
        </section>

      </main>

      <Footer />
      <CartDrawer />
    </>
  );
}
