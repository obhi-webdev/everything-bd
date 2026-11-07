import { useWebsiteMedia } from "../features/website-media/useWebsiteMedia";
import {
  MarketplaceHero,
  MarketplaceCategories,
  MarketplaceShelves,
  MarketplacePromoBanners
} from "../components/home/MarketplaceSections";
import PromoCards from "../components/home/PromoCards";
import "../styles/store-redesign.css";
import "../styles/luxury-header.css";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Truck,
  ShieldCheck,
  Headphones,
  Gift
} from "lucide-react";

import Header from "../components/layout/Header";
import { useShopStore } from "../store/useShopStore";
import Hero from "../components/home/Hero";
import ProductCard from "../components/product/ProductCard";
import CartDrawer from "../components/layout/CartDrawer";

import {
  categories
} from "../features/products/data/products";
import { useProducts } from "../features/products/hooks/useProducts";

export default function Home() {
  const [search, setSearch] = useState(
    () => new URLSearchParams(window.location.search).get("q") || ""
  );
  const [category, setCategory] = useState("All");
  const { products, loading, error } = useProducts();
  const media = useWebsiteMedia();

  const showWishlist = new URLSearchParams(
    window.location.search
  ).get("wishlist") === "1";

  const wishlist = useShopStore(state => state.wishlist);

  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) return;

    const timer = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 120);

    return () => window.clearTimeout(timer);
  }, []);

  const filteredProducts = products.filter((product) => {
    const keyword = search.toLowerCase();

    const matchSearch = [
      product.name,
      product.brand,
      product.category
    ].join(" ").toLowerCase().includes(keyword);

    const matchCategory =
      category === "All" || product.category === category;

    const matchWishlist =
      !showWishlist || wishlist.includes(product.id);

    return matchSearch && matchCategory && matchWishlist;
  });

  return (
    <>
      <Header search={search} setSearch={setSearch} />

      <main id="home">
        <MarketplaceHero products={products} media={media}/>
        {["promo-1", "promo-2", "promo-3"].some(
          key => media[key]?.imageUrl
        ) ? (
          <MarketplacePromoBanners media={media}/>
        ) : (
          <PromoCards products={products}/>
        )}

        <section className="benefits">
          <div className="container benefit-grid">
            <div><Truck /> Nationwide Delivery</div>
            <div><ShieldCheck /> Quality Selection</div>
            <div><Headphones /> Customer Support</div>
            <div><Gift /> Beauty Essentials</div>
          </div>
        </section>

        <MarketplaceCategories
          products={products}
          media={media}
          selected={category}
          onSelect={value => {
            setCategory(value);
            document.getElementById("products")?.scrollIntoView({
              behavior: "smooth"
            });
          }}
        />

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

            {loading ? (
              <div className="no-products">Loading skincare products...</div>
            ) : error ? (
              <div className="no-products" role="alert">{error}</div>
            ) : filteredProducts.length > 0 ? (
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
                {showWishlist ? "No wishlist products found." : "No matching products found."}
              </div>
            )}
          </div>
        </section>

        <MarketplaceShelves products={products} media={media}/>

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

      <footer id="contact" className="footer">
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
