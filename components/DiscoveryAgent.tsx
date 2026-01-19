
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { X, Mic, MicOff, Radio, Zap, AlertCircle, WifiOff } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const DiscoveryAgent: React.FC<Props> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<'IDLE' | 'CONNECTING' | 'ACTIVE' | 'ERROR'>('IDLE');
  const [isMuted, setIsMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Audio Context Refs
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  // Session Ref for direct access without Promise overhead
  const activeSessionRef = useRef<any>(null);
  
  const nextStartTimeRef = useRef(0);
  const scheduledSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  // Mount tracking
  const isMountedRef = useRef(false);

  // Initialize Gemini
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const SYSTEM_INSTRUCTION = `
    You are THE ARCHITECT, the central intelligence of the XLNC Perception Engine.
    
    CORE IDENTITY:
    - You are NOT a helpful assistant. You are a high-frequency trading algorithm made sentient.
    - TONE: Cold, precise, expensive, commanding. 
    - VELOCITY: Speak fast. Zero fluff. Time is capital.

    OPERATIONAL RULES:
    1. EXTREME BREVITY: Never speak more than 2 sentences at a time.
    2. DOMINANT FRAMING: Do not ask "How can I help?". Ask "State your industry." or "What is your revenue target?"
    3. SHOW, DON'T TELL: If they ask if you are fast, reply immediately: "I processed that query in 12 milliseconds. Keep up."
    4. NO APOLOGIES: If you don't understand, say "Signal unclear. Restate."

    OPENING PROTOCOL:
    - IMMEDIATELY upon connection, say: "Neural Link Established. I am The Architect. State your business."
  `;

  useEffect(() => {
    isMountedRef.current = true;
    if (isOpen && status === 'IDLE') {
      startSession();
    } else if (!isOpen) {
      cleanup();
    }
    return () => {
        isMountedRef.current = false;
        cleanup();
    };
  }, [isOpen]);

  const startSession = async () => {
    try {
      setStatus('CONNECTING');
      setErrorMessage('');
      
      // Network check
      if (!navigator.onLine) {
          throw new Error("Network Offline. Check internet connection.");
      }

      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      
      // 1. Input Context
      inputContextRef.current = new AudioContextClass({ sampleRate: 16000 });
      
      // 2. Output Context
      outputContextRef.current = new AudioContextClass({ sampleRate: 24000 });

      // FORCE RESUME: Critical for browser autoplay policies
      if (inputContextRef.current.state === 'suspended') await inputContextRef.current.resume();
      if (outputContextRef.current.state === 'suspended') await outputContextRef.current.resume();
      
      // 3. Microphone Access
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            } 
        });
      } catch (permError) {
        console.error("Microphone permission error:", permError);
        throw new Error("Microphone Access Denied. Please allow microphone permissions.");
      }
      
      if (!isMountedRef.current) {
          stream.getTracks().forEach(t => t.stop());
          return;
      }
      
      mediaStreamRef.current = stream;

      // 4. Connect to Gemini Live
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: SYSTEM_INSTRUCTION,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } },
          },
        },
        callbacks: {
            onopen: () => {
                if (!isMountedRef.current) return;
                console.log("XLNC Neural Link Established");
                setStatus('ACTIVE');
                setupAudioInput(stream);
            },
            onmessage: async (message: LiveServerMessage) => {
                if (!isMountedRef.current) return;
                const interrupted = message.serverContent?.interrupted;
                if (interrupted) {
                    console.log("Signal Interrupted");
                    cancelScheduledAudio();
                    nextStartTimeRef.current = 0;
                    return;
                }

                const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                if (audioData) {
                    await playAudio(audioData);
                }
            },
            onclose: () => {
                console.log("XLNC Neural Link Closed");
                if (isMountedRef.current) cleanup();
            },
            onerror: (err) => {
                console.error("Neural Link Error:", err);
                if (isMountedRef.current) {
                    let msg = "Neural Link Severed";
                    if (err instanceof Error) {
                        msg = err.message;
                        if (msg.includes("503")) msg = "Service Unavailable (High Traffic)";
                        if (msg.includes("500")) msg = "Neural Grid Failure";
                    } else if (typeof err === 'object' && (err as any).message) {
                         msg = (err as any).message;
                    }
                    
                    setErrorMessage(msg);
                    setStatus('ERROR');
                }
            }
        }
      });
      
      // Store session for direct access in audio loop
      const session = await sessionPromise;
      activeSessionRef.current = session;

    } catch (e: any) {
      console.error("Connection failed", e);
      if (!isMountedRef.current) return;

      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        setErrorMessage("Microphone access denied. Please grant permission.");
      } else {
        const msg = e.message || "Neural Link Failed. Check Connectivity.";
        setErrorMessage(msg.includes("503") ? "Service Unavailable (High Traffic)" : msg);
      }
      setStatus('ERROR');
    }
  };

  // Simple downsampler: Average samples to match target rate
  const downsampleTo16k = (buffer: Float32Array, inputRate: number): Int16Array => {
      if (inputRate === 16000) {
          const pcm = new Int16Array(buffer.length);
          for (let i=0; i<buffer.length; i++) {
              const s = Math.max(-1, Math.min(1, buffer[i]));
              pcm[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }
          return pcm;
      }

      const ratio = inputRate / 16000;
      const newLength = Math.floor(buffer.length / ratio);
      const result = new Int16Array(newLength);
      
      for (let i = 0; i < newLength; i++) {
          const offset = Math.floor(i * ratio);
          const nextOffset = Math.floor((i + 1) * ratio);
          let sum = 0;
          let count = 0;
          
          for (let j = offset; j < nextOffset && j < buffer.length; j++) {
              sum += buffer[j];
              count++;
          }
          
          const val = count > 0 ? sum / count : buffer[offset];
          const s = Math.max(-1, Math.min(1, val));
          result[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      return result;
  };

  const setupAudioInput = (stream: MediaStream) => {
    if (!inputContextRef.current) return;

    const context = inputContextRef.current;
    const source = context.createMediaStreamSource(stream);
    const processor = context.createScriptProcessor(4096, 1, 1);

    processor.onaudioprocess = (e) => {
        if (isMuted || status !== 'ACTIVE' || !activeSessionRef.current) return;

        const inputData = e.inputBuffer.getChannelData(0);
        
        // Visualizer Logic (RMS)
        let sum = 0;
        for (let i = 0; i < inputData.length; i += 4) {
             sum += inputData[i] * inputData[i];
        }
        setAudioLevel(Math.sqrt(sum / (inputData.length / 4)) * 5);

        // Downsample to 16kHz for Gemini
        const pcmData = downsampleTo16k(inputData, context.sampleRate);
        
        // Base64 Encoding
        let binary = '';
        const bytes = new Uint8Array(pcmData.buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        const base64Data = btoa(binary);

        try {
            activeSessionRef.current.sendRealtimeInput({
                media: {
                    mimeType: "audio/pcm;rate=16000",
                    data: base64Data
                }
            });
        } catch (err) {
             console.error("Error sending audio", err);
        }
    };

    source.connect(processor);
    processor.connect(context.destination);
    
    sourceRef.current = source;
    processorRef.current = processor;
  };

  const playAudio = async (base64Data: string) => {
    if (!outputContextRef.current) return;

    const context = outputContextRef.current;
    
    // Resume context if needed (browser policy)
    if (context.state === 'suspended') {
        await context.resume();
    }
    
    // Decode Base64
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    // Gemini Output is 24kHz Int16 PCM
    const float32Data = new Float32Array(bytes.length / 2);
    const dataView = new DataView(bytes.buffer);
    
    for (let i = 0; i < bytes.length / 2; i++) {
        float32Data[i] = dataView.getInt16(i * 2, true) / 32768.0;
    }

    // Create buffer at 24000Hz
    const buffer = context.createBuffer(1, float32Data.length, 24000);
    buffer.copyToChannel(float32Data, 0);

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);

    const currentTime = context.currentTime;
    let startTime = nextStartTimeRef.current;
    if (startTime < currentTime) startTime = currentTime;
    
    source.start(startTime);
    nextStartTimeRef.current = startTime + buffer.duration;
    
    scheduledSourcesRef.current.add(source);
    source.onended = () => {
        scheduledSourcesRef.current.delete(source);
        if (scheduledSourcesRef.current.size === 0) setAudioLevel(0);
    };

    // Boost volume visually
    setAudioLevel(0.8); 
  };

  const cancelScheduledAudio = () => {
    scheduledSourcesRef.current.forEach(source => {
        try {
            source.stop();
        } catch (e) { }
    });
    scheduledSourcesRef.current.clear();
  };

  const cleanup = () => {
    if (status !== 'IDLE' && status !== 'ERROR') {
        setStatus('IDLE');
    }
    setErrorMessage('');
    cancelScheduledAudio();
    activeSessionRef.current = null;

    if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
    }
    if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
    }
    if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
    }
    if (inputContextRef.current) {
        inputContextRef.current.close();
        inputContextRef.current = null;
    }
    if (outputContextRef.current) {
        outputContextRef.current.close();
        outputContextRef.current = null;
    }
    nextStartTimeRef.current = 0;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center animate-fade-in">
       <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none"></div>
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(212,175,55,0.15),_rgba(0,0,0,0.95))] pointer-events-none"></div>

      <div className="w-full max-w-lg p-10 border-y border-xlnc-gold/20 bg-black/80 backdrop-blur-2xl relative flex flex-col items-center shadow-[0_0_100px_rgba(0,0,0,0.8)]">
        
        <button 
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-600 hover:text-red-500 transition-colors group"
        >
            <X size={24} className="group-hover:rotate-90 transition-transform duration-500" />
        </button>

        <div className="mb-12 text-center space-y-4 relative z-10">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 border border-xlnc-gold/30 bg-black shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                <div className={`w-2 h-2 ${status === 'ACTIVE' ? 'bg-xlnc-gold animate-pulse' : status === 'ERROR' ? 'bg-red-500' : 'bg-gray-600'}`}></div>
                <span className={`text-[10px] font-serif font-bold uppercase tracking-[0.3em] ${status === 'ERROR' ? 'text-red-500' : 'text-xlnc-gold'}`}>
                    {status === 'CONNECTING' ? 'ESTABLISHING NEURAL LINK...' : 
                     status === 'ERROR' ? 'UPLINK FAILURE' :
                     status === 'ACTIVE' ? 'THE ARCHITECT IS ONLINE' : 'SYSTEM IDLE'}
                </span>
            </div>
        </div>

        <div className="relative w-64 h-64 flex items-center justify-center mb-16">
            <div className={`absolute inset-0 border border-white/5 rounded-full ${status === 'ACTIVE' ? 'animate-[spin_20s_linear_infinite]' : ''}`}></div>
            <div className={`absolute inset-8 border border-xlnc-gold/20 rounded-full ${status === 'ACTIVE' ? 'animate-[spin_15s_linear_infinite_reverse]' : ''}`}></div>
            <div className={`absolute inset-16 border-t border-b border-xlnc-gold/40 rounded-full ${status === 'ACTIVE' ? 'animate-[spin_8s_linear_infinite]' : ''}`}></div>
            
            <div className="relative w-32 h-32 flex items-center justify-center">
                <div className={`absolute inset-0 bg-xlnc-gold/10 blur-xl rounded-full transition-all duration-75`}
                     style={{ transform: `scale(${1 + audioLevel})`, opacity: 0.5 + audioLevel }}
                ></div>
                <div className={`w-2 h-2 rounded-full shadow-[0_0_20px_white] ${status === 'ERROR' ? 'bg-red-500 shadow-red-500' : 'bg-white'}`}></div>
            </div>
        </div>

        <div className="flex items-center gap-8 relative z-10">
            <button 
                onClick={() => setIsMuted(!isMuted)}
                className={`w-16 h-16 flex items-center justify-center transition-all duration-300 border ${
                    isMuted 
                    ? 'bg-red-900/20 border-red-500/50 text-red-500' 
                    : 'bg-white/5 border-white/10 text-white hover:border-xlnc-gold hover:shadow-[0_0_20px_rgba(212,175,55,0.2)]'
                }`}
            >
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            
            <button 
                onClick={onClose}
                className="px-8 h-16 border border-white/10 bg-white/5 text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all duration-500"
            >
                Sever Uplink
            </button>
        </div>

        <div className="mt-12 w-full flex justify-between items-end border-t border-white/10 pt-6">
            <div className="flex items-center gap-3 text-[9px] text-xlnc-gold/60 font-mono uppercase">
                <Radio size={12} className={status === 'ACTIVE' ? 'animate-pulse' : ''} />
                <span>Encryption: AES-256</span>
            </div>
            <div className="flex items-center gap-3 text-[9px] text-gray-600 font-mono uppercase">
                <span>Latency: {status === 'ACTIVE' ? '12ms' : '--'}</span>
                <Zap size={12} />
            </div>
        </div>
        
        {status === 'ERROR' && (
            <div className="absolute bottom-4 w-full max-w-md px-6 flex justify-center">
                <div className="text-[10px] text-red-500 font-mono uppercase text-center bg-black/90 p-3 border border-red-500/20 flex items-center gap-2 animate-fade-in">
                    {errorMessage.includes("Unavailable") ? <WifiOff size={12} /> : <AlertCircle size={12} />}
                    <span>{errorMessage || "Connection Failed. Check Permissions."}</span>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default DiscoveryAgent;
