import "./mobilePromoGrid.css";

const fallbackImages = [
  "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=900&q=85",
  "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=700&q=85",
  "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=700&q=85",
  "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=900&q=85"
];

export default function MobilePromoGrid({
  products = [],
  media = {}
}) {
  const featured = products.filter(
    product => product.image && Number(product.stock) > 0
  );

  const keys = [
    "hero-side",
    "promo-1",
    "promo-2",
    "promo-3"
  ];

  const items = keys.map((key, index) => {
    const managed = media[key];
    const product = featured[index];

    return {
      key,
      image:
        managed?.imageUrl ||
        product?.image ||
        fallbackImages[index],
      title:
        managed?.altText ||
        product?.name ||
        "EverythingBD Collection",
      link:
        managed?.imageUrl
          ? managed.linkUrl || "/#products"
          : product?.slug
            ? `/product/${product.slug}`
            : "/#products"
    };
  });

  return (
    <section
      className="ebd-mobile-four-promos"
      aria-label="Featured collections"
    >
      <div className="ebd-mobile-four-heading">
        <h2>Featured Collections</h2>
        <span>Explore our picks</span>
      </div>

      <div className="ebd-mobile-four-grid">
        {items.map(item => (
          <a
            key={item.key}
            href={item.link}
            className="ebd-mobile-four-card"
            aria-label={item.title}
          >
            <img
              src={item.image}
              alt={item.title}
              loading="lazy"
            />
          </a>
        ))}
      </div>
    </section>
  );
}
