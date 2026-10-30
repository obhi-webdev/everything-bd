import { useCallback, useEffect, useState } from "react";
import { Copy, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { uploadProductImage } from "./imageUpload";
import "./landingManager.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const empty = {
  name: "",
  slug: "",
  headline: "",
  description: "",
  benefits: "",
  images: [],
  videoUrl: "",
  productId: "",
  buttonText: "Order Now",
  isPublished: false
};

function makeSlug(value) {
  return value.toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

export default function LandingPageManager({ token }) {
  const [pages, setPages] = useState([]);
  const [form, setForm] = useState({ ...empty });
  const [editId, setEditId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body ? { "Content-Type": "application/json" } : {})
      },
      cache: "no-store"
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(json.message || "Request failed");
    return json;
  }, [token]);

  const load = useCallback(async () => {
    try {
      const result = await request("/admin/landing-pages");
      setPages(result.data || []);
    } catch (err) {
      setError(err.message);
    }
  }, [request]);

  useEffect(() => { load(); }, [load]);

  function change(key, value) {
    setForm(previous => ({ ...previous, [key]: value }));
  }

  function reset() {
    setEditId("");
    setForm({ ...empty, images: [] });
  }

  async function uploadImages(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    if (form.images.length + files.length > 12) {
      setError("Maximum 12 images allowed");
      event.target.value = "";
      return;
    }

    setUploading(true);
    setError("");

    try {
      for (const file of files) {
        const result = await uploadProductImage(file, token);
        setForm(previous => ({
          ...previous,
          images: [...previous.images, result.url]
        }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function save(event) {
    event.preventDefault();
    if (uploading || saving) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const result = await request(
        editId ? `/admin/landing-pages/${editId}` : "/admin/landing-pages",
        {
          method: editId ? "PUT" : "POST",
          body: JSON.stringify(form)
        }
      );

      const url = `${window.location.origin}/lp/${result.data.slug}`;
      setMessage(`Saved successfully: ${url}`);
      reset();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function edit(page) {
    setEditId(page._id);
    setForm({
      name: page.name,
      slug: page.slug,
      headline: page.headline || "",
      description: page.description || "",
      benefits: page.benefits || "",
      images: page.images || [],
      videoUrl: page.videoUrl || "",
      productId: page.productId || "",
      buttonText: page.buttonText || "Order Now",
      isPublished: page.isPublished
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(page) {
    if (!window.confirm(`Delete "${page.name}"?`)) return;
    try {
      await request(`/admin/landing-pages/${page._id}`, {
        method: "DELETE"
      });
      if (editId === page._id) reset();
      await load();
      setMessage("Landing page deleted");
    } catch (err) {
      setError(err.message);
    }
  }

  function pageUrl(slug) {
    return `${window.location.origin}/lp/${slug}`;
  }

  return (
    <div className="lp-admin">
      <form className="lp-panel" onSubmit={save}>
        <h2>{editId ? "Edit Landing Page" : "Create Landing Page"}</h2>
        <p>Build standalone sales pages without adding them to your store catalogue.</p>

        <div className="lp-form-grid">
          <label>
            Page Name
            <input required maxLength={120} value={form.name}
              onChange={e => {
                const value = e.target.value;
                setForm(previous => ({
                  ...previous,
                  name: value,
                  slug: editId ? previous.slug : makeSlug(value)
                }));
              }}/>
          </label>

          <label>
            URL Slug
            <input required maxLength={90} value={form.slug}
              placeholder="korean-sunscreen"
              onChange={e => change("slug", makeSlug(e.target.value))}/>
          </label>

          <label className="lp-wide">
            Main Headline
            <input maxLength={200} value={form.headline}
              onChange={e => change("headline", e.target.value)}/>
          </label>

          <label className="lp-wide">
            Product Description
            <textarea rows={5} maxLength={6000} value={form.description}
              onChange={e => change("description", e.target.value)}/>
          </label>

          <label className="lp-wide">
            Product Benefits (one per line)
            <textarea rows={4} maxLength={3000} value={form.benefits}
              onChange={e => change("benefits", e.target.value)}/>
          </label>

          <label>
            Existing Product ID
            <input required value={form.productId}
              placeholder="MongoDB Product ID"
              onChange={e => change("productId", e.target.value.trim())}/>
          </label>

          <label>
            Order Button Text
            <input maxLength={50} value={form.buttonText}
              onChange={e => change("buttonText", e.target.value)}/>
          </label>

          <label className="lp-wide">
            Product Video URL (direct HTTPS MP4/WebM)
            <input type="url" value={form.videoUrl}
              placeholder="https://..."
              onChange={e => change("videoUrl", e.target.value)}/>
          </label>

          <label className="lp-wide">
            Product Images (maximum 12)
            <input type="file" multiple
              accept="image/jpeg,image/png,image/webp"
              disabled={uploading}
              onChange={uploadImages}/>
          </label>
        </div>

        <div className="lp-image-grid">
          {form.images.map((url, index) => (
            <div key={`${url}-${index}`} className="lp-image">
              <img src={url} alt={`Product ${index + 1}`}/>
              <button type="button" disabled={uploading}
                onClick={() => change("images",
                  form.images.filter((_, i) => i !== index))}>×</button>
            </div>
          ))}
        </div>

        <label className="lp-publish">
          <input type="checkbox" checked={form.isPublished}
            onChange={e => change("isPublished", e.target.checked)}/>
          Publish Landing Page
        </label>

        {error && <p className="lp-error" role="alert">{error}</p>}
        {message && <p className="lp-success">{message}</p>}

        <div className="lp-actions">
          <button type="submit" disabled={saving || uploading}>
            {uploading ? "Uploading..." :
              saving ? "Saving..." : editId ? "Update Page" : "Create Page"}
          </button>
          {editId && <button type="button" onClick={reset}>Cancel Edit</button>}
        </div>
      </form>

      <div className="lp-panel">
        <h2>My Landing Pages</h2>

        {pages.length === 0 && <p>No landing pages created yet.</p>}

        <div className="lp-page-list">
          {pages.map(page => (
            <div className="lp-page-row" key={page._id}>
              {page.images?.[0] && (
                <img src={page.images[0]} alt={page.name}/>
              )}

              <div className="lp-page-info">
                <strong>{page.name}</strong>
                <small>{page.isPublished ? "Published" : "Draft"}</small>
                <code>{pageUrl(page.slug)}</code>
              </div>

              <div className="lp-row-actions">
                <button title="Copy URL"
                  onClick={() => navigator.clipboard.writeText(pageUrl(page.slug))}>
                  <Copy size={17}/>
                </button>
                {page.isPublished && (
                  <a href={pageUrl(page.slug)} target="_blank" rel="noreferrer"
                    title="Open Landing Page">
                    <ExternalLink size={17}/>
                  </a>
                )}
                <button title="Edit" onClick={() => edit(page)}>
                  <Pencil size={17}/>
                </button>
                <button title="Delete" onClick={() => remove(page)}>
                  <Trash2 size={17}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
