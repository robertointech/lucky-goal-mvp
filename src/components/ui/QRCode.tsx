"use client";

import { QRCodeSVG } from "qrcode.react";

interface QRCodeDisplayProps {
  code: string;
  url: string;
}

export default function QRCodeDisplay({ code, url }: QRCodeDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-white p-4 rounded-2xl">
        <QRCodeSVG
          value={url}
          size={200}
          bgColor="#ffffff"
          fgColor="#1a1a2e"
          level="H"
        />
      </div>
      <div className="text-center">
        <p className="text-gray-400 text-sm mb-1">O ingresa el codigo:</p>
        <div className="bg-[#1a1a2e] border-2 border-[#00FF88] rounded-xl px-6 py-3">
          <span className="text-[#00FF88] text-3xl font-mono font-bold tracking-[0.3em]">
            {code}
          </span>
        </div>
      </div>
    </div>
  );
}
