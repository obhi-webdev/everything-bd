import { ArrowRight, ChevronRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import Hero from "./Hero";
import ProductCard from "../product/ProductCard";
import "./marketplace.css";

const money = value =>
  `৳${Number(value || 0).toLocaleString("en-BD")}`;

export function MarketplaceHero({ products = [], media = {} }) {
  const featured = products.find(
    product => product.image && Number(product.stock) > 0
  );

  return (
    <section className="em-marketplace-hero">
      <div className="em-marketplace-hero-main">
        <Hero />
      </div>

      <div className="em-marketplace-side-promo">
        {media["hero-side"]?.imageUrl ? (
          <a
            className="em-managed-side-banner"
            href={media["hero-side"].linkUrl || "/#products"}
            aria-label={media["hero-side"].altText || "Explore promotion"}
          >
            <img
              src={media["hero-side"].imageUrl}
              alt={media["hero-side"].altText || "EverythingBD promotion"}
            />
          </a>
        ) : featured ? (
          <Link
            to={`/product/${featured.slug}`}
            className="em-marketplace-side-link"
          >
            <div className="em-marketplace-side-copy">
              <span><Sparkles size={15}/> FEATURED PICK</span>
              <h2>{featured.name}</h2>
              <p>{featured.category}</p>
              <strong>{money(featured.price)}</strong>
              <span className="em-marketplace-side-cta">
                Shop Now <ArrowRight size={17}/>
              </span>
            </div>
            <img src={featured.image} alt={featured.name}/>
          </Link>
        ) : (
          <a href="/#products" className="em-marketplace-side-link">
            <div className="em-marketplace-side-copy">
              <span>DISCOVER EVERYTHINGBD</span>
              <h2>Find Your Next Favourite</h2>
              <p>Beauty, fashion and lifestyle essentials.</p>
              <span className="em-marketplace-side-cta">
                Explore Collection <ArrowRight size={17}/>
              </span>
            </div>
          </a>
        )}
      </div>
    </section>
  );
}

export function MarketplaceCategories({
  products = [],
  media = {},
  managedCategories = null,
  selected,
  onSelect
}) {
  const categories = managedCategories !== null
    ? managedCategories.map(item => item.name)
    : [...new Set(
        products
          .map(product => product.category)
          .filter(Boolean)
      )];

  function selectCategory(category) {
    onSelect(category);
  }

  function renderCategory(category, index, duplicate = false) {
    const representative = products.find(
      product => product.category === category && product.image
    );

    const managed = managedCategories?.find(
      item => item.name === category
    );

    const image =
      managed?.imageUrl ||
      media[`category:${category}`]?.imageUrl ||
      representative?.image;

    return (
      <button
        type="button"
        key={`${category}-${index}`}
        className={
          "em-category-circle " +
          (selected === category ? "is-selected" : "")
        }
        onClick={() => selectCategory(category)}
        tabIndex={duplicate ? -1 : 0}
        aria-hidden={duplicate ? "true" : undefined}
      >
        <span className="em-category-photo">
          {image ? (
            <img src={image} alt="" loading="lazy" />
          ) : (
            <Sparkles size={28}/>
          )}
        </span>
        <strong>{category}</strong>
      </button>
    );
  }

  function renderRow(direction, rowCategories, label) {
    return (
      <div
        className={`em-category-marquee em-category-${direction}`}
        aria-label={label}
      >
        <div className="em-category-marquee-track">
          <div className="em-category-marquee-group">
            {rowCategories.map((category, index) =>
              renderCategory(category, index)
            )}
          </div>

          <div
            className="em-category-marquee-group"
            aria-hidden="true"
          >
            {rowCategories.map((category, index) =>
              renderCategory(category, index, true)
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <section id="categories" className="em-categories-section">
      <div className="container">
        <div className="em-marketplace-title-row">
          <h2>Explore Popular Categories</h2>
          <a href="/#products">
            View All <ChevronRight size={15}/>
          </a>
        </div>

        {categories.length > 0 ? (
          <div className="em-category-double-marquee">
            {renderRow(
              "rtl",
              categories,
              "Categories moving right to left"
            )}

            {renderRow(
              "ltr",
              [...categories].reverse(),
              "Categories moving left to right"
            )}
          </div>
        ) : (
          <p className="em-empty-category">
            Categories will appear when products are added.
          </p>
        )}
      </div>
    </section>
  );
}

function ProductShelf({ title, products = [] }) {
  if (!products.length) return null;

  return (
    <section className="em-shelf">
      <div className="container">
        <div className="em-marketplace-title-row">
          <h2>{title}</h2>
          <a href="/#products">View All <ChevronRight size={15}/></a>
        </div>

        <div className="em-product-shelf">
          {products.slice(0, 5).map(product => (
            <ProductCard key={product.id} product={product}/>
          ))}
        </div>
      </div>
    </section>
  );
}

export function MarketplaceShelves({ products = [], media = {} }) {
  const available = products.filter(
    product => Number(product.stock) > 0
  );

  const deals = available.filter(
    product =>
      Number(product.oldPrice) > Number(product.price)
  );

  const featured = available.filter(
    product => product.badge === "FEATURED"
  );

  return (
    <div className="em-marketplace-shelves">
      <ProductShelf
        title="Today's Best Deals For You!"
        products={deals}
      />

      {media["campaign-main"]?.imageUrl ? (
        <a
          className="em-managed-campaign container"
          href={media["campaign-main"].linkUrl || "/#products"}
        >
          <img
            src={media["campaign-main"].imageUrl}
            alt={
              media["campaign-main"].altText ||
              "EverythingBD campaign"
            }
          />
        </a>
      ) : (
      <div className="em-shop-campaign container">
        <div>
          <span>EVERYTHINGBD COLLECTION</span>
          <h2>Discover More. Love Every Find.</h2>
          <p>Explore beauty and everyday essentials in one place.</p>
          <a href="/#products">
            Explore Collection <ArrowRight size={16}/>
          </a>
        </div>
        <div className="em-campaign-decoration" aria-hidden="true">
          ✦
        </div>
      </div>

      )}

      <ProductShelf
        title="Featured Products"
        products={featured}
      />

      <ProductShelf
        title="More To Explore"
        products={[...available].reverse()}
      />
    </div>
  );
}

export function MarketplacePromoBanners({ media = {} }) {
  const slots = ["promo-1", "promo-2", "promo-3"];

  const available = slots
    .map(key => ({ key, ...media[key] }))
    .filter(item => item.imageUrl);

  if (!available.length) return null;

  return (
    <section className="em-managed-promos container">
      {available.map(item => (
        <a
          key={item.key}
          href={item.linkUrl || "/#products"}
          className="em-managed-promo"
        >
          <img
            src={item.imageUrl}
            alt={item.altText || "EverythingBD promotion"}
            loading="lazy"
          />
        </a>
      ))}
    </section>
  );
}
