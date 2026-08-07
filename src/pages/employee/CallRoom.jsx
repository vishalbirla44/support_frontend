import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import SimplePeer from 'simple-peer';
import { io } from 'socket.io-client';
import api from '../../api/axios';
import {
  MicrophoneIcon,
  VideoCameraIcon,
  PhoneXMarkIcon,
  MicrophoneIcon as MicOffIcon,
  VideoCameraSlashIcon,
} from '@heroicons/react/24/solid';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'supportbackend-production-54cc.up.railway.app';

export default function CallRoom() {
  const { roomId } = useParams();

  const [status, setStatus] = useState('connecting'); // connecting | connected | ended
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [error, setError] = useState('');

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const startTimeRef = useRef(null);

  // Determine if we are the agent (initiator) from query string or localStorage
  const isInitiator = new URLSearchParams(window.location.search).get('initiator') === 'true';

  useEffect(() => {
    initCall();
    return () => cleanup();
  }, []);

  async function initCall() {
    try {
      // Get local media
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Connect socket (no auth required for call room)
      socketRef.current = io(SOCKET_URL, { query: { roomId } });

      socketRef.current.on('connect', () => {
        socketRef.current.emit('join_call', { roomId });
      });

      socketRef.current.on('call_signal', (data) => {
        if (peerRef.current) {
          peerRef.current.signal(data.signal);
        }
      });

      socketRef.current.on('call_ended', () => {
        endCallUI();
      });

      socketRef.current.on('peer_joined', () => {
        // Other party joined — if not already created a peer, create one
        if (!peerRef.current) {
          createPeer(stream, false);
        }
      });

      // Create peer
      createPeer(stream, isInitiator);

      startTimeRef.current = Date.now();
    } catch (err) {
      setError('Could not access camera/microphone. Please allow permissions and refresh.');
      setStatus('ended');
    }
  }

  function createPeer(stream, initiator) {
    const peer = new SimplePeer({
      initiator,
      trickle: true,
      stream,
    });

    peer.on('signal', (signal) => {
      socketRef.current?.emit('call_signal', { roomId, signal });
    });

    peer.on('stream', (remoteStream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      setStatus('connected');
    });

    peer.on('connect', () => {
      setStatus('connected');
    });

    peer.on('close', () => {
      endCallUI();
    });

    peer.on('error', (err) => {
      console.error('Peer error:', err);
      endCallUI();
    });

    peerRef.current = peer;
  }

  function endCallUI() {
    setStatus('ended');
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
    }
  }

  async function handleEndCall() {
    const duration = startTimeRef.current
      ? Math.floor((Date.now() - startTimeRef.current) / 1000)
      : 0;

    socketRef.current?.emit('call_ended', { roomId });
    peerRef.current?.destroy();
    endCallUI();

    // Report duration to backend
    try {
      await api.post('/calls/end', { roomId, duration });
    } catch (_) { /* best effort */ }
  }

  function cleanup() {
    peerRef.current?.destroy();
    socketRef.current?.disconnect();
    localStreamRef.current?.getTracks().forEach(t => t.stop());
  }

  function toggleMute() {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!isMuted);
    }
  }

  function toggleCamera() {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCameraOff(!isCameraOff);
    }
  }

  // Status label
  const statusLabel = {
    connecting: 'Connecting...',
    connected: 'Connected',
    ended: 'Call Ended',
  }[status];

  const statusColor = {
    connecting: 'text-yellow-400',
    connected: 'text-green-400',
    ended: 'text-red-400',
  }[status];

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Remote video (full screen) */}
      <div className="absolute inset-0 bg-gray-800">
        {status !== 'ended' ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="h-20 w-20 rounded-full bg-red-900 flex items-center justify-center mx-auto mb-4">
                <PhoneXMarkIcon className="h-10 w-10 text-red-400" />
              </div>
              <p className="text-white text-2xl font-semibold">Call Ended</p>
            </div>
          </div>
        )}
      </div>

      {/* Local video (PiP) */}
      {status !== 'ended' && (
        <div className="absolute bottom-28 right-5 w-36 h-48 rounded-xl overflow-hidden border-2 border-white shadow-2xl bg-gray-700 z-10">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          {isCameraOff && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <VideoCameraSlashIcon className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>
      )}

      {/* Status badge */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
        <div className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${
            status === 'connected' ? 'bg-green-400 animate-pulse' :
            status === 'connecting' ? 'bg-yellow-400 animate-pulse' :
            'bg-red-400'
          }`} />
          <span className={`text-sm font-medium ${statusColor}`}>{statusLabel}</span>
        </div>
      </div>

      {/* Room ID */}
      <div className="absolute top-6 right-5 z-10">
        <div className="bg-black/40 text-white/60 text-xs px-3 py-1.5 rounded-full">
          Room: {roomId}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-red-900/80 text-red-200 text-sm px-4 py-2 rounded-lg max-w-sm text-center">
          {error}
        </div>
      )}

      {/* Controls */}
      {status !== 'ended' && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex items-center gap-4">
          {/* Mute */}
          <button
            onClick={toggleMute}
            className={`h-14 w-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
              isMuted
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-white/20 hover:bg-white/30 backdrop-blur-sm'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <MicOffIcon className="h-6 w-6 text-white" />
            ) : (
              <MicrophoneIcon className="h-6 w-6 text-white" />
            )}
          </button>

          {/* End Call */}
          <button
            onClick={handleEndCall}
            className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-xl transition-all"
            title="End Call"
          >
            <PhoneXMarkIcon className="h-8 w-8 text-white" />
          </button>

          {/* Camera */}
          <button
            onClick={toggleCamera}
            className={`h-14 w-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
              isCameraOff
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-white/20 hover:bg-white/30 backdrop-blur-sm'
            }`}
            title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            {isCameraOff ? (
              <VideoCameraSlashIcon className="h-6 w-6 text-white" />
            ) : (
              <VideoCameraIcon className="h-6 w-6 text-white" />
            )}
          </button>
        </div>
      )}

      {/* Ended — rejoin prompt */}
      {status === 'ended' && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <button
            onClick={() => window.location.reload()}
            className="bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-lg text-sm transition-colors"
          >
            Rejoin Call
          </button>
        </div>
      )}
    </div>
  );
}