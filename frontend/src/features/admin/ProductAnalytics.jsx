import { useEffect, useState } from "react";
import {
  RefreshCw,
  Package,
  Eye,
  ShoppingBag,
  Wallet
} from "lucide-react";
import "./productAnalytics.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5001/api";

const money = value =>
  "৳" + Number(value || 0).toLocaleString("en-BD");

const periods = [
  { value: 1, label: "Today" },
  { value: 7, label: "Last 7 days" },
  { value: 30, label: "Last 30 days" },
  { value: 90, label: "Last 90 days" }
];

function RevenueChart({ daily = [] }) {
  const width = 640;
  const height = 220;
  const left = 70;
  const right = 16;
  const top = 18;
  const bottom = 32;

  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;

  const max = Math.max(
    1,
    ...daily.map(day => Number(day.orderValue || 0))
  );

  const points = daily.map((day, index) => ({
    x: left + (
      daily.length === 1
        ? chartWidth / 2
        : index / Math.max(1, daily.length - 1) * chartWidth
    ),
    y: top + chartHeight -
      Number(day.orderValue || 0) / max * chartHeight,
    ...day
  }));

  const line = points.map(
    (point, index) =>
      `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
  ).join(" ");

  const baseline = top + chartHeight;

  const area = points.length > 1
    ? `${line} L ${points.at(-1).x} ${baseline}
       L ${points[0].x} ${baseline} Z`
    : "";

  const labels = points.filter((point, index) =>
    index === 0 ||
    index === points.length - 1 ||
    index % Math.ceil(points.length / 5) === 0
  );

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="ebd-pa-chart"
      role="img"
      aria-label="Daily order value in Bangladeshi taka"
    >
      {[0, 1, 2, 3, 4].map(index => {
        const y = top + index / 4 * chartHeight;
        const value = max * (1 - index / 4);

        return (
          <g key={index}>
            <line
              x1={left}
              x2={width - right}
              y1={y}
              y2={y}
              stroke="#e5ece7"
              strokeDasharray="4 5"
            />
            <text
              x={left - 10}
              y={y + 4}
              textAnchor="end"
              fontSize="11"
              fill="#74847d"
            >
              {money(Math.round(value))}
            </text>
          </g>
        );
      })}

      {area && (
        <path d={area} fill="#e5f3ed"/>
      )}

      <path
        d={line}
        fill="none"
        stroke="#117c75"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {points.map(point => (
        <circle
          key={point.date}
          cx={point.x}
          cy={point.y}
          r={points.length > 30 ? 2 : 3.5}
          fill="#117c75"
        >
          <title>
            {point.date}: {money(point.orderValue)}
          </title>
        </circle>
      ))}

      {labels.map(point => (
        <text
          key={point.date}
          x={point.x}
          y={height - 8}
          fontSize="11"
          fill="#74847d"
          textAnchor="middle"
        >
          {point.date.slice(5)}
        </text>
      ))}
    </svg>
  );
}

function ProductThumbnail({ product }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="ebd-pa-thumbnail">
      {product.image && !failed ? (
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <Package size={22}/>
      )}
    </div>
  );
}

export default function ProductAnalytics({ token }) {
  const [days, setDays] = useState(7);
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState(null);

  const requestKey = `${days}:${revision}`;

  const current =
    result?.key === requestKey &&
    result?.token === token
      ? result
      : null;

  const loading = !current;
  const data = current?.data;
  const error = current?.error;

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const response = await fetch(
          `${API_URL}/analytics/products?days=${days}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            },
            signal: controller.signal,
            cache: "no-store"
          }
        );

        const payload = await response.json();

        if (!response.ok || !payload.success) {
          throw new Error(
            payload.message || "Analytics unavailable"
          );
        }

        if (!controller.signal.aborted) {
          setResult({
            key: requestKey,
            token,
            data: payload.data
          });
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setResult({
            key: requestKey,
            token,
            error: err.message
          });
        }
      }
    }

    load();

    return () => controller.abort();
  }, [days, revision, token, requestKey]);

  const stats = [
    {
      title: "Product Views",
      value: data?.totalProductViews,
      icon: Eye
    },
    {
      title: "Total Orders",
      value: data?.totalOrders,
      icon: ShoppingBag
    },
    {
      title: "Paid Order Value",
      value: data ? money(data.paidOrderValue) : null,
      icon: Wallet
    }
  ];

  return (
    <section className="ebd-pa">

      <div className="ebd-pa-header">
        <div>
          <span className="ebd-pa-eyebrow">
            STORE PERFORMANCE
          </span>
          <h2>Analytics</h2>
          <p>Understand your store performance.</p>
        </div>

        <div className="ebd-pa-controls">
          <select
            value={days}
            aria-label="Analytics period"
            onChange={event =>
              setDays(Number(event.target.value))
            }
          >
            {periods.map(period => (
              <option
                key={period.value}
                value={period.value}
              >
                {period.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            aria-label="Refresh analytics"
            disabled={loading}
            onClick={() => setRevision(value => value + 1)}
          >
            <RefreshCw size={17}/>
          </button>
        </div>
      </div>

      {loading && (
        <div className="ebd-pa-message" role="status">
          Loading analytics...
        </div>
      )}

      {error && (
        <div className="ebd-pa-message ebd-pa-error"
          role="alert">
          {error}
        </div>
      )}

      {data && (
        <>
          <div className="ebd-pa-stats">
            {stats.map(item => {
              const Icon = item.icon;

              return (
                <article
                  className="ebd-pa-stat"
                  key={item.title}
                >
                  <Icon size={20}/>
                  <span>{item.title}</span>
                  <strong>
                    {typeof item.value === "number"
                      ? item.value.toLocaleString("en-BD")
                      : item.value ?? "—"}
                  </strong>
                </article>
              );
            })}
          </div>

          <div className="ebd-pa-card">
            <div className="ebd-pa-revenue-heading">
              <div>
                <h3>Order Value</h3>
                <p>
                  {data.totalOrders} orders in this period
                </p>
              </div>

              <strong>
                {money(data.totalOrderValue)}
              </strong>
            </div>

            <RevenueChart
              daily={data.dailyRevenue || []}
            />

            <p className="ebd-pa-note">
              Includes delivery and discounts.
              Excludes cancelled, returned and archived
              orders. Not actual cash collected.
            </p>
          </div>

          <div className="ebd-pa-card">
            <div className="ebd-pa-list-heading">
              <div>
                <h3>Top products</h3>
                <p>Ranked by views</p>
              </div>

              <span>Orders / views</span>
            </div>

            {!data.topProducts?.length ? (
              <div className="ebd-pa-message">
                No tracked product views in this period.
              </div>
            ) : (
              <div className="ebd-pa-list">
                {data.topProducts.map(product => (
                  <article
                    className="ebd-pa-product"
                    key={product.productId}
                  >
                    <span
                      className={
                        "ebd-pa-rank" +
                        (product.rank <= 3
                          ? " ebd-pa-rank-top"
                          : "")
                      }
                    >
                      {product.rank}
                    </span>

                    <ProductThumbnail
                      key={product.image}
                      product={product}
                    />

                    <div className="ebd-pa-product-info">
                      <a
                        href={`/product/${product.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {product.name}
                      </a>

                      <small>
                        {product.views} views
                        {" · "}
                        {product.orders} orders
                      </small>
                    </div>

                    <strong
                      className={
                        "ebd-pa-conversion" +
                        (product.conversionRate > 0
                          ? " ebd-pa-positive"
                          : "")
                      }
                    >
                      {product.conversionRate == null
                        ? "—"
                        : `${Number(
                            product.conversionRate
                          ).toFixed(2)}%`}
                    </strong>
                  </article>
                ))}
              </div>
            )}

            <p className="ebd-pa-note">
              Orders divided by recorded product views.
              This is not session-based conversion.
            </p>

            {data.unmatchedProductViews > 0 && (
              <p className="ebd-pa-note">
                {data.unmatchedProductViews} recorded
                views could not be matched to current
                product slugs.
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
