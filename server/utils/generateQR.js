const QRCode = require("qrcode");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");

// Generates a cryptographically signed ticket token + QR image (data URL).
// The signature lets checkAdmin scanners verify the QR wasn't tampered with,
// and each new resale invalidates the previous token by rotating this value.
const generateTicketQR = async ({ bookingId, eventId, seatId }) => {
  const nonce = uuidv4();
  const payload = `${bookingId}:${eventId}:${seatId}:${nonce}`;
  const signature = crypto
    .createHmac("sha256", process.env.JWT_SECRET)
    .update(payload)
    .digest("hex");

  const ticketToken = `${payload}:${signature}`;
  const image = await QRCode.toDataURL(ticketToken, {
    errorCorrectionLevel: "H",
    margin: 1,
    width: 320,
    color: { dark: "#0D0D14", light: "#FFFFFF" },
  });

  return { data: ticketToken, image };
};

// Verifies a scanned QR token's signature to prevent forged / edited tickets
const verifyTicketQR = (ticketToken) => {
  const parts = ticketToken.split(":");
  if (parts.length !== 5) return { valid: false };

  const [bookingId, eventId, seatId, nonce, signature] = parts;
  const payload = `${bookingId}:${eventId}:${seatId}:${nonce}`;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.JWT_SECRET)
    .update(payload)
    .digest("hex");

  return {
    valid: expectedSignature === signature,
    bookingId,
    eventId,
    seatId,
  };
};

module.exports = { generateTicketQR, verifyTicketQR };
