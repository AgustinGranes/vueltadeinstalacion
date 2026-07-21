import { useEffect, useState, useRef, useCallback } from 'react';
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
  const btnRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, arrowLeft: 0 });

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

  const calcPosition = useCallback(() => {
    if (!btnRef.current || !tooltipRef.current) return;
    const btnRect = btnRef.current.getBoundingClientRect();
    const tipRect = tooltipRef.current.getBoundingClientRect();
    const ARROW_GAP = 8;

    // Center of the button in viewport
    const btnCenterX = btnRect.left + btnRect.width / 2;

    // Ideal left = button center - half tooltip width
    let idealLeft = btnCenterX - tipRect.width / 2;

    // Clamp so it doesn't go off-screen (8px margin)
    const margin = 8;
    if (idealLeft < margin) idealLeft = margin;
    if (idealLeft + tipRect.width > window.innerWidth - margin) {
      idealLeft = window.innerWidth - margin - tipRect.width;
    }

    // Arrow offset inside tooltip pointing at button center
    const arrowLeft = btnCenterX - idealLeft;

    setPos({
      top: btnRect.top - tipRect.height - ARROW_GAP,
      left: idealLeft,
      arrowLeft: Math.max(12, Math.min(arrowLeft, tipRect.width - 12)),
    });
  }, []);

  // Recalculate on open and on scroll/resize
  useEffect(() => {
    if (!isOpen) return;
    // Use RAF to wait for the tooltip to render and get measured
    const raf = requestAnimationFrame(() => calcPosition());

    const onScrollOrResize = () => calcPosition();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [isOpen, calcPosition]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (btnRef.current?.contains(target)) return;
      if (tooltipRef.current?.contains(target)) return;
      setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
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
    <div className="weather-widget-container" style={{ position: 'relative', display: 'inline-flex' }}>
      <button 
        ref={btnRef}
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
              ref={tooltipRef}
              initial={{ opacity: 0, y: 5, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'fixed',
                top: `${pos.top}px`,
                left: `${pos.left}px`,
                background: '#0d1621',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '12px',
                minWidth: '180px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
                zIndex: 99999,
                cursor: 'default',
                pointerEvents: 'auto',
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
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', gap: '16px' }}>
                  <span style={{ color: '#9ca3af' }}>Temperatura</span>
                  <span style={{ color: '#fff', fontWeight: 'bold' }}>{weather.temperature}°C</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', gap: '16px' }}>
                  <span style={{ color: '#9ca3af' }}>Prob. Lluvia</span>
                  <span style={{ color: '#fff', fontWeight: 'bold' }}>{weather.rainChance}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', gap: '16px' }}>
                  <span style={{ color: '#9ca3af' }}>Precipitación</span>
                  <span style={{ color: '#fff', fontWeight: 'bold' }}>{weather.rainfall} mm</span>
                </div>
              </div>
              
              {/* Arrow — positioned to point exactly at button center */}
              <div style={{
                position: 'absolute',
                bottom: '-5px',
                left: `${pos.arrowLeft}px`,
                transform: 'translateX(-50%) rotate(45deg)',
                width: '10px',
                height: '10px',
                background: '#0d1621',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                borderRight: '1px solid rgba(255,255,255,0.1)',
              }} />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
