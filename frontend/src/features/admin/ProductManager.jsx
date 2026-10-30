import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Archive, RefreshCw, X } from "lucide-react";
import { productApi } from "./productApi";
import ImageUploader from "./ImageUploader";

const empty = {
  name: "", slug: "", sku: "", brand: "",
  category: "", description: "", price: "",
  compareAtPrice: "", stock: "0",
  status: "draft", isFeatured: false,
  imagesText: "", ingredientsText: "", benefitsText: "",
  seoTitle: "", seoDescription: ""
};

const slugify = (text) => text.toLowerCase().trim()
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const toForm = (p) => ({
  name: p.name || "",
  slug: p.slug || "",
  sku: p.sku || "",
  brand: p.brand || "",
  category: p.category || "",
  description: p.description || "",
  price: String(p.price ?? ""),
  compareAtPrice: String(p.compareAtPrice ?? ""),
  stock: String(p.stock ?? 0),
  status: p.status || "draft",
  isFeatured: Boolean(p.isFeatured),
  imagesText: (p.images || []).map(x => x.url).join("\n"),
  ingredientsText: (p.ingredients || []).join("\n"),
  benefitsText: (p.benefits || []).join("\n"),
  seoTitle: p.seo?.title || "",
  seoDescription: p.seo?.description || ""
});

const lines = (text) => text.split("\n").map(x => x.trim()).filter(Boolean);

function toPayload(form) {
  const images = lines(form.imagesText).map(url => ({
    url, alt: form.name, publicId: ""
  }));

  return {
    name: form.name.trim(),
    slug: form.slug.trim(),
    sku: form.sku.trim(),
    brand: form.brand.trim(),
    category: form.category.trim(),
    description: form.description,
    price: Number(form.price),
    compareAtPrice: form.compareAtPrice === ""
      ? null : Number(form.compareAtPrice),
    stock: Number(form.stock),
    status: form.status,
    isFeatured: form.isFeatured,
    images,
    ingredients: lines(form.ingredientsText),
    benefits: lines(form.benefitsText),
    seo: {
      title: form.seoTitle,
      description: form.seoDescription
    }
  };
}

