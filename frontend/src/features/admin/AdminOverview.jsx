import TrafficAnalytics from "./TrafficAnalytics";
import { useEffect, useState } from "react";
import { RefreshCw, ArrowUpRight } from "lucide-react";
import "./premiumAnalytics.css";

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
  const [days, setDays] = useState(7);
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState(null);

  const requestKey = `${days}:${revision}`;

  const current =
    result?.key === requestKey &&
    result?.token === token
      ? result
      : null;

  const data = current?.data ?? null;
  const error = current?.error ?? "";
  const loading = !current;

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const response = await fetch(
          `${API_URL}/admin/orders/analytics?days=${days}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            },
            signal: controller.signal,
            cache: "no-store"
          }
        );

        const payload = await response.json();

        if (!response.ok || !payload.success) {
          throw new Error(
            payload.message || "Analytics unavailable"
          );
        }

        if (!controller.signal.aborted) {
          setResult({
            key: requestKey,
            token,
            data: payload.data
          });
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setResult({
            key: requestKey,
            token,
            error: err.message
          });
        }
      }
    }

    load();

    return () => controller.abort();
  }, [token, days, requestKey]);

  const stats = [
    {
      title: "Total Orders",
      value: data?.totalOrders ?? "—",
      note: `Orders in the last ${days} days`
    },
    {
      title: "Order Value",
      value: data ? money(data.totalOrderValue) : "—",
      note: "Excludes cancelled and returned"
    },
    {
      title: "Customers",
      value: data?.totalCustomers ?? "—",
      note: "Unique customer phone numbers"
    },
    {
      title: "Active Products",
      value: data?.activeProducts ?? "—",
      note: "Currently published products"
    },
    {
      title: "Pending Orders",
      value: data?.pendingOrders ?? "—",
      note: `Pending in the last ${days} days`
    }
  ];

  const chartDays = (data?.dailyOrders || []).slice(
    -(days === 7 ? 7 : 14)
  );

  const maxOrders = Math.max(
    1,
    ...chartDays.map(item => item.orders)
  );

  return (
    <section
      className="ebd-premium-analytics"
      aria-label="Store analytics"
    >
      <TrafficAnalytics token={token} days={days} />
      <div className="ebd-analytics-heading">
        <div>
          <span className="ebd-analytics-eyebrow">
            EVERYTHINGBD INSIGHTS
          </span>
          <h2>Analytics</h2>
          <p>Understand your orders and store performance.</p>
        </div>
      </div>

      <div className="ebd-analytics-periods"
        role="group" aria-label="Analytics date range">
        {[7, 30, 90].map(value => (
          <button
            key={value}
            type="button"
            className={days === value ? "is-active" : ""}
            aria-pressed={days === value}
            onClick={() => setDays(value)}
          >
            {value} days
          </button>
        ))}
      </div>
      <div className="pm-actions" style={{ marginBottom: 20 }}>
        <button
          onClick={() => setRevision(value => value + 1)}
          disabled={loading}
        >
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

          <div className="ebd-analytics-chart">
            <div className="ebd-analytics-chart-heading">
              <div>
                <h3>Order Trend</h3>
                <p>
                  Daily orders — last {chartDays.length} days
                </p>
              </div>
              <strong>{data.totalOrders} orders</strong>
            </div>

            <div className="ebd-analytics-bars"
              role="img"
              aria-label="Daily order counts for the chart period">
              {chartDays.map(day => (
                <div className="ebd-analytics-bar-col"
                  key={day.date}
                  title={`${day.date}: ${day.orders} orders`}>
                  <div className="ebd-analytics-bar-area">
                    <div
                      className="ebd-analytics-bar"
                      style={{
                        height: day.orders
                          ? `${Math.max(
                              5,
                              day.orders / maxOrders * 100
                            )}%`
                          : "0%"
                      }}
                    />
                  </div>
                  <small>{day.date.slice(8)}</small>
                </div>
              ))}
            </div>
            <p className="ebd-analytics-chart-note">
              Values are based on orders saved in your database.
              This is not a page-view chart.
            </p>
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
