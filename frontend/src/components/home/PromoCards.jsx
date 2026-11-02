import { ArrowUpRight, Sparkles } from "lucide-react";

const money = value =>
  `৳${Number(value || 0).toLocaleString("en-BD")}`;

export default function PromoCards({ products = [] }) {
  const featured = products.filter(p => p.stock > 0).slice(0, 2);

  const promos = [0, 1].map(index => {
    const product = featured[index];
    return {
      title: product?.name || (
        index === 0 ? "Daily Glow Essentials" : "Your Skincare Routine"
      ),
      price: product ? money(product.price) : "",
      image: product?.image || (
        index === 0
          ? "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=700&q=85"
          : "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=700&q=85"
      ),
      link: product?.slug
        ? `/product/${product.slug}`
        : "/#products"
    };
  });

  return (
    <section id="offers" className="ebd-prime-promos">
      <div className="ebd-prime-promo-grid">
        <a href="/#products" className="ebd-prime-promo-main">
          <div className="ebd-prime-promo-main-image">
            <img
              src="https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=900&q=85"
              alt="Beauty and skincare collection"
              loading="lazy"
            />
            <span>BEAUTY PICKS</span>
          </div>

          <div>
            <span className="ebd-promo-kicker">
              <Sparkles size={14}/> SPECIAL COLLECTION
            </span>
            <h2>Premium Products <br/>On Sale!</h2>
            <p>Beautiful skincare finds for your everyday routine.</p>
            <strong>Explore Offers <ArrowUpRight size={17}/></strong>
          </div>
        </a>

        {promos.map((promo, index) => (
          <a href={promo.link} className="ebd-prime-promo-card"
             key={index}>
            <div className="ebd-prime-promo-image">
              <img src={promo.image} alt={promo.title}
                   loading="lazy"/>
            </div>
            <div className="ebd-prime-promo-info">
              <small>DISCOVER</small>
              <h3>{promo.title}</h3>
              {promo.price && <strong>{promo.price}</strong>}
              <span>SHOP NOW <ArrowUpRight size={16}/></span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
