// Preserve image metadata independently of URL ordering.

export function readImageMetadata(images = []) {
  return images
    .filter(image =>
      typeof image?.url === "string" &&
      image.url.trim()
    )
    .map(image => ({
      url: image.url.trim(),
      alt: typeof image.alt === "string"
        ? image.alt : "",
      publicId: typeof image.publicId === "string"
        ? image.publicId : ""
    }));
}

export function mergeImageMetadata(
  existing = [],
  uploaded = []
) {
  const metadata = new Map(
    readImageMetadata(existing).map(
      image => [image.url, image]
    )
  );

  for (const image of readImageMetadata(uploaded)) {
    const previous = metadata.get(image.url);

    metadata.set(image.url, {
      url: image.url,
      alt: previous?.alt ?? image.alt,
      publicId: image.publicId ||
        previous?.publicId || ""
    });
  }

  return [...metadata.values()];
}

export function buildProductImages(
  urls = "",
  metadata = [],
  productName = ""
) {
  const byUrl = new Map(
    readImageMetadata(metadata).map(
      image => [image.url, image]
    )
  );

  return String(urls)
    .split("\n")
    .map(url => url.trim())
    .filter(Boolean)
    .map(url => {
      const existing = byUrl.get(url);

      return {
        url,
        alt: existing
          ? existing.alt
          : String(productName).trim().slice(0, 200),
        publicId: existing?.publicId || ""
      };
    });
}
