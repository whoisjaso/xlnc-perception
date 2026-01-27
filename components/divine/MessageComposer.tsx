// Divine Agentic Intelligence System - Message Composer
// Modal component for composing ad-hoc messages or editing before retry

import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  MessageSquare,
  Mail,
  Loader,
  AlertCircle
} from 'lucide-react';
import { divineApi, QueueMessage, ClientConfig } from '../../src/services/divine';

interface MessageComposerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  // If editMessage is provided, we're editing a failed message for retry
  editMessage?: QueueMessage;
  // Available clients for selection
  clients?: ClientConfig[];
}

const MessageComposer: React.FC<MessageComposerProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editMessage,
  clients = []
}) => {
  const [channel, setChannel] = useState<'sms' | 'email'>('sms');
  const [clientId, setClientId] = useState('');
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill if editing
  useEffect(() => {
    if (editMessage) {
      setChannel(editMessage.channel);
      setClientId(editMessage.clientId);
      setRecipient(editMessage.recipient);
      setSubject(editMessage.subject || '');
      setBody(editMessage.body);
    }
  }, [editMessage]);

  const handleSend = async () => {
    setError(null);

    // Validation
    if (!clientId && !editMessage) {
      setError('Please select a client');
      return;
    }
    if (!recipient && !editMessage) {
      setError('Recipient is required');
      return;
    }
    if (channel === 'email' && !subject) {
      setError('Subject is required for email');
      return;
    }
    if (!body.trim()) {
      setError('Message body is required');
      return;
    }

    setIsSending(true);

    try {
      if (editMessage) {
        // Edit and retry
        await divineApi.retryMessageWithEdit(editMessage.id, {
          body,
          subject: channel === 'email' ? subject : undefined
        });
      } else {
        // Send new manual message
        await divineApi.sendManualMessage({
          clientId,
          channel,
          recipient,
          subject: channel === 'email' ? subject : undefined,
          body
        });
      }

      onSuccess();
      onClose();

      // Reset form
      setChannel('sms');
      setClientId('');
      setRecipient('');
      setSubject('');
      setBody('');
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#0A0A0A] border border-xlnc-gold/20 w-full max-w-lg"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-white/10 p-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            {editMessage ? 'Edit & Retry Message' : 'Compose Message'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Error Display */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 p-3 flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Channel Selection (disabled when editing) */}
          <div>
            <label className="text-[9px] text-gray-500 uppercase block mb-2">Channel</label>
            <div className="flex gap-2">
              <button
                onClick={() => !editMessage && setChannel('sms')}
                disabled={!!editMessage}
                className={`flex items-center gap-2 px-4 py-2 text-sm border transition-all ${
                  channel === 'sms'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                    : 'border-white/10 text-gray-500 hover:text-white'
                } ${editMessage ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <MessageSquare size={14} />
                SMS
              </button>
              <button
                onClick={() => !editMessage && setChannel('email')}
                disabled={!!editMessage}
                className={`flex items-center gap-2 px-4 py-2 text-sm border transition-all ${
                  channel === 'email'
                    ? 'border-purple-500 bg-purple-500/10 text-purple-500'
                    : 'border-white/10 text-gray-500 hover:text-white'
                } ${editMessage ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Mail size={14} />
                Email
              </button>
            </div>
          </div>

          {/* Client Selection (only for new messages) */}
          {!editMessage && (
            <div>
              <label className="text-[9px] text-gray-500 uppercase block mb-1">Client</label>
              <select
                value={clientId}
                onChange={e => setClientId(e.target.value)}
                className="w-full bg-black/50 border border-white/10 px-3 py-2 text-sm text-white focus:border-xlnc-gold/50 outline-none"
              >
                <option value="">Select a client...</option>
                {clients.map(c => (
                  <option key={c.client_id} value={c.client_id}>
                    {c.business_name} ({c.client_id})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Recipient */}
          <div>
            <label className="text-[9px] text-gray-500 uppercase block mb-1">
              {channel === 'sms' ? 'Phone Number' : 'Email Address'}
            </label>
            <input
              type={channel === 'sms' ? 'tel' : 'email'}
              value={recipient}
              onChange={e => setRecipient(e.target.value)}
              disabled={!!editMessage}
              placeholder={channel === 'sms' ? '+1234567890' : 'email@example.com'}
              className={`w-full bg-black/50 border border-white/10 px-3 py-2 text-sm text-white focus:border-xlnc-gold/50 outline-none ${
                editMessage ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            />
          </div>

          {/* Subject (email only) */}
          {channel === 'email' && (
            <div>
              <label className="text-[9px] text-gray-500 uppercase block mb-1">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Email subject..."
                className="w-full bg-black/50 border border-white/10 px-3 py-2 text-sm text-white focus:border-xlnc-gold/50 outline-none"
              />
            </div>
          )}

          {/* Body */}
          <div>
            <label className="text-[9px] text-gray-500 uppercase block mb-1">
              Message {channel === 'sms' && `(${body.length}/160)`}
            </label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={channel === 'sms' ? 3 : 6}
              placeholder={channel === 'sms' ? 'Your SMS message...' : 'Your email content (HTML supported)...'}
              className="w-full bg-black/50 border border-white/10 px-3 py-2 text-sm text-white focus:border-xlnc-gold/50 outline-none resize-none"
            />
            {channel === 'sms' && body.length > 160 && (
              <div className="text-[10px] text-yellow-500 mt-1">
                Message exceeds 160 characters. It may be sent as multiple SMS.
              </div>
            )}
          </div>

          {/* Edit note */}
          {editMessage && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 text-[11px] text-yellow-500">
              Editing will reset retry attempts and queue the message immediately.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 p-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="text-[10px] font-bold uppercase px-4 py-2 border border-white/10 text-gray-400 hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={isSending}
            className="text-[10px] font-bold uppercase px-4 py-2 bg-xlnc-gold text-black hover:bg-xlnc-gold/90 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isSending ? (
              <Loader size={12} className="animate-spin" />
            ) : (
              <Send size={12} />
            )}
            {editMessage ? 'Retry' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageComposer;
