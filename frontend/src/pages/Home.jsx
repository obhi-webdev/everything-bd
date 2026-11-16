import MobilePromoGrid from "../components/home/MobilePromoGrid";
import { useCategories } from "../features/categories/useCategories";
import { useWebsiteMedia } from "../features/website-media/useWebsiteMedia";
import {
  MarketplaceHero,
  MarketplaceCategories,
  MarketplaceShelves,
  MarketplacePromoBanners
} from "../components/home/MarketplaceSections";
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
import Footer from "../components/layout/Footer";
import { useShopStore } from "../store/useShopStore";
import Hero from "../components/home/Hero";
import CategoryProductSection from "../components/home/CategoryProductSection";
import MarketplaceCampaign from "../components/home/MarketplaceCampaign";
import CartDrawer from "../components/layout/CartDrawer";

import {
  categories
} from "../features/products/data/products";
import { useProducts } from "../features/products/hooks/useProducts";
import "../styles/reference-product-grid.css";

export default function Home() {
  const [search, setSearch] = useState(
    () => new URLSearchParams(window.location.search).get("q") || ""
  );
  const [category, setCategory] = useState("All");
  const { products, loading, error } = useProducts();
  const managedCategories = useCategories();
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


  const categoryCounts = products.reduce((counts, product) => {
    const name = String(product.category || "").trim();
    if (name) counts[name] = (counts[name] || 0) + 1;
    return counts;
  }, {});

  const featuredCategories = Object.keys(categoryCounts)
    .sort((a, b) =>
      categoryCounts[b] - categoryCounts[a] ||
      a.localeCompare(b)
    )
    .slice(0, 2)
    .reverse();

  return (
    <>
      <Header search={search} setSearch={setSearch} />

      <main id="home">
        <MarketplaceHero products={products} media={media}/>
        <MobilePromoGrid products={products} media={media}/>
        {["promo-1", "promo-2", "promo-3"].some(
          key => media[key]?.imageUrl
        ) ? (
          <MarketplacePromoBanners media={media}/>
        ) : null}

        <section className="benefits">
          <div className="container benefit-grid">
            <div><Truck /> Nationwide Delivery</div>
            <div><ShieldCheck /> Quality Selection</div>
            <div><Headphones /> Customer Support</div>
            <div><Gift /> Beauty Essentials</div>
          </div>
        </section>

        <MarketplaceCategories
          managedCategories={managedCategories}
          products={products}
          media={media}
          selected={category}
          onSelect={value => {
            window.location.assign(
              value === "All"
                ? "/shop"
                : `/shop?category=${encodeURIComponent(value)}`
            );
          }}
        />

        {loading ? (
          <div className="container no-products">
            Loading products...
          </div>
        ) : error ? (
          <div className="container no-products" role="alert">
            {error}
          </div>
        ) : (
          <>
            <CategoryProductSection
              id="products"
              category={featuredCategories[0]}
              products={products}
            />

            <MarketplaceCampaign media={media} />

            <CategoryProductSection
              id="more-products"
              category={featuredCategories[1]}
              products={products}
            />
          </>
        )}




      </main>

      <Footer/>

      <CartDrawer />
    </>
  );
}
