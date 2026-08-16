
import { type Alert } from '../types';

const ALERTS_STORAGE_KEY = 'crime-watch-alerts';

export function getAlerts(): Alert[] {
  try {
    const alertsJson = localStorage.getItem(ALERTS_STORAGE_KEY);
    if (!alertsJson) return [];
    
    const parsedAlerts = JSON.parse(alertsJson);
    // Migration: ensure 'mode' exists for older alerts
    return parsedAlerts.map((alert: any) => ({
      ...alert,
      mode: alert.mode || 'crime'
    }));
  } catch (error) {
    console.error("Failed to parse alerts from localStorage", error);
    return [];
  }
}

export function saveAlerts(alerts: Alert[]): void {
  try {
    localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
  } catch (error) {
    console.error("Failed to save alerts to localStorage", error);
  }
}

export function addAlert(newAlert: Omit<Alert, 'id'>): Alert {
  const alerts = getAlerts();
  const alertWithId: Alert = {
    ...newAlert,
    id: crypto.randomUUID(),
  };
  const updatedAlerts = [...alerts, alertWithId];
  saveAlerts(updatedAlerts);
  return alertWithId;
}

export function updateAlert(updatedAlert: Alert): void {
  const alerts = getAlerts();
  const index = alerts.findIndex(a => a.id === updatedAlert.id);
  if (index !== -1) {
    alerts[index] = updatedAlert;
    saveAlerts(alerts);
  }
}

export function deleteAlert(alertId: string): void {
  const alerts = getAlerts();
  const updatedAlerts = alerts.filter(a => a.id !== alertId);
  saveAlerts(updatedAlerts);
}
