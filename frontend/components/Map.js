import React, { useEffect, useRef, useState } from 'react';

const Map = ({ events }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);

  // Initialize map
  useEffect(() => {
    if (window.google && mapRef.current && !map) {
      const googleMap = new window.google.maps.Map(mapRef.current, {
        center: { lat: 37.5665, lng: 126.9780 }, // Default to Seoul
        zoom: 12,
      });
      setMap(googleMap);
    }
  }, [map]);

  // Update markers when events change
  useEffect(() => {
    if (map) {
      // Clear existing markers
      markers.forEach(marker => marker.setMap(null));
      
      const newMarkers = [];
      const bounds = new window.google.maps.LatLngBounds();
      let locationsFound = 0;

      events.forEach((event, index) => {
        if (event.coordinates) {
          locationsFound++;
          const position = new window.google.maps.LatLng(event.coordinates.lat, event.coordinates.lng);
          
          const marker = new window.google.maps.Marker({
            position,
            map,
            label: {
              text: `${index + 1}`,
              color: 'white',
            },
          });

          newMarkers.push(marker);
          bounds.extend(position);
        }
      });

      setMarkers(newMarkers);

      // Adjust map view to fit all markers
      if (locationsFound > 0) {
        map.fitBounds(bounds);
        // Prevent zooming too far in if there's only one marker
        if (locationsFound === 1) {
          map.setZoom(14);
        }
      }
    }
  }, [events, map]);

  return (
    <div style={{ height: '100%', width: '100%' }} ref={mapRef}>
      {/* The map will be rendered here */}
    </div>
  );
};

export default Map;
