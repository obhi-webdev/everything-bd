import StoreAnalyticsTracker from "./features/analytics/StoreAnalyticsTracker";
import DynamicFavicon from "./components/settings/DynamicFavicon";
import LandingPage from "./pages/landing/LandingPage";
import MetaPixel from "./features/marketing/MetaPixel";
import OrderSuccess from "./pages/checkout/OrderSuccess";
import "./styles/checkout.css";
import Checkout from "./pages/checkout/Checkout";
import ProductDetails from "./pages/products/ProductDetails";
import "./styles/product-manager.css";
import { useEffect, useState } from "react";
import { adminApi } from "./features/admin/adminApi";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import "./styles/admin.css";
import "./styles/everythingbd-theme.css";

const SESSION_KEY = "everythingbd_admin_session";

function readSavedSession() {
  try {
    const saved =
      sessionStorage.getItem(SESSION_KEY) ||
      localStorage.getItem(SESSION_KEY);

    if (!saved) return null;

    const parsed = JSON.parse(saved);

    if (typeof parsed.token !== "string" || !parsed.token) {
      return null;
    }

    return { token: parsed.token, user: null };
  } catch {
    return null;
  }
}

function AdminArea() {
  const [session, setSession] = useState(readSavedSession);
  const [checking, setChecking] = useState(
    () => Boolean(readSavedSession())
  );

  useEffect(() => {
    if (!session?.token || session.user) return;

    let cancelled = false;

    adminApi.me(session.token)
      .then(profile => {
        if (cancelled) return;

        if (!["admin", "manager"].includes(profile.user?.role)) {
          throw new Error("Dashboard access denied");
        }

        setSession({
          token: session.token,
          user: profile.user
        });
      })
      .catch(() => {
        if (cancelled) return;

        localStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(SESSION_KEY);
        setSession(null);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [session]);

  function handleLogin(token, user, rememberMe = false) {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);

    const storage = rememberMe ? localStorage : sessionStorage;

    storage.setItem(
      SESSION_KEY,
      JSON.stringify({ token })
    );

    setSession({ token, user });
    setChecking(false);
  }

  function handleLogout() {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    setSession(null);
    setChecking(false);
  }

  if (checking) {
    return (
      <main className="admin-login-page">
        <div className="admin-login-panel" style={{ textAlign: "center" }}>
          <h2>everythingbd.</h2>
          <p>Verifying your admin session...</p>
        </div>
      </main>
    );
  }

  if (!session?.user) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return (
    <AdminDashboard
      user={session.user}
      token={session.token}
      onLogout={handleLogout}
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <StoreAnalyticsTracker />
      <DynamicFavicon />
      <MetaPixel />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/product/:slug" element={<ProductDetails />} />
        <Route path="/lp/:slug" element={<LandingPage />} />
        <Route path="/admin/*" element={<AdminArea />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
