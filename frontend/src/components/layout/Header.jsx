import { useEffect, useState } from "react";
import {
  Search, ShoppingBag, Heart, UserRound,
  Menu, X, Sparkles
} from "lucide-react";
import { useShopStore } from "../../store/useShopStore";
import { trackMetaEvent } from "../../features/marketing/MetaPixel";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchDraft, setSearchDraft] = useState("");

  const cart = useShopStore(state => state.cart);
  const wishlist = useShopStore(state => state.wishlist);
  const setCartOpen = useShopStore(state => state.setCartOpen);

  const cartCount = cart.reduce(
    (sum, item) => sum + item.quantity, 0
  );

  useEffect(() => {
    const closeMenu = event => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", closeMenu);
    return () => window.removeEventListener("keydown", closeMenu);
  }, []);

  function submitSearch(event) {
    event.preventDefault();
    const query = searchDraft.trim();

    if (query) {
      trackMetaEvent("Search", { search_string: query });
    }

    window.location.assign(
      query ? `/?q=${encodeURIComponent(query)}#products` : "/#products"
    );
  }

  return (
    <>
      <div className="announcement ebd-new-announcement">
        <Sparkles size={14}/>
        Discover your everyday beauty essentials
        <Sparkles size={14}/>
      </div>

      <header className="site-header ebd-new-header">
        <div className="ebd-header-inner">
          <a className="ebd-header-logo" href="/" aria-label="EverythingBD Home">
            everything<span>bd</span>.
            <small>BEAUTY & SKINCARE</small>
          </a>

          <nav className={`ebd-header-nav ${menuOpen ? "is-open" : ""}`}
               aria-label="Main navigation">
            <a href="/#home" onClick={() => setMenuOpen(false)}>Home</a>
            <a href="/#products" onClick={() => setMenuOpen(false)}>Shop</a>
            <a href="/#categories" onClick={() => setMenuOpen(false)}>Categories</a>
            <a href="/#offers" onClick={() => setMenuOpen(false)}>Offers</a>
            <a href="/#about" onClick={() => setMenuOpen(false)}>About Us</a>
          </nav>

          <form className="ebd-header-search" role="search"
                onSubmit={submitSearch}>
            <input
              aria-label="Search products"
              value={searchDraft}
              onChange={e => setSearchDraft(e.target.value)}
              placeholder="Search skincare products..."
            />
            <button type="submit" aria-label="Search">
              <Search size={19}/>
            </button>
          </form>

          <div className="ebd-header-actions">
            <a href="/?wishlist=1#products"
               aria-label={`Wishlist (${wishlist.length})`}
               className="ebd-header-icon">
              <Heart size={21}/>
              {wishlist.length > 0 && <b>{wishlist.length}</b>}
            </a>

            <button type="button"
                    className="ebd-header-icon"
                    aria-label={`Shopping cart (${cartCount})`}
                    onClick={() => setCartOpen(true)}>
              <ShoppingBag size={22}/>
              {cartCount > 0 && <b>{cartCount}</b>}
            </button>

            <a href="/#about" className="ebd-header-icon ebd-account"
               aria-label="About EverythingBD">
              <UserRound size={21}/>
            </a>

            <button type="button"
                    className="ebd-header-icon ebd-mobile-toggle"
                    aria-label="Toggle navigation"
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen(value => !value)}>
              {menuOpen ? <X size={23}/> : <Menu size={23}/>}
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