export default function ProductManager({ token }) {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await productApi.list(token);
      setProducts(result.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  function change(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function startCreate() {
    setEditingId(null);
    setForm(empty);
    setError("");
    setNotice("");
    setShowForm(true);
  }

  function startEdit(product) {
    setEditingId(product._id);
    setForm(toForm(product));
    setError("");
    setNotice("");
    setShowForm(true);
  }

  async function save(event) {
    event.preventDefault();
    if (uploadingImages) return;
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const payload = toPayload(form);
      if (editingId) {
        await productApi.update(token, editingId, payload);
      } else {
        await productApi.create(token, payload);
      }
      setShowForm(false);
      setEditingId(null);
      setNotice("Product saved successfully.");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function archive(product) {
    if (!window.confirm(`Archive "${product.name}"?`)) return;
    setError("");
    try {
      await productApi.archive(token, product._id);
      setNotice("Product archived.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="pm">
      <div className="pm-heading">
        <div>
          <h2>Product Management</h2>
          <p>Manage your skincare catalog and inventory.</p>
        </div>
        <div className="pm-actions">
          <button onClick={load} disabled={loading}>
            <RefreshCw size={16}/> Refresh
          </button>
          <button className="pm-primary" onClick={startCreate}>
            <Plus size={17}/> Add Product
          </button>
        </div>
      </div>

      {error && <p className="pm-error" role="alert">{error}</p>}
      {notice && <p className="pm-success" role="status">{notice}</p>}

      {showForm && (
        <section className="pm-panel">
          <div className="pm-panel-heading">
            <h3>{editingId ? "Edit Product" : "Add New Product"}</h3>
            <button onClick={() => setShowForm(false)}
              aria-label="Close form"><X size={20}/></button>
          </div>
          <form onSubmit={save}>
            <div className="pm-form-grid">
              <label>Product Name *
                <input required minLength={3} value={form.name}
                  onChange={e => {
                    const name = e.target.value;
                    setForm(prev => ({
                      ...prev, name,
                      slug: !editingId && prev.slug === slugify(prev.name)
                        ? slugify(name) : prev.slug
                    }));
                  }}/>
              </label>
              <label>Slug *
                <input required pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  value={form.slug}
                  onChange={e => change("slug", e.target.value)}/>
              </label>
              <label>SKU *
                <input required value={form.sku}
                  onChange={e => change("sku", e.target.value)}/>
              </label>
              <label>Brand
                <input value={form.brand}
                  onChange={e => change("brand", e.target.value)}/>
              </label>
              <label>Category *
                <input required value={form.category}
                  placeholder="Serum, Cleanser, Sunscreen..."
                  onChange={e => change("category", e.target.value)}/>
              </label>
              <label>Status
                <select value={form.status}
                  onChange={e => change("status", e.target.value)}>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
              <label>Selling Price (BDT) *
                <input required type="number" min="0" step="0.01"
                  value={form.price}
                  onChange={e => change("price", e.target.value)}/>
              </label>
              <label>Original Price (BDT)
                <input type="number" min="0" step="0.01"
                  value={form.compareAtPrice}
                  onChange={e => change("compareAtPrice", e.target.value)}/>
              </label>
              <label>Stock *
                <input required type="number" min="0" step="1"
                  value={form.stock}
                  onChange={e => change("stock", e.target.value)}/>
              </label>
              <label className="pm-checkbox">
                <input type="checkbox" checked={form.isFeatured}
                  onChange={e => change("isFeatured", e.target.checked)}/>
                Featured Product
              </label>
            </div>

            <label>Description
              <textarea rows={3} value={form.description}
                onChange={e => change("description", e.target.value)}/>
            </label>
            <ImageUploader
              token={token}
              urls={form.imagesText}
              onChange={value => change("imagesText", value)}
              onUploadingChange={setUploadingImages}
            />
            <div className="pm-form-grid">
              <label>Ingredients (one per line)
                <textarea rows={3} value={form.ingredientsText}
                  onChange={e => change("ingredientsText", e.target.value)}/>
              </label>
              <label>Benefits (one per line)
                <textarea rows={3} value={form.benefitsText}
                  onChange={e => change("benefitsText", e.target.value)}/>
              </label>
              <label>SEO Title
                <input value={form.seoTitle}
                  onChange={e => change("seoTitle", e.target.value)}/>
              </label>
              <label>SEO Description
                <input value={form.seoDescription}
                  onChange={e => change("seoDescription", e.target.value)}/>
              </label>
            </div>
            <div className="pm-form-actions">
              <button type="button" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button className="pm-primary" disabled={saving || uploadingImages} type="submit">
                {saving ? "Saving..." : editingId ? "Update Product" : "Save Product"}
              </button>
            </div>
          </form>
        </section>
      )}

      <div className="pm-panel pm-table-scroll">
        {loading ? <p>Loading products...</p> : (
          <table className="pm-table">
            <thead><tr>
              <th>Product</th><th>SKU</th><th>Price</th>
              <th>Stock</th><th>Status</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {products.map(p => (
                <tr key={p._id}>
                  <td><div className="pm-product">
                    {p.images?.[0]?.url
                      ? <img src={p.images[0].url} alt={p.name}/>
                      : <div className="pm-no-image">No image</div>}
                    <div><strong>{p.name}</strong><small>{p.brand || p.category}</small></div>
                  </div></td>
                  <td>{p.sku}</td>
                  <td>৳{Number(p.price).toLocaleString("en-BD")}</td>
                  <td>{p.stock}</td>
                  <td><span className="pm-status">{p.status}</span></td>
                  <td><div className="pm-row-actions">
                    <button title="Edit" onClick={() => startEdit(p)}>
                      <Pencil size={17}/>
                    </button>
                    <button title="Archive" disabled={p.status === "archived"}
                      onClick={() => archive(p)}>
                      <Archive size={17}/>
                    </button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && products.length === 0 && (
          <p className="pm-empty">No products yet. Add your first skincare product.</p>
        )}
      </div>
      <p className="pm-footnote">Showing up to 100 products. Pagination and direct image uploads will be added next.</p>
    </div>
  );
}
