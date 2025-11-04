import axios from 'axios';

// Interfaces
interface Metric {
  ok: boolean;
  latency?: number;
}

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface QueuedMessage {
  id: string;
  data: ContactFormData;
  idempotencyKey: string;
  timestamp: number;
}

// Almacenamiento de métricas
const metrics = {
  success: 0,
  failures: 0,
  totalLatency: 0,
  queuedItems: 0,
};

// Función para registrar métricas
export function trackMetric(metric: Metric): void {
  if (metric.ok) {
    metrics.success++;
    if (metric.latency) {
      metrics.totalLatency += metric.latency;
    }
  } else {
    metrics.failures++;
  }
  
  // Guardar métricas en localStorage para persistencia
  localStorage.setItem('contactMetrics', JSON.stringify(metrics));
}

// Función para obtener métricas actuales
export function getMetrics() {
  // Intentar recuperar métricas del localStorage
  const savedMetrics = localStorage.getItem('contactMetrics');
  if (savedMetrics) {
    try {
      const parsedMetrics = JSON.parse(savedMetrics);
      Object.assign(metrics, parsedMetrics);
    } catch (e) {
      console.error('Error al parsear métricas guardadas:', e);
    }
  }
  
  // Actualizar contador de elementos en cola
  const queue = getQueuedMessages();
  metrics.queuedItems = queue.length;
  
  return {
    ...metrics,
    avgLatency: metrics.success > 0 ? metrics.totalLatency / metrics.success : 0
  };
}

// Función para obtener mensajes en cola
export function getQueuedMessages(): QueuedMessage[] {
  try {
    const queueStr = localStorage.getItem('contactQueue');
    return queueStr ? JSON.parse(queueStr) : [];
  } catch (e) {
    console.error('Error al obtener mensajes en cola:', e);
    return [];
  }
}

// Función para guardar mensaje en cola
function saveToQueue(data: ContactFormData, idempotencyKey: string): void {
  const queue = getQueuedMessages();
  const queuedMessage: QueuedMessage = {
    id: crypto.randomUUID(),
    data,
    idempotencyKey,
    timestamp: Date.now()
  };
  
  queue.push(queuedMessage);
  localStorage.setItem('contactQueue', JSON.stringify(queue));
  metrics.queuedItems = queue.length;
  localStorage.setItem('contactMetrics', JSON.stringify(metrics));
}

// Función para eliminar mensaje de la cola
function removeFromQueue(id: string): void {
  const queue = getQueuedMessages();
  const updatedQueue = queue.filter(msg => msg.id !== id);
  localStorage.setItem('contactQueue', JSON.stringify(updatedQueue));
  metrics.queuedItems = updatedQueue.length;
  localStorage.setItem('contactMetrics', JSON.stringify(metrics));
}

// Función para enviar formulario de contacto con reintentos y backoff
export async function sendContactForm(data: ContactFormData, idempotencyKey: string): Promise<any> {
  const startTime = performance.now();
  
  // Si estamos offline, guardar en cola y lanzar error
  if (!navigator.onLine) {
    saveToQueue(data, idempotencyKey);
    throw new Error('Sin conexión. El mensaje se enviará cuando vuelva la conexión.');
  }
  
  // Intentar enviar con reintentos y backoff
  let attempt = 0;
  const maxAttempts = 3;
  
  while (attempt < maxAttempts) {
    try {
      const response = await axios.post('/api/contact', {
        ...data,
        idempotencyKey
      }, {
        headers: {
          'X-Idempotency-Key': idempotencyKey
        }
      });
      
      // Registrar métrica de éxito
      const endTime = performance.now();
      trackMetric({
        ok: true,
        latency: endTime - startTime
      });
      
      return response.data;
    } catch (error) {
      attempt++;
      
      // Si es el último intento, guardar en cola y registrar fallo
      if (attempt >= maxAttempts) {
        saveToQueue(data, idempotencyKey);
        trackMetric({ ok: false });
        throw error;
      }
      
      // Esperar con backoff lineal antes de reintentar
      const backoffTime = 1000 * attempt; // 1s, 2s, 3s...
      await new Promise(resolve => setTimeout(resolve, backoffTime));
    }
  }
}

// Función para sincronizar cola offline
export async function syncOfflineQueue(): Promise<void> {
  if (!navigator.onLine) return;
  
  const queue = getQueuedMessages();
  if (queue.length === 0) return;
  
  // Procesar cada mensaje en cola
  for (const message of queue) {
    try {
      await axios.post('/api/contact', {
        ...message.data,
        idempotencyKey: message.idempotencyKey
      }, {
        headers: {
          'X-Idempotency-Key': message.idempotencyKey
        }
      });
      
      // Eliminar mensaje de la cola si se envió correctamente
      removeFromQueue(message.id);
      
      // Registrar métrica de éxito
      trackMetric({ ok: true });
    } catch (error) {
      console.error('Error al sincronizar mensaje en cola:', error);
      // No eliminamos de la cola para reintentar después
    }
  }
}