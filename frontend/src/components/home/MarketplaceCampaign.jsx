import { ArrowRight } from "lucide-react";

export default function MarketplaceCampaign({ media = {} }) {
  const campaign = media["campaign-main"];

  if (campaign?.imageUrl) {
    return (
      <a
        className="em-managed-campaign container"
        href={campaign.linkUrl || "/shop"}
      >
        <img
          src={campaign.imageUrl}
          alt={campaign.altText || "EverythingBD campaign"}
        />
      </a>
    );
  }

  return (
    <div className="em-shop-campaign container">
      <div>
        <span>EVERYTHINGBD COLLECTION</span>
        <h2>Discover More. Love Every Find.</h2>
        <p>
          Explore beauty and everyday essentials in one place.
        </p>
        <a href="/shop">
          Explore Collection <ArrowRight size={16}/>
        </a>
      </div>
      <div
        className="em-campaign-decoration"
        aria-hidden="true"
      >
        ✦
      </div>
    </div>
  );
}
