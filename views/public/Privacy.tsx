import React from 'react';
import { Lock, Eye, Database, ShieldCheck } from 'lucide-react';

const Privacy: React.FC = () => {
  return (
    <div className="pt-24 min-h-screen px-6 bg-xlnc-bg">
      <div className="max-w-4xl mx-auto py-20">
        
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center justify-center p-4 border border-white/10 rounded-full mb-6">
            <Lock size={24} className="text-xlnc-gold" />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif text-white mb-4">Privacy Protocol</h1>
          <p className="text-gray-500 font-mono uppercase tracking-widest text-xs">Data Sovereignty Level: 5 (Highest)</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="opulent-card p-8">
                <Database className="text-neon-cyan mb-6" size={32} />
                <h3 className="text-lg font-bold text-white mb-3 uppercase tracking-wide">Data Retention</h3>
                <p className="text-gray-400 text-sm font-light leading-relaxed">
                    We retain voice logs and transaction data solely for the purpose of refining your specific neural models. 
                    This data is siloed in isolated shards. It is never pooled with other client data.
                </p>
            </div>

            <div className="opulent-card p-8">
                <Eye className="text-status-alert mb-6" size={32} />
                <h3 className="text-lg font-bold text-white mb-3 uppercase tracking-wide">No Third-Party Sale</h3>
                <p className="text-gray-400 text-sm font-light leading-relaxed">
                    XLNC does not sell data. We are an infrastructure provider, not a data broker. 
                    Your leads, your transcripts, and your revenue metrics remain your sovereign property.
                </p>
            </div>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-8">
            <div className="bg-xlnc-panel border border-xlnc-border p-10">
                <h2 className="text-2xl font-serif text-white mb-6">Voice Biometrics & AI Training</h2>
                <div className="space-y-4 text-gray-400 font-light leading-relaxed">
                    <p>
                        When you utilize our Voice Agent Cloning services, you grant XLNC permission to process audio samples for the sole purpose of generating synthetic voice models.
                    </p>
                    <p>
                        These models are encrypted at rest using AES-256 standards. The "Voice Identity" created remains exclusive to your account instance. 
                        Upon account termination, the neural weights associated with your voice model are permanently purged from our GPU clusters.
                    </p>
                </div>
            </div>

            <div className="bg-xlnc-panel border border-xlnc-border p-10">
                <h2 className="text-2xl font-serif text-white mb-6">Operational Telemetry</h2>
                <div className="space-y-4 text-gray-400 font-light leading-relaxed">
                    <p>
                        We collect operational telemetry (latency, error rates, connection success) to maintain the stability of the Dominion Matrix. 
                        This meta-data is anonymized and used to optimize global routing protocols.
                    </p>
                </div>
            </div>
        </div>

        <div className="mt-12 flex items-center justify-center gap-4 opacity-70">
            <ShieldCheck size={16} className="text-xlnc-gold" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-gray-500">
                End-to-End Encryption Active
            </span>
        </div>

      </div>
    </div>
  );
};

export default Privacy;