import React, { useState } from "react";
import Draggable from "react-draggable";
import { Minus, X } from "lucide-react";

export default function FloatingCallWindow({ callLink, onClose }) {
  const [minimized, setMinimized] = useState(false);

  return (
    <Draggable handle=".call-header">
      <div
        className={`fixed z-[9999] bg-white rounded-xl shadow-2xl border overflow-hidden ${
          minimized ? "w-72 h-12" : "w-[420px] h-[700px]"
        }`}
        style={{
          top: 70,
          right: 20,
        }}
      >
        {/* Header */}
        <div className="call-header cursor-move bg-green-600 text-white flex justify-between items-center px-4 py-2">
          <span className="font-semibold">
            Support Video Call
          </span>

          <div className="flex gap-2">
            <button
              onClick={() => setMinimized(!minimized)}
              className="hover:bg-green-700 rounded p-1"
            >
              <Minus size={18} />
            </button>

            <button
              onClick={onClose}
              className="hover:bg-red-600 rounded p-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {!minimized && (
          <iframe
            src={callLink}
            title="Video Call"
            className="w-full h-[650px]"
            allow="camera; microphone; fullscreen"
          />
        )}
      </div>
    </Draggable>
  );
}