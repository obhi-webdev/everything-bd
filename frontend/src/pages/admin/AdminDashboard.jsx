import "./premiumAdminTypography.css";
import CategoryManager from "../../features/admin/CategoryManager";
import "./premiumDashboard.css";
import "./mobileAdminResponsive.css";
import WebsiteMediaManager from "../../features/admin/WebsiteMediaManager";
import CouponManager from "../../features/admin/CouponManager";
import CustomerManager from "../../features/admin/CustomerManager";
import UnifiedSettings from "../../features/admin/UnifiedSettings";
import LandingPageManager from "../../features/admin/LandingPageManager";
import BannerManager from "../../features/admin/BannerManager";
import AdminOverview from "../../features/admin/AdminOverview";
import OrderManager from "../../features/admin/OrderManager";
import ProductManager from "../../features/admin/ProductManager";
import { useState } from "react";
import {
  LayoutDashboard, Package, ShoppingBag,
  Users, TicketPercent, Image, Settings,
  LogOut, Menu, X, ArrowUpRight, ShieldCheck,
  House, ChartColumn, LayoutGrid, ChevronRight
} from "lucide-react";

const menus = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Products", icon: Package },
  { name: "Categories", icon: Package },
  { name: "Orders", icon: ShoppingBag },
  { name: "Customers", icon: Users },
  { name: "Coupons", icon: TicketPercent },
  { name: "Banners", icon: Image },
  { name: "Website Media", icon: Image },
  { name: "Landing Pages", icon: Image },
  { name: "Settings", icon: Settings }
];

const mobileTabs = [
  { label: "Home", page: "Overview", icon: House },
  { label: "Orders", page: "Orders", icon: ShoppingBag },
  { label: "Products", page: "Products", icon: Package },
  { label: "Analytics", page: "Analytics", icon: ChartColumn },
  { label: "More", page: "More", icon: LayoutGrid }
];

const mainMobilePages = [
  "Overview", "Orders", "Products", "Analytics"
];

export default function AdminDashboard({ user, token, onLogout }) {
  const [active, setActive] = useState("Overview");
  const [menuOpen, setMenuOpen] = useState(false);

  const isMorePage =
    active === "More" ||
    !mainMobilePages.includes(active);

  const currentMobileTab = isMorePage
    ? "More"
    : active;


  function changePage(page) {
    setActive(page);
    setMenuOpen(false);
  }

  return (
    <div className="admin-dashboard">
      <aside className={`admin-sidebar ${menuOpen ? "open" : ""}`}>
        <div className="admin-sidebar-brand">
          everything<span>bd</span>.
          <small>ADMIN PANEL</small>
        </div>

        <p className="admin-menu-label">MANAGEMENT</p>

        <nav aria-label="Admin navigation">
          {menus.map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={active === name ? "active" : ""}
              onClick={() => changePage(name)}
            >
              <Icon size={19} />
              {name}
            </button>
          ))}
        </nav>

        <button className="admin-logout" onClick={onLogout}>
          <LogOut size={19} />
          Logout
        </button>
      </aside>

      {menuOpen && (
        <button
          type="button"
          className="admin-mobile-backdrop"
          aria-label="Close navigation menu"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            className="admin-menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle sidebar"
          >
            {menuOpen ? <X /> : <Menu />}
          </button>

          <div className="admin-topbar-user">
            <div className="admin-avatar">
              {user.name?.slice(0, 1).toUpperCase() || "A"}
            </div>
            <div>
              <strong>{user.name}</strong>
              <small>{user.role}</small>
            </div>
          </div>
        </header>

        <div className="admin-content">
          <p className="admin-eyebrow">EVERYTHINGBD / {active.toUpperCase()}</p>
          <h1>
            {active === "Overview" ? "Dashboard Overview" : active}
          </h1>
          <p className="admin-muted">
            Manage your EverythingBD Multi-Vendor Store.
          </p>

          {active === "Products" ? (
            <ProductManager token={token} />
          ) : active === "Categories" ? (
            <CategoryManager token={token} />
          ) : active === "Orders" ? (
            <OrderManager token={token} />
          ) : active === "Customers" ? (
            <CustomerManager token={token} />
          ) : active === "Coupons" ? (
            <CouponManager token={token} />
          ) : active === "Banners" ? (
            <BannerManager token={token} />
          ) : active === "Website Media" ? (
            <WebsiteMediaManager token={token} />
          ) : active === "Landing Pages" ? (
            <LandingPageManager token={token} />
          ) : active === "Settings" ? (
            <UnifiedSettings token={token} />
          ) : active === "More" ? (
            <section className="ebd-mobile-more-page">
              <div className="ebd-more-intro">
                <h2>Manage your store</h2>
                <p>All your store management tools in one place.</p>
              </div>

              <div className="ebd-mobile-more-grid">
                {menus
                  .filter(item =>
                    !["Overview", "Orders", "Products"].includes(
                      item.name
                    )
                  )
                  .map(({ name, icon: Icon }) => (
                    <button
                      key={name}
                      type="button"
                      className="ebd-mobile-more-card"
                      onClick={() => changePage(name)}
                    >
                      <span className="ebd-mobile-more-icon">
                        <Icon size={23}/>
                      </span>
                      <span>{name}</span>
                      <ChevronRight
                        className="ebd-mobile-more-arrow"
                        size={15}
                      />
                    </button>
                  ))}
              </div>

              <button
                type="button"
                className="ebd-mobile-more-logout"
                onClick={onLogout}
              >
                <LogOut size={18}/>
                Logout
              </button>
            </section>
          ) : active === "Analytics" ||
              active === "Overview" ? (
            <AdminOverview token={token} />
          ) : (
            <div className="admin-placeholder">
              <Package size={42} />
              <h2>{active} Management</h2>
              <p>
                This module is being prepared for
                database integration.
              </p>
            </div>
          )}
        </div>
      </div>

      <nav
        className="ebd-mobile-bottom-nav"
        aria-label="Mobile admin navigation"
      >
        {mobileTabs.map(({ label, page, icon: Icon }) => {
          const selected = currentMobileTab === page;

          return (
            <button
              type="button"
              key={label}
              className={selected ? "is-active" : ""}
              aria-current={selected ? "page" : undefined}
              onClick={() => changePage(page)}
            >
              <span className="ebd-mobile-tab-icon">
                <Icon size={22} strokeWidth={1.9}/>
              </span>
              <span className="ebd-mobile-tab-label">
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
