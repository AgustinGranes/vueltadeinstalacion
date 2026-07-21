import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sun, Moon, CloudSun, CloudMoon, Cloud, CloudFog, 
  CloudDrizzle, CloudRain, CloudSnow, CloudLightning
} from 'lucide-react';
import { getWeatherForSession, getWeatherConditionName } from '../services/weatherService';
import type { WeatherData } from '../services/weatherService';

interface WeatherWidgetProps {
  lat: number;
  long: number;
  timestamp: number;
}

export function WeatherWidget({ lat, long, timestamp }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getWeatherForSession(lat, long, timestamp).then(data => {
      if (mounted) {
        setWeather(data);
        setLoading(false);
      }
    }).catch(() => {
      if (mounted) setLoading(false);
    });

    return () => { mounted = false; };
  }, [lat, long, timestamp]);

  // Handle clicking outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        // Also check if they clicked inside the portal tooltip
        const tooltipEl = document.getElementById('weather-tooltip-portal');
        if (tooltipEl && tooltipEl.contains(event.target as Node)) {
          return;
        }
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate and update portal position
  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCoords({
          top: rect.top + window.scrollY - 8,
          left: rect.left + window.scrollX + rect.width / 2
        });
      }
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  if (loading || !weather) return null;

  const renderIcon = (size = 16, color = '#fff') => {
    const { weatherCode: code, isDay } = weather;
    if (code === 0) return isDay ? <Sun size={size} color={color} /> : <Moon size={size} color={color} />;
    if (code === 1 || code === 2) return isDay ? <CloudSun size={size} color={color} /> : <CloudMoon size={size} color={color} />;
    if (code === 3) return <Cloud size={size} color={color} />;
    if (code === 45 || code === 48) return <CloudFog size={size} color={color} />;
    if (code >= 51 && code <= 57) return <CloudDrizzle size={size} color={color} />;
    if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return <CloudRain size={size} color={color} />;
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return <CloudSnow size={size} color={color} />;
    if (code >= 95 && code <= 99) return <CloudLightning size={size} color={color} />;
    return <Cloud size={size} color={color} />;
  };
  return (
    <div className="weather-widget-container" ref={containerRef} style={{ position: 'relative', display: 'inline-flex' }}>
      <button 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'none',
          border: 'none',
          padding: '2px 6px',
          cursor: 'pointer',
          borderRadius: '4px',
          color: '#fff',
          fontSize: '14px',
          fontWeight: 'bold',
          transition: 'background 0.2s',
          backgroundColor: isOpen ? 'rgba(255,255,255,0.1)' : 'transparent'
        }}
      >
        {renderIcon(16)}
        <span>{weather.temperature}°C</span>
        {weather.rainChance > 0 && (
          <span style={{ color: '#3b82f6', marginLeft: '2px' }}>{weather.rainChance}%</span>
        )}
      </button>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              id="weather-tooltip-portal"
              initial={{ opacity: 0, y: 5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'absolute',
                top: `${coords.top}px`,
                left: `${coords.left}px`,
                transform: 'translate(-50%, -100%)',
                background: '#0d1621',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '12px',
                minWidth: '160px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                zIndex: 99999,
                cursor: 'default'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                {renderIcon(20)}
                <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#fff' }}>
                  {getWeatherConditionName(weather.weatherCode)}
                </span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#9ca3af' }}>Temperatura</span>
                  <span style={{ color: '#fff', fontWeight: 'bold' }}>{weather.temperature}°C</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#9ca3af' }}>Prob. Lluvia</span>
                  <span style={{ color: '#fff', fontWeight: 'bold' }}>{weather.rainChance}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#9ca3af' }}>Precipitación</span>
                  <span style={{ color: '#fff', fontWeight: 'bold' }}>{weather.rainfall} mm</span>
                </div>
              </div>
              
              {/* Tooltip Arrow */}
              <div style={{
                position: 'absolute',
                bottom: '-5px',
                left: '50%',
                transform: 'translateX(-50%) rotate(45deg)',
                width: '10px',
                height: '10px',
                background: '#0d1621',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                borderRight: '1px solid rgba(255,255,255,0.1)'
              }} />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
