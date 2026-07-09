import { createRouter } from '../scripts/router/index.ts';

/**
 * Initialise the modular router.
 */
const router = createRouter({ container: '#app' });

/**
 * Mount the router to take control of the document.
 */
router.mount();
