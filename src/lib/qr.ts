export async function generateQrDataUrl(text: string) {
  if (!text) return "";
  const QRCode = await import("qrcode");
  return QRCode.toDataURL(text, { margin: 1, scale: 6 });
}
