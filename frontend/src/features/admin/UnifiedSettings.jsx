import { useState } from "react";
import { Globe, ChartNoAxesCombined } from "lucide-react";
import WebsiteSettings from "./WebsiteSettings";
import MetaMarketingSettings from "./MetaMarketingSettings";
import "./unifiedSettings.css";

export default function UnifiedSettings({ token }) {
  const [activeTab, setActiveTab] = useState("website");

  return (
    <div className="eb-unified-settings">
      <div className="eb-settings-tabs" role="tablist" aria-label="Settings sections">
        <button
          id="eb-website-tab"
          type="button"
          role="tab"
          aria-selected={activeTab === "website"}
          aria-controls="eb-website-panel"
          className={activeTab === "website" ? "active" : ""}
          onClick={() => setActiveTab("website")}
        >
          <Globe size={19} />
          Website Settings
        </button>

        <button
          id="eb-meta-tab"
          type="button"
          role="tab"
          aria-selected={activeTab === "meta"}
          aria-controls="eb-meta-panel"
          className={activeTab === "meta" ? "active" : ""}
          onClick={() => setActiveTab("meta")}
        >
          <ChartNoAxesCombined size={19} />
          Meta Marketing
        </button>
      </div>

      <div
        id="eb-website-panel"
        role="tabpanel"
        aria-labelledby="eb-website-tab"
        hidden={activeTab !== "website"}
      >
        {activeTab === "website" && <WebsiteSettings token={token} />}
      </div>

      <div
        id="eb-meta-panel"
        role="tabpanel"
        aria-labelledby="eb-meta-tab"
        hidden={activeTab !== "meta"}
      >
        {activeTab === "meta" && <MetaMarketingSettings token={token} />}
      </div>
    </div>
  );
}
