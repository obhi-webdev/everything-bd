import { Link } from "react-router-dom";
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
        <h3>
  {product.slug ? (
    <Link to={`/product/${product.slug}`}>
      {product.name}
    </Link>
  ) : product.name}
</h3>
        <div className="product-rating">
          {product.rating != null && (
            <>
              <Star size={13} fill="currentColor"/>
              {product.rating}
              <span> · </span>
            </>
          )}
          <span>{product.category}</span>
        </div>
        <div className="price-row">
          <strong>{money(product.price)}</strong>
          {Number(product.oldPrice) > Number(product.price) && (
            <del>{money(product.oldPrice)}</del>
          )}
        </div>
        <button
          className="add-btn"
          disabled={product.stock <= 0}
          onClick={() => addToCart(product)}
        >
          <ShoppingBag size={16}/>
          {product.stock <= 0 ? "Out of Stock" : "Add to Cart"}
        </button>
      </div>
    </article>
  );
}
