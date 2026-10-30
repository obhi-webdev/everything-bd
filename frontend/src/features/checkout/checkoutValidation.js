const bdPhone = /^(?:\+?88)?01[3-9]\d{8}$/;

export function validateCheckout(form) {
  const name = form.name.trim();
  const phone = form.phone.trim();
  const alternate = form.alternatePhone.trim();
  const district = form.district.trim();
  const area = form.area.trim();
  const address = form.address.trim();

  if (name.length < 2 || name.length > 100) {
    return "Please enter your full name.";
  }

  if (!bdPhone.test(phone)) {
    return "Enter a valid Bangladesh mobile number.";
  }

  if (alternate && !bdPhone.test(alternate)) {
    return "Enter a valid alternative phone number.";
  }

  if (district.length < 2 || district.length > 100) {
    return "Please enter your district.";
  }

  if (area.length < 2 || area.length > 150) {
    return "Please enter your area or thana.";
  }

  if (address.length < 10 || address.length > 500) {
    return "Address must contain 10 to 500 characters.";
  }

  if (!["inside_dhaka", "outside_dhaka"].includes(form.deliveryZone)) {
    return "Please select a delivery zone.";
  }

  if (
    form.deliveryZone === "inside_dhaka" &&
    district.toLowerCase() !== "dhaka"
  ) {
    return "Inside Dhaka delivery requires Dhaka district.";
  }

  if (
    form.email.trim() &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
  ) {
    return "Please enter a valid email address.";
  }

  if (form.customerNote.length > 500) {
    return "Order note is too long.";
  }

  return null;
}
