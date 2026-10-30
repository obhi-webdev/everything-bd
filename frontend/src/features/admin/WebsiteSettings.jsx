import { useEffect, useState } from "react";
import { ImagePlus, Save, Trash2 } from "lucide-react";
import { uploadProductImage } from "./imageUpload";
import "./websiteSettings.css";

const API =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5001/api";

export default function WebsiteSettings({ token }) {
  const [favicon, setFavicon] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetch(`${API}/site-settings`, {
      cache: "no-store"
    })
      .then(async response => {
        if (!response.ok) {
          throw new Error("Unable to load settings");
        }
        return response.json();
      })
      .then(result => {
        if (!cancelled) {
          setFavicon(result.data?.faviconUrl || "");
        }
      })
      .catch(err => {
        if (!cancelled) setError(err.message);
      });

    return () => { cancelled = true; };
  }, []);

  async function uploadFavicon(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setMessage("");

    if (file.type !== "image/png") {
      setError("Please select a PNG image");
      event.target.value = "";
      return;
    }

    setUploading(true);

    try {
      const result = await uploadProductImage(file, token);
      setFavicon(result.url);
      setMessage("Uploaded. Click Save Favicon to publish.");
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function saveFavicon(url = favicon) {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API}/admin/site-settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ faviconUrl: url })
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message || "Unable to save favicon");
      }

      setFavicon(result.data.faviconUrl);
      window.dispatchEvent(new Event("everythingbd:settings-updated"));
      setMessage(url ? "Favicon saved successfully!" : "Favicon removed!");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="website-settings">
      <div className="website-settings-card">
        <div className="website-settings-heading">
          <ImagePlus size={24}/>
          <div>
            <h2>Website Favicon</h2>
            <p>Manage the icon displayed in your browser tab.</p>
          </div>
        </div>

        <div className="website-favicon-area">
          <div className="website-favicon-preview">
            {favicon ? (
              <img src={favicon} alt="Favicon preview"/>
            ) : (
              <ImagePlus size={36}/>
            )}
          </div>

          <div className="website-favicon-details">
            <strong>Upload Your Favicon</strong>
            <p>
              Recommended size: 512 × 512 pixels.
              PNG format, square image, maximum 5 MB.
            </p>

            <label className="website-upload-button">
              <ImagePlus size={17}/>
              {uploading ? "Uploading..." : "Choose PNG File"}
              <input
                type="file"
                accept="image/png"
                onChange={uploadFavicon}
                disabled={uploading || saving}
                hidden
              />
            </label>
          </div>
        </div>

        {error && <p className="website-settings-error" role="alert">{error}</p>}
        {message && <p className="website-settings-success" role="status">{message}</p>}

        <div className="website-settings-actions">
          <button
            type="button"
            className="website-save-button"
            disabled={uploading || saving || !favicon}
            onClick={() => saveFavicon()}
          >
            <Save size={17}/>
            {saving ? "Saving..." : "Save Favicon"}
          </button>

          <button
            type="button"
            className="website-remove-button"
            disabled={uploading || saving || !favicon}
            onClick={() => saveFavicon("")}
          >
            <Trash2 size={17}/>
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
