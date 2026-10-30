import { useEffect, useState } from "react";
import {
  Search, ShoppingBag, Heart, UserRound,
  Menu, X, Sparkles
} from "lucide-react";
import { useShopStore } from "../../store/useShopStore";
import { trackMetaEvent } from "../../features/marketing/MetaPixel";

export default function Header({ search, setSearch }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchDraft, setSearchDraft] = useState("");

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setSearchOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const cart = useShopStore((state) => state.cart);
  const wishlist = useShopStore((state) => state.wishlist);
  const setCartOpen = useShopStore((state) => state.setCartOpen);

  function submitSearch(event) {
    event.preventDefault();
    const query = searchDraft.trim();
    const url = query
      ? `/?q=${encodeURIComponent(query)}#products`
      : "/#products";
    if (query) {
      trackMetaEvent("Search", {
        search_string: query
      });
    }

    window.location.assign(url);
  }

  const cartCount = cart.reduce(
    (sum, item) => sum + item.quantity, 0
  );

  return (
    <>
      <div className="announcement">
        <Sparkles size={14} />
        Your glow journey starts here
        <Sparkles size={14} />
      </div>

      <header className="site-header">
        <div className="header-inner container">
          <button
            className="icon-btn mobile-menu"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>

          <a className="brand" href="/">
            everything<span>bd</span><i>.</i>
            <small>BEAUTY & SKINCARE</small>
          </a>

          <nav className={`nav ${menuOpen ? "nav-open" : ""}`}>
            <a href="/#home" onClick={() => setMenuOpen(false)}>Home</a>
            <a href="/#products" onClick={() => setMenuOpen(false)}>Shop All</a>
            <a href="/#categories" onClick={() => setMenuOpen(false)}>Categories</a>
            <a href="/#about" onClick={() => setMenuOpen(false)}>Our Story</a>
          </nav>

          <div className="header-actions">
            <button
              className="icon-btn"
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Search products"
              aria-expanded={searchOpen}
            >
              <Search size={21} />
            </button>
            <a className="icon-btn account-icon" href="/#about" aria-label="About us">
              <UserRound size={21} />
            </a>
            <a href="/?wishlist=1#products" className="icon-btn badge-icon" aria-label="Wishlist">
              <Heart size={21} />
              {wishlist.length > 0 && <span>{wishlist.length}</span>}
            </a>
            <button
              className="icon-btn badge-icon"
              onClick={() => setCartOpen(true)}
              aria-label="Shopping cart"
            >
              <ShoppingBag size={21} />
              {cartCount > 0 && <span>{cartCount}</span>}
            </button>
          </div>
        </div>

        {searchOpen && (
          <form className="search-bar container" onSubmit={submitSearch}>
            <Search size={18} />
            <input
              autoFocus
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder="Search your skincare favourites..."
            />
            <button type="button" aria-label="Clear search" onClick={() => {setSearchDraft("");setSearchOpen(false)}}>
              <X size={18} />
            </button>
          </form>
        )}
      </header>
    </>
  );
}
