import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from "lucide-react";
import "./heroBanners.css";

const API =
  import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const fallback = {
  _id: "default",
  eyebrow: "THE BEAUTY EDIT",
  title: "Your skin deserves a little extra love.",
  subtitle:
    "Discover thoughtfully selected skincare essentials for your everyday glow. Your self-care ritual begins here.",
  buttonText: "Explore Collection",
  buttonLink: "/#products",
  desktopImage:
    "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=1100&q=85",
  mobileImage: ""
};

export default function Hero() {
  const [banners, setBanners] = useState([fallback]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API}/banners`, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error("Banner API unavailable");
        return response.json();
      })
      .then(result => {
        if (Array.isArray(result.data) && result.data.length) {
          setBanners(result.data);
          setActive(0);
        }
      })
      .catch(() => {});

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (banners.length < 2) return undefined;

    const timer = setInterval(() => {
      setActive(index => (index + 1) % banners.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [banners.length]);

  const banner = banners[active] || banners[0] || fallback;

  function move(direction) {
    setActive(index =>
      (index + direction + banners.length) % banners.length
    );
  }

  return (
    <section id="home" className="hero eb-dynamic-hero">
      <div className="container hero-grid">
        <div className="hero-content" key={`${banner._id}-text`}>
          {banner.eyebrow && (
            <div className="eyebrow">
              <Sparkles size={15}/>
              {banner.eyebrow}
            </div>
          )}

          {banner.title && <h1>{banner.title}</h1>}
          {banner.subtitle && <p>{banner.subtitle}</p>}

          {banner.buttonText && banner.buttonLink && (
            <a href={banner.buttonLink} className="primary-btn">
              {banner.buttonText} <ArrowUpRight size={18}/>
            </a>
          )}

          <div className="hero-note">
            <span>✦</span> A little care, a lot of glow.
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-blob"/>
          <picture key={`${banner._id}-image`}>
            {banner.mobileImage && (
              <source
                media="(max-width: 640px)"
                srcSet={banner.mobileImage}
              />
            )}
            <img
              src={banner.desktopImage}
              alt={banner.title || "EverythingBD Skincare"}
              fetchPriority={active === 0 ? "high" : undefined}
            />
          </picture>

          {banner._id === "default" && (
            <div className="hero-sticker">
              <span>GLOW</span>
              <strong>EVERY</strong>
              <span>DAY ✳</span>
            </div>
          )}
        </div>
      </div>

      {banners.length > 1 && (
        <div className="eb-hero-controls">
          <button
            type="button"
            aria-label="Previous banner"
            onClick={() => move(-1)}
          >
            <ChevronLeft size={19}/>
          </button>

          <div className="eb-hero-dots">
            {banners.map((item, index) => (
              <button
                type="button"
                key={item._id}
                onClick={() => setActive(index)}
                aria-label={`Show banner ${index + 1}`}
                aria-current={index === active ? "true" : undefined}
                className={index === active ? "active" : ""}
              />
            ))}
          </div>

          <button
            type="button"
            aria-label="Next banner"
            onClick={() => move(1)}
          >
            <ChevronRight size={19}/>
          </button>
        </div>
      )}
    </section>
  );
}
