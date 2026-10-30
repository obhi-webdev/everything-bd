import { useCallback, useEffect, useState } from "react";
import { ImagePlus, Pencil, Trash2, X } from "lucide-react";
import { uploadProductImage } from "./imageUpload";
import "./bannerManager.css";

const API =
  import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const blank = {
  title: "",
  subtitle: "",
  eyebrow: "THE BEAUTY EDIT",
  buttonText: "Explore Collection",
  buttonLink: "/#products",
  desktopImage: "",
  mobileImage: "",
  sortOrder: 0,
  isActive: true
};

export default function BannerManager({ token }) {
  const [banners, setBanners] = useState([]);
  const [form, setForm] = useState({ ...blank });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers
      },
      cache: "no-store"
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.message || `Request failed (${response.status})`);
    }
    return result;
  }, [token]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const response = await request("/admin/banners");
      setBanners(response.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => { load(); }, [load]);

  function update(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function reset() {
    setForm({ ...blank });
    setEditingId(null);
    setError("");
    setNotice("");
  }

  async function uploadImage(event, key) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(key);
    setError("");

    try {
      const result = await uploadProductImage(file, token);
      update(key, result.url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading("");
      event.target.value = "";
    }
  }

  async function save(event) {
    event.preventDefault();
    if (saving || uploading) return;

    if (!form.desktopImage) {
      setError("Please upload a desktop banner image");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const path = editingId
        ? `/admin/banners/${editingId}`
        : "/admin/banners";

      await request(path, {
        method: editingId ? "PATCH" : "POST",
        body: JSON.stringify({
          ...form,
          sortOrder: Number(form.sortOrder)
        })
      });

      reset();
      setNotice(editingId ? "Banner updated" : "Banner created");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function edit(banner) {
    setEditingId(banner._id);
    setForm({
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      eyebrow: banner.eyebrow || "",
      buttonText: banner.buttonText || "",
      buttonLink: banner.buttonLink || "",
      desktopImage: banner.desktopImage || "",
      mobileImage: banner.mobileImage || "",
      sortOrder: banner.sortOrder ?? 0,
      isActive: banner.isActive ?? true
    });
    setError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(banner) {
    if (!window.confirm(`Delete banner "${banner.title || "Untitled"}"?`)) {
      return;
    }

    setError("");
    setNotice("");
    try {
      await request(`/admin/banners/${banner._id}`, {
        method: "DELETE"
      });
      if (editingId === banner._id) reset();
      setNotice("Banner deleted");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggle(banner) {
    setError("");
    try {
      await request(`/admin/banners/${banner._id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !banner.isActive })
      });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  function imageField(label, key, recommendedSize) {
    return (
      <div className="eb-banner-upload">
        <strong>{label}</strong>
        <small>{recommendedSize} · JPG, PNG or WebP · Max 5 MB</small>

        {form[key] ? (
          <div className="eb-banner-preview">
            <img src={form[key]} alt={`${label} preview`} />
            <button
              type="button"
              onClick={() => update(key, "")}
              aria-label={`Remove ${label}`}
              disabled={!!uploading}
            >
              <X size={17}/>
            </button>
          </div>
        ) : null}

        <label className="eb-banner-file-button">
          <ImagePlus size={18}/>
          {uploading === key ? "Uploading..." : `Upload ${label}`}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={!!uploading || saving}
            onChange={event => uploadImage(event, key)}
            hidden
          />
        </label>
      </div>
    );
  }

  return (
    <div className="eb-banners">
      <form className="eb-banner-form" onSubmit={save}>
        <div className="eb-banner-section-heading">
          <div>
            <h2>{editingId ? "Edit Banner" : "Create New Banner"}</h2>
            <p>Manage homepage visuals directly from your dashboard.</p>
          </div>
          {editingId && (
            <button className="eb-banner-secondary" type="button" onClick={reset}>
              Cancel Edit
            </button>
          )}
        </div>

        <div className="eb-banner-upload-grid">
          {imageField("Desktop Banner", "desktopImage", "Recommended 1600 × 900")}
          {imageField("Mobile Banner", "mobileImage", "Recommended 750 × 950")}
        </div>

        <div className="eb-banner-fields">
          <label>
            Eyebrow / Tagline
            <input
              value={form.eyebrow}
              maxLength={70}
              onChange={e => update("eyebrow", e.target.value)}
              placeholder="THE BEAUTY EDIT"
            />
          </label>

          <label>
            Banner Title
            <input
              value={form.title}
              maxLength={120}
              onChange={e => update("title", e.target.value)}
              placeholder="Your skin deserves extra love"
            />
          </label>

          <label className="eb-banner-full">
            Subtitle / Description
            <textarea
              value={form.subtitle}
              maxLength={350}
              rows={3}
              onChange={e => update("subtitle", e.target.value)}
              placeholder="Discover premium Korean skincare..."
            />
          </label>

          <label>
            Button Text
            <input
              value={form.buttonText}
              maxLength={50}
              onChange={e => update("buttonText", e.target.value)}
              placeholder="Shop Now"
            />
          </label>

          <label>
            Button Link
            <input
              value={form.buttonLink}
              maxLength={500}
              onChange={e => update("buttonLink", e.target.value)}
              placeholder="/#products"
            />
          </label>

          <label>
            Display Order
            <input
              type="number"
              min="0"
              max="9999"
              value={form.sortOrder}
              onChange={e => update("sortOrder", e.target.value)}
            />
          </label>

          <label className="eb-banner-checkbox">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={e => update("isActive", e.target.checked)}
            />
            Active (visible on homepage)
          </label>
        </div>

        {error && <p className="eb-banner-error" role="alert">{error}</p>}
        {notice && <p className="eb-banner-success">{notice}</p>}

        <button
          className="eb-banner-submit"
          type="submit"
          disabled={saving || !!uploading}
        >
          {saving ? "Saving..." : editingId ? "Update Banner" : "Publish Banner"}
        </button>
      </form>

      <div className="eb-banner-list-heading">
        <h2>All Banners</h2>
        <span>{banners.length} banners</span>
      </div>

      {loading ? (
        <p>Loading banners...</p>
      ) : banners.length === 0 ? (
        <div className="eb-banner-empty">
          No banners yet. Upload your first homepage banner above.
        </div>
      ) : (
        <div className="eb-banner-list">
          {banners.map(banner => (
            <article className="eb-banner-item" key={banner._id}>
              <img src={banner.desktopImage} alt={banner.title || "Banner"} />
              <div className="eb-banner-item-info">
                <strong>{banner.title || "Untitled Banner"}</strong>
                <small>Display order: {banner.sortOrder}</small>
                <span className={banner.isActive ? "is-active" : "is-hidden"}>
                  {banner.isActive ? "Active" : "Hidden"}
                </span>
              </div>

              <div className="eb-banner-actions">
                <button type="button" onClick={() => toggle(banner)}>
                  {banner.isActive ? "Hide" : "Show"}
                </button>
                <button type="button" onClick={() => edit(banner)}>
                  <Pencil size={16}/> Edit
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={() => remove(banner)}
                >
                  <Trash2 size={16}/> Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
