
import React, { useState, useEffect, useRef } from 'react';

interface CrimeReportProps {
  report: string;
  details: string;
  title?: string;
  themeColor?: string;
}

const CrimeReport: React.FC<CrimeReportProps> = ({ report, details, title = "Summary", themeColor = 'red' }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Theme-based colors
  const titleColor = themeColor === 'red' ? 'text-red-400' : 'text-emerald-400';
  const buttonHover = themeColor === 'red' ? 'hover:bg-red-600/80 focus:ring-red-500' : 'hover:bg-emerald-600/80 focus:ring-emerald-500';
  const expandColor = themeColor === 'red' ? 'text-blue-400 hover:text-blue-300' : 'text-emerald-400 hover:text-emerald-300';

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      console.warn("Speech Synthesis not supported in this browser.");
      return;
    }

    const synth = window.speechSynthesis;
    const u = new SpeechSynthesisUtterance(report);
    utteranceRef.current = u;

    u.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    u.onpause = () => {
      setIsPaused(true);
    };

    u.onresume = () => {
      setIsPaused(false);
    };

    u.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    return () => {
      synth.cancel();
    };
  }, [report]);

  const handlePlayPause = () => {
    const synth = window.speechSynthesis;
    if (!utteranceRef.current) return;

    if (!isSpeaking) {
      synth.speak(utteranceRef.current);
    } else if (isPaused) {
      synth.resume();
    } else {
      synth.pause();
    }
  };

  const handleStop = () => {
    const synth = window.speechSynthesis;
    synth.cancel();
  };

  const isSpeechSupported = 'speechSynthesis' in window;
  const hasDetails = details && details.trim() !== '';

  return (
    <div className="bg-gray-800/50 p-6 rounded-lg shadow-lg backdrop-blur-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className={`text-2xl font-bold ${titleColor}`}>{title}</h2>
        {isSpeechSupported && report && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePlayPause}
              title={isSpeaking && !isPaused ? "Pause" : "Play Summary"}
              className={`p-2 rounded-full bg-gray-700 focus:outline-none focus:ring-2 transition-colors ${buttonHover}`}
              aria-label={isSpeaking && !isPaused ? "Pause audio" : "Play audio"}
            >
              {isSpeaking && !isPaused ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v4a1 1 0 11-2 0V8z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            {isSpeaking && (
              <button
                onClick={handleStop}
                title="Stop"
                className={`p-2 rounded-full bg-gray-700 focus:outline-none focus:ring-2 transition-colors ${buttonHover}`}
                aria-label="Stop audio"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 8a2 2 0 00-2 2v0a2 2 0 002 2h4a2 2 0 002-2v0a2 2 0 00-2-2H8z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
      <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap">
        {report}
      </div>

      <div className="mt-4 border-t border-gray-700/50">
        {hasDetails ? (
          <div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`flex items-center ${expandColor} focus:outline-none w-full text-left pt-4`}
              aria-expanded={isExpanded}
              aria-controls="crime-report-details"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 transform transition-transform duration-300 ${ isExpanded ? 'rotate-180' : '' }`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">{isExpanded ? 'Show Less' : 'Show More Details'}</span>
            </button>
            <div
              id="crime-report-details"
              className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
            >
              <div className="overflow-hidden">
                <div className="pt-2 pb-4 prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap">
                  {details}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="pt-4 text-gray-500 italic">No further details available.</p>
        )}
      </div>
    </div>
  );
};

export default CrimeReport;
