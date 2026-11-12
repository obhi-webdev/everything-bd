import { useEffect, useState } from "react";
import {
  Eye,
  Users,
  PackageSearch,
  Activity
} from "lucide-react";
import "./trafficAnalytics.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5001/api";

export default function TrafficAnalytics({
  token,
  days: externalDays
}) {
  const [localDays, setLocalDays] = useState(7);
  const days = externalDays ?? localDays;

  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError("");
    setData(null);

    fetch(
      `${API_URL}/analytics/summary?days=${days}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        signal: controller.signal
      }
    )
      .then(async response => {
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Traffic unavailable"
          );
        }

        setData(result.data);
      })
      .catch(err => {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [token, days]);

  const cards = [
    {
      title: "Page Views",
      value: data?.pageViews,
      icon: Eye
    },
    {
      title: "Unique Visitors",
      value: data?.uniqueVisitors,
      icon: Users
    },
    {
      title: "Product Views",
      value: data?.productViews,
      icon: PackageSearch
    }
  ];

  const daily = data?.dailyViews || [];
  const max = Math.max(
    1,
    ...daily.map(day => day.views)
  );

  return (
    <div className="ebd-traffic-analytics">
      <div className="ebd-traffic-heading">
        <div>
          <span>STORE TRAFFIC</span>
          <h2>Website Visitors</h2>
          <p>
            Actual page views recorded by EverythingBD.
          </p>
        </div>
        <Activity size={25}/>
      </div>

      {externalDays == null && (
        <div className="ebd-traffic-tabs">
          {[7, 30, 90].map(value => (
            <button
              key={value}
              type="button"
              className={
                days === value ? "active" : ""
              }
              onClick={() => setLocalDays(value)}
            >
              {value} days
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="ebd-traffic-error" role="alert">
          {error}
        </p>
      )}

      <div className="ebd-traffic-cards">
        {cards.map(card => {
          const Icon = card.icon;

          return (
            <div
              className="ebd-traffic-card"
              key={card.title}
            >
              <div className="ebd-traffic-icon">
                <Icon size={20}/>
              </div>
              <strong>
                {loading || !data
                  ? "—"
                  : Number(card.value).toLocaleString()}
              </strong>
              <span>{card.title}</span>
            </div>
          );
        })}
      </div>

      <div className="ebd-traffic-chart">
        <h3>Daily Page Views</h3>

        {loading ? (
          <p>Loading traffic...</p>
        ) : !data ? (
          <p>Traffic data unavailable.</p>
        ) : daily.length === 0 ? (
          <p>No tracked views in this period yet.</p>
        ) : (
          <div
            className="ebd-traffic-bars"
            role="img"
            aria-label="Page views grouped by day"
          >
            {daily.map(day => (
              <div
                className="ebd-traffic-bar-cell"
                key={day.date}
                title={`${day.date}: ${day.views} views`}
              >
                <div className="ebd-traffic-bar-space">
                  <div
                    className="ebd-traffic-bar"
                    style={{
                      height: `${
                        (day.views / max) * 100
                      }%`
                    }}
                  />
                </div>
                <small>{day.date.slice(5)}</small>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="ebd-traffic-disclaimer">
        Visitors represent browser sessions, not verified
        individual people. Tracking begins after deployment;
        earlier website traffic cannot be recovered from
        this new database.
      </p>
    </div>
  );
}
