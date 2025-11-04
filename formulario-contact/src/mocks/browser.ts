import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// Este archivo configura el Service Worker para MSW en el navegador
export const worker = setupWorker(...handlers);