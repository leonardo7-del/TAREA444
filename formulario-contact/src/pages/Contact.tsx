import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import TextField from '../components/TextField';
import TextArea from '../components/TextArea';
import StatsPanel from '../components/StatsPanel';
import { sendContactForm, getQueuedMessages, syncOfflineQueue } from '../api/contactApi';

// Esquema de validación con Zod
const contactSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  email: z.string().email('Ingrese un email válido'),
  subject: z.string().min(5, 'El asunto debe tener al menos 5 caracteres'),
  message: z.string().min(10, 'El mensaje debe tener al menos 10 caracteres').max(500, 'El mensaje no puede exceder los 500 caracteres')
});

type ContactFormData = z.infer<typeof contactSchema>;

const Contact = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queuedCount, setQueuedCount] = useState(0);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [idempotencyKey, setIdempotencyKey] = useState('');

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema)
  });

  // Monitorear estado de conexión
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineQueue();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Actualizar contador de mensajes en cola
    const updateQueuedCount = async () => {
      const messages = await getQueuedMessages();
      setQueuedCount(messages.length);
    };

    updateQueuedCount();
    const interval = setInterval(updateQueuedCount, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const onSubmit = async (data: ContactFormData) => {
    try {
      setSubmitStatus('submitting');
      
      // Generar nueva clave de idempotencia para este envío
      const newKey = crypto.randomUUID();
      setIdempotencyKey(newKey);
      
      await sendContactForm(data, newKey);
      setSubmitStatus('success');
      reset();
      
      // Actualizar contador de mensajes en cola
      const messages = await getQueuedMessages();
      setQueuedCount(messages.length);
      
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Error al enviar formulario:', error);
      setSubmitStatus('error');
      
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 3000);
    }
  };

  return (
    <div className="contact-container">
      <h1>Formulario de Contacto</h1>
      
      {/* Indicador de estado de conexión */}
      <div className={`connection-status ${isOnline ? 'online' : 'offline'}`}>
        {isOnline ? '🟢 En línea' : '🔴 Sin conexión'}
      </div>
      
      {queuedCount > 0 && (
        <div className="queued-messages">
          📋 {queuedCount} mensaje{queuedCount !== 1 ? 's' : ''} en cola para envío
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <TextField
          label="Nombre"
          name="name"
          type="text"
          error={errors.name?.message}
          register={register}
          required
        />
        
        <TextField
          label="Email"
          name="email"
          type="email"
          error={errors.email?.message}
          register={register}
          required
        />
        
        <TextField
          label="Asunto"
          name="subject"
          type="text"
          error={errors.subject?.message}
          register={register}
          required
        />
        
        <TextArea
          label="Mensaje"
          name="message"
          error={errors.message?.message}
          maxLength={500}
          register={register}
          required
        />
        
        <button 
          type="submit" 
          disabled={submitStatus === 'submitting'}
          aria-busy={submitStatus === 'submitting'}
        >
          {submitStatus === 'submitting' ? 'Enviando...' : 'Enviar mensaje'}
        </button>
        
        {submitStatus === 'success' && (
          <div className="submit-feedback success" role="alert">
            ✅ Mensaje enviado correctamente
          </div>
        )}
        
        {submitStatus === 'error' && (
          <div className="submit-feedback error" role="alert">
            ❌ Error al enviar el mensaje. Se reintentará automáticamente.
          </div>
        )}
      </form>
      
      <StatsPanel />
    </div>
  );
};

export default Contact;