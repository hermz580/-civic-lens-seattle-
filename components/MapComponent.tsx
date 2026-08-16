
import React, { useEffect, useRef } from 'react';
import { Location, ReportMode } from '../types';

declare const L: any;

interface MapComponentProps {
  locations: Location[];
  onAreaChange: (area: any | null) => void;
  mode: ReportMode;
}

const MapComponent: React.FC<MapComponentProps> = ({ locations, onAreaChange, mode }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any | null>(null);
  const heatLayerRef = useRef<any | null>(null);
  const markersRef = useRef<any[]>([]);
  const drawnItemsRef = useRef<any | null>(null);

  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, {
        center: [47.6062, -122.3321],
        zoom: 11,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(mapInstance.current);
      
      drawnItemsRef.current = new L.FeatureGroup();
      mapInstance.current.addLayer(drawnItemsRef.current);

      const drawControl = new L.Control.Draw({
        edit: { featureGroup: drawnItemsRef.current },
        draw: {
          polygon: true,
          rectangle: true,
          circle: false,
          polyline: false,
          marker: false,
          circlemarker: false,
        },
      });
      mapInstance.current.addControl(drawControl);

      mapInstance.current.on(L.Draw.Event.CREATED, (e: any) => {
        drawnItemsRef.current.clearLayers();
        drawnItemsRef.current.addLayer(e.layer);
        onAreaChange(e.layer.toGeoJSON());
      });
      mapInstance.current.on(L.Draw.Event.DELETED, () => onAreaChange(null));

      setTimeout(() => {
        if (mapInstance.current) {
          mapInstance.current.invalidateSize();
        }
      }, 200);
    }
  }, [onAreaChange]);

  useEffect(() => {
    if (mapInstance.current) {
      mapInstance.current.invalidateSize();
      
      // Clear heat
      if (heatLayerRef.current) mapInstance.current.removeLayer(heatLayerRef.current);
      // Clear markers
      markersRef.current.forEach(m => mapInstance.current.removeLayer(m));
      markersRef.current = [];

      if (locations.length > 0) {
        const points = locations.map(l => [l.lat, l.lng, 0.5]);
        const gradient = mode === 'crime' 
            ? { 0.4: '#3b82f6', 0.6: '#eab308', 1.0: '#ef4444' }
            : { 0.4: '#10b981', 0.6: '#34d399', 1.0: '#6366f1' };

        heatLayerRef.current = L.heatLayer(points, {
          radius: 20, blur: 15, gradient
        }).addTo(mapInstance.current);

        // Add detailed markers
        locations.forEach(loc => {
          const marker = L.circleMarker([loc.lat, loc.lng], {
            radius: 8,
            fillColor: mode === 'crime' ? '#ef4444' : '#10b981',
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
          }).addTo(mapInstance.current)
            .bindPopup(`<div class="text-gray-900 font-bold p-1">${loc.description}</div>`);
          markersRef.current.push(marker);
        });
        
        if (drawnItemsRef.current.getLayers().length === 0) {
          const bounds = L.latLngBounds(locations.map(loc => [loc.lat, loc.lng]));
          mapInstance.current.fitBounds(bounds.pad(0.2));
        }
      }
    }
  }, [locations, mode]);

  return (
    <div className="relative z-0 isolate overflow-hidden rounded-2xl border border-gray-700 shadow-2xl bg-gray-950">
      <div id="map" ref={mapRef} className="w-full" style={{ height: '420px' }} />
    </div>
  );
};

export default MapComponent;

