import { useId } from "react";
import { Search, Sparkles, RotateCcw, AlertCircle } from "lucide-react";
import {
  SITE_URL,
  productTitle,
  productDescription
} from "../../components/seo/seoUtils";
import "./productSeoEditor.css";

const count = value => Array.from(value || "").length;

const normalize = value =>
  String(value || "")
    .normalize("NFC")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

function Meter({ value, target }) {
  const length = count(value);

  return (
    <div className="ebd-seo-meter">
      <div
        className={
          "ebd-seo-meter-fill" +
          (length > target ? " is-warning" : "")
        }
        style={{
          width: `${Math.min(100, length / target * 100)}%`
        }}
      />
    </div>
  );
}

export default function ProductSeoEditor({
  form,
  change,
  products = [],
  editingId,
  disabled = false
}) {
  const id = useId();

  const product = {
    name: form.name,
    slug: form.slug,
    brand: form.brand,
    category: form.category,
    description: form.description,
    seo: {
      title: form.seoTitle,
      description: form.seoDescription
    }
  };

  const automatic = {
    ...product,
    seo: { title: "", description: "" }
  };

  const autoTitle = productTitle(automatic);
  const autoDescription = productDescription(automatic);

  const title = productTitle(product);
  const description = productDescription(product);

  const manualTitle = Boolean(form.seoTitle.trim());
  const manualDescription = Boolean(form.seoDescription.trim());
  const manual = manualTitle || manualDescription;

  const hasName = Boolean(form.name.trim());

  const others = products.filter(item =>
    item._id !== editingId &&
    item.status === "active"
  );

  const duplicateTitle = hasName && others.some(item =>
    normalize(productTitle(item)) === normalize(title)
  );

  const duplicateDescription = hasName && others.some(item =>
    normalize(productDescription(item)) === normalize(description)
  );

  const warnings = [];

  if (!hasName) {
    warnings.push("Enter a product name to generate meaningful SEO.");
  }

  if (!form.slug.trim()) {
    warnings.push("A product slug is required for its search URL.");
  }

  if (count(title) > 65) {
    warnings.push("Title exceeds the recommended 65-character target.");
  }

  if (count(description) < 70) {
    warnings.push("Consider adding more useful product information.");
  }

  if (count(form.seoDescription) > 160) {
    warnings.push("Custom description exceeds 160 characters and may be shortened.");
  }

  if (description.endsWith("…") || description.endsWith("...")) {
    warnings.push("Description is shortened. Consider writing a complete summary.");
  }

  if (!form.description.trim()) {
    warnings.push("Product description is missing. Automatic SEO fallback is being used.");
  }

  if (duplicateTitle) {
    warnings.push("Another loaded active product has the same SEO title.");
  }

  if (duplicateDescription) {
    warnings.push("Another loaded active product has the same meta description.");
  }

  if (form.status !== "active") {
    warnings.push("This product is not active. Search preview does not guarantee public availability.");
  }

  function useAutomaticDraft() {
    if (!hasName || disabled) return;

    if (
      manual &&
      !window.confirm("Replace current custom SEO with generated suggestions?")
    ) return;

    change("seoTitle", autoTitle);
    change("seoDescription", autoDescription);
  }

  function resetAutomatic() {
    if (disabled) return;

    if (
      manual &&
      !window.confirm("Clear custom SEO and use automatic SEO?")
    ) return;

    change("seoTitle", "");
    change("seoDescription", "");
  }

  return (
    <section
      className="ebd-seo-editor"
      aria-labelledby={`${id}-heading`}
    >
      <header className="ebd-seo-header">
        <div className="ebd-seo-header-main">
          <div className="ebd-seo-icon">
            <Search size={21} aria-hidden="true"/>
          </div>
          <div>
            <h4 id={`${id}-heading`}>
              Search Engine Optimization
            </h4>
            <p>Manage product metadata and search appearance.</p>
          </div>
        </div>

        <span className="ebd-seo-mode">
          {manual ? "Custom SEO" : "Automatic SEO"}
        </span>
      </header>

      <div className="ebd-seo-fields">
        <div className="ebd-seo-field">
          <div className="ebd-seo-label-row">
            <label htmlFor={`${id}-title`}>
              SEO Title
            </label>
            <span>{count(title)} / 65</span>
          </div>

          <input
            id={`${id}-title`}
            value={form.seoTitle}
            placeholder={hasName ? autoTitle : "Enter product name first"}
            disabled={disabled}
            onChange={event =>
              change("seoTitle", event.target.value)
            }
          />

          <Meter value={title} target={65}/>

          <small>
            {manualTitle
              ? "Custom title override"
              : "Automatically generated from product information"}
          </small>
        </div>

        <div className="ebd-seo-field">
          <div className="ebd-seo-label-row">
            <label htmlFor={`${id}-description`}>
              Meta Description
            </label>
            <span>{count(description)} / 160</span>
          </div>

          <textarea
            id={`${id}-description`}
            rows={4}
            value={form.seoDescription}
            placeholder={
              hasName
                ? autoDescription
                : "Add product information first"
            }
            disabled={disabled}
            onChange={event =>
              change("seoDescription", event.target.value)
            }
          />

          <Meter value={description} target={160}/>

          <small>
            {manualDescription
              ? "Custom description override"
              : "Automatically generated from product information"}
          </small>
        </div>
      </div>

      <div className="ebd-seo-actions">
        <button
          type="button"
          className="ebd-seo-generate"
          disabled={disabled || !hasName}
          onClick={useAutomaticDraft}
        >
          <Sparkles size={16}/>
          Use Generated SEO
        </button>

        <button
          type="button"
          disabled={disabled || !manual}
          onClick={resetAutomatic}
        >
          <RotateCcw size={16}/>
          Reset to Automatic
        </button>
      </div>

      <div className="ebd-seo-preview">
        <h5>Google Search Preview</h5>

        <div className="ebd-seo-result">
          <div className="ebd-seo-result-site">
            <span className="ebd-seo-site-icon">E</span>
            <div>
              <strong>EverythingBD</strong>
              <small>
                {SITE_URL}/product/{
                  encodeURIComponent(form.slug || "product-slug")
                }
              </small>
            </div>
          </div>

          <div className="ebd-seo-result-title">
            {hasName ? title : "Product SEO Title"}
          </div>

          <p>
            {hasName
              ? description
              : "Your product meta description will appear here."}
          </p>
        </div>

        <small>
          Illustrative preview. Google may rewrite titles and snippets.
        </small>
      </div>

      {warnings.length > 0 ? (
        <div className="ebd-seo-warnings" role="status">
          <strong>
            <AlertCircle size={16}/>
            SEO Recommendations
          </strong>
          <ul>
            {warnings.map(warning => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="ebd-seo-good" role="status">
          No issues detected by current SEO checks.
        </div>
      )}

      <p className="ebd-seo-footer">
        Changes are saved only when you save the product.
        Duplicate checks cover loaded active products only.
        Leave custom fields empty to keep SEO automatic.
      </p>
    </section>
  );
}
