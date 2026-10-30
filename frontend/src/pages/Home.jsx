import { useState } from "react";
import {
  ArrowRight,
  Truck,
  ShieldCheck,
  Headphones,
  Gift
} from "lucide-react";

import Header from "../components/layout/Header";
import Hero from "../components/home/Hero";
import ProductCard from "../components/product/ProductCard";
import CartDrawer from "../components/layout/CartDrawer";

import {
  products,
  categories
} from "../features/products/data/products";

export default function Home() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const filteredProducts = products.filter((product) => {
    const keyword = search.toLowerCase();

    const matchSearch = [
      product.name,
      product.brand,
      product.category
    ].join(" ").toLowerCase().includes(keyword);

    const matchCategory =
      category === "All" || product.category === category;

    return matchSearch && matchCategory;
  });

  return (
    <>
      <Header search={search} setSearch={setSearch} />

      <main>
        <Hero />

        <section className="benefits">
          <div className="container benefit-grid">
            <div><Truck /> Nationwide Delivery</div>
            <div><ShieldCheck /> Quality Selection</div>
            <div><Headphones /> Customer Support</div>
            <div><Gift /> Beauty Essentials</div>
          </div>
        </section>

        <section id="categories" className="section categories-section">
          <div className="container">
            <div className="section-heading center">
              <p className="section-kicker">PICK YOUR RITUAL</p>
              <h2>Shop by <em>category</em></h2>
              <p>Find everything your skin loves.</p>
            </div>

            <div className="category-grid">
              {categories.map((item) => (
                <button
                  key={item.name}
                  className={
                    "category-card " +
                    (category === item.name ? "selected" : "")
                  }
                  onClick={() => {
                    setCategory(item.name);
                    document
                      .getElementById("products")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <span className="category-emoji">{item.icon}</span>
                  <strong>{item.name}</strong>
                  <span className="category-arrow">↗</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section id="products" className="section products-section">
          <div className="container">
            <div className="section-top">
              <div className="section-heading">
                <p className="section-kicker">FRESH BEAUTY FINDS</p>
                <h2>New <em>arrivals</em></h2>
                <p>Discover your new skincare favourites.</p>
              </div>

              <button
                className="view-all"
                onClick={() => {
                  setCategory("All");
                  setSearch("");
                }}
              >
                View All <ArrowRight size={16} />
              </button>
            </div>

            <div className="filter-row">
              {[
                "All",
                "Serum",
                "Cleanser",
                "Moisturizer",
                "Skincare"
              ].map((item) => (
                <button
                  key={item}
                  className={
                    category === item ? "filter-active" : ""
                  }
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            {filteredProducts.length > 0 ? (
              <div className="product-grid">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                  />
                ))}
              </div>
            ) : (
              <div className="no-products">
                No matching products found.
              </div>
            )}
          </div>
        </section>

        <section className="promo-section">
          <div className="container promo-inner">
            <div>
              <p className="section-kicker">THE SELF-CARE CLUB</p>
              <h2>Good skin days <em>start here.</em></h2>
              <p>A little ritual for a beautiful everyday you.</p>

              <a href="#products" className="primary-btn">
                Shop Collection <ArrowRight size={17} />
              </a>
            </div>
            <div className="promo-decoration">✿</div>
          </div>
        </section>

        <section id="about" className="about-section container">
          <div className="section-heading center">
            <p className="section-kicker">HELLO, BEAUTIFUL</p>
            <h2>Welcome to <em>EverythingBD</em></h2>
            <p>
              Your beauty destination for skincare,
              self-care and everyday essentials.
            </p>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-grid">
          <div>
            <div className="brand footer-brand">
              everything<span>bd</span><i>.</i>
            </div>
            <p>Beauty begins with you.</p>
          </div>

          <div>
            <h4>Explore</h4>
            <a href="#products">Shop All</a>
            <a href="#categories">Categories</a>
            <a href="#about">About Us</a>
          </div>

          <div>
            <h4>Customer Care</h4>
            <p>Product Enquiries</p>
            <p>Delivery Information</p>
            <p>Order Assistance</p>
          </div>

          <div>
            <h4>EverythingBD</h4>
            <p>Your skincare, your ritual, your glow.</p>
          </div>
        </div>

        <div className="footer-bottom container">
          © {new Date().getFullYear()} EverythingBD.
          All rights reserved.
        </div>
      </footer>

      <CartDrawer />
    </>
  );
}
