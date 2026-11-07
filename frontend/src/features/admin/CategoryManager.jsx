import { useCallback, useEffect, useState } from "react";
import {
  Plus, Pencil, Trash2, Save, X, ImagePlus
} from "lucide-react";
import { uploadProductImage } from "./imageUpload";
import "./categoryManager.css";

const API =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5001/api";

const blank = {
  name: "",
  description: "",
  imageUrl: "",
  sortOrder: 0,
  isActive: true
};

export default function CategoryManager({ token }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ ...blank });
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body
          ? { "Content-Type": "application/json" }
          : {}),
        ...(options.headers || {})
      },
      cache: "no-store"
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.message || `Request failed (${response.status})`
      );
    }

    return data;
  }, [token]);

  const load = useCallback(async () => {
    try {
      const result = await request("/admin/categories");
      setItems(result.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => { load(); }, [load]);

  function startNew() {
    setEditing(null);
    setForm({ ...blank });
    setShowForm(true);
    setError("");
    setMessage("");
  }

  function startEdit(item) {
    setEditing(item._id);
    setForm({
      name: item.name,
      description: item.description || "",
      imageUrl: item.imageUrl || "",
      sortOrder: item.sortOrder ?? 0,
      isActive: item.isActive !== false
    });
    setShowForm(true);
    setError("");
    setMessage("");
  }

  async function manageLegacy(item) {
    setBusy(true);
    setError("");

    try {
      const result = await request(
        `/admin/categories/import/${
          encodeURIComponent(item.name)
        }`,
        { method: "POST" }
      );

      await load();
      startEdit(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function uploadImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setError("");

    try {
      const result = await uploadProductImage(file, token);
      setForm(prev => ({
        ...prev,
        imageUrl: result.url
      }));
      setMessage("Image uploaded. Save category to publish.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    try {
      await request(
        editing
          ? `/admin/categories/${editing}`
          : "/admin/categories",
        {
          method: editing ? "PUT" : "POST",
          body: JSON.stringify({
            ...form,
            name: form.name.trim(),
            sortOrder: Number(form.sortOrder)
          })
        }
      );

      await load();
      setShowForm(false);
      setEditing(null);
      setMessage("Category saved successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(item) {
    if (!window.confirm(
      `Delete "${item.name}" category?`
    )) return;

    setBusy(true);
    setError("");
    setMessage("");

    try {
      await request(
        `/admin/categories/${item._id}`,
        { method: "DELETE" }
      );
      await load();
      setMessage("Category deleted.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="eb-category-manager">
      <div className="eb-category-heading">
        <div>
          <h2>Category Management</h2>
          <p>
            Organize storefront categories, images and display order.
          </p>
        </div>
        <button
          className="eb-category-primary"
          onClick={startNew}
          type="button"
        >
          <Plus size={17}/> Add Category
        </button>
      </div>

      {error && <p className="eb-category-error" role="alert">{error}</p>}
      {message && <p className="eb-category-success" role="status">{message}</p>}

      {showForm && (
        <form className="eb-category-form" onSubmit={save}>
          <div className="eb-category-form-title">
            <h3>{editing ? "Edit Category" : "New Category"}</h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              aria-label="Close form"
            >
              <X size={20}/>
            </button>
          </div>

          <div className="eb-category-form-grid">
            <label>
              Category Name *
              <input
                required
                maxLength={100}
                value={form.name}
                onChange={e => setForm(prev => ({
                  ...prev,
                  name: e.target.value
                }))}
                placeholder="e.g. Skincare"
              />
            </label>

            <label>
              Display Order
              <input
                type="number"
                value={form.sortOrder}
                onChange={e => setForm(prev => ({
                  ...prev,
                  sortOrder: e.target.value
                }))}
              />
            </label>

            <label className="eb-category-wide">
              Description
              <textarea
                rows={2}
                maxLength={500}
                value={form.description}
                onChange={e => setForm(prev => ({
                  ...prev,
                  description: e.target.value
                }))}
                placeholder="Short category description"
              />
            </label>
          </div>

          <div className="eb-category-image-area">
            <div className="eb-category-image-preview">
              {form.imageUrl ? (
                <img src={form.imageUrl} alt="Category preview"/>
              ) : (
                <ImagePlus size={34}/>
              )}
            </div>

            <div>
              <strong>Category Image</strong>
              <p>Recommended: 500 × 500 px, JPG/PNG/WebP, max 5 MB</p>

              <label className="eb-category-upload">
                <ImagePlus size={16}/>
                {busy ? "Processing..." : "Upload Image"}
                <input
                  type="file"
                  hidden
                  disabled={busy}
                  accept="image/jpeg,image/png,image/webp"
                  onChange={uploadImage}
                />
              </label>

              {form.imageUrl && (
                <button
                  type="button"
                  className="eb-category-clear"
                  onClick={() => setForm(prev => ({
                    ...prev,
                    imageUrl: ""
                  }))}
                >
                  Remove image
                </button>
              )}
            </div>
          </div>

          <label className="eb-category-toggle">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={e => setForm(prev => ({
                ...prev,
                isActive: e.target.checked
              }))}
            />
            Active — show on homepage
          </label>

          <button
            type="submit"
            disabled={busy}
            className="eb-category-primary"
          >
            <Save size={17}/>
            {busy ? "Saving..." : "Save Category"}
          </button>
        </form>
      )}

      {loading ? (
        <p>Loading categories...</p>
      ) : (
        <div className="eb-category-grid">
          {items.map(item => (
            <article
              key={item._id || item.name}
              className="eb-category-card"
            >
              <div className="eb-category-card-image">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name}/>
                ) : (
                  <ImagePlus size={30}/>
                )}
              </div>

              <div className="eb-category-card-info">
                <h3>{item.name}</h3>
                <p>
                  {item.isLegacy
                    ? "Existing product category"
                    : `Order: ${item.sortOrder}`}
                </p>
                <span className={
                  item.isActive ? "is-active" : "is-inactive"
                }>
                  {item.isActive ? "Active" : "Hidden"}
                </span>
              </div>

              <div className="eb-category-card-actions">
                {item.isLegacy ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => manageLegacy(item)}
                  >
                    <Pencil size={15}/> Manage
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => startEdit(item)}
                    >
                      <Pencil size={15}/> Edit
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => remove(item)}
                      aria-label={`Delete ${item.name}`}
                    >
                      <Trash2 size={15}/>
                    </button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
