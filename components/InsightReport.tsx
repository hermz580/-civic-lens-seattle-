
import React from 'react';

interface InsightReportProps {
  insight: string;
  sentimentScore: number;
  mode: 'crime' | 'good_deed';
}

const InsightReport: React.FC<InsightReportProps> = ({ insight, sentimentScore, mode }) => {
  if (!insight) return null;

  const isCrime = mode === 'crime';
  const label = isCrime ? 'Risk Level' : 'Community Spirit';
  
  // Calculate color based on sentiment
  // Crime: Low (0) = Green, High (100) = Red
  // Good Deed: Low (0) = Gray, High (100) = Emerald
  let colorClass = "text-emerald-400";
  if (isCrime) {
      if (sentimentScore > 70) colorClass = "text-red-500";
      else if (sentimentScore > 30) colorClass = "text-yellow-500";
  } else {
      if (sentimentScore > 70) colorClass = "text-emerald-400";
      else if (sentimentScore > 30) colorClass = "text-teal-400";
      else colorClass = "text-gray-400";
  }

  const circumference = 2 * Math.PI * 18;
  const offset = circumference - (sentimentScore / 100) * circumference;

  return (
    <div className="bg-gray-800/80 p-6 rounded-lg shadow-xl border-l-4 border-blue-500 backdrop-blur-md flex flex-col md:flex-row items-center gap-6">
      <div className="relative flex-shrink-0">
        <svg className="w-24 h-24 transform -rotate-90">
          <circle cx="48" cy="48" r="18" fill="transparent" stroke="#374151" strokeWidth="4" />
          <circle 
            cx="48" cy="48" r="18" fill="transparent" 
            stroke="currentColor" strokeWidth="4" 
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={`transition-all duration-1000 ease-out ${colorClass}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xl font-black ${colorClass}`}>{sentimentScore}%</span>
        </div>
        <p className="text-[10px] uppercase font-bold text-center mt-1 text-gray-500">{label}</p>
      </div>
      
      <div className="flex-grow">
        <h3 className="text-xl font-bold text-blue-400 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
          </svg>
          Neighborhood Pulse
        </h3>
        <p className="mt-2 text-gray-300 italic leading-relaxed">"{insight}"</p>
      </div>
    </div>
  );
};

export default InsightReport;
