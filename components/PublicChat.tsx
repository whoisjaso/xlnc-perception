
import React, { useState, useRef, useEffect } from 'react';
import { Send, X, MessageSquare, User, Bot, Mic, Loader2, Diamond } from 'lucide-react';
import { chatWithConcierge, transcribeAudio } from '../services/gemini';

const PublicChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user'|'model', text: string}[]>([
      { role: 'model', text: 'Welcome to XLNC. I am the Concierge. How may I assist in your architectural expansion?' }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsThinking(true);

    // Format history for Gemini
    const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
    }));

    const response = await chatWithConcierge(history, userMsg);
    
    setIsThinking(false);
    if (response) {
        setMessages(prev => [...prev, { role: 'model', text: response }]);
    }
  };

  const handleMicClick = async () => {
    if (isRecording) {
        // Stop Recording
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    } else {
        // Start Recording
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            const audioChunks: Blob[] = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = async () => {
                    const base64Audio = (reader.result as string).split(',')[1];
                    setIsThinking(true);
                    const text = await transcribeAudio(base64Audio);
                    setIsThinking(false);
                    if (text) setInput(prev => prev + (prev ? ' ' : '') + text);
                };
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Mic Error", err);
            alert("Microphone access denied or not found.");
        }
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-8 right-8 z-40 w-14 h-14 rounded-full shadow-[0_0_30px_rgba(255,255,255,0.1)] flex items-center justify-center transition-all duration-300 group ${isOpen ? 'bg-black border border-white/20 text-white' : 'bg-white text-black hover:bg-xlnc-gold'}`}
      >
        {isOpen ? <X size={24} /> : <Diamond size={24} className="group-hover:scale-110 transition-transform" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-28 right-6 md:right-8 w-[90vw] md:w-96 h-[500px] z-40 bg-black/90 border border-white/10 shadow-2xl flex flex-col animate-slide-up rounded-sm overflow-hidden backdrop-blur-xl">
            {/* Header */}
            <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-xlnc-gold rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">
                        XLNC Concierge
                    </span>
                </div>
                <Diamond size={14} className="text-xlnc-gold opacity-50" />
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-transparent">
                {messages.map((m, i) => (
                    <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`w-6 h-6 rounded-sm flex items-center justify-center shrink-0 ${m.role === 'model' ? 'bg-xlnc-gold text-black' : 'bg-gray-800 text-gray-400'}`}>
                            {m.role === 'model' ? <Bot size={14} /> : <User size={14} />}
                        </div>
                        <div className={`p-3 max-w-[80%] text-xs font-light leading-relaxed ${m.role === 'model' ? 'text-gray-200 bg-white/5 border border-white/5' : 'text-black bg-white border border-white'}`}>
                            {m.text}
                        </div>
                    </div>
                ))}
                {isThinking && (
                    <div className="flex gap-3">
                        <div className="w-6 h-6 bg-xlnc-gold/10 text-xlnc-gold border border-xlnc-gold/20 rounded-sm flex items-center justify-center">
                             <Loader2 size={14} className="animate-spin" />
                        </div>
                        <div className="text-[10px] text-gray-500 self-center font-mono uppercase tracking-widest">Analyzing Query...</div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-black/80 border-t border-white/10 flex gap-2">
                <button 
                    onClick={handleMicClick}
                    className={`p-3 border transition-all ${isRecording ? 'bg-red-500/20 border-red-500 text-red-500 animate-pulse' : 'border-white/10 text-gray-400 hover:text-white hover:border-white'}`}
                >
                    <Mic size={16} />
                </button>
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Inquire about access..."
                    className="flex-1 bg-transparent border border-white/10 px-3 text-white text-xs focus:border-white/30 focus:outline-none font-mono"
                />
                <button 
                    onClick={handleSend}
                    className="p-3 bg-white text-black hover:bg-xlnc-gold transition-colors"
                >
                    <Send size={16} />
                </button>
            </div>
        </div>
      )}
    </>
  );
};

export default PublicChat;
