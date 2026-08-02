import React, { useState, useEffect } from 'react'
import { formatTime } from '../utils/formatTime'
import { Check, CheckCheck } from 'lucide-react'

export default function MessageBubble({ message, direction }) {
  const inferredDirection =
    direction ?? (message?.direction === 'out' ? 'out' : 'in')

  const isOutgoing = inferredDirection === 'out'

  const text = message.body || message.text || ''
  
  const timeValue =
    message.timestamp || message.createdAt || new Date().toISOString()

  const mediaUrl = message.mediaUrl
    ? `${import.meta.env.VITE_API_URL}${message.mediaUrl}`
    : null

  const [showViewer, setShowViewer] = useState(false);

  useEffect(() => {
    if (!showViewer) return

    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setShowViewer(false)
      }
    }

    window.addEventListener('keydown', handleKey)

    return () => {
      window.removeEventListener('keydown', handleKey)
    }
  }, [showViewer])

  return (
    <>
      <div
        className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'
          } mb-3`}
      >
        <div
          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-xl break-words shadow-sm ${isOutgoing
            ? 'bg-[#25D366] text-white rounded-br-sm'
            : 'bg-white text-gray-900 rounded-bl-sm border border-gray-100'
            }`}
        >
          {text && (
            <p
              className={`text-sm leading-relaxed ${isOutgoing ? 'text-white' : 'text-gray-900'
                }`}
            >
              {text}
            </p>
          )}

          {/* Media */}
          {mediaUrl && (
            <div className="mt-2">

              {/* Image */}
              {message.type === 'image' && (
                <img
                  src={mediaUrl}
                  alt="media"
                  onClick={() => setShowViewer(true)}
                  className="rounded-lg max-w-full cursor-pointer hover:opacity-90 transition-opacity"
                />
              )}

              {/* Video */}
              {message.type === 'video' && (
                <div
                  onClick={() => setShowViewer(true)}
                  className="relative cursor-pointer"
                >
                  <video
                    src={mediaUrl}
                    className="w-full max-w-md h-auto rounded-lg shadow-2xl"
                    muted
                  />

                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/60 text-white rounded-full w-14 h-14 flex items-center justify-center text-2xl">
                      ▶
                    </div>
                  </div>
                </div>
              )}

              {/* Audio */}
              {message.type === 'audio' && (
                <audio controls className="w-full">
                  <source src={mediaUrl} />
                </audio>
              )}

              {/* PDF */}
              {message.type === 'document' &&
                mediaUrl.toLowerCase().endsWith('.pdf') && (
                  <a
                    href={mediaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-500 underline text-sm"
                  >
                    📄 View PDF
                  </a>
                )}

              {/* Other Files */}
              {message.type === 'document' &&
                !mediaUrl.toLowerCase().endsWith('.pdf') && (
                  <a
                    href={mediaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={`text-sm underline ${isOutgoing ? 'text-green-100' : 'text-blue-500'
                      }`}
                  >
                    📎 Download Attachment
                  </a>
                )}

            </div>
          )}
          <div
            className={`flex items-center justify-end gap-1 mt-1 text-xs ${isOutgoing
              ? 'text-green-100'
              : 'text-gray-400'
              }`}
          >
            <span>{formatTime(timeValue)}</span>

            {isOutgoing &&
              (message.status === 'seen' ||
                message.status === 'read' ? (
                <CheckCheck size={13} />
              ) : (
                <Check size={13} />
              ))}
          </div>
        </div>
      </div>

      {showViewer && (
        <div
          className="fixed inset-0 bg-black/90 z-[9999] flex flex-col"
          onClick={() => setShowViewer(false)}
        >
          <div className="p-4" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setShowViewer(false)}
              className="bg-white text-black px-4 py-2 rounded-lg font-semibold hover:bg-gray-200"
            >
              ✕ Close
            </button>
          </div>

          <div
            className="flex-1 flex items-center justify-center p-5"
            onClick={(e) => e.stopPropagation()}
          >
            {message.type === 'image' ? (
              <img
                src={mediaUrl}
                alt="Full Size"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            ) : message.type === 'video' ? (
              <video
                src={mediaUrl}
                controls
                autoPlay
                className="w-auto h-auto max-w-[80vw] max-h-[80vh] rounded-lg shadow-2xl"
              />
            ) : null}
          </div>
        </div>
      )}
    </>
  )
}