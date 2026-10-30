import { useCallback, useEffect, useState } from "react";
import { RefreshCw, ArrowUpRight } from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const money = value =>
  "৳" + Number(value || 0).toLocaleString("en-BD");


function OrderStatusBadge({ status }) {
  const value = String(status || "pending").toLowerCase();

  return (
    <span className={`ebd-order-status ebd-order-status--${value}`}>
      {value.charAt(0).toUpperCase() + value.slice(1)}
    </span>
  );
}

function formatBDDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export default function AdminOverview({ token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (signal) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/admin/orders/analytics`,
        {
          headers: { Authorization: `Bearer ${token}` },
          signal
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Analytics unavailable");
      }

      setData(result.data);
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err.message);
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const stats = [
    {
      title: "Total Order Value",
      value: money(data?.totalOrderValue),
      note: "Excludes cancelled and returned"
    },
    {
      title: "Total Orders",
      value: data?.totalOrders ?? 0,
      note: "All orders"
    },
    {
      title: "Active Products",
      value: data?.activeProducts ?? 0,
      note: "Published products"
    },
    {
      title: "Pending Orders",
      value: data?.pendingOrders ?? 0,
      note: "Awaiting confirmation"
    },
    {
      title: "Customers",
      value: data?.totalCustomers ?? 0,
      note: "Unique customer phone numbers"
    }
  ];

  return (
    <section aria-label="Live store analytics">
      <div className="pm-actions" style={{ marginBottom: 20 }}>
        <button onClick={() => load()} disabled={loading}>
          <RefreshCw size={16} />
          {loading ? "Loading..." : "Refresh Analytics"}
        </button>
      </div>

      {error && (
        <p className="pm-error" role="alert">
          {error}
        </p>
      )}

      {loading && !data && (
        <div className="admin-stat-grid" aria-busy="true"
          aria-label="Loading analytics">
          {Array.from({ length: 5 }, (_, index) => (
            <div className="admin-stat-card" key={index}>
              <div className="ebd-skeleton ebd-skeleton-label" />
              <div className="ebd-skeleton ebd-skeleton-value" />
              <div className="ebd-skeleton ebd-skeleton-note" />
            </div>
          ))}
        </div>
      )}

      {data && (
        <>
          <div className="admin-stat-grid">
            {stats.map(item => (
              <div className="admin-stat-card" key={item.title}>
                <div className="admin-stat-title">
                  {item.title}
                  <ArrowUpRight size={17} />
                </div>
                <strong>{item.value}</strong>
                <small>{item.note}</small>
              </div>
            ))}
          </div>

          <div className="admin-welcome-card"
            style={{ marginTop: 24, display: "block" }}>
            <h2>Recent Orders</h2>
            {!data.recentOrders?.length ? (
              <p>No orders yet. New orders will appear here.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  textAlign: "left"
                }}>
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentOrders.map(order => (
                      <tr key={order._id}>
                        <td>{order.orderNumber}</td>
                        <td>{order.customer?.name || "—"}</td>
                        <td>{money(order.total)}</td>
                        <td><OrderStatusBadge status={order.orderStatus} /></td>
                        <td>
                          {formatBDDate(order.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
