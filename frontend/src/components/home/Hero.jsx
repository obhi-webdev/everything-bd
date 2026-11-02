import { useEffect, useState } from "react";
import {
  ArrowRight, ChevronLeft, ChevronRight, Sparkles
} from "lucide-react";
import "./heroBanners.css";

const API = import.meta.env.VITE_API_URL ||
  "http://localhost:5001/api";

const defaultBanner = {
  _id: "default",
  eyebrow: "THE BEAUTY EDIT",
  title: "The secret to your everyday glow.",
  subtitle: "Discover premium skincare essentials, thoughtful beauty finds and everything your skin deserves.",
  buttonText: "Shop Collection",
  buttonLink: "/#products",
  desktopImage:
    "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=1200&q=85",
  mobileImage: ""
};

export default function Hero() {
  const [banners, setBanners] = useState([defaultBanner]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API}/banners`, { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error("Banner unavailable");
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
    if (banners.length < 2) return;

    const timer = window.setInterval(() => {
      setActive(index => (index + 1) % banners.length);
    }, 6000);

    return () => window.clearInterval(timer);
  }, [banners.length]);

  const banner = banners[active] || defaultBanner;

  function changeSlide(step) {
    setActive(index =>
      (index + step + banners.length) % banners.length
    );
  }

  return (
    <section id="home" className="ebd-prime-hero">
      <div className="ebd-prime-hero-copy" key={banner._id}>
        {banner.eyebrow && (
          <div className="ebd-prime-eyebrow">
            <Sparkles size={15}/>
            {banner.eyebrow}
          </div>
        )}

        <h1>{banner.title || "Everything beautiful starts here."}</h1>

        {banner.subtitle && <p>{banner.subtitle}</p>}

        <div className="ebd-prime-hero-highlights">
          <span>PREMIUM BEAUTY</span>
          <span className="ebd-prime-highlight-star">★★★★★</span>
        </div>

        {banner.buttonLink && (
          <a href={banner.buttonLink} className="ebd-prime-hero-btn">
            {banner.buttonText || "Shop Now"}
            <ArrowRight size={19}/>
          </a>
        )}

        <small>Thoughtfully selected for your beauty routine.</small>
      </div>

      <div className="ebd-prime-hero-image">
        <picture key={`${banner._id}-picture`}>
          {banner.mobileImage && (
            <source media="(max-width: 640px)"
                    srcSet={banner.mobileImage}/>
          )}
          <img
            src={banner.desktopImage}
            alt={banner.title || "EverythingBD skincare"}
            fetchPriority={active === 0 ? "high" : undefined}
          />
        </picture>

        <span className="ebd-prime-hero-image-label">
          THE BEAUTY COLLECTION
        </span>
      </div>

      {banners.length > 1 && (
        <div className="ebd-prime-slider-controls">
          <button type="button" aria-label="Previous banner"
                  onClick={() => changeSlide(-1)}>
            <ChevronLeft size={20}/>
          </button>

          <div className="ebd-prime-slider-dots">
            {banners.map((item, index) => (
              <button
                type="button"
                key={item._id}
                className={index === active ? "active" : ""}
                aria-label={`Show banner ${index + 1}`}
                aria-current={index === active ? "true" : undefined}
                onClick={() => setActive(index)}
              />
            ))}
          </div>

          <button type="button" aria-label="Next banner"
                  onClick={() => changeSlide(1)}>
            <ChevronRight size={20}/>
          </button>
        </div>
      )}
    </section>
  );
}
