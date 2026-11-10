import { useEffect, useState } from "react";
import { orderApi } from "./orderApi";
import "./order-manager.css";

const statuses = [
  "", "pending", "confirmed", "processing",
  "shipped", "delivered", "cancelled", "returned"
];

const money = value =>
  `৳${Number(value ?? 0).toLocaleString("en-BD")}`;

export default function OrderManager({ token }) {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [nextStatus, setNextStatus] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);

  const transitions = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["processing", "cancelled"],
    processing: ["shipped", "cancelled"],
    shipped: ["delivered"],
    delivered: [],
    cancelled: [],
    returned: []
  };


  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    orderApi.list(token, page, status)
      .then(result => {
        if (!active) return;
        setOrders(result.data || []);
        setPagination(result.pagination || {});
      })
      .catch(err => {
        if (!active) return;
        setOrders([]);
        setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [token, page, status, refresh]);


  async function changeOrderStatus() {
    if (!selected || !nextStatus || savingStatus) return;

    if (nextStatus === "cancelled" &&
        !window.confirm("Cancel order and restore stock?")) {
      return;
    }

    setSavingStatus(true);
    setError("");

    try {
      const result = await orderApi.updateStatus(
        token, selected._id, nextStatus
      );

      setSelected(result.data);
      setNextStatus("");
      setRefresh(value => value + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingStatus(false);
    }
  }

  async function viewOrder(id) {
    try {
      setError("");
      const result = await orderApi.details(token, id);
      setSelected(result.data);
      setNextStatus("");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="ebd-orders">
      <div className="ebd-orders-header">
        <div>
          <h2>Customer Orders</h2>
          <p>Review your EverythingBD orders.</p>
        </div>
        <button onClick={() => setRefresh(v => v + 1)}>
          Refresh
        </button>
      </div>

      <div className="ebd-orders-filter">
        <label htmlFor="ebd-status">Order Status</label>
        <select id="ebd-status" value={status}
          onChange={e => {
            setStatus(e.target.value);
            setPage(1);
          }}>
          {statuses.map(value => (
            <option key={value} value={value}>
              {value || "All Orders"}
            </option>
          ))}
        </select>
        <span>{pagination.total ?? 0} orders</span>
      </div>

      {error && <p className="ebd-orders-error" role="alert">{error}</p>}
      {loading && <p>Loading orders...</p>}

      <div className="ebd-orders-table-wrap">
        <table className="ebd-orders-table">
          <thead>
            <tr>
              <th>Order Number</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order._id}>
                <td>{order.orderNumber}</td>
                <td>
                  <strong>{order.customer?.name}</strong>
                  <small>{order.customer?.phone}</small>
                </td>
                <td>{new Date(order.createdAt).toLocaleDateString("en-BD")}</td>
                <td>{money(order.total)}</td>
                <td>{order.paymentStatus}</td>
                <td>
                  <span className="ebd-status">
                    {order.orderStatus}
                  </span>
                </td>
                <td>
                  <button onClick={() => viewOrder(order._id)}>
                    View
                  </button>
                </td>
              </tr>
            ))}
            {!loading && orders.length === 0 && (
              <tr>
                <td colSpan="7" className="ebd-orders-empty">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="ebd-orders-pages">
        <button disabled={loading || page <= 1}
          onClick={() => setPage(p => p - 1)}>
          Previous
        </button>
        <span>Page {page} of {pagination.totalPages || 1}</span>
        <button
          disabled={loading || page >= (pagination.totalPages || 1)}
          onClick={() => setPage(p => p + 1)}>
          Next
        </button>
      </div>

      {selected && (
        <div className="ebd-order-backdrop"
          onClick={() => setSelected(null)}>
          <div className="ebd-order-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Order details"
            onClick={e => e.stopPropagation()}>
            <div className="ebd-orders-header">
              <h2>{selected.orderNumber}</h2>
              <button onClick={() => setSelected(null)}>Close</button>
            </div>

            <p><b>Customer:</b> {selected.customer?.name}</p>
            <p><b>Phone:</b> {selected.customer?.phone}</p>
            <p><b>District:</b> {selected.shippingAddress?.district}</p>
            <p><b>Area:</b> {selected.shippingAddress?.area}</p>
            <p><b>Address:</b> {selected.shippingAddress?.address}</p>
            <p><b>Status:</b> {selected.orderStatus}</p>
            <div className="ebd-status-editor">
              <h3>Update Order Status</h3>

              <select
                value={nextStatus}
                onChange={e => setNextStatus(e.target.value)}
              >
                <option value="">Select next status</option>
                {(transitions[selected.orderStatus] || []).map(value => (
                  <option value={value} key={value}>
                    {value}
                  </option>
                ))}
              </select>

              <button
                type="button"
                disabled={!nextStatus || savingStatus}
                onClick={changeOrderStatus}
              >
                {savingStatus ? "Updating..." : "Update Status"}
              </button>

              {error && <p role="alert">{error}</p>}
            </div>

            <p><b>Payment:</b> {selected.paymentStatus}</p>
            <p><b>Note:</b> {selected.customerNote || "None"}</p>

            <h3>Products</h3>
            {(selected.items || []).map((item, index) => (
              <div className="ebd-order-line" key={index}>
                <span>
                  {item.name}
                  {item.size ? ` — Size: ${item.size}` : ""}
                  {" × "}{item.quantity}
                </span>
                <b>{money(item.subtotal)}</b>
              </div>
            ))}

            <div className="ebd-order-line">
              <span>Subtotal</span>
              <b>{money(selected.subtotal)}</b>
            </div>
            <div className="ebd-order-line">
              <span>Delivery Charge</span>
              <b>{money(selected.deliveryCharge)}</b>
            </div>
            <div className="ebd-order-line ebd-order-total">
              <span>Total</span>
              <b>{money(selected.total)}</b>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
