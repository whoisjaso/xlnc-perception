// Divine Agentic Intelligence System - PRISM Analytics
// Behavioral analysis visualization and insights

import React, { useState } from 'react';
import {
  Brain,
  Loader,
  TrendingUp,
  Users,
  Target,
  Zap
} from 'lucide-react';
import { divineApi, AnalysisResult } from '../../src/services/divine';

interface PRISMBarProps {
  label: string;
  value: number;
  color: string;
  description?: string;
}

const PRISMBar: React.FC<PRISMBarProps> = ({ label, value, color, description }) => (
  <div className="mb-3">
    <div className="flex justify-between items-center mb-1">
      <span className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</span>
      <span className="text-[10px] text-white font-bold">{value}</span>
    </div>
    <div className="h-2 bg-white/5 overflow-hidden">
      <div
        className={`h-full transition-all duration-500 ${color}`}
        style={{ width: `${value}%` }}
      />
    </div>
    {description && <div className="text-[9px] text-gray-600 mt-1">{description}</div>}
  </div>
);

const PRISMAnalytics: React.FC = () => {
  const [transcript, setTranscript] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!transcript.trim()) return;

    try {
      setIsAnalyzing(true);
      setError(null);
      const result = await divineApi.analyzeTranscript(transcript);
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getNeedColor = (need: string): string => {
    const colors: Record<string, string> = {
      certainty: 'bg-blue-500',
      variety: 'bg-purple-500',
      significance: 'bg-xlnc-gold',
      connection: 'bg-pink-500',
      growth: 'bg-emerald-500',
      contribution: 'bg-cyan-500',
    };
    return colors[need] || 'bg-gray-500';
  };

  const getNeedDescription = (need: string): string => {
    const descriptions: Record<string, string> = {
      certainty: 'Need for security, stability, predictability',
      variety: 'Need for change, stimulation, challenge',
      significance: 'Need to feel important, special, unique',
      connection: 'Need for love, bonding, belonging',
      growth: 'Need for learning, expanding, developing',
      contribution: 'Need to give, help, make a difference',
    };
    return descriptions[need] || '';
  };

  const getIntentColor = (intent: string): string => {
    const colors: Record<string, string> = {
      booking_request: 'text-emerald-500 bg-emerald-500/10',
      sales_opportunity: 'text-xlnc-gold bg-xlnc-gold/10',
      complaint: 'text-red-500 bg-red-500/10',
      support_request: 'text-blue-500 bg-blue-500/10',
      information_inquiry: 'text-purple-500 bg-purple-500/10',
    };
    return colors[intent] || 'text-gray-500 bg-gray-500/10';
  };

  return (
    <div className="bg-[#0A0A0A] border border-white/5 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Brain size={18} className="text-xlnc-gold" />
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">PRISM Behavioral Analysis</h3>
      </div>

      {/* Input Area */}
      <div className="mb-6">
        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Transcript Input</div>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Paste a conversation transcript to analyze..."
          className="w-full h-32 bg-black border border-white/10 p-3 text-sm text-white placeholder-gray-600 focus:border-xlnc-gold/50 focus:outline-none resize-none"
        />
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !transcript.trim()}
          className="mt-3 w-full py-3 bg-xlnc-gold/10 border border-xlnc-gold/30 text-xlnc-gold text-[10px] font-bold uppercase tracking-wider hover:bg-xlnc-gold hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? (
            <span className="flex items-center justify-center gap-2">
              <Loader size={12} className="animate-spin" /> Analyzing...
            </span>
          ) : (
            'Analyze Transcript'
          )}
        </button>
        {error && (
          <div className="mt-2 text-[10px] text-red-500">{error}</div>
        )}
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Intent Classification */}
          <div className="border border-white/5 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Target size={14} className="text-gray-500" />
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Intent Classification</span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className={`px-3 py-1.5 text-sm font-bold uppercase ${getIntentColor(analysis.intent.intent)}`}>
                {analysis.intent.intent.replace(/_/g, ' ')}
              </span>
              <span className="text-[10px] text-gray-500">
                Confidence: <span className="text-white font-bold">{Math.round(analysis.intent.confidence * 100)}%</span>
              </span>
            </div>
            <div className="flex items-center gap-4 text-[10px]">
              <span className={`px-2 py-0.5 ${analysis.intent.actionRequired ? 'bg-yellow-500/10 text-yellow-500' : 'bg-gray-500/10 text-gray-500'}`}>
                {analysis.intent.actionRequired ? 'Action Required' : 'No Action'}
              </span>
              <span className={`px-2 py-0.5 ${
                analysis.intent.urgency === 'high' ? 'bg-red-500/10 text-red-500' :
                analysis.intent.urgency === 'medium' ? 'bg-yellow-500/10 text-yellow-500' :
                'bg-gray-500/10 text-gray-500'
              }`}>
                {analysis.intent.urgency.toUpperCase()} Urgency
              </span>
            </div>

            {/* Extracted Entities */}
            {Object.keys(analysis.intent.entities).length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/5">
                <div className="text-[9px] text-gray-500 uppercase mb-2">Extracted Entities</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(analysis.intent.entities).map(([key, value]) => (
                    <span key={key} className="text-[10px] px-2 py-1 bg-white/5 border border-white/10">
                      <span className="text-gray-500">{key}:</span>{' '}
                      <span className="text-white">{value}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* PRISM Scores */}
          {analysis.prism && (
            <div className="border border-white/5 p-4">
              <div className="flex items-center gap-2 mb-4">
                <Zap size={14} className="text-xlnc-gold" />
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">Psychological Profile</span>
              </div>

              {/* Dominant Needs */}
              {analysis.prism.dominantNeeds.length > 0 && (
                <div className="mb-4">
                  <div className="text-[9px] text-gray-600 mb-2">Dominant Needs</div>
                  <div className="flex gap-2">
                    {analysis.prism.dominantNeeds.map((need, i) => (
                      <span
                        key={need}
                        className={`px-3 py-1.5 text-[10px] font-bold uppercase border ${
                          i === 0
                            ? 'border-xlnc-gold/30 text-xlnc-gold bg-xlnc-gold/10'
                            : 'border-white/10 text-gray-400'
                        }`}
                      >
                        {need}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Score Bars */}
              <div className="space-y-1">
                {Object.entries(analysis.prism.scores).map(([need, score]) => (
                  <PRISMBar
                    key={need}
                    label={need}
                    value={score}
                    color={getNeedColor(need)}
                    description={getNeedDescription(need)}
                  />
                ))}
              </div>

              {/* Communication Style */}
              {analysis.prism.communicationStyle && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <div className="text-[9px] text-gray-500 uppercase mb-2">Recommended Communication Style</div>
                  <div className="text-sm text-white">{analysis.prism.communicationStyle}</div>
                </div>
              )}

              {/* Calibration Guide */}
              {analysis.prism.calibrationGuide && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <div className="text-[9px] text-gray-500 uppercase mb-2">Calibration Guide</div>
                  <div className="text-[11px] text-gray-400 whitespace-pre-wrap">
                    {analysis.prism.calibrationGuide}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Processing Info */}
          <div className="text-[10px] text-gray-600 text-right">
            Analyzed in {analysis.processingTimeMs}ms
          </div>
        </div>
      )}

      {/* Empty State */}
      {!analysis && !isAnalyzing && (
        <div className="border border-dashed border-white/10 p-8 text-center">
          <Brain size={32} className="text-gray-700 mx-auto mb-3" />
          <div className="text-sm text-gray-500 mb-2">No Analysis Yet</div>
          <div className="text-[10px] text-gray-600">
            Paste a conversation transcript above to analyze behavioral patterns
          </div>
        </div>
      )}
    </div>
  );
};

export default PRISMAnalytics;
