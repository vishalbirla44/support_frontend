import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare, LogOut, RefreshCw, PhoneCall, Info, Check, CheckCheck
} from 'lucide-react';
import axios from '../../api/axios';
import { formatTime } from '../../utils/formatTime';
import useAuth from '../../hooks/useAuth';
import useSocket from '../../hooks/useSocket';
import { useNavigate } from 'react-router-dom';

const MyConversation = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [callRoomId, setCallRoomId] = useState(null);
  const [customerInfo, setCustomerInfo] = useState(null);
  const bottomRef = useRef(null);

  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const fetchMessages = useCallback(async () => {
    try {
      const res = await axios.get('/api/customer/messages');
      setMessages(res.data.messages ?? res.data);
      setCustomerInfo(res.data.customer ?? null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!socket) return;

    // Real-time new message pushed for this customer
    const handleNew = (msg) => {
      setMessages(prev => {
        if (prev.some(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    };

    // Agent sends call link — extract room ID
    const handleCallInvite = ({ roomId }) => {
      setCallRoomId(roomId);
    };

    socket.on('customer_message', handleNew);
    socket.on('call_invite', handleCallInvite);

    return () => {
      socket.off('customer_message', handleNew);
      socket.off('call_invite', handleCallInvite);
    };
  }, [socket]);

  const handleLogout = () => {
    logout();
    navigate('/customer/login');
  };

  const handleJoinCall = () => {
    navigate(`/customer/call/${callRoomId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="w-7 h-7 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Support Conversation</p>
              <p className="text-xs text-gray-400">{user?.customerId ?? customerInfo?.customerId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {callRoomId && (
              <button
                onClick={handleJoinCall}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors animate-pulse"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                Join Call
              </button>
            )}
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Read-only notice */}
      <div className="max-w-2xl mx-auto w-full px-4 pt-3">
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-600">
          <Info className="w-3.5 h-3.5 shrink-0" />
          This is a read-only view of your conversation. Continue chatting via WhatsApp to reach our team.
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No messages yet</p>
            <p className="text-sm text-gray-300 mt-1">Send a WhatsApp message to get started</p>
          </div>
        ) : (
          messages.map(msg => (
            <CustomerMessageBubble key={msg._id} message={msg} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Footer */}
      <div className="max-w-2xl mx-auto w-full px-4 py-3">
        <p className="text-center text-xs text-gray-300">
          Messages are synced in real time from WhatsApp
        </p>
      </div>
    </div>
  );
};

const CustomerMessageBubble = ({ message }) => {
  const isInbound = message.direction === 'in'; // from customer
  const isOutbound = message.direction === 'out'; // from agent

  return (
    <div className={`flex ${isInbound ? 'justify-end' : 'justify-start'}`}>
      {isOutbound && (
        <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center mr-2 shrink-0 self-end mb-1">
          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
        </div>
      )}
      <div className={`max-w-[75%] group`}>
        {isOutbound && (
          <p className="text-xs text-gray-400 mb-1 ml-1">Support Agent</p>
        )}
        <div className={`rounded-2xl px-4 py-2.5 shadow-sm ${
          isInbound
            ? 'bg-emerald-600 text-white rounded-br-sm'
            : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'
        }`}>
          {message.type === 'image' && message.mediaUrl ? (
            <img src={message.mediaUrl} alt="media" className="rounded-lg max-w-full mb-1" />
          ) : message.type === 'document' && message.mediaUrl ? (
            <a href={message.mediaUrl} target="_blank" rel="noopener noreferrer"
              className={`underline text-sm ${isInbound ? 'text-emerald-100' : 'text-emerald-600'}`}>
              📎 View Document
            </a>
          ) : null}
          {message.body && <p className="text-sm leading-relaxed">{message.body}</p>}
        </div>
        <div className={`flex items-center gap-1 mt-1 ${isInbound ? 'justify-end' : 'justify-start'}`}>
          <span className={`text-xs ${isInbound ? 'text-gray-400' : 'text-gray-300'}`}>
            {formatTime(message.timestamp)}
          </span>
          {isInbound && (
            message.status === 'seen'
              ? <CheckCheck className="w-3 h-3 text-blue-400" />
              : <Check className="w-3 h-3 text-gray-400" />
          )}
        </div>
      </div>
    </div>
  );
};

export default MyConversation;