import { useState } from "react";
import {
  LockKeyhole,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import { adminApi } from "../../features/admin/adminApi";

export default function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await adminApi.login(email, password);
      const profile = await adminApi.me(result.token);

      if (!["admin", "manager"].includes(profile.user?.role)) {
        throw new Error("Dashboard access denied");
      }

      onLogin(result.token, profile.user, rememberMe);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-login-page">
      <div className="admin-login-panel">
        <div className="admin-login-logo">
          everything<span>bd</span>.
        </div>

        <div className="admin-login-icon">
          <LockKeyhole size={27} />
        </div>

        <p className="admin-eyebrow">ADMINISTRATION</p>
        <h1>Welcome <em>back.</em></h1>
        <p className="admin-login-subtitle">
          Sign in to manage your Multi-Vendor Store.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="admin-email">Email address</label>
          <div className="admin-input-wrap">
            <Mail size={19} />
            <input
              id="admin-email"
              type="email"
              placeholder="Enter admin email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <label htmlFor="admin-password">Password</label>
          <div className="admin-input-wrap">
            <LockKeyhole size={19} />
            <input
              id="admin-password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <label className="admin-remember-me">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={event => setRememberMe(event.target.checked)}
            />
            <span>Remember Me</span>
            <small>Keep me signed in</small>
          </label>

          {error && (
            <p className="admin-error" role="alert">{error}</p>
          )}

          <button
            type="submit"
            className="admin-submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in to Dashboard"}
            <ArrowRight size={18} />
          </button>
        </form>

        <p className="admin-secure-note">
          <ShieldCheck size={15} />
          Restricted to authorized staff
        </p>
      </div>
    </main>
  );
}
