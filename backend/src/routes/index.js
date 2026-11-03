import { Router } from 'express';
import { healthController } from '../controllers/health.controller.js';
import { managementRoutes } from '../controllers/management.controller.js';
export const apiRoutes = Router();
apiRoutes.get('/health', healthController);
apiRoutes.use(managementRoutes);
