import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X, ChevronDown, RotateCcw } from "lucide-react";
import SEO from "../components/seo/SEO";
import { buildBreadcrumb } from "../components/seo/seoUtils";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import CartDrawer from "../components/layout/CartDrawer";
import ProductCard from "../components/product/ProductCard";
import "../styles/store-redesign.css";
import "../styles/reference-product-grid.css";
import "../styles/shop-page.css";

const API_URL = import.meta.env.VITE_API_URL ||
  "http://localhost:5001/api";

const PAGE_SIZE = 12;

function normalizePage(value) {
  const requestedPage = Number(value || 1);

  return Number.isSafeInteger(requestedPage) &&
    requestedPage > 0
    ? requestedPage
    : 1;
}

function normalizeProduct(p) {
  return {
    id: p._id,
    slug: p.slug,
    sku: p.sku,
    name: p.name,
    brand: p.brand || "EverythingBD",
    category: p.category,
    price: p.price,
    oldPrice: p.compareAtPrice,
    stock: p.stock,
    hasSizeVariants: Boolean(p.hasSizeVariants),
    sizeVariants: p.sizeVariants || [],
    rating: null,
    badge: p.isFeatured ? "FEATURED" : "NEW",
    image: p.images?.[0]?.url || "",
    images: p.images || [],
    description: p.description || ""
  };
}

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    categories: [],
    brands: []
  });
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const loadMoreRef = useRef(null);

  // Store only the last successfully loaded collection.
  const loadedCollectionRef = useRef(null);

  const [mobileFilters, setMobileFilters] = useState(false);

  const category = params.get("category") || "";
  const brand = params.get("brand") || "";
  const flag = params.get("flag") || "";
  const sort = params.get("sort") || "latest";
  const q = params.get("q") || "";
  const minPrice = params.get("minPrice") || "";
  const maxPrice = params.get("maxPrice") || "";
  const page = normalizePage(params.get("page"));

  const priceKey = JSON.stringify([minPrice, maxPrice]);

  const [priceState, setPriceState] = useState(() => ({
    key: priceKey,
    draft: { min: minPrice, max: maxPrice }
  }));

  // Synchronize the draft when committed URL prices change.
  // Guarded render-time adjustment prevents stale drafts
  // from returning when an earlier URL is revisited.
  if (priceState.key !== priceKey) {
    setPriceState({
      key: priceKey,
      draft: { min: minPrice, max: maxPrice }
    });
  }

  const priceDraft = priceState.key === priceKey
    ? priceState.draft
    : { min: minPrice, max: maxPrice };

  function setPriceDraft(updateDraft) {
    setPriceState(previous => {
      const current = previous.key === priceKey
        ? previous.draft
        : { min: minPrice, max: maxPrice };

      return {
        key: priceKey,
        draft: typeof updateDraft === "function"
          ? updateDraft(current)
          : updateDraft
      };
    });
  }

  function update(changes) {
    const next = new URLSearchParams(params);

    Object.entries(changes).forEach(([key, value]) => {
      if (value === "" || value === null || value === undefined) {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    });

    if (!Object.prototype.hasOwnProperty.call(changes, "page")) {
      next.delete("page");
    }

    const requestKeys = [
      "category",
      "brand",
      "flag",
      "sort",
      "q",
      "minPrice",
      "maxPrice",
      "page"
    ];

    const requestValue = (search, key) => {
      const value = search.get(key);

      if (key === "sort") return value || "latest";

      if (key === "page") {
        return String(normalizePage(value));
      }

      return value || "";
    };

    const requestChanged = requestKeys.some(
      key =>
        requestValue(params, key) !==
        requestValue(next, key)
    );

    if (
      requestChanged &&
      !Object.prototype.hasOwnProperty.call(changes, "page")
    ) {
      setProducts([]);
      setPagination(null);
    }

    if (next.toString() !== params.toString()) {
      setParams(next);
    }
  }

  useEffect(() => {
    const controller = new AbortController();

    const collectionKey = JSON.stringify([
      category,
      brand,
      flag,
      sort,
      q,
      minPrice,
      maxPrice
    ]);

    async function fetchPage(targetPage) {
      const query = new URLSearchParams({
        page: String(targetPage),
        limit: String(PAGE_SIZE),
        sort
      });

      if (category) query.set("category", category);
      if (brand) query.set("brand", brand);
      if (flag) query.set("flag", flag);
      if (q) query.set("q", q);
      if (minPrice) query.set("minPrice", minPrice);
      if (maxPrice) query.set("maxPrice", maxPrice);

      const response = await fetch(
        `${API_URL}/products?${query.toString()}`,
        { signal: controller.signal }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to load products"
        );
      }

      if (
        !Array.isArray(result.data) ||
        !Number.isSafeInteger(result.pagination?.totalPages) ||
        result.pagination.totalPages < 0
      ) {
        throw new Error("Invalid product pagination response");
      }

      return result;
    }

    function correctPage(targetPage) {
      if (controller.signal.aborted) return;

      loadedCollectionRef.current = null;

      setParams(previous => {
        const next = new URLSearchParams(previous);

        if (targetPage === 1) {
          next.delete("page");
        } else {
          next.set("page", String(targetPage));
        }

        return next;
      }, { replace: true });
    }

    async function load() {
      const cached = loadedCollectionRef.current;

      const canAppend = Boolean(
        cached &&
        cached.key === collectionKey &&
        cached.page + 1 === page
      );

      setLoading(!canAppend);
      setLoadingMore(canAppend);
      setError("");

      if (!canAppend) {
        setProducts([]);
        setPagination(null);
      }

      try {
        let result;
        let collection;

        if (canAppend) {
          result = await fetchPage(page);

          if (controller.signal.aborted) return;

          const lastPage = Math.max(
            1,
            result.pagination.totalPages
          );

          if (page > lastPage) {
            correctPage(lastPage);
            return;
          }

          collection = [
            ...cached.products,
            ...result.data.map(normalizeProduct)
          ];

        } else {
          // Always restore a complete prefix on direct
          // navigation, refresh or history navigation.
          result = await fetchPage(1);

          if (controller.signal.aborted) return;

          const lastPage = Math.max(
            1,
            result.pagination.totalPages
          );

          if (page > lastPage) {
            correctPage(lastPage);
            return;
          }

          collection = result.data.map(normalizeProduct);

          for (let current = 2; current <= page; current++) {
            if (controller.signal.aborted) return;

            result = await fetchPage(current);

            if (controller.signal.aborted) return;

            const availablePages = Math.max(
              1,
              result.pagination.totalPages
            );

            if (page > availablePages) {
              correctPage(availablePages);
              return;
            }

            collection.push(
              ...result.data.map(normalizeProduct)
            );
          }
        }

        if (controller.signal.aborted) return;

        const uniqueProducts = [
          ...new Map(
            collection.map(item => [item.id, item])
          ).values()
        ];

        loadedCollectionRef.current = {
          key: collectionKey,
          page,
          products: uniqueProducts
        };

        setProducts(uniqueProducts);
        setPagination(result.pagination);

        if (result.filters) {
          setFilters(result.filters);
        }

      } catch (err) {
        if (!controller.signal.aborted) {
          loadedCollectionRef.current = null;
          setError(err.message);
          setProducts([]);
          setPagination(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    }

    load();

    return () => controller.abort();

  }, [
    page,
    category,
    brand,
    flag,
    sort,
    q,
    minPrice,
    maxPrice,
    setParams
  ]);

  const totalPages = pagination?.totalPages || 0;


  useEffect(() => {
    if (
      loading ||
      loadingMore ||
      error ||
      totalPages === 0 ||
      page >= totalPages
    ) return;

    let timer = null;
    let cancelled = false;

    const checkScroll = () => {
      if (cancelled || timer !== null) return;

      const target = loadMoreRef.current;
      if (!target) return;

      const rect = target.getBoundingClientRect();

      if (rect.top > window.innerHeight + 300) return;

      timer = window.setTimeout(() => {
        timer = null;

        if (cancelled) return;

        const next = new URLSearchParams(window.location.search);
        next.set("page", String(page + 1));

        setParams(next);
      }, 1200);
    };

    window.addEventListener(
      "scroll",
      checkScroll,
      { passive: true }
    );

    window.addEventListener("resize", checkScroll);

    checkScroll();

    return () => {
      cancelled = true;

      if (timer !== null) {
        window.clearTimeout(timer);
      }

      window.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [
    loading,
    loadingMore,
    error,
    page,
    totalPages,
    products.length,
    setParams
  ]);


  const sidebar = (
    <div className="eb-shop-filter-stack">
      <section className="eb-shop-filter-card">
        <h3>FILTER BY CATEGORY <ChevronDown size={17}/></h3>
        <label className="eb-shop-check">
          <input
            type="radio"
            name="shop-category"
            checked={!category}
            onChange={() => update({ category: "" })}
          />
          <span>All Categories</span>
        </label>
        {[...new Set(filters.categories)].map(item => (
          <label className="eb-shop-check" key={item}>
            <input
              type="radio"
              name="shop-category"
              checked={category === item}
              onChange={() => update({ category: item })}
            />
            <span>{item}</span>
          </label>
        ))}
      </section>

      <section className="eb-shop-filter-card">
        <h3>PRICE RANGE <ChevronDown size={17}/></h3>
        <form onSubmit={event => {
          event.preventDefault();
          update({
            minPrice: priceDraft.min,
            maxPrice: priceDraft.max
          });
        }}>
          <div className="eb-shop-price-inputs">
            <label>
              Min (৳)
              <input
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={priceDraft.min}
                onChange={e => setPriceDraft(p => ({
                  ...p, min: e.target.value
                }))}
              />
            </label>
            <label>
              Max (৳)
              <input
                type="number"
                min="0"
                step="1"
                placeholder="Any"
                value={priceDraft.max}
                onChange={e => setPriceDraft(p => ({
                  ...p, max: e.target.value
                }))}
              />
            </label>
          </div>
          <button className="eb-shop-apply" type="submit">
            Apply Price
          </button>
        </form>
      </section>

      <section className="eb-shop-filter-card">
        <h3>BRANDS <ChevronDown size={17}/></h3>
        <label className="eb-shop-check">
          <input
            type="radio"
            name="shop-brand"
            checked={!brand}
            onChange={() => update({ brand: "" })}
          />
          <span>All Brands</span>
        </label>
        {filters.brands.map(item => (
          <label className="eb-shop-check" key={item}>
            <input
              type="radio"
              name="shop-brand"
              checked={brand === item}
              onChange={() => update({ brand: item })}
            />
            <span>{item}</span>
          </label>
        ))}
      </section>

      <section className="eb-shop-filter-card">
        <h3>PRODUCT FLAG <ChevronDown size={17}/></h3>
        {[
          ["", "All Products"],
          ["featured", "Featured"],
          ["new", "New Arrival (30 Days)"]
        ].map(([value, label]) => (
          <label className="eb-shop-check" key={label}>
            <input
              type="radio"
              name="shop-flag"
              checked={flag === value}
              onChange={() => update({ flag: value })}
            />
            <span>{label}</span>
          </label>
        ))}
      </section>

      <button
        type="button"
        className="eb-shop-reset"
        onClick={() => {
          setPriceState({
            key: JSON.stringify(["", ""]),
            draft: { min: "", max: "" }
          });

          const hasActiveRequest =
            Boolean(
              category ||
              brand ||
              flag ||
              q ||
              minPrice ||
              maxPrice ||
              sort !== "latest" ||
              page > 1
            );

          if (hasActiveRequest) {
            setProducts([]);
            setPagination(null);
          }

          if (params.toString()) {
            setParams(new URLSearchParams());
          }

          setMobileFilters(false);
        }}
      >
        <RotateCcw size={15}/> Clear All Filters
      </button>
    </div>
  );

  return (
    <>
      <SEO
        title="Shop All Products | EverythingBD"
        description="Explore Korean skincare, women's fashion, kids' clothing, leather accessories and smart gadgets. Shop online with Cash on Delivery across Bangladesh."
        path="/shop"
        robots={
          category || brand || flag || q ||
          minPrice || maxPrice || sort !== "latest" ||
          page > 1
            ? "noindex, follow"
            : "index, follow"
        }
        schemas={[
          buildBreadcrumb([
            { name: "Home", path: "/" },
            { name: "Shop", path: "/shop" }
          ])
        ]}
      />
      <Header />

      <main className="eb-shop-page">
        <div className="container">
          <div className="eb-shop-heading">
            <h1>{category || "Shop All Products"}</h1>
            <p>Home / Shop {category ? `/ ${category}` : ""}</p>
          </div>

          <div className="eb-shop-layout">
            <aside className="eb-shop-sidebar" aria-label="Shop filters">
              {sidebar}
            </aside>

            <div className="eb-shop-main">
              <div className="eb-shop-toolbar">
                <button
                  type="button"
                  className="eb-shop-mobile-filter"
                  onClick={() => setMobileFilters(true)}
                >
                  <SlidersHorizontal size={18}/> Filters
                </button>

                <label className="eb-shop-sort">
                  Sort By:
                  <select
                    value={sort}
                    onChange={e => update({ sort: e.target.value })}
                  >
                    <option value="latest">Default Sorting</option>
                    <option value="oldest">Oldest</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="name_asc">Name: A to Z</option>
                  </select>
                </label>

                <span className="eb-shop-count">
                  {pagination?.total ?? 0} Products
                </span>
              </div>

              {loading ? (
                <div className="no-products">Loading products...</div>
              ) : error ? (
                <div className="no-products" role="alert">{error}</div>
              ) : products.length ? (
                <div className="product-grid eb-shop-product-grid">
                  {products.map(product => (
                    <ProductCard key={product.id} product={product}/>
                  ))}
                </div>
              ) : (
                <div className="no-products">
                  No matching products found.
                </div>
              )}


              {!loading && !error && page < totalPages && (
                <div
                  ref={loadMoreRef}
                  className="eb-shop-auto-loading"
                  aria-live="polite"
                >
                  <span className="eb-shop-auto-spinner" />
                  <p>
                    {loadingMore
                      ? "Loading more products..."
                      : "Scroll to load more products"}
                  </p>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>

      {mobileFilters && (
        <div className="eb-shop-mobile-overlay">
          <button
            className="eb-shop-overlay-backdrop"
            aria-label="Close filters"
            onClick={() => setMobileFilters(false)}
          />
          <aside
            className="eb-shop-mobile-panel"
            aria-label="Mobile shop filters"
          >
            <div className="eb-shop-mobile-heading">
              <strong>Filters</strong>
              <button
                type="button"
                aria-label="Close filters"
                onClick={() => setMobileFilters(false)}
              >
                <X size={22}/>
              </button>
            </div>
            {sidebar}
            <button
              type="button"
              className="eb-shop-apply"
              onClick={() => setMobileFilters(false)}
            >
              View Products
            </button>
          </aside>
        </div>
      )}

      <Footer/>
      <CartDrawer/>
    </>
  );
}
