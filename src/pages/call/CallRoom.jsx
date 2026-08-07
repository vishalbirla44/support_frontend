import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { io } from 'socket.io-client'
import SimplePeer from 'simple-peer'
import api from '../../api/axios'

const SOCKET_URL = import.meta.env.VITE_API_URL || 'supportbackend-production-54cc.up.railway.app'

// ─── Status States ────────────────────────────────────────────────────────────
const STATUS = {
  CONNECTING: 'connecting',
  WAITING: 'waiting',
  CONNECTED: 'connected',
  ENDED: 'ended',
  ERROR: 'error',
}

export default function CallRoom() {
  const { roomId } = useParams()

  const [status, setStatus] = useState(STATUS.CONNECTING)
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const [isInitiator, setIsInitiator] = useState(false)

  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const socketRef = useRef(null)
  const peerRef = useRef(null)
  const localStreamRef = useRef(null)
  const startTimeRef = useRef(null)
  const timerRef = useRef(null)

  // ─── Timer ──────────────────────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now()
    timerRef.current = setInterval(() => {
      setCallDuration(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 1000)
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  function formatDuration(secs) {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  // ─── End Call ──────────────────────────────────────────────────────────────
  const endCall = useCallback(
    async (fromRemote = false) => {
      if (status === STATUS.ENDED) return

      stopTimer()

      // Stop local tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop())
        localStreamRef.current = null
      }

      // Destroy peer
      if (peerRef.current) {
        peerRef.current.destroy()
        peerRef.current = null
      }

      // Notify server
      if (socketRef.current && !fromRemote) {
        socketRef.current.emit('call_ended', { roomId })
      }

      // Record duration to backend
      if (startTimeRef.current) {
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000)
        try {
          await api.post('/calls/end', { roomId, duration })
        } catch (_) {
          // Best-effort — call still ends
        }
      }

      setStatus(STATUS.ENDED)
    },
    [status, roomId, stopTimer]
  )

  // ─── WebRTC Setup ──────────────────────────────────────────────────────────
  const createPeer = useCallback(
    (initiator, stream, socket) => {
      const peer = new SimplePeer({
        initiator,
        trickle: true,
        stream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ],
        },
      })

      peer.on('signal', (data) => {
        socket.emit('call_signal', { roomId, signal: data })
      })

      peer.on('stream', (remoteStream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream
        }
        setStatus(STATUS.CONNECTED)
        startTimer()
      })

      peer.on('connect', () => {
        setStatus(STATUS.CONNECTED)
      })

      peer.on('error', (err) => {
        console.error('Peer error:', err)
        setErrorMsg('Connection error. Please try again.')
        setStatus(STATUS.ERROR)
      })

      peer.on('close', () => {
        endCall(true)
      })

      return peer
    },
    [roomId, startTimer, endCall]
  )

  // ─── Main Effect ───────────────────────────────────────────────────────────
  useEffect(() => {
    let socket
    let peer

    async function init() {
      // 1. Get local media
      let stream
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        localStreamRef.current = stream
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }
      } catch (err) {
        console.error('Media error:', err)
        setErrorMsg('Cannot access camera/microphone. Please allow permissions and reload.')
        setStatus(STATUS.ERROR)
        return
      }

      // 2. Connect socket
      const token = localStorage.getItem('waToken')
      socket = io(SOCKET_URL, {
        auth: token ? { token } : {},
        transports: ['websocket'],
      })
      socketRef.current = socket

      socket.on('connect', () => {
        socket.emit('join_call_room', { roomId })
      })

      // 3. Room join response — server tells us if we're initiator
      socket.on('call_room_joined', ({ initiator: init }) => {
        setIsInitiator(init)
        if (init) {
          setStatus(STATUS.WAITING)
        }
        peer = createPeer(init, stream, socket)
        peerRef.current = peer
      })

      // 4. Receive signals
      socket.on('call_signal', ({ signal }) => {
        if (peerRef.current) {
          peerRef.current.signal(signal)
        }
      })

      // 5. Someone joined (for initiator waiting)
      socket.on('peer_joined', () => {
        setStatus(STATUS.CONNECTING)
      })

      // 6. Remote ended
      socket.on('call_ended', () => {
        endCall(true)
      })

      socket.on('connect_error', (err) => {
        console.error('Socket error:', err)
        // Don't block call — peer can still connect
      })
    }

    init()

    return () => {
      stopTimer()
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop())
      }
      if (peerRef.current) {
        peerRef.current.destroy()
      }
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId])

  // ─── Controls ──────────────────────────────────────────────────────────────
  function toggleMute() {
    if (!localStreamRef.current) return
    localStreamRef.current.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled
    })
    setIsMuted((m) => !m)
  }

  function toggleCamera() {
    if (!localStreamRef.current) return
    localStreamRef.current.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled
    })
    setIsCameraOff((c) => !c)
  }

  // ─── Status helpers ────────────────────────────────────────────────────────
  const statusLabel = {
    [STATUS.CONNECTING]: 'Connecting…',
    [STATUS.WAITING]: 'Waiting for other party to join…',
    [STATUS.CONNECTED]: formatDuration(callDuration),
    [STATUS.ENDED]: 'Call Ended',
    [STATUS.ERROR]: errorMsg || 'Something went wrong',
  }[status]

  const statusColor = {
    [STATUS.CONNECTING]: 'text-yellow-400',
    [STATUS.WAITING]: 'text-yellow-400',
    [STATUS.CONNECTED]: 'text-green-400',
    [STATUS.ENDED]: 'text-gray-400',
    [STATUS.ERROR]: 'text-red-400',
  }[status]

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="relative w-screen h-screen bg-gray-950 flex flex-col overflow-hidden select-none">
      {/* Remote video — fills screen */}
      <div className="absolute inset-0">
        {status === STATUS.CONNECTED ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-6">
            {/* Avatar placeholder */}
            <div className="w-28 h-28 rounded-full bg-gray-800 flex items-center justify-center">
              <svg className="w-14 h-14 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>

            {status !== STATUS.ENDED && status !== STATUS.ERROR && (
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Gradient overlays for UI readability */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/70 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

      {/* Top bar — status */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-6">
        <div className="flex items-center gap-3">
          {/* WhatsApp-green logo mark */}
          <div className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg">
            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
          </div>
          <div>
            <p className="text-white font-semibold text-sm">WhatsApp Support</p>
            <p className={`text-xs font-medium ${statusColor}`}>{statusLabel}</p>
          </div>
        </div>

        <div className="text-xs text-gray-400 font-mono bg-black/30 px-3 py-1 rounded-full">
          Room: {roomId}
        </div>
      </div>

      {/* Local video — PiP bottom right */}
      {status !== STATUS.ENDED && status !== STATUS.ERROR && (
        <div className="absolute bottom-28 right-4 z-20 w-32 h-44 md:w-40 md:h-52 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${isCameraOff ? 'hidden' : ''}`}
          />
          {isCameraOff && (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.845v6.31a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          <div className="absolute bottom-1 left-1 right-1 text-center">
            <span className="text-white text-xs bg-black/40 px-1.5 py-0.5 rounded-full">You</span>
          </div>
        </div>
      )}

      {/* Call Ended screen */}
      {status === STATUS.ENDED && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
            </svg>
          </div>
          <p className="text-white text-2xl font-semibold">Call Ended</p>
          {callDuration > 0 && (
            <p className="text-gray-400 text-sm">Duration: {formatDuration(callDuration)}</p>
          )}
          <button
            onClick={() => window.close()}
            className="mt-2 px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-xl transition-colors"
          >
            Close Tab
          </button>
        </div>
      )}

      {/* Error screen */}
      {status === STATUS.ERROR && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 px-8">
          <div className="w-20 h-20 rounded-full bg-red-900/40 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-white text-xl font-semibold text-center">Connection Failed</p>
          <p className="text-gray-400 text-sm text-center">{errorMsg}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-6 py-2.5 bg-[#25D366] hover:bg-green-500 text-white text-sm font-medium rounded-xl transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Bottom controls */}
      {status !== STATUS.ENDED && status !== STATUS.ERROR && (
        <div className="absolute bottom-0 inset-x-0 z-20 pb-8 flex items-center justify-center gap-4">
          {/* Mute */}
          <button
            onClick={toggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
              isMuted
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-white/20 hover:bg-white/30 backdrop-blur-sm'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>

          {/* End Call — centre, prominent */}
          <button
            onClick={() => endCall(false)}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-xl transition-all active:scale-95"
            title="End Call"
          >
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
            </svg>
          </button>

          {/* Camera toggle */}
          <button
            onClick={toggleCamera}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
              isCameraOff
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-white/20 hover:bg-white/30 backdrop-blur-sm'
            }`}
            title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            {isCameraOff ? (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.845v6.31a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2zM3 3l18 18" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.845v6.31a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  )
}