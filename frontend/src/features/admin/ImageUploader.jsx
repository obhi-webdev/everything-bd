import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { uploadProductImage } from "./imageUpload";

export default function ImageUploader({
  token,
  urls,
  onChange,
  onUploadingChange = () => {}
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const images = urls.split("\n")
    .map(x => x.trim())
    .filter(Boolean);

  async function handleFiles(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    if (images.length + files.length > 12) {
      setError("Maximum 12 images allowed");
      event.target.value = "";
      return;
    }

    setUploading(true);
    onUploadingChange(true);
    setError("");
    setProgress(0);

    const completed = [...images];

    try {
      for (let i = 0; i < files.length; i++) {
        const result = await uploadProductImage(
          files[i],
          token,
          percent => setProgress(
            Math.round(((i + percent / 100) / files.length) * 100)
          )
        );

        completed.push(result.url);
        onChange(completed.join("\n"));
      }
      setProgress(100);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      onUploadingChange(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeImage(index) {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated.join("\n"));
  }

  return (
    <div className="eb-uploader">
      <label className="eb-upload-label">
        Product Images ({images.length}/12)
      </label>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        disabled={uploading || !token}
        onChange={handleFiles}
        className="eb-file-input"
      />

      <button
        type="button"
        className="eb-upload-button"
        disabled={uploading || !token || images.length >= 12}
        onClick={() => inputRef.current?.click()}
      >
        <ImagePlus size={20}/>
        {uploading ? "Uploading..." : "Choose Images"}
      </button>

      <p className="eb-upload-help">
        JPG, PNG, WebP · Max 5 MB per image · Up to 12 images
      </p>

      {uploading && (
        <div className="eb-progress">
          <div style={{ width: `${progress}%` }}/>
        </div>
      )}

      {uploading && <p>{progress}% uploaded</p>}
      {error && <p className="pm-error" role="alert">{error}</p>}

      <div className="eb-image-grid">
        {images.map((url, index) => (
          <div className="eb-image-item" key={`${url}-${index}`}>
            <img src={url} alt={`Product image ${index + 1}`}/>
            <button
              type="button"
              aria-label={`Remove image ${index + 1}`}
              disabled={uploading}
              onClick={() => removeImage(index)}
            >
              <X size={15}/>
            </button>
            {index === 0 && <span>Main</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
