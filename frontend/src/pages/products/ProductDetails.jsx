import "./productDetails.css";
import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, ChevronLeft, ChevronRight,
  Heart, Minus, Plus, ShoppingBag,
  ShieldCheck, Truck
} from "lucide-react";

import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import ProductCard from "../../components/product/ProductCard";
import { useProducts } from "../../features/products/hooks/useProducts";
import CartDrawer from "../../components/layout/CartDrawer";
import { useShopStore } from "../../store/useShopStore";
import { getProductBySlug } from "../../features/products/services/productDetailsApi";
import { trackMetaEvent } from "../../features/marketing/MetaPixel";

const money = value =>
  `৳${Number(value).toLocaleString("en-BD")}`;

export default function ProductDetails() {
  const { slug } = useParams();
  const { products: allProducts } = useProducts();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImage, setActiveImage] = useState(0);

  const [quantity, setQuantity] = useState(1);

  const addToCart = useShopStore(s => s.addToCart);
  const wishlist = useShopStore(s => s.wishlist);
  const toggleWishlist = useShopStore(s => s.toggleWishlist);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProduct() {
      setLoading(true);
      setError("");
      setProduct(null);
      setActiveImage(0);
      setQuantity(1);

      try {
        const data = await getProductBySlug(
          slug, controller.signal
        );
        if (!controller.signal.aborted) setProduct(data);
      } catch (err) {
        if (!controller.signal.aborted) setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadProduct();
    return () => controller.abort();
  }, [slug]);

  useEffect(() => {
    if (!product) return;

    document.title =
      `${product.seo?.title || product.name} | EverythingBD`;

    return () => {
      document.title = "EverythingBD | Premium Beauty & Skincare";
    };
  }, [product]);

  useEffect(() => {
    if (!product) return;

    trackMetaEvent("ViewContent", {
      content_name: product.name,
      content_ids: [String(product._id)],
      content_type: "product",
      value: Number(product.price),
      currency: "BDT"
    });
  }, [product]);

  const images = product?.images?.filter(img => img.url) || [];
  const currentImage = images[activeImage];
  const stock = product?.stock ?? 0;
  const liked = product
    ? wishlist.includes(product._id)
    : false;


  const relatedProducts = product
    ? allProducts
        .filter(item =>
          item.slug &&
          Number(item.stock) > 0 &&
          String(item.id) !== String(product._id) &&
          item.slug !== product.slug
        )
        .sort((a, b) =>
          Number(b.category === product.category) -
          Number(a.category === product.category)
        )
        .slice(0, 4)
    : [];

  function changeImage(direction) {
    if (!images.length) return;
    setActiveImage(index =>
      (index + direction + images.length) % images.length
    );
  }

  function handleAddToCart() {
    if (!product || stock < 1) return;

    const item = {
      id: product._id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      price: product.price,
      image: images[0]?.url || "",
      stock
    };

    for (let i = 0; i < Math.min(quantity, stock); i++) {
      addToCart(item);
    }
  }


  function handleBuyNow() {
    if (!product || stock < 1) return;
    handleAddToCart();
    navigate("/checkout");
  }

  return (
    <>
      <Header search="" setSearch={() => {}}/>

      <main className="pd-page">
        <div className="container">
          <div className="pd-breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <Link to="/#products">Shop</Link>
            <span>/</span>
            <span>{product?.name || "Product Details"}</span>
          </div>

          {loading ? (
            <div className="pd-message">Loading product...</div>
          ) : error || !product ? (
            <div className="pd-message">
              <h2>Product unavailable</h2>
              <p>{error || "Product not found"}</p>
              <Link to="/" className="pd-primary">
                <ArrowLeft size={16}/> Back to Shop
              </Link>
            </div>
          ) : (
            <>
            <div className="pd-layout">
              <div className="pd-gallery">
                <div className="pd-main-image">
                  {currentImage ? (
                    <img
                      src={currentImage.url}
                      alt={currentImage.alt || product.name}
                    />
                  ) : (
                    <div className="pd-image-empty">
                      Product image coming soon
                    </div>
                  )}

                  {images.length > 1 && (
                    <>
                      <button
                        className="pd-gallery-prev"
                        aria-label="Previous image"
                        onClick={() => changeImage(-1)}
                      >
                        <ChevronLeft/>
                      </button>
                      <button
                        className="pd-gallery-next"
                        aria-label="Next image"
                        onClick={() => changeImage(1)}
                      >
                        <ChevronRight/>
                      </button>
                    </>
                  )}
                </div>

                {images.length > 1 && (
                  <div className="pd-thumbnails">
                    {images.map((img, index) => (
                      <button
                        key={`${img.url}-${index}`}
                        className={activeImage === index ? "active" : ""}
                        onClick={() => setActiveImage(index)}
                        aria-label={`View image ${index + 1}`}
                      >
                        <img src={img.url} alt={`View ${index + 1}`}/>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="pd-information">
                <p className="pd-brand">
                  {product.brand || "EverythingBD"}
                </p>

                <h1>{product.name}</h1>

                <div className="pd-price">
                  <strong>{money(product.price)}</strong>
                  {product.compareAtPrice > product.price && (
                    <del>{money(product.compareAtPrice)}</del>
                  )}
                </div>

                <p className="pd-stock">
                  {stock > 0
                    ? `${stock} items available`
                    : "Currently out of stock"}
                </p>


                <div className="pd-purchase">
                  <div className="pd-quantity">
                    <button
                      aria-label="Decrease quantity"
                      disabled={quantity <= 1}
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    >
                      <Minus size={17}/>
                    </button>
                    <strong>{quantity}</strong>
                    <button
                      aria-label="Increase quantity"
                      disabled={quantity >= stock}
                      onClick={() =>
                        setQuantity(q => Math.min(stock, q + 1))
                      }
                    >
                      <Plus size={17}/>
                    </button>
                  </div>

                  <button
                    className="pd-primary"
                    disabled={stock <= 0}
                    onClick={handleAddToCart}
                  >
                    <ShoppingBag size={19}/>
                    {stock > 0 ? "Add to Cart" : "Out of Stock"}
                  </button>

                  <button
                    className={`pd-wishlist ${liked ? "active" : ""}`}
                    aria-label="Toggle wishlist"
                    aria-pressed={liked}
                    onClick={() => toggleWishlist(product._id)}
                  >
                    <Heart
                      size={21}
                      fill={liked ? "currentColor" : "none"}
                    />
                  </button>
                </div>

                <button
                  type="button"
                  className="pd-buy-now"
                  disabled={stock <= 0}
                  onClick={handleBuyNow}
                >
                  <ShoppingBag size={19}/>
                  {stock > 0 ? "Buy Now — Order Today" : "Out of Stock"}
                </button>

                <div className="pd-service-info">
                  <span><Truck size={18}/> Nationwide Delivery</span>
                  <span><ShieldCheck size={18}/> Secure Shopping</span>
                </div>

                <div className="pd-meta">
                  SKU: {product.sku} · Category: {product.category}
                </div>
              </div>
            </div>

            <section className="pd-lower-content">
              <div className="pd-section-heading">
                <span>MORE ABOUT THIS PRODUCT</span>
                <h2>Product Description & Details</h2>
                <p>Explore product information and additional images.</p>
              </div>

              {product.description && (
                <div className="pd-description-panel">
                  <h3>Description</h3>
                  <p>{product.description}</p>
                </div>
              )}

              {images.length > 1 && (
                <section className="pd-extra-gallery">
                  <div className="pd-extra-heading">
                    <span>PRODUCT DETAILS</span>
                    <h3>Explore Product Images</h3>
                    <p>ছবিতে ক্লিক করে প্রোডাক্টটি বিস্তারিত দেখুন।</p>
                  </div>

                  <div className="pd-extra-viewer">
                    <div
                      className="pd-extra-thumbs"
                      aria-label="Product image thumbnails"
                    >
                      {images.map((img, index) => (
                        <button
                          type="button"
                          key={`${img.url}-${index}`}
                          className={activeImage === index ? "active" : ""}
                          onClick={() => setActiveImage(index)}
                          aria-label={`Show product image ${index + 1}`}
                          aria-pressed={activeImage === index}
                        >
                          <img
                            src={img.url}
                            alt=""
                            loading="lazy"
                          />
                        </button>
                      ))}
                    </div>

                    <div className="pd-extra-main">
                      <img
                        src={currentImage?.url || images[0]?.url}
                        alt={currentImage?.alt || product.name}
                        loading="lazy"
                      />

                      <span className="pd-extra-count">
                        {activeImage + 1} / {images.length}
                      </span>
                    </div>
                  </div>
                </section>
              )}

              <div className="pd-additional-details">
                {product.benefits?.length > 0 && (
                  <section className="pd-details-section">
                    <h3>Product Benefits</h3>
                    <ul>
                      {product.benefits.map((b, i) =>
                        <li key={i}>{b}</li>
                      )}
                    </ul>
                  </section>
                )}

                {product.ingredients?.length > 0 && (
                  <section className="pd-details-section">
                    <h3>Key Ingredients</h3>
                    <p>{product.ingredients.join(", ")}</p>
                  </section>
                )}


              </div>

              <div className="pd-trust-row">
                <div><ShieldCheck size={22}/><strong>Quality Checked</strong><span>Carefully selected products</span></div>
                <div><Truck size={22}/><strong>Nationwide Delivery</strong><span>Delivery across Bangladesh</span></div>
                <div><ShoppingBag size={22}/><strong>Easy Shopping</strong><span>Convenient ordering</span></div>
              </div>
            </section>
            </>
          )}
        </div>
      </main>


      {product && relatedProducts.length > 0 && (
        <section className="pd-related-products">
          <div className="pd-related-container">
            <div className="pd-related-heading">
              <div>
                <span>DISCOVER MORE</span>
                <h2>You May Also Like</h2>
                <p>Explore similar products from EverythingBD.</p>
              </div>
              <Link
                to="/#products"
                className="pd-related-view-all"
              >
                View All Products
              </Link>
            </div>

            <div className="pd-related-grid">
              {relatedProducts.map(item => (
                <ProductCard
                  key={item.id}
                  product={item}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer/>
      <CartDrawer/>
    </>
  );
}
