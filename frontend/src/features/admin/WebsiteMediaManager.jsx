import { useEffect, useMemo, useState } from "react";
import {
  ImagePlus, Save, Trash2, ExternalLink
} from "lucide-react";

import { uploadProductImage } from "./imageUpload";
import "./websiteMediaManager.css";

const API =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5001/api";

const FIXED_SLOTS = [
  {
    key: "hero-side",
    name: "Hero Side Banner",
    location: "Right side of the homepage hero slider",
    size: "Recommended: 800 × 900"
  },
  {
    key: "promo-1",
    name: "Promotional Banner 1",
    location: "First promotional banner below the hero",
    size: "Recommended: 800 × 650"
  },
  {
    key: "promo-2",
    name: "Promotional Banner 2",
    location: "Second promotional banner",
    size: "Recommended: 800 × 650"
  },
  {
    key: "promo-3",
    name: "Promotional Banner 3",
    location: "Third promotional banner",
    size: "Recommended: 800 × 650"
  },
  {
    key: "campaign-main",
    name: "Wide Campaign Banner",
    location: "Middle homepage campaign section",
    size: "Recommended: 1600 × 500"
  }
];

const empty = () => ({
  imageUrl: "",
  linkUrl: "",
  altText: ""
});

export default function WebsiteMediaManager({ token }) {
  const [saved, setSaved] = useState({});
  const [draft, setDraft] = useState({});
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const slots = useMemo(() => {
    const names = new Set(categories);

    Object.keys(saved).forEach(key => {
      if (key.startsWith("category:")) {
        names.add(key.slice(9));
      }
    });

    return [
      ...FIXED_SLOTS,
      ...[...names].sort().map(name => ({
        key: `category:${name}`,
        name: `${name} Category`,
        location: "Circular homepage category image",
        size: "Recommended: 500 × 500"
      }))
    ];
  }, [categories, saved]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [mediaResponse, productResponse] =
          await Promise.all([
            fetch(`${API}/admin/website-media`, {
              headers: {
                Authorization: `Bearer ${token}`
              },
              cache: "no-store"
            }),
            fetch(`${API}/products?limit=48`, {
              cache: "no-store"
            })
          ]);

        const mediaResult =
          await mediaResponse.json().catch(() => ({}));

        if (!mediaResponse.ok) {
          throw new Error(
            mediaResult.message || "Unable to load media"
          );
        }

        const media = Object.fromEntries(
          (mediaResult.data || []).map(item => [
            item.key,
            {
              imageUrl: item.imageUrl || "",
              linkUrl: item.linkUrl || "",
              altText: item.altText || ""
            }
          ])
        );

        const productResult = productResponse.ok
          ? await productResponse.json()
          : {};

        const names = [
          ...new Set(
            (productResult.data || [])
              .map(product => product.category)
              .filter(Boolean)
          )
        ];

        if (!cancelled) {
          setSaved(media);
          setDraft(media);
          setCategories(names);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => { cancelled = true; };
  }, [token]);

  function update(key, field, value) {
    setDraft(previous => ({
      ...previous,
      [key]: {
        ...(previous[key] || empty()),
        [field]: value
      }
    }));
    setNotice("");
  }

  async function uploadImage(event, key) {
    const file = event.target.files?.[0];
    if (!file) return;

    setBusy(key);
    setError("");
    setNotice("");

    try {
      const result = await uploadProductImage(file, token);
      update(key, "imageUrl", result.url);
      setNotice("Image uploaded. Click Save to publish.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
      event.target.value = "";
    }
  }

  async function save(key) {
    const data = draft[key] || empty();

    if (!data.imageUrl) {
      setError("Upload an image before saving.");
      return;
    }

    setBusy(key);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `${API}/admin/website-media`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            key,
            ...data
          })
        }
      );

      const result =
        await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to save image"
        );
      }

      const next = {
        imageUrl: result.data.imageUrl || "",
        linkUrl: result.data.linkUrl || "",
        altText: result.data.altText || ""
      };

      setSaved(previous => ({
        ...previous,
        [key]: next
      }));

      setDraft(previous => ({
        ...previous,
        [key]: next
      }));

      setNotice(`${key} published successfully.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function remove(key) {
    if (!window.confirm(`Remove image from ${key}?`)) {
      return;
    }

    setBusy(key);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `${API}/admin/website-media?key=${
          encodeURIComponent(key)
        }`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const result =
        await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to remove image"
        );
      }

      setSaved(previous => {
        const next = { ...previous };
        delete next[key];
        return next;
      });

      setDraft(previous => ({
        ...previous,
        [key]: empty()
      }));

      setNotice(`${key} image removed.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="wm-manager">
      <div className="wm-intro">
        <h2>Website Media Manager</h2>
        <p>
          Upload images for specific homepage locations.
          Hero slider images remain under the Banners menu.
        </p>
      </div>

      {error && (
        <p className="wm-alert wm-error" role="alert">
          {error}
        </p>
      )}

      {notice && (
        <p className="wm-alert wm-success" role="status">
          {notice}
        </p>
      )}

      {loading ? (
        <p>Loading website images...</p>
      ) : (
        <div className="wm-grid">
          {slots.map(slot => {
            const value = draft[slot.key] || empty();
            const isBusy = !!busy;

            return (
              <article className="wm-card" key={slot.key}>
                <div className="wm-card-heading">
                  <div>
                    <h3>{slot.name}</h3>
                    <p>{slot.location}</p>
                    <small>{slot.size}</small>
                  </div>
                  <span>
                    {saved[slot.key]
                      ? "Published"
                      : "Empty"}
                  </span>
                </div>

                <div className="wm-preview">
                  {value.imageUrl ? (
                    <img
                      src={value.imageUrl}
                      alt={value.altText || slot.name}
                    />
                  ) : (
                    <div className="wm-placeholder">
                      <ImagePlus size={36}/>
                      <span>No image uploaded</span>
                    </div>
                  )}
                </div>

                <label className="wm-upload">
                  <ImagePlus size={17}/>
                  {busy === slot.key
                    ? "Processing..."
                    : "Upload / Replace Image"}

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={isBusy}
                    onChange={event =>
                      uploadImage(event, slot.key)
                    }
                    hidden
                  />
                </label>

                <label className="wm-field">
                  Image Link (Optional)
                  <input
                    type="text"
                    value={value.linkUrl}
                    placeholder="/#products"
                    onChange={event =>
                      update(
                        slot.key,
                        "linkUrl",
                        event.target.value
                      )
                    }
                    disabled={isBusy}
                  />
                </label>

                <label className="wm-field">
                  Image Description
                  <input
                    type="text"
                    maxLength={180}
                    value={value.altText}
                    placeholder="Describe this banner"
                    onChange={event =>
                      update(
                        slot.key,
                        "altText",
                        event.target.value
                      )
                    }
                    disabled={isBusy}
                  />
                </label>

                <div className="wm-actions">
                  <button
                    type="button"
                    className="wm-save"
                    disabled={isBusy || !value.imageUrl}
                    onClick={() => save(slot.key)}
                  >
                    <Save size={16}/>
                    Save & Publish
                  </button>

                  <button
                    type="button"
                    className="wm-remove"
                    disabled={isBusy || !saved[slot.key]}
                    onClick={() => remove(slot.key)}
                  >
                    <Trash2 size={16}/>
                    Remove
                  </button>
                </div>

                {saved[slot.key]?.imageUrl && (
                  <a
                    className="wm-view"
                    href={saved[slot.key].imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View published image
                    <ExternalLink size={14}/>
                  </a>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
