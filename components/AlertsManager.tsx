
import React, { useState, useEffect } from 'react';
import { type Alert, type ReportMode } from '../types';
import * as alertService from '../services/alertService';

interface AlertsManagerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: Alert[];
  onAlertsChange: (alerts: Alert[]) => void;
  crimeCategories: string[];
  goodDeedCategories: string[];
  currentArea: any | null;
}

const AlertsManager: React.FC<AlertsManagerProps> = ({
  isOpen,
  onClose,
  alerts,
  onAlertsChange,
  crimeCategories,
  goodDeedCategories,
  currentArea,
}) => {
  const [alertName, setAlertName] = useState('');
  const [alertMode, setAlertMode] = useState<ReportMode>('crime');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);

  const activeCategories = alertMode === 'crime' ? crimeCategories : goodDeedCategories;

  useEffect(() => {
    if (isOpen) {
      setNotificationPermission(Notification.permission);
    }
  }, [isOpen]);

  const handleRequestPermission = async () => {
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleAddAlert = () => {
    if (!alertName.trim() || !currentArea) {
      alert('Please provide a name and draw an area on the map.');
      return;
    }
    const newAlert: Omit<Alert, 'id'> = {
      name: alertName,
      mode: alertMode,
      categories: selectedCategories,
      area: currentArea,
      isActive: true,
      lastChecked: Date.now(),
      lastResultHash: null,
    };
    const addedAlert = alertService.addAlert(newAlert);
    onAlertsChange([...alerts, addedAlert]);
    setAlertName('');
    setSelectedCategories([]);
  };
  
  const handleToggleAlert = (alert: Alert) => {
    const updatedAlert = { ...alert, isActive: !alert.isActive };
    alertService.updateAlert(updatedAlert);
    onAlertsChange(alerts.map(a => a.id === alert.id ? updatedAlert : a));
  };
  
  const handleDeleteAlert = (alertId: string) => {
    alertService.deleteAlert(alertId);
    onAlertsChange(alerts.filter(a => a.id !== alertId));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-blue-400">Manage Alerts</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
          </div>
        </div>

        {notificationPermission !== 'granted' && (
          <div className="p-6 bg-yellow-900/50 text-yellow-300">
            <p className="font-bold mb-2">Notifications Disabled</p>
            <p className="mb-4">To receive alerts, you need to grant notification permissions for this site.</p>
            <button onClick={handleRequestPermission} className="bg-yellow-600 text-white font-bold py-2 px-4 rounded hover:bg-yellow-700">
              Enable Notifications
            </button>
          </div>
        )}

        <div className="p-6 space-y-6">
          <div className="bg-gray-700/50 p-4 rounded-lg">
            <h3 className="text-xl font-semibold mb-3 text-gray-200">Create New Alert</h3>
            <div className="space-y-4">
              <input
                type="text"
                value={alertName}
                onChange={e => setAlertName(e.target.value)}
                placeholder="Alert Name (e.g., 'Home Area')"
                className="w-full bg-gray-800 text-white placeholder-gray-400 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <div>
                 <p className="mb-2 text-gray-400">Alert Type:</p>
                 <div className="flex space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input 
                            type="radio" 
                            name="alertMode" 
                            value="crime" 
                            checked={alertMode === 'crime'} 
                            onChange={() => { setAlertMode('crime'); setSelectedCategories([]); }}
                            className="form-radio text-red-500 focus:ring-red-500"
                        />
                        <span className={alertMode === 'crime' ? 'text-white' : 'text-gray-400'}>Crime Watch</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input 
                            type="radio" 
                            name="alertMode" 
                            value="good_deed" 
                            checked={alertMode === 'good_deed'} 
                            onChange={() => { setAlertMode('good_deed'); setSelectedCategories([]); }}
                            className="form-radio text-emerald-500 focus:ring-emerald-500"
                        />
                        <span className={alertMode === 'good_deed' ? 'text-white' : 'text-gray-400'}>Good Deed Watch</span>
                    </label>
                 </div>
              </div>

              <div>
                <p className="mb-2 text-gray-400">Select Categories (optional):</p>
                <div className="flex flex-wrap gap-2">
                  {activeCategories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => handleCategoryToggle(cat)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        selectedCategories.includes(cat)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleAddAlert}
                disabled={!currentArea || !alertName.trim()}
                className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed"
              >
                {currentArea ? 'Create Alert for Drawn Area' : 'Draw an Area on the Map to Create an Alert'}
              </button>
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-3 text-gray-200">Your Alerts</h3>
            <div className="space-y-3">
              {alerts.length === 0 ? (
                <p className="text-gray-500">You have no saved alerts.</p>
              ) : (
                alerts.map(alert => (
                  <div key={alert.id} className="bg-gray-700/50 p-4 rounded-lg flex justify-between items-center border-l-4 border-transparent" 
                       style={{ borderColor: alert.mode === 'crime' ? '#ef4444' : '#10b981' }}>
                    <div>
                      <div className="flex items-center space-x-2">
                          <p className="font-bold text-white">{alert.name}</p>
                          <span className={`text-xs px-2 py-0.5 rounded ${alert.mode === 'crime' ? 'bg-red-900/50 text-red-200' : 'bg-emerald-900/50 text-emerald-200'}`}>
                             {alert.mode === 'crime' ? 'Crime' : 'Good Deed'}
                          </span>
                      </div>
                      <p className="text-sm text-gray-400">{alert.categories.length > 0 ? alert.categories.join(', ') : 'All Categories'}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <label htmlFor={`toggle-${alert.id}`} className="flex items-center cursor-pointer">
                        <div className="relative">
                          <input type="checkbox" id={`toggle-${alert.id}`} className="sr-only" checked={alert.isActive} onChange={() => handleToggleAlert(alert)} />
                          <div className={`block w-14 h-8 rounded-full ${alert.isActive ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                          <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${alert.isActive ? 'transform translate-x-6' : ''}`}></div>
                        </div>
                      </label>
                      <button onClick={() => handleDeleteAlert(alert.id)} className="text-red-500 hover:text-red-400" title="Delete Alert">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertsManager;
