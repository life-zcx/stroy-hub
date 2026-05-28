import { useState, useEffect } from 'react';
import { findClosestCity } from '../utils/geo';

export default function useRegion(showToast) {
  const [currentRegion, setCurrentRegion] = useState(() => {
    return localStorage.getItem('tormag_region') || 'Алматы';
  });
  const [regionModalOpen, setRegionModalOpen] = useState(false);

  useEffect(() => {
    const savedRegion = localStorage.getItem('tormag_region');
    
    if (!savedRegion) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const cityName = findClosestCity(position.coords.latitude, position.coords.longitude);
            handleSelectRegion(cityName);
            showToast?.(`📍 Мы определили ваш город: ${cityName}`);
          },
          () => {
            // If denied or error, open the modal
            setRegionModalOpen(true);
          }
        );
      } else {
        setRegionModalOpen(true);
      }
    }
  }, []);

  const handleSelectRegion = (region) => {
    setCurrentRegion(region);
    localStorage.setItem('tormag_region', region);
    setRegionModalOpen(false);
  };

  return {
    currentRegion,
    regionModalOpen,
    setRegionModalOpen,
    handleSelectRegion,
  };
}
