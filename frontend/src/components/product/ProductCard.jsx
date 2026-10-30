import { Heart, ShoppingBag, Star } from "lucide-react";
import { money } from "../../features/products/data/products";
import { useShopStore } from "../../store/useShopStore";

export default function ProductCard({ product }) {
  const wishlist = useShopStore((state) => state.wishlist);
  const toggleWishlist = useShopStore((state) => state.toggleWishlist);
  const addToCart = useShopStore((state) => state.addToCart);
  const liked = wishlist.includes(product.id);

  return (
    <article className="product-card">
      <div className="product-image">
        <span className="product-badge">{product.badge}</span>
        <button
          className={`wishlist-btn ${liked ? "liked" : ""}`}
          onClick={() => toggleWishlist(product.id)}
          aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={liked}
        >
          <Heart size={19} fill={liked ? "currentColor" : "none"}/>
        </button>
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          onError={(e) => {e.currentTarget.style.opacity = "0"}}
        />
      </div>
      <div className="product-info">
        <p className="product-brand">{product.brand}</p>
        <h3>{product.name}</h3>
        <div className="product-rating">
          <Star size={13} fill="currentColor"/>
          {product.rating}
          <span> · {product.category}</span>
        </div>
        <div className="price-row">
          <strong>{money(product.price)}</strong>
          <del>{money(product.oldPrice)}</del>
        </div>
        <button
          className="add-btn"
          onClick={() => addToCart(product)}
        >
          <ShoppingBag size={16}/> Add to Cart
        </button>
      </div>
    </article>
  );
}
