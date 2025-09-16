import React, { useEffect, useRef } from "react";

const Map = () => {
  const mapRef = useRef(null);

  useEffect(() => {
    if (window.google && mapRef.current) {
      new window.google.maps.Map(mapRef.current, {
        center: { lat: 37.5665, lng: 126.978 }, // Default to Seoul
        zoom: 12,
      });
    }
  }, []);

  return (
    <div style={{ height: "100%", width: "100%" }} ref={mapRef}>
      {/* The map will be rendered here */}
    </div>
  );
};

export default Map;
