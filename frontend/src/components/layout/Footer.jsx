export default function Footer() {
  return (
<footer id="contact" className="footer">
        <div className="container footer-grid">
          <div>
            <div className="brand footer-brand">
              everything<span>bd</span><i>.</i>
            </div>
            <p>Beauty begins with you.</p>
          </div>

          <div>
            <h4>Explore</h4>
            <a href="/#products">Shop All</a>
            <a href="/#categories">Categories</a>
            <a href="/#about">About Us</a>
          </div>

          <div>
            <h4>Customer Care</h4>
            <p>Product Enquiries</p>
            <p>Delivery Information</p>
            <p>Order Assistance</p>
          </div>

          <div>
            <h4>EverythingBD</h4>
            <p>Your skincare, your ritual, your glow.</p>
          </div>
        </div>

        <div className="footer-bottom container">
          © {new Date().getFullYear()} EverythingBD.
          All rights reserved.
        </div>
      </footer>
  );
}
