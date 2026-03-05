"use client";

import { AVATARS, type Avatar } from "@/types/game";

interface AvatarPickerProps {
  selected: Avatar | null;
  onSelect: (avatar: Avatar) => void;
}

export default function AvatarPicker({ selected, onSelect }: AvatarPickerProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {AVATARS.map((avatar) => (
        <button
          key={avatar}
          onClick={() => onSelect(avatar)}
          className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl transition-all duration-200 active:scale-90 ${
            selected === avatar
              ? "bg-[#00FF88]/20 border-2 border-[#00FF88] scale-110"
              : "bg-[#1a1a2e] border-2 border-gray-700 hover:border-gray-500"
          }`}
        >
          {avatar}
        </button>
      ))}
    </div>
  );
}
