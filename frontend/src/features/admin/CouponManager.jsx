import { useCallback, useEffect, useState } from "react";
import { Pencil, Trash2, TicketPercent } from "lucide-react";
import "./couponManager.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const initial = {
  code: "",
  type: "percentage",
  value: 10,
  minimumOrder: 0,
  maximumDiscount: "",
  usageLimit: "",
  expiresAt: "",
  isActive: true
};

export default function CouponManager({ token }) {
  const [form, setForm] = useState({ ...initial });
  const [editId, setEditId] = useState("");
  const [coupons, setCoupons] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body ? { "Content-Type": "application/json" } : {})
      },
      cache: "no-store"
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || "Request failed");
    }
    return data;
  }, [token]);

  const load = useCallback(async () => {
    try {
      const data = await request("/admin/coupons");
      setCoupons(data.data || []);
    } catch (err) {
      setError(err.message);
    }
  }, [request]);

  useEffect(() => { load(); }, [load]);

  function change(key, value) {
    setForm(previous => ({ ...previous, [key]: value }));
  }

  function reset() {
    setForm({ ...initial });
    setEditId("");
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const payload = {
        ...form,
        code: form.code.trim().toUpperCase(),
        value: Number(form.value),
        minimumOrder: Number(form.minimumOrder),
        maximumDiscount: form.maximumDiscount === ""
          ? null : Number(form.maximumDiscount),
        usageLimit: form.usageLimit === ""
          ? null : Number(form.usageLimit),
        expiresAt: form.expiresAt
          ? new Date(`${form.expiresAt}T23:59:59+06:00`).toISOString()
          : null
      };

      await request(
        editId ? `/admin/coupons/${editId}` : "/admin/coupons",
        {
          method: editId ? "PUT" : "POST",
          body: JSON.stringify(payload)
        }
      );

      reset();
      setNotice("Coupon saved successfully");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function edit(coupon) {
    setEditId(coupon._id);
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minimumOrder: coupon.minimumOrder || 0,
      maximumDiscount: coupon.maximumDiscount ?? "",
      usageLimit: coupon.usageLimit ?? "",
      expiresAt: coupon.expiresAt
        ? new Date(new Date(coupon.expiresAt).getTime() + 21600000)
            .toISOString().slice(0, 10)
        : "",
      isActive: coupon.isActive
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(coupon) {
    if (!window.confirm(`Delete coupon ${coupon.code}?`)) return;

    try {
      await request(`/admin/coupons/${coupon._id}`, {
        method: "DELETE"
      });
      await load();
      setNotice("Coupon deleted");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="eb-coupon-manager">
      <form className="eb-coupon-panel" onSubmit={save}>
        <div className="eb-coupon-heading">
          <TicketPercent size={25}/>
          <div>
            <h2>{editId ? "Edit Coupon" : "Create Discount Coupon"}</h2>
            <p>Manage promotional codes and customer discounts.</p>
          </div>
        </div>

        <div className="eb-coupon-fields">
          <label>Coupon Code
            <input required minLength={3} maxLength={30}
              placeholder="WELCOME10"
              value={form.code}
              onChange={e => change("code", e.target.value.toUpperCase())}/>
          </label>

          <label>Discount Type
            <select value={form.type}
              onChange={e => change("type", e.target.value)}>
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (৳)</option>
            </select>
          </label>

          <label>Discount Value
            <input required type="number" min="0.01" step="0.01"
              max={form.type === "percentage" ? 100 : undefined}
              value={form.value}
              onChange={e => change("value", e.target.value)}/>
          </label>

          <label>Minimum Order (৳)
            <input required type="number" min="0" step="0.01"
              value={form.minimumOrder}
              onChange={e => change("minimumOrder", e.target.value)}/>
          </label>

          <label>Maximum Discount (৳, optional)
            <input type="number" min="0" step="0.01"
              value={form.maximumDiscount}
              onChange={e => change("maximumDiscount", e.target.value)}/>
          </label>

          <label>Usage Limit (optional)
            <input type="number" min="1" step="1"
              value={form.usageLimit}
              onChange={e => change("usageLimit", e.target.value)}/>
          </label>

          <label>Expiry Date (optional)
            <input type="date"
              value={form.expiresAt}
              onChange={e => change("expiresAt", e.target.value)}/>
          </label>

          <label className="eb-coupon-active">
            <input type="checkbox" checked={form.isActive}
              onChange={e => change("isActive", e.target.checked)}/>
            Coupon Active
          </label>
        </div>

        {error && <p className="eb-coupon-error" role="alert">{error}</p>}
        {notice && <p className="eb-coupon-success">{notice}</p>}

        <div className="eb-coupon-actions">
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : editId ? "Update Coupon" : "Create Coupon"}
          </button>
          {editId && (
            <button type="button" className="secondary" onClick={reset}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <section className="eb-coupon-panel">
        <h2>All Coupons ({coupons.length})</h2>
        <div className="eb-coupon-list">
          {coupons.map(coupon => (
            <article key={coupon._id} className="eb-coupon-item">
              <div>
                <strong>{coupon.code}</strong>
                <p>
                  {coupon.type === "percentage"
                    ? `${coupon.value}% OFF`
                    : `৳${coupon.value} OFF`}
                </p>
                <small>
                  Used: {coupon.usedCount}
                  {coupon.usageLimit != null
                    ? ` / ${coupon.usageLimit}` : " / Unlimited"}
                </small>
                <span>{coupon.isActive ? "Active" : "Inactive"}</span>
              </div>
              <div className="eb-coupon-item-actions">
                <button onClick={() => edit(coupon)}>
                  <Pencil size={16}/> Edit
                </button>
                <button onClick={() => remove(coupon)}>
                  <Trash2 size={16}/> Delete
                </button>
              </div>
            </article>
          ))}
          {!coupons.length && <p>No coupons created yet.</p>}
        </div>
      </section>
    </div>
  );
}
