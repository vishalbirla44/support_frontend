import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff,
  AlertCircle, RefreshCw, MessageSquare
} from 'lucide-react';
import SimplePeer from 'simple-peer';
import useSocket from '../../hooks/useSocket';
import useAuth from '../../hooks/useAuth';

const JoinCall = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { user } = useAuth();

  const [status, setStatus] = useState('waiting'); // waiting | connecting | connected | ended | error
  const [error, setError] = useState('');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (!socket || !roomId) return;

    let peer = null;

    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Join the room
        socket.emit('call_join', { roomId, role: 'customer', userId: user?._id });
        setStatus('connecting');

        socket.on('call_offer', ({ signal }) => {
          peer = new SimplePeer({ initiator: false, trickle: false, stream });
          peerRef.current = peer;

          peer.on('signal', (data) => {
            socket.emit('call_answer', { roomId, signal: data });
          });

          peer.on('stream', (remoteStream) => {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteStream;
            }
            setStatus('connected');
          });

          peer.on('error', (err) => {
            console.error('Peer error:', err);
            setError('Connection error. Please try refreshing.');
            setStatus('error');
          });

          peer.on('close', () => {
            setStatus('ended');
          });

          peer.signal(signal);
        });

        socket.on('call_ended', () => {
          setStatus('ended');
          cleanup();
        });

      } catch (err) {
        console.error('Media error:', err);
        if (err.name === 'NotAllowedError') {
          setError('Camera/microphone access denied. Please allow access in your browser settings.');
        } else {
          setError('Could not access camera or microphone.');
        }
        setStatus('error');
      }
    };

    initMedia();

    return () => {
      socket.off('call_offer');
      socket.off('call_ended');
      cleanup();
    };
  }, [socket, roomId, user]);

  const cleanup = () => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const hangUp = () => {
    socket?.emit('call_end', { roomId });
    cleanup();
    setStatus('ended');
  };

  const toggleAudio = () => {
    if (!streamRef.current) return;
    streamRef.current.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setAudioEnabled(v => !v);
  };

  const toggleVideo = () => {
    if (!streamRef.current) return;
    streamRef.current.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setVideoEnabled(v => !v);
  };

  if (status === 'ended') {
    return (
      <CallEndScreen onBack={() => navigate('/customer/conversation')} />
    );
  }

  if (status === 'error') {
    return (
      <ErrorScreen error={error} onBack={() => navigate('/customer/conversation')} />
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
          <span className="text-sm text-gray-300">
            {status === 'waiting' && 'Waiting for agent…'}
            {status === 'connecting' && 'Connecting…'}
            {status === 'connected' && 'In call'}
          </span>
        </div>
        <span className="text-xs text-gray-500 font-mono">Room: {roomId}</span>
      </div>

      {/* Video Area */}
      <div className="flex-1 relative bg-gray-950">
        {/* Remote (agent) video */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Placeholder when not connected */}
        {status !== 'connected' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="w-8 h-8 text-gray-500 animate-spin" />
              </div>
              <p className="text-gray-400 text-sm">
                {status === 'waiting' ? 'Waiting for the agent to start…' : 'Establishing connection…'}
              </p>
            </div>
          </div>
        )}

        {/* Local (customer) PiP */}
        <div className="absolute bottom-4 right-4 w-32 h-24 rounded-xl overflow-hidden border-2 border-gray-700 shadow-lg bg-gray-800">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {!videoEnabled && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <VideoOff className="w-5 h-5 text-gray-500" />
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-900 border-t border-gray-800 px-6 py-4">
        <div className="flex items-center justify-center gap-4">
          <ControlBtn onClick={toggleAudio} active={audioEnabled} label={audioEnabled ? 'Mute' : 'Unmute'}>
            {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </ControlBtn>
          <ControlBtn onClick={toggleVideo} active={videoEnabled} label={videoEnabled ? 'Camera off' : 'Camera on'}>
            {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </ControlBtn>
          <button
            onClick={hangUp}
            className="w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
            title="End call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

const ControlBtn = ({ onClick, active, label, children }) => (
  <button
    onClick={onClick}
    title={label}
    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
      active ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-900/60 hover:bg-red-900 text-red-400'
    }`}
  >
    {children}
  </button>
);

const CallEndScreen = ({ onBack }) => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
    <div className="text-center max-w-sm">
      <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
        <PhoneOff className="w-7 h-7 text-gray-400" />
      </div>
      <h2 className="text-white text-xl font-semibold mb-2">Call ended</h2>
      <p className="text-gray-400 text-sm mb-6">Thank you for contacting us. The call has been completed.</p>
      <button
        onClick={onBack}
        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors mx-auto"
      >
        <MessageSquare className="w-4 h-4" />
        Back to Conversation
      </button>
    </div>
  </div>
);

const ErrorScreen = ({ error, onBack }) => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
    <div className="text-center max-w-sm">
      <div className="w-16 h-16 bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-7 h-7 text-red-400" />
      </div>
      <h2 className="text-white text-xl font-semibold mb-2">Can't join call</h2>
      <p className="text-gray-400 text-sm mb-6">{error}</p>
      <button
        onClick={onBack}
        className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors mx-auto"
      >
        <MessageSquare className="w-4 h-4" />
        Back to Conversation
      </button>
    </div>
  </div>
);

export default JoinCall;