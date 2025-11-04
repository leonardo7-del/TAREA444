import React, { useState, useEffect } from 'react';
import { getMetrics } from '../api/contactApi';

const StatsPanel: React.FC = () => {
  const [metrics, setMetrics] = useState({
    success: 0,
    failures: 0,
    avgLatency: 0,
    queuedItems: 0
  });

  useEffect(() => {
    // Actualizar métricas al montar el componente
    setMetrics(getMetrics());
    
    // Actualizar métricas cada 5 segundos
    const interval = setInterval(() => {
      setMetrics(getMetrics());
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="stats-panel">
      <h3>Estadísticas de Contacto</h3>
      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-label">Envíos exitosos</div>
          <div className="stat-value success">{metrics.success}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Envíos fallidos</div>
          <div className="stat-value error">{metrics.failures}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Latencia promedio</div>
          <div className="stat-value">{Math.round(metrics.avgLatency)} ms</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">En cola offline</div>
          <div className="stat-value pending">
            {metrics.queuedItems}
            {metrics.queuedItems > 0 && (
              <span className="pending-badge">
                Pendiente
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;