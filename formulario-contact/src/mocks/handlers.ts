import { http, HttpResponse, delay } from 'msw';

export const handlers = [
  http.post('/api/contact', async ({ request }) => {
    await delay(600); // simula latencia
    
    // 20% de fallas simuladas
    if (Math.random() < 0.2) {
      return HttpResponse.json(
        { error: 'Temporary failure' }, 
        { status: 503 }
      );
    }
    
    const body = await request.json();
    
    return HttpResponse.json(
      { 
        status: 'queued', 
        id: crypto.randomUUID(), 
        ...body 
      }, 
      { status: 202 }
    );
  }),
];