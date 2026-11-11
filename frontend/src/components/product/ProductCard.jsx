import { Link, useNavigate } from "react-router-dom";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { money } from "../../features/products/data/products";
import { useShopStore } from "../../store/useShopStore";

export default function ProductCard({ product }) {
  const navigate = useNavigate();

  const openProduct = () => {
    if (product.slug) {
      navigate(`/product/${encodeURIComponent(product.slug)}`);
    }
  };
  const wishlist = useShopStore((state) => state.wishlist);
  const toggleWishlist = useShopStore((state) => state.toggleWishlist);
  const addToCart = useShopStore((state) => state.addToCart);
  const liked = wishlist.includes(product.id);

  return (
    <article
      className="product-card"
      onClick={event => {
        if (event.target.closest("button, a")) return;
        openProduct();
      }}
      style={{ cursor: product.slug ? "pointer" : "default" }}
    >
      <div className="product-image">
        <span className="product-badge">{product.badge}</span>
        <button
          className={`wishlist-btn ${liked ? "liked" : ""}`}
          onClick={event => {
            event.stopPropagation();
            toggleWishlist(product.id);
          }}
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
        <div className="ebd-card-actions">
          <button
            type="button"
            className="add-btn ebd-card-add"
            disabled={Number(product.stock) <= 0}
            onClick={event => {
              event.stopPropagation();
              if (product.hasSizeVariants) {
                openProduct();
                return;
              }
              addToCart(product);
            }}
          >
            <ShoppingBag size={15}/>
            {Number(product.stock) <= 0
              ? "Out of Stock"
              : product.hasSizeVariants
                ? "Select Size"
                : "Add to Cart"}
          </button>

          <button
            type="button"
            className="ebd-card-buy"
            disabled={Number(product.stock) <= 0}
            onClick={event => {
              event.stopPropagation();

              if (product.hasSizeVariants) {
                openProduct();
                return;
              }

              addToCart(product);
              navigate("/checkout");
            }}
          >
            Buy Now
          </button>
        </div>
      </div>
    </article>
  );
}

import "./compactProductCard.css";
