import { useEffect, useState } from "react";
import { Users, Search, Eye, X, Repeat2, ShoppingBag, Wallet } from "lucide-react";
import "./customerManager.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const money = value => `৳${Number(value || 0).toLocaleString("en-BD")}`;
const date = value => value ? new Date(value).toLocaleDateString("en-GB") : "—";

export default function CustomerManager({ token }) {
  const [customers, setCustomers] = useState([]);
  const [summary, setSummary] = useState({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [orders, setOrders] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          search,
          page: String(page),
          limit: "15"
        });

        const response = await fetch(`${API}/admin/customers?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
          cache: "no-store"
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Unable to load customers");

        setCustomers(result.data || []);
        setSummary(result.summary || {});
      } catch (err) {
        if (err.name !== "AbortError") setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [token, search, page]);

  async function viewCustomer(customer) {
    setSelected(customer);
    setOrders([]);
    setHistoryLoading(true);

    try {
      const response = await fetch(
        `${API}/admin/customers/${encodeURIComponent(customer._id)}/orders`,
        { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to load orders");

      setOrders(result.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setHistoryLoading(false);
    }
  }

  const stats = [
    ["Total Customers", summary.totalCustomers, Users],
    ["Repeat Customers", summary.repeatCustomers, Repeat2],
    ["Total Orders", summary.totalOrders, ShoppingBag],
    ["Order Value", money(summary.totalOrderValue), Wallet]
  ];

  return (
    <div className="eb-customers">
      <div className="eb-customer-stats">
        {stats.map(([label, value, Icon]) => (
          <div className="eb-customer-stat" key={label}>
            <div className="eb-customer-stat-icon"><Icon size={22}/></div>
            <small>{label}</small>
            <strong>{value ?? 0}</strong>
          </div>
        ))}
      </div>

      <section className="eb-customer-panel">
        <div className="eb-customer-heading">
          <div>
            <h2>Customer Directory</h2>
            <p>Customer profiles generated from order history.</p>
          </div>

          <div className="eb-customer-search">
            <Search size={18}/>
            <input
              value={search}
              placeholder="Search name, phone or district"
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {error && <p className="eb-customer-error" role="alert">{error}</p>}

        {loading ? (
          <p className="eb-customer-loading">Loading customers...</p>
        ) : customers.length === 0 ? (
          <div className="eb-customer-empty">No customers found.</div>
        ) : (
          <div className="eb-customer-table-wrap">
            <table className="eb-customer-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Location</th>
                  <th>Orders</th>
                  <th>Order Value</th>
                  <th>Last Order</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c._id}>
                    <td>
                      <div className="eb-customer-name">
                        <span className="eb-customer-avatar">
                          {c.name?.charAt(0)?.toUpperCase() || "C"}
                        </span>
                        <div>
                          <strong>{c.name || "Customer"}</strong>
                          <small>{c.phone}</small>
                          {c.totalOrders > 1 && <span className="eb-repeat-badge">Repeat</span>}
                        </div>
                      </div>
                    </td>
                    <td>{c.district || "—"}</td>
                    <td>{c.totalOrders}</td>
                    <td>{money(c.totalOrderValue)}</td>
                    <td>{date(c.lastOrder)}</td>
                    <td>
                      <button className="eb-view-customer" onClick={() => viewCustomer(c)}>
                        <Eye size={16}/> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="eb-customer-pagination">
          <span>Page {page}</span>
          <div>
            <button disabled={page <= 1 || loading}
              onClick={() => setPage(p => p - 1)}>Previous</button>
            <button disabled={loading || customers.length < 15}
              onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      </section>

      {selected && (
        <div className="eb-customer-modal-backdrop" onClick={() => setSelected(null)}>
          <section className="eb-customer-modal" role="dialog"
            aria-modal="true" aria-label="Customer details"
            onClick={e => e.stopPropagation()}>
            <div className="eb-customer-modal-head">
              <div>
                <h2>{selected.name}</h2>
                <p>{selected.phone}</p>
                <p>{selected.area}, {selected.district}</p>
              </div>
              <button aria-label="Close" onClick={() => setSelected(null)}>
                <X size={22}/>
              </button>
            </div>

            <h3>Order History</h3>

            {historyLoading ? <p>Loading orders...</p> : (
              <div className="eb-customer-history">
                {orders.length === 0 && <p>No orders found.</p>}
                {orders.map(order => (
                  <article key={order._id}>
                    <strong>{order.orderNumber}</strong>
                    <p>{date(order.createdAt)} · {order.orderStatus}</p>
                    <strong>{money(order.total)}</strong>
                    <p>{order.items?.map(i => `${i.name} × ${i.quantity}`).join(", ")}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
