import { Router } from 'express';
import * as authController from '../controllers/authController';
import * as userController from '../controllers/userController';
import * as vehicleController from '../controllers/vehicleController';
import * as driverController from '../controllers/driverController';
import * as deliveryController from '../controllers/deliveryController';
import * as assignmentController from '../controllers/assignmentController';
import * as dashboardController from '../controllers/dashboardController';
import * as analyticsController from '../controllers/analyticsController';
import * as activityController from '../controllers/activityController';
import * as systemController from '../controllers/systemController';
import { requireAuth, requireRole } from '../middleware/authMiddleware';

const router = Router();

// Public Endpoints
router.get('/health', systemController.getHealth);
router.post('/auth/login', authController.login);

// Session & Authentication Endpoints
router.post('/auth/logout', requireAuth, authController.logout);
router.get('/auth/me', requireAuth, authController.getMe);

// User Administration (ADMIN only)
router.get('/users', requireAuth, requireRole(['ADMIN']), userController.getUsers);
router.post('/users', requireAuth, requireRole(['ADMIN']), userController.createUser);
router.put('/users/:id', requireAuth, requireRole(['ADMIN']), userController.updateUser);
router.delete('/users/:id', requireAuth, requireRole(['ADMIN']), userController.deleteUser);

// System & Maintenance (ADMIN only)
router.post('/system/reset-demo', requireAuth, requireRole(['ADMIN']), systemController.resetDemoData);
router.post('/dev/reset-demo', requireAuth, requireRole(['ADMIN']), systemController.resetDemoData);

// Operational Dashboard (ADMIN & DISPATCHER)
router.get('/dashboard/summary', requireAuth, dashboardController.getDashboardSummary);

// Fleet Vehicles (View & update: ADMIN & DISPATCHER; Hard delete: ADMIN only)
router.get('/vehicles', requireAuth, vehicleController.getVehicles);
router.post('/vehicles', requireAuth, vehicleController.createVehicle);
router.get('/vehicles/:id', requireAuth, vehicleController.getVehicleById);
router.patch('/vehicles/:id', requireAuth, vehicleController.updateVehicle);
router.delete('/vehicles/:id', requireAuth, requireRole(['ADMIN']), vehicleController.deleteVehicle);

// Drivers Roster (View & update: ADMIN & DISPATCHER; Hard delete: ADMIN only)
router.get('/drivers', requireAuth, driverController.getDrivers);
router.post('/drivers', requireAuth, driverController.createDriver);
router.get('/drivers/:id', requireAuth, driverController.getDriverById);
router.patch('/drivers/:id', requireAuth, driverController.updateDriver);
router.delete('/drivers/:id', requireAuth, requireRole(['ADMIN']), driverController.deleteDriver);

// Deliveries Management (View, create, update, assign, transition: ADMIN & DISPATCHER; Hard delete: ADMIN only)
router.get('/deliveries', requireAuth, deliveryController.getDeliveries);
router.post('/deliveries', requireAuth, deliveryController.createDelivery);
router.get('/deliveries/:id', requireAuth, deliveryController.getDeliveryById);
router.patch('/deliveries/:id', requireAuth, deliveryController.updateDelivery);
router.post('/deliveries/:id/assign', requireAuth, deliveryController.assignDelivery);
router.patch('/deliveries/:id/status', requireAuth, deliveryController.updateDeliveryStatus);
router.delete('/deliveries/:id', requireAuth, requireRole(['ADMIN']), deliveryController.deleteDelivery);

// Assignments
router.get('/assignments', requireAuth, assignmentController.getAssignments);
router.post('/assignments', requireAuth, assignmentController.createAssignment);

// Activity Log & Audit Trail (Read-only: ADMIN & DISPATCHER)
router.get('/activity', requireAuth, activityController.getActivityLogs);

// Analytics & Reports (ADMIN & DISPATCHER)
router.get('/analytics', requireAuth, analyticsController.getAnalytics);
router.get('/analytics/export/deliveries', requireAuth, analyticsController.exportDeliveriesCsv);
router.get('/analytics/export/vehicles', requireAuth, analyticsController.exportVehiclesCsv);

export default router;
