import "./premiumDashboard.css";
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
  LogOut, Menu, X, ArrowUpRight, ShieldCheck
} from "lucide-react";

const menus = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Products", icon: Package },
  { name: "Orders", icon: ShoppingBag },
  { name: "Customers", icon: Users },
  { name: "Coupons", icon: TicketPercent },
  { name: "Banners", icon: Image },
  { name: "Website Media", icon: Image },
  { name: "Landing Pages", icon: Image },
  { name: "Settings", icon: Settings }
];

export default function AdminDashboard({ user, token, onLogout }) {
  const [active, setActive] = useState("Overview");
  const [menuOpen, setMenuOpen] = useState(false);

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
          <h1>{active === "Overview" ? "Dashboard Overview" : active}</h1>
          <p className="admin-muted">
            Manage your EverythingBD beauty store.
          </p>

          {active === "Products" ? (
            <ProductManager token={token} />
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
          ) : active === "Overview" ? (
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
    </div>
  );
}
