import { upload } from "@imagekit/javascript";

const API_URL =
  import.meta.env?.VITE_API_URL ||
  "http://localhost:5001/api";

export async function uploadProductImage(
  file,
  token,
  onProgress
) {
  if (!token) throw new Error("Admin login required");

  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Only JPG, PNG and WebP images are allowed");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Maximum image size is 5 MB");
  }

  const response = await fetch(
    `${API_URL}/admin/media/upload-auth`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      },
      cache: "no-store"
    }
  );

  const auth = await response.json();

  if (!response.ok) {
    throw new Error(
      auth.message || "Image upload authorization failed"
    );
  }

  const result = await upload({
    file,
    fileName: file.name.replace(/[^a-zA-Z0-9._-]/g, "_"),
    publicKey: auth.publicKey,
    signature: auth.signature,
    expire: auth.expire,
    token: auth.token,
    folder: "/everythingbd/products",
    useUniqueFileName: true,
    onProgress: (event) => {
      if (event.total > 0 && onProgress) {
        onProgress(
          Math.round((event.loaded / event.total) * 100)
        );
      }
    }
  });

  if (!result.url || !result.fileId) {
    throw new Error("Invalid ImageKit upload response");
  }

  return {
    url: result.url,
    publicId: result.fileId,
    alt: file.name
  };
}
