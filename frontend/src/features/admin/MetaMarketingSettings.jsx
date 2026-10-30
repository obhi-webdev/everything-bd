import { useCallback, useEffect, useState } from "react";
import { Save, RefreshCw, ShieldCheck } from "lucide-react";

const API =
  import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const empty = {
  pixelId: "",
  capiToken: "",
  testEventCode: "",
  enabled: false,
  testMode: false,
  hasCapiToken: false
};

export default function MetaMarketingSettings({ token }) {
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const change = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const load = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API}/marketing`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
        signal
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load settings");
      }

      setForm({
        ...empty,
        ...result.data,
        capiToken: ""
      });
    } catch (err) {
      if (err.name !== "AbortError") setError(err.message);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(`${API}/marketing`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          pixelId: form.pixelId.trim(),
          capiToken: form.capiToken.trim(),
          testEventCode: form.testEventCode.trim(),
          enabled: form.enabled,
          testMode: form.testMode
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Save failed");
      }

      setForm(prev => ({
        ...prev,
        ...result.data,
        capiToken: ""
      }));
      setNotice("Meta Marketing Settings saved successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="ebd-meta-settings">
      <div className="ebd-meta-heading">
        <div>
          <h2>Meta Marketing Settings</h2>
          <p>Manage Pixel, Conversions API and Test Events.</p>
        </div>
        <button type="button" onClick={() => load()}
          disabled={loading || saving}>
          <RefreshCw size={16}/> Refresh
        </button>
      </div>

      {error && <p className="pm-error" role="alert">{error}</p>}
      {notice && <p className="pm-success" role="status">{notice}</p>}

      {loading && <p>Loading settings...</p>}

      {!loading && (
        <form onSubmit={save} className="ebd-meta-form">
          <label>
            Meta Pixel ID
            <input
              inputMode="numeric"
              placeholder="Enter Meta Pixel ID"
              value={form.pixelId}
              onChange={e => change("pixelId", e.target.value)}
              pattern="[0-9]{8,25}"
            />
          </label>

          <label>
            Conversions API Access Token
            <input
              type="password"
              autoComplete="new-password"
              placeholder={
                form.hasCapiToken
                  ? "Token saved. Enter a new one to replace."
                  : "Enter CAPI Access Token"
              }
              value={form.capiToken}
              onChange={e => change("capiToken", e.target.value)}
            />
            <small>
              <ShieldCheck size={14}/>
              {form.hasCapiToken
                ? "A token is securely stored."
                : "No CAPI token saved yet."}
              {" "}The saved token is never displayed.
            </small>
          </label>

          <label>
            Test Event Code
            <input
              placeholder="e.g. TEST12345"
              value={form.testEventCode}
              onChange={e => change("testEventCode", e.target.value)}
            />
            <small>
              Find this code in Meta Events Manager → Test Events.
            </small>
          </label>

          <label className="ebd-meta-switch">
            <span>
              <strong>Enable Meta Tracking</strong>
              <small>Allow tracking when integration is active</small>
            </span>
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={e => change("enabled", e.target.checked)}
            />
          </label>

          <label className="ebd-meta-switch">
            <span>
              <strong>Enable Test Mode</strong>
              <small>
                Send configured server test events with test_event_code
              </small>
            </span>
            <input
              type="checkbox"
              checked={form.testMode}
              onChange={e => change("testMode", e.target.checked)}
            />
          </label>

          <div className="ebd-meta-notice">
            Settings alone do not activate event tracking.
            Browser Pixel and server-side CAPI events must also
            be connected before use.
          </div>

          <button
            className="ebd-meta-save"
            type="submit"
            disabled={saving}
          >
            <Save size={18}/>
            {saving ? "Saving..." : "Save Marketing Settings"}
          </button>
        </form>
      )}
    </section>
  );
}
