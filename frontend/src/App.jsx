import MetaPixel from "./features/marketing/MetaPixel";
import OrderSuccess from "./pages/checkout/OrderSuccess";
import "./styles/checkout.css";
import Checkout from "./pages/checkout/Checkout";
import ProductDetails from "./pages/products/ProductDetails";
import "./styles/product-manager.css";
import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import "./styles/admin.css";

function AdminArea() {
  const [session, setSession] = useState(null);

  function handleLogin(token, user) {
    setSession({ token, user });
  }

  function handleLogout() {
    setSession(null);
  }

  if (!session) {
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
      <MetaPixel />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/product/:slug" element={<ProductDetails />} />
        <Route path="/admin/*" element={<AdminArea />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
