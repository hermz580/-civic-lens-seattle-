
import React, { useState, useEffect, useRef } from 'react';

interface SearchFormProps {
  query: string;
  setQuery: (query: string) => void;
  category: string;
  setCategory: (category: string) => void;
  categories: string[];
  handleSearch: (e: React.FormEvent) => void;
  isLoading: boolean;
  themeColor: string;
  onImageCapture: (base64: string | null) => void;
  capturedImage: string | null;
}

const SearchForm: React.FC<SearchFormProps> = ({ 
  query, 
  setQuery, 
  category, 
  setCategory, 
  categories, 
  handleSearch, 
  isLoading,
  themeColor,
  onImageCapture,
  capturedImage
}) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const focusRingClass = themeColor === 'red' ? 'focus:ring-red-500' : 'focus:ring-emerald-500';
  const buttonBgClass = themeColor === 'red' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700';
  const pulseClass = themeColor === 'red' ? 'text-red-500' : 'text-emerald-500';

  useEffect(() => {
    const WindowWithSpeech = window as any;
    const SpeechRecognition = WindowWithSpeech.SpeechRecognition || WindowWithSpeech.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => setQuery(event.results[0][0].transcript);
    recognitionRef.current = recognition;
  }, [setQuery]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageCapture(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 w-full">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          disabled={isLoading}
          className={`bg-gray-800 text-white border border-gray-700 rounded-md px-4 py-3 focus:outline-none focus:ring-2 ${focusRingClass} transition-all`}
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        
        <div className="relative flex-grow">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={themeColor === 'red' ? "e.g., 'theft in Ballard'" : "e.g., 'volunteer events'"}
            className={`w-full bg-gray-800 text-white placeholder-gray-500 border border-gray-700 rounded-md pl-4 pr-24 py-3 focus:outline-none focus:ring-2 ${focusRingClass} transition-all`}
            disabled={isLoading}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 space-x-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Upload image witness"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => recognitionRef.current?.start()}
              className={`p-2 text-gray-400 hover:text-white transition-colors ${isListening ? `${pulseClass} animate-pulse` : ''}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-14 0m7 7v4m0 0H8m4 0h2m-4-8a3 3 0 01-6 0V6a3 3 0 016 0v2z" />
              </svg>
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`${buttonBgClass} text-white font-bold py-3 px-8 rounded-md transition-all flex items-center justify-center disabled:opacity-50`}
        >
          {isLoading ? 'Searching...' : 'Explore'}
        </button>
      </form>

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

      {capturedImage && (
        <div className="relative inline-block mt-2">
          <img src={capturedImage} alt="Preview" className="h-20 w-20 object-cover rounded-md border-2 border-blue-500 shadow-lg" />
          <button 
            onClick={() => onImageCapture(null)}
            className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow-lg hover:bg-red-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <span className="text-xs text-blue-400 block mt-1">Image Witness Attached</span>
        </div>
      )}
    </div>
  );
};

export default SearchForm;
