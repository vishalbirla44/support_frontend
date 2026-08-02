import React from 'react'
import { X } from 'lucide-react'

export default function QRModal({ isOpen, qrBase64, onClose }) {
  if (!isOpen) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Scan QR Code</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            {qrBase64 ? (
              <img
                src={qrBase64}
                alt="QR Code"
                className="w-full"
              />
            ) : (
              <div className="aspect-square flex items-center justify-center">
                <div className="spinner"></div>
              </div>
            )}
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600 font-medium">
              Open WhatsApp on your phone
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Point your camera at this QR code
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}