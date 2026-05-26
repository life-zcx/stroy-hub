import { useState } from 'react';

export default function useRegion(showToast) {
  const [currentRegion, setCurrentRegion] = useState(() => {
    return localStorage.getItem('stroyhub_region') || 'Алматы и область';
  });
  const [regionModalOpen, setRegionModalOpen] = useState(() => {
    return !localStorage.getItem('stroyhub_region');
  });

  const handleSelectRegion = (region) => {
    setCurrentRegion(region);
    localStorage.setItem('stroyhub_region', region);
    setRegionModalOpen(false);
    showToast?.(`📍 Ваш регион: ${region}`);
  };

  return {
    currentRegion,
    regionModalOpen,
    setRegionModalOpen,
    handleSelectRegion,
  };
}
