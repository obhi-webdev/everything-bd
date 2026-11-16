import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import ProductCard from "../product/ProductCard";

export default function CategoryProductSection({
  id,
  category,
  products = []
}) {
  if (!category) return null;

  const selected = products
    .filter(product => product.category === category)
    .slice(0, 12);

  if (!selected.length) return null;

  return (
    <section id={id} className="section products-section eb-category-section">
      <div className="container">
        <div className="section-top">
          <div className="section-heading">
            <p className="section-kicker">
              EVERYTHINGBD COLLECTION
            </p>
            <h2>{category}</h2>
            <p>Discover our selected products.</p>
          </div>

          <Link
            className="view-all"
            to={`/shop?category=${encodeURIComponent(category)}`}
          >
            View All <ArrowRight size={16}/>
          </Link>
        </div>

        <div className="product-grid">
          {selected.map(product => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
