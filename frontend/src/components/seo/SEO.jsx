import { useEffect } from "react";
import {
  SITE_URL,
  DEFAULT_TITLE,
  DEFAULT_DESCRIPTION
} from "./seoUtils";

export default function SEO({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  path,
  image = "",
  type = "website",
  robots = "index, follow",
  schemas = []
}) {
  const schemaJson = JSON.stringify(
    schemas.filter(Boolean)
  );

  useEffect(() => {
    const previousTitle = document.title;
    const restore = [];

    const canonical = path
      ? `${SITE_URL}${path}`
      : "";

    document.title = title;

    function updateTag(tag, selector, attributes) {
      let element = document.head.querySelector(selector);

      if (element) {
        const previous = [...element.attributes].map(
          attribute => [attribute.name, attribute.value]
        );

        restore.push(() => {
          for (const attribute of [...element.attributes]) {
            element.removeAttribute(attribute.name);
          }

          for (const [key, value] of previous) {
            element.setAttribute(key, value);
          }
        });
      } else {
        element = document.createElement(tag);
        document.head.appendChild(element);
        restore.push(() => element.remove());
      }

      for (const [key, value] of Object.entries(attributes)) {
        element.setAttribute(key, value);
      }
    }

    function meta(key, value, property = "name") {
      updateTag(
        "meta",
        `meta[${property}="${key}"]`,
        { [property]: key, content: value }
      );
    }

    meta("description", description);
    meta("robots", robots);

    meta("og:title", title, "property");
    meta("og:description", description, "property");
    meta("og:type", type, "property");
    meta("og:site_name", "EverythingBD", "property");

    meta("twitter:title", title);
    meta("twitter:description", description);
    meta(
      "twitter:card",
      image ? "summary_large_image" : "summary"
    );

    if (canonical) {
      updateTag(
        "link",
        'link[rel="canonical"]',
        { rel: "canonical", href: canonical }
      );

      meta("og:url", canonical, "property");
    }

    if (image) {
      meta("og:image", image, "property");
      meta("twitter:image", image);
    }

    for (const schema of JSON.parse(schemaJson)) {
      const script = document.createElement("script");

      script.type = "application/ld+json";
      script.dataset.everythingbdSeo = "true";
      script.textContent = JSON.stringify(schema);

      document.head.appendChild(script);

      restore.push(() => script.remove());
    }

    return () => {
      document.title = previousTitle;
      restore.reverse().forEach(callback => callback());
    };
  }, [
    title,
    description,
    path,
    image,
    type,
    robots,
    schemaJson
  ]);

  return null;
}
