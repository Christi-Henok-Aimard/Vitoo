import { Router } from 'express';
import {
  getDriverTripsController,
  getDriverTripByIdController,
  updateDriverStatusController,
  updateTripStatusController,
  reportIncidentController,
  validateTicketController,
  lookupTicketController,
  getDriverStatsController,
  updateTripPositionController,
  notifyAbsentController,
  getDriverMessagesController,
  sendDriverMessageController,
} from './driver.controller.js';

export const driverRouter = Router();

driverRouter.get('/trips', getDriverTripsController);
driverRouter.get('/trips/:id', getDriverTripByIdController);
driverRouter.patch('/status', updateDriverStatusController);
driverRouter.patch('/trips/:id/status', updateTripStatusController);
driverRouter.post('/trips/:id/position', updateTripPositionController);
driverRouter.post('/trips/:id/notify-absent', notifyAbsentController);
driverRouter.post('/incidents', reportIncidentController);
driverRouter.post('/tickets/validate', validateTicketController);
driverRouter.post('/tickets/lookup', lookupTicketController);
driverRouter.get('/stats', getDriverStatsController);
driverRouter.get('/messages', getDriverMessagesController);
driverRouter.post('/messages', sendDriverMessageController);
