import { useCallback, useState } from "react";

export function useGeolocation() {
  const [coordinates, setCoordinates] = useState(null);
  const [locationError, setLocationError] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  const requestLocation = useCallback(() => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        const message = "Geolocation is not supported on this device.";
        setLocationError(message);
        resolve({ coordinates: null, error: message });
        return;
      }

      setIsLocating(true);
      setLocationError("");

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };

          setCoordinates(coords);
          setIsLocating(false);
          resolve({ coordinates: coords, error: null });
        },
        (error) => {
          const message =
            error.code === error.PERMISSION_DENIED
              ? "Location permission denied. SOS will be sent without coordinates."
              : "Could not get GPS coordinates. SOS will be sent without location.";

          setLocationError(message);
          setIsLocating(false);
          resolve({ coordinates: null, error: message });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }, []);

  return { coordinates, locationError, isLocating, requestLocation };
}
