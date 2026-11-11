import "./cleanSearch.css";
import FloatingContactButtons from "./FloatingContactButtons";
import { useEffect, useState } from "react";
import {
  Search, ShoppingCart, Heart, Phone,
  Menu, X, ChevronDown, ChevronUp
} from "lucide-react";
import { useShopStore } from "../../store/useShopStore";
import { trackMetaEvent } from "../../features/marketing/MetaPixel";
import "./maxStyleHeader.css";
import "./scrollHeader.css";

const navigation = [
  { name: "Home", url: "/#home" },
  { name: "Shop", url: "/#products" },
  { name: "About", url: "/#about" },
  { name: "Contact Us", url: "/#contact" }
];

const categoryLinks = [
  "Serum",
  "Cleanser",
  "Moisturizer",
  "Sunscreen",
  "Skincare"
];

export default function Header() {
  const [headerFavicon, setHeaderFavicon] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [compactSearchOpen, setCompactSearchOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [search, setSearch] = useState(
    () => new URLSearchParams(window.location.search).get("q") || ""
  );

  // Use the same public favicon setting as DynamicFavicon.
  useEffect(() => {
    let active = true;
    let controller = null;

    const API = import.meta.env.VITE_API_URL ||
      "http://localhost:5001/api";

    async function loadHeaderFavicon() {
      if (controller) controller.abort();
      controller = new AbortController();

      try {
        const response = await fetch(
          `${API}/site-settings`,
          {
            cache: "no-store",
            signal: controller.signal
          }
        );

        if (!response.ok) return;

        const result = await response.json();

        if (active) {
          const url = result.data?.faviconUrl;
          setHeaderFavicon(
            typeof url === "string" &&
            url.startsWith("https://") ? url : ""
          );
        }
      } catch {
        // Keep existing image on network failure.
      }
    }

    loadHeaderFavicon();

    window.addEventListener(
      "everythingbd:settings-updated",
      loadHeaderFavicon
    );

    return () => {
      active = false;
      controller?.abort();
      window.removeEventListener(
        "everythingbd:settings-updated",
        loadHeaderFavicon
      );
    };
  }, []);

  const cart = useShopStore(state => state.cart);
  const wishlist = useShopStore(state => state.wishlist);
  const setCartOpen = useShopStore(state => state.setCartOpen);

  const cartCount = cart.reduce(
    (total, item) => total + (Number(item.quantity) || 0),
    0
  );

  useEffect(() => {
    const handleEscape = e => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setCategoriesOpen(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  useEffect(() => {
    const updateScroll = () => {
      const y = window.scrollY;

      setScrolled(previous => {
        if (!previous && y >= 230) return true;
        if (previous && y <= 60) return false;
        return previous;
      });
    };

    updateScroll();

    window.addEventListener("scroll", updateScroll, {
      passive: true
    });

    return () => {
      window.removeEventListener("scroll", updateScroll);
    };
  }, []);

  function submitSearch(event) {
    event.preventDefault();
    const query = search.trim();

    if (query) {
      trackMetaEvent("Search", { search_string: query });
    }

    window.location.assign(
      query
        ? `/?q=${encodeURIComponent(query)}#products`
        : "/#products"
    );
  }

  return (
    <div className={`ebd-header-stage ${scrolled && !menuOpen && !categoriesOpen ? "mobile-nav-collapsed" : ""}`}>
    <FloatingContactButtons />
    <div className={`ebd-max-header ${scrolled ? "is-scrolled" : ""} ${compactSearchOpen ? "search-open" : ""}`}>

      <div className="ebd-max-main">
        <div className="ebd-max-container ebd-max-main-inner">

          <a href="/" className="ebd-max-logo" aria-label="EverythingBD Home">
            <span className="ebd-logo-lockup">
              {headerFavicon && (
                <img
                  className="ebd-header-favicon"
                  src={headerFavicon}
                  alt=""
                  aria-hidden="true"
                />
              )}
              <span className="ebd-original-logo">
                everything<span>bd</span><i>.</i>
              </span>
            </span>
          </a>

          <nav className="ebd-max-compact-nav" aria-label="Compact navigation">
            {navigation.map(link => (
              <a href={link.url} key={link.name}>
                {link.name}
              </a>
            ))}
          </nav>

          <form
            className="ebd-max-search"
            role="search"
            onSubmit={submitSearch}
          >
            <input
              type="search"
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search for products..."
              aria-label="Search products"
            />

            <button type="submit" aria-label="Submit search">
              <Search size={23}/>
            </button>
          </form>

          <div className="ebd-max-top-actions">
            <button
              type="button"
              className="ebd-max-compact-search-button"
              aria-label="Open product search"
              aria-expanded={compactSearchOpen}
              onClick={() => setCompactSearchOpen(value => !value)}
            >
              {compactSearchOpen ? <X size={22}/> : <Search size={22}/>}
            </button>

            <a
              href="/?wishlist=1#products"
              className="ebd-max-action"
              aria-label={`Wishlist (${wishlist.length})`}
            >
              <span className="ebd-max-action-icon">
                <Heart size={27} strokeWidth={1.7}/>
                {wishlist.length > 0 && (
                  <b>{wishlist.length}</b>
                )}
              </span>
              <small>Wishlist</small>
            </a>

            <a
              href="/#contact"
              className="ebd-max-action ebd-max-contact-icon"
              aria-label="Contact"
            >
              <Phone size={27} strokeWidth={1.7}/>
              <small>Contact</small>
            </a>

            <button
              type="button"
              className="ebd-max-action"
              onClick={() => setCartOpen(true)}
              aria-label={`Shopping cart (${cartCount})`}
            >
              <span className="ebd-max-action-icon">
                <ShoppingCart size={29} strokeWidth={1.7}/>
                <b>{cartCount}</b>
              </span>
              <small>Your Cart</small>
            </button>

            <button
              type="button"
              className="ebd-max-mobile-menu"
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
              aria-controls="ebd-max-nav"
              onClick={() => setMenuOpen(value => !value)}
            >
              {menuOpen ? <X size={25}/> : <Menu size={25}/>}
            </button>
          </div>
        </div>
      </div>

      <div className="ebd-max-bottom">
        <div className="ebd-max-container ebd-max-bottom-inner">

          <div className="ebd-max-category-wrap">
            <button
              type="button"
              className="ebd-max-category-button"
              aria-expanded={categoriesOpen}
              aria-controls="ebd-max-category-dropdown"
              onClick={() => setCategoriesOpen(value => !value)}
            >
              <Menu size={20}/>
              <span>CATEGORIES</span>
              {categoriesOpen
                ? <ChevronUp size={18}/>
                : <ChevronDown size={18}/>
              }
            </button>

            {categoriesOpen && (
              <div
                className="ebd-max-category-dropdown"
                id="ebd-max-category-dropdown"
              >
                {categoryLinks.map(category => (
                  <a
                    key={category}
                    href={`/?q=${encodeURIComponent(category)}#products`}
                    onClick={() => setCategoriesOpen(false)}
                  >
                    {category}
                  </a>
                ))}
                <a
                  href="/#products"
                  onClick={() => setCategoriesOpen(false)}
                >
                  View All Products
                </a>
              </div>
            )}
          </div>

          <nav
            id="ebd-max-nav"
            className={`ebd-max-nav ${menuOpen ? "is-open" : ""}`}
            aria-label="Main navigation"
          >
            {navigation.map(link => (
              <a
                href={link.url}
                key={link.name}
                onClick={() => setMenuOpen(false)}
              >
                {link.name}
              </a>
            ))}
          </nav>

          <a href="/#contact" className="ebd-max-contact-button">
            Contact
          </a>
        </div>
      </div>
    </div>
    </div>
  );
}
