import { useState } from "react";
import {
  Search, ShoppingBag, Heart, UserRound,
  Menu, X, Sparkles
} from "lucide-react";
import { useShopStore } from "../../store/useShopStore";

export default function Header({ search, setSearch }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const cart = useShopStore((state) => state.cart);
  const wishlist = useShopStore((state) => state.wishlist);
  const setCartOpen = useShopStore((state) => state.setCartOpen);

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
          >
            {menuOpen ? <X /> : <Menu />}
          </button>

          <a className="brand" href="/">
            everything<span>bd</span><i>.</i>
            <small>BEAUTY & SKINCARE</small>
          </a>

          <nav className={`nav ${menuOpen ? "nav-open" : ""}`}>
            <a href="#home" onClick={() => setMenuOpen(false)}>Home</a>
            <a href="#products" onClick={() => setMenuOpen(false)}>Shop All</a>
            <a href="#categories" onClick={() => setMenuOpen(false)}>Categories</a>
            <a href="#about" onClick={() => setMenuOpen(false)}>Our Story</a>
          </nav>

          <div className="header-actions">
            <button
              className="icon-btn"
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Search products"
            >
              <Search size={21} />
            </button>
            <a className="icon-btn account-icon" href="#about" aria-label="About us">
              <UserRound size={21} />
            </a>
            <a href="#products" className="icon-btn badge-icon" aria-label="Wishlist">
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
          <div className="search-bar container">
            <Search size={18} />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your skincare favourites..."
            />
            <button onClick={() => {setSearch("");setSearchOpen(false)}}>
              <X size={18} />
            </button>
          </div>
        )}
      </header>
    </>
  );
}
