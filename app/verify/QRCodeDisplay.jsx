"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function QRCodeDisplay({ text }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    QRCode.toDataURL(text, { width: 200, margin: 2 }, (err, url) => {
      if (!err) setSrc(url);
    });
  }, [text]);

  if (!src) return null;

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <img src={src} alt="QR Code" className="rounded-lg shadow-sm" />
      <p className="mt-2 text-xs text-slate-500">Scan to verify this record</p>
    </div>
  );
}
