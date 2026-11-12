import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play
} from "lucide-react";
import "./heroBanners.css";

const API =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5001/api";

const SLIDE_TIME = 3000;

const fallbackBanner = {
  _id: "default",
  title: "EverythingBD Beauty Collection",
  desktopImage:
    "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=1600&q=85",
  mobileImage: "",
  buttonLink: "/#products"
};

export default function Hero() {
  const [banners, setBanners] = useState([fallbackBanner]);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [pageHidden, setPageHidden] = useState(false);

  const touchStartX = useRef(null);

  // Load active banners from the existing backend.
  useEffect(() => {
    const controller = new AbortController();

    async function loadBanners() {
      try {
        const response = await fetch(`${API}/banners`, {
          signal: controller.signal,
          cache: "no-store"
        });

        if (!response.ok) {
          throw new Error("Unable to load banners");
        }

        const result = await response.json();

        if (
          Array.isArray(result.data) &&
          result.data.length > 0
        ) {
          const valid = result.data.filter(
            item => item.desktopImage
          );

          if (valid.length > 0 && !controller.signal.aborted) {
            setBanners(valid);
            setActive(0);
          }
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.warn("Using fallback banner:", error.message);
        }
      }
    }

    loadBanners();

    return () => controller.abort();
  }, []);

  // Pause automatic transitions when browser tab is hidden.
  useEffect(() => {
    function onVisibilityChange() {
      setPageHidden(document.hidden);
    }

    document.addEventListener(
      "visibilitychange",
      onVisibilityChange
    );

    onVisibilityChange();

    return () => {
      document.removeEventListener(
        "visibilitychange",
        onVisibilityChange
      );
    };
  }, []);

  // Change banner automatically every 5 seconds.
  useEffect(() => {
    if (banners.length <= 1 || paused || hovered || pageHidden) {
      return;
    }

    const timer = window.setTimeout(() => {
      setActive(current => (current + 1) % banners.length);
    }, SLIDE_TIME);

    return () => window.clearTimeout(timer);
  }, [active, banners.length, paused, hovered, pageHidden]);

  function changeSlide(direction) {
    if (banners.length <= 1) return;

    setActive(current =>
      (current + direction + banners.length) % banners.length
    );
  }

  function goToSlide(index) {
    setActive(index);
  }

  function handleTouchStart(event) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event) {
    if (touchStartX.current === null) return;

    const endX = event.changedTouches[0]?.clientX;
    if (typeof endX !== "number") return;

    const difference = touchStartX.current - endX;

    if (Math.abs(difference) > 45) {
      changeSlide(difference > 0 ? 1 : -1);
    }

    touchStartX.current = null;
  }

  return (
    <section
      id="home"
      className="ebd-premium-slider"
      aria-label="EverythingBD promotional banners"
      aria-roledescription="carousel"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setHovered(false);
        }
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="ebd-premium-slider-track">
        {banners.map((banner, index) => {
          const isActive = index === active;

          const image = (
            <picture>
              {banner.mobileImage && (
                <source
                  media="(max-width: 640px)"
                  srcSet={banner.mobileImage}
                />
              )}

              <img
                src={banner.desktopImage}
                alt={
                  banner.title ||
                  `EverythingBD promotional banner ${index + 1}`
                }
                loading={index < 2 ? "eager" : "lazy"}
                fetchPriority={
                  index === 0 ? "high" : undefined
                }
                draggable="false"
              />
            </picture>
          );

          return (
            <div
              key={banner._id || index}
              className={
                "ebd-premium-slide " +
                (isActive ? "is-active" : "")
              }
              inert={isActive ? undefined : ""}
            >
              {banner.buttonLink ? (
                <a
                  href={banner.buttonLink}
                  className="ebd-premium-slide-link"
                  tabIndex={isActive ? 0 : -1}
                  aria-label={
                    `Explore ${banner.title || "EverythingBD collection"}`
                  }
                >
                  {image}
                </a>
              ) : (
                <div className="ebd-premium-slide-image">
                  {image}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
