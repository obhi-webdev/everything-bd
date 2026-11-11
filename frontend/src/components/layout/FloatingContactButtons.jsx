import { createPortal } from "react-dom";
import { Phone } from "lucide-react";
import "./floatingContactButtons.css";

const phone = "+8801316804410";
const whatsapp = "https://wa.me/8801316804410";

function WhatsAppIcon() {
  return (
    <svg
      width="25"
      height="25"
      viewBox="0 0 32 32"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M16.002 3C8.824 3 3 8.823 3 16c0 2.29.596 4.523 1.73 6.49L3 29l6.69-1.754A12.92 12.92 0 0 0 16.002 29C23.18 29 29 23.18 29 16S23.18 3 16.002 3zm0 23.63a10.59 10.59 0 0 1-5.406-1.48l-.39-.23-3.96 1.04 1.056-3.86-.254-.397A10.59 10.59 0 0 1 5.37 16c0-5.86 4.77-10.63 10.632-10.63 5.86 0 10.63 4.77 10.63 10.63 0 5.862-4.77 10.63-10.63 10.63zm5.83-7.96c-.32-.16-1.89-.933-2.18-1.04-.29-.106-.5-.16-.71.16-.21.32-.82 1.04-1.007 1.253-.186.214-.372.24-.692.08-.32-.16-1.35-.498-2.57-1.588-.95-.85-1.59-1.9-1.776-2.22-.186-.32-.02-.493.14-.653.144-.143.32-.373.48-.56.16-.186.213-.32.32-.533.106-.213.053-.4-.027-.56-.08-.16-.71-1.708-.973-2.34-.256-.615-.516-.532-.71-.542-.183-.009-.394-.01-.604-.01-.21 0-.55.08-.84.4-.29.32-1.11 1.083-1.11 2.64 0 1.56 1.137 3.066 1.296 3.28.16.213 2.24 3.42 5.42 4.794.757.327 1.35.522 1.81.667.76.242 1.45.207 1.997.126.61-.09 1.89-.773 2.157-1.52.266-.746.266-1.386.186-1.52-.08-.133-.29-.213-.61-.373z"/>
    </svg>
  );
}

export default function FloatingContactButtons() {
  return createPortal(
    <div className="ebd-floating-contact"
      aria-label="Contact EverythingBD">

      <a
        className="ebd-floating-whatsapp"
        href={whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with EverythingBD on WhatsApp"
        title="WhatsApp: +8801316804410"
      >
        <WhatsAppIcon/>
        <span>WhatsApp</span>
      </a>

      <a
        className="ebd-floating-phone"
        href={`tel:${phone}`}
        aria-label="Call EverythingBD at +8801316804410"
        title="Call: +8801316804410"
      >
        <Phone size={23} fill="currentColor"/>
        <span>Call Now</span>
      </a>

    </div>,
    document.body
  );
}
