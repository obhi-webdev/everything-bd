import { ArrowUpRight, Sparkles } from "lucide-react";

export default function Hero() {
  return (
    <section id="home" className="hero">
      <div className="container hero-grid">
        <div className="hero-content">
          <div className="eyebrow">
            <Sparkles size={15} />
            THE BEAUTY EDIT
          </div>
          <h1>
            Your skin deserves
            <br />
            a little <em>extra love.</em>
          </h1>
          <p>
            Discover thoughtfully selected skincare essentials
            for your everyday glow. Your self-care ritual begins here.
          </p>
          <a href="#products" className="primary-btn">
            Explore Collection <ArrowUpRight size={18}/>
          </a>
          <div className="hero-note">
            <span>✦</span> A little care, a lot of glow.
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-blob"></div>
          <img
            src="https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=1100&q=85"
            alt="Premium skincare collection"
            onError={(e) => {e.currentTarget.style.opacity = "0"}}
          />
          <div className="hero-sticker">
            <span>GLOW</span>
            <strong>EVERY</strong>
            <span>DAY ✳</span>
          </div>
        </div>
      </div>
    </section>
  );
}
