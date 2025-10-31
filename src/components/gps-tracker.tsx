'use client';

import { useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import type { GeoJSON } from 'geojson';

interface GpsTrackerProps {
  onLocationUpdate: (location: GeoJSON.Point) => void;
}

export default function GpsTracker({ onLocationUpdate }: GpsTrackerProps) {
  const { toast } = useToast();

  useEffect(() => {
    if (!navigator.geolocation) {
      toast({
        variant: 'destructive',
        title: 'Geolocation Error',
        description: 'Geolocation is not supported by your browser.',
      });
      return;
    }

    const handleSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      const locationPoint: GeoJSON.Point = {
        type: 'Point',
        coordinates: [longitude, latitude],
      };
      onLocationUpdate(locationPoint);
    };

    const handleError = (error: GeolocationPositionError) => {
        let description = 'An unknown error occurred while fetching your location.';
        if (error.code === error.PERMISSION_DENIED) {
            description = 'Geolocation access was denied. L\'Ombre is disappointed.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
            description = 'Your location information is unavailable.';
        } else if (error.code === error.TIMEOUT) {
            description = 'The request to get your location timed out.';
        }
        
      toast({
        variant: 'destructive',
        title: 'Geolocation Error',
        description: description
      });
    };

    const watcherId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });

    // Cleanup watcher on component unmount
    return () => {
      navigator.geolocation.clearWatch(watcherId);
    };
  }, [onLocationUpdate, toast]);

  return null; // This component does not render anything
}
