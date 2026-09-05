import { Router } from 'express';
import {
  addDriverController,
  getDriversController,
  updateDriverController,
  deleteDriverController,
} from './company.drivers.controller.js';
import {
  addVehicleController,
  getVehiclesController,
  updateVehicleController,
  deleteVehicleController,
} from './company.vehicles.controller.js';
import {
  addTripController,
  getTripsController,
  getTripByIdController,
  updateTripController,
  deleteTripController,
} from './company.trips.controller.js';
import {
  sellTicketController,
  getTicketsController,
  getTicketByIdController,
} from './company.tickets.controller.js';
import {
  getStatsController,
} from './company.stats.controller.js';
import {
  getCompanyMessagesController,
  sendCompanyMessageController,
} from './company.messages.controller.js';
import { requireAuth, requireCompany } from '../shared/middleware/auth.middleware.js';

export const companyRouter = Router();

// All routes require authentication
companyRouter.use(requireAuth);
companyRouter.use(requireCompany);

// Drivers
companyRouter.get('/drivers', getDriversController);
companyRouter.post('/drivers', addDriverController);
companyRouter.patch('/drivers/:id', updateDriverController);
companyRouter.delete('/drivers/:id', deleteDriverController);

// Vehicles
companyRouter.get('/vehicles', getVehiclesController);
companyRouter.post('/vehicles', addVehicleController);
companyRouter.patch('/vehicles/:id', updateVehicleController);
companyRouter.delete('/vehicles/:id', deleteVehicleController);

// Trips
companyRouter.get('/trips', getTripsController);
companyRouter.get('/trips/:id', getTripByIdController);
companyRouter.post('/trips', addTripController);
companyRouter.patch('/trips/:id', updateTripController);
companyRouter.delete('/trips/:id', deleteTripController);

// Tickets (guichet)
companyRouter.get('/tickets', getTicketsController);
companyRouter.get('/tickets/:id', getTicketByIdController);
companyRouter.post('/tickets', sellTicketController);

// Stats
companyRouter.get('/stats', getStatsController);

// Messages (conversation avec les chauffeurs)
companyRouter.get('/messages', getCompanyMessagesController);
companyRouter.post('/messages', sendCompanyMessageController);
