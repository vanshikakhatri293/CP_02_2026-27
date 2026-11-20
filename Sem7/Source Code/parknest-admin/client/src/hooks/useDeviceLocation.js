import { useCallback, useState } from 'react';

const useDeviceLocation = () => {
  const [location, setLocation] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('error');
      setError('Location services are not supported by this browser.');
      return;
    }

    setStatus('loading');
    setError('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation({ latitude: coords.latitude, longitude: coords.longitude });
        setStatus('ready');
      },
      (locationError) => {
        setStatus('error');
        setError(
          locationError.code === locationError.PERMISSION_DENIED
            ? 'Location permission was denied. Enable it in your browser to sort nearby places.'
            : 'Could not get your location. Check your connection and try again.'
        );
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 }
    );
  }, []);

  return { location, status, error, locate };
};

export default useDeviceLocation;
