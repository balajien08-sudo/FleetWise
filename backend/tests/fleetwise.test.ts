import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import prisma from '../src/prisma';
import { seedDemoData } from '../prisma/seed';
import { AuthService } from '../src/services/authService';

describe('FleetWise — Full-Stack Security, Dispatch Reliability & Verification', () => {
  let adminToken: string;
  let dispatcherToken: string;

  const getAdminAuth = () => ({
    Authorization: `Bearer ${adminToken}`,
  });

  const getDispatcherAuth = () => ({
    Authorization: `Bearer ${dispatcherToken}`,
  });

  beforeAll(async () => {
    // Seed database and provision default users
    await seedDemoData();

    // Authenticate Admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'admin', password: 'Admin@12345' });
    expect(adminLogin.status).toBe(200);
    adminToken = adminLogin.body.data.token;

    // Authenticate Dispatcher
    const dispatcherLogin = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'dispatcher', password: 'Dispatch@12345' });
    expect(dispatcherLogin.status).toBe(200);
    dispatcherToken = dispatcherLogin.body.data.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Reset operational tables before each test
    await seedDemoData();
  });

  // Test 1: Unauthenticated users cannot access protected endpoints (401)
  it('1. Unauthenticated users cannot access protected APIs (HTTP 401)', async () => {
    const resDeliveries = await request(app).get('/api/deliveries');
    expect(resDeliveries.status).toBe(401);
    expect(resDeliveries.body.error.code).toBe('UNAUTHENTICATED');

    const resVehicles = await request(app).get('/api/vehicles');
    expect(resVehicles.status).toBe(401);

    const resSummary = await request(app).get('/api/dashboard/summary');
    expect(resSummary.status).toBe(401);
  });

  // Test 2: Dispatcher users cannot invoke administrator-only endpoints (403)
  it('2. Dispatcher users cannot invoke administrator-only endpoints (HTTP 403)', async () => {
    // Dispatcher trying to access user management
    const resUsers = await request(app)
      .get('/api/users')
      .set(getDispatcherAuth());
    expect(resUsers.status).toBe(403);
    expect(resUsers.body.error.code).toBe('FORBIDDEN');

    // Dispatcher trying to reset demo database
    const resReset = await request(app)
      .post('/api/system/reset-demo')
      .set(getDispatcherAuth());
    expect(resReset.status).toBe(403);

    // Dispatcher trying to hard-delete a vehicle
    const resDelete = await request(app)
      .delete('/api/vehicles/V-101')
      .set(getDispatcherAuth());
    expect(resDelete.status).toBe(403);

    // Administrator CAN access user management
    const resAdminUsers = await request(app)
      .get('/api/users')
      .set(getAdminAuth());
    expect(resAdminUsers.status).toBe(200);
    expect(Array.isArray(resAdminUsers.body.data)).toBe(true);
  });

  // Test 3: Invalid credentials rejected and rate-limited
  it('3. Invalid credentials are rejected (HTTP 401) and rate-limited', async () => {
    // Attempt invalid password
    const resInvalid = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'admin', password: 'WrongPassword123' });
    expect(resInvalid.status).toBe(401);
    expect(resInvalid.body.error.code).toBe('INVALID_CREDENTIALS');

    // Test brute-force rate limit by attempting 5 invalid logins
    const testUsername = `ratelimit_${Date.now()}`;
    // Create temporary user for rate-limit test
    await AuthService.createUser(
      {
        email: `${testUsername}@test.com`,
        username: testUsername,
        name: 'Rate Limit Test',
        password: 'Password@123',
        role: 'DISPATCHER',
      },
      'Test Suite',
      1
    );

    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/auth/login')
        .send({ identifier: testUsername, password: 'WrongPassword' });
    }

    // 6th attempt should be blocked by rate limiter with 429
    const resBlocked = await request(app)
      .post('/api/auth/login')
      .send({ identifier: testUsername, password: 'WrongPassword' });
    expect(resBlocked.status).toBe(429);
    expect(resBlocked.body.error.code).toBe('RATE_LIMITED');
  });

  // Test 4: Valid users can log in and log out safely
  it('4. Valid users can log in and log out safely with session invalidation', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'admin', password: 'Admin@12345' });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.user.role).toBe('ADMIN');
    const token = loginRes.body.data.token;

    // Use token to verify /api/auth/me
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.username).toBe('admin');

    // Logout
    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);
    expect(logoutRes.status).toBe(200);

    // Verify session is invalidated
    const meAfterLogout = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(meAfterLogout.status).toBe(401);
  });

  // Test 5: A newly created delivery persists across queries
  it('5. A newly created delivery remains persisted in database', async () => {
    const deliveryPayload = {
      pickup: 'Electronic City Phase 1, Bangalore',
      dropoff: 'MG Road Metro Station, Bangalore',
      scheduledTime: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
      priority: 'high',
      packageDescription: 'Precision Medical Sensors',
      requiredCapacity: 450,
    };

    const createRes = await request(app)
      .post('/api/deliveries')
      .set(getDispatcherAuth())
      .send(deliveryPayload);

    expect(createRes.status).toBe(201);
    const newDeliveryId = createRes.body.data.deliveryId;
    expect(newDeliveryId).toBeDefined();

    // Verify persistence via separate GET
    const fetchRes = await request(app)
      .get(`/api/deliveries/${newDeliveryId}`)
      .set(getDispatcherAuth());

    expect(fetchRes.status).toBe(200);
    expect(fetchRes.body.data.deliveryId).toBe(newDeliveryId);
    expect(fetchRes.body.data.requiredCapacity).toBe(450);

    // Verify directly in Prisma SQLite table
    const dbRecord = await prisma.delivery.findUnique({
      where: { deliveryId: newDeliveryId },
    });
    expect(dbRecord).not.toBeNull();
    expect(dbRecord?.pickup).toBe(deliveryPayload.pickup);
  });

  // Test 6: Invalid vehicle, driver, cargo capacity, and delivery status are rejected
  it('6. Invalid vehicle, driver, cargo capacity, and delivery status are rejected', async () => {
    // 6a. Non-existent vehicle
    const resNoVeh = await request(app)
      .post('/api/deliveries/D-204/assign')
      .set(getDispatcherAuth())
      .send({ vehicleId: 'V-NONEXISTENT', driverId: 'D-01' });
    expect(resNoVeh.status).toBe(404);

    // 6b. Non-existent driver
    const resNoDriver = await request(app)
      .post('/api/deliveries/D-204/assign')
      .set(getDispatcherAuth())
      .send({ vehicleId: 'V-101', driverId: 'D-NONEXISTENT' });
    expect(resNoDriver.status).toBe(404);

    // 6c. Vehicle in maintenance (V-106 is in maintenance)
    const resMaint = await request(app)
      .post('/api/deliveries/D-204/assign')
      .set(getDispatcherAuth())
      .send({ vehicleId: 'V-106', driverId: 'D-01' });
    expect(resMaint.status).toBe(409);
    expect(resMaint.body.error.code).toBe('VEHICLE_IN_MAINTENANCE');

    // 6d. Overloaded vehicle: create delivery requiring 6000kg (max vehicle capacity is 5000kg)
    const heavyDelivery = await prisma.delivery.create({
      data: {
        deliveryId: 'D-HEAVY-1',
        pickup: 'Warehouse A',
        dropoff: 'Port B',
        scheduledTime: new Date(),
        requiredCapacity: 6000,
        status: 'pending',
      },
    });

    const resOverload = await request(app)
      .post(`/api/deliveries/${heavyDelivery.deliveryId}/assign`)
      .set(getDispatcherAuth())
      .send({ vehicleId: 'V-101', driverId: 'D-01' }); // V-101 capacity is 1200kg
    expect(resOverload.status).toBe(409);
    expect(resOverload.body.error.code).toBe('VEHICLE_OVERLOAD');

    // 6e. Delivery not pending (D-200 is already delivered)
    const resDelivered = await request(app)
      .post('/api/deliveries/D-200/assign')
      .set(getDispatcherAuth())
      .send({ vehicleId: 'V-101', driverId: 'D-01' });
    expect(resDelivered.status).toBe(409);
    expect(resDelivered.body.error.code).toBe('DELIVERY_NOT_PENDING');
  });

  // Test 7: Vehicle double-booking prevention (HTTP 409)
  it('7. A vehicle already assigned to an active delivery cannot be double-booked', async () => {
    // Assign V-101 to D-204
    const firstAssign = await request(app)
      .post('/api/deliveries/D-204/assign')
      .set(getDispatcherAuth())
      .send({ vehicleId: 'V-101', driverId: 'D-01' });
    expect(firstAssign.status).toBe(200);

    // Attempt to assign V-101 again to another pending delivery D-205 with driver D-02
    const secondAssign = await request(app)
      .post('/api/deliveries/D-205/assign')
      .set(getDispatcherAuth())
      .send({ vehicleId: 'V-101', driverId: 'D-02' });

    expect(secondAssign.status).toBe(409);
    expect(secondAssign.body.error.code).toMatch(/VEHICLE_ALREADY_ASSIGNED|VEHICLE_NOT_AVAILABLE/);
    expect(secondAssign.body.error.message).toContain('V-101');
  });

  // Test 8: Driver double-booking prevention (HTTP 409)
  it('8. A driver already assigned to an active delivery cannot be double-booked', async () => {
    // Assign D-01 to D-204 with V-101
    const firstAssign = await request(app)
      .post('/api/deliveries/D-204/assign')
      .set(getDispatcherAuth())
      .send({ vehicleId: 'V-101', driverId: 'D-01' });
    expect(firstAssign.status).toBe(200);

    // Attempt to assign D-01 again to D-205 with a different vehicle V-102
    const secondAssign = await request(app)
      .post('/api/deliveries/D-205/assign')
      .set(getDispatcherAuth())
      .send({ vehicleId: 'V-102', driverId: 'D-01' });

    expect(secondAssign.status).toBe(409);
    expect(secondAssign.body.error.code).toMatch(/DRIVER_ALREADY_ASSIGNED|DRIVER_NOT_AVAILABLE/);
    expect(secondAssign.body.error.message).toContain('D-01');
  });

  // Test 9: Concurrent dispatch race conditions (At most one succeeds)
  it('9. Concurrent dispatch requests competing for the same vehicle result in at most one success', async () => {
    // D-204 and D-205 compete simultaneously for V-101 with available drivers D-01 and D-02
    const [resA, resB] = await Promise.all([
      request(app)
        .post('/api/deliveries/D-204/assign')
        .set(getDispatcherAuth())
        .send({ vehicleId: 'V-101', driverId: 'D-01' }),
      request(app)
        .post('/api/deliveries/D-205/assign')
        .set(getDispatcherAuth())
        .send({ vehicleId: 'V-101', driverId: 'D-02' }),
    ]);

    const statuses = [resA.status, resB.status];
    expect(statuses).toContain(200);
    expect(statuses).toContain(409);

    // Verify in database: exactly ONE active assignment exists for V-101
    const activeAssignments = await prisma.assignment.findMany({
      where: { vehicleId: 'V-101', assignmentStatus: 'active' },
    });
    expect(activeAssignments.length).toBe(1);
  });

  // Test 10: Failed dispatch leaves no partial assignment
  it('10. Failed dispatch operations leave no partial assignment and do not corrupt resource availability', async () => {
    // Attempt dispatch with invalid condition (e.g. unavailable driver D-05)
    const res = await request(app)
      .post('/api/deliveries/D-204/assign')
      .set(getDispatcherAuth())
      .send({ vehicleId: 'V-101', driverId: 'D-05' }); // D-05 is unavailable in seed

    expect(res.status).toBe(409);

    // Verify V-101 remained available and was NOT locked or partially assigned
    const vehicle = await prisma.vehicle.findUnique({ where: { vehicleId: 'V-101' } });
    expect(vehicle?.status).toBe('available');

    const delivery = await prisma.delivery.findUnique({ where: { deliveryId: 'D-204' } });
    expect(delivery?.status).toBe('pending');

    const assignments = await prisma.assignment.findMany({ where: { deliveryId: 'D-204' } });
    expect(assignments.length).toBe(0);
  });

  // Test 11: Completing or cancelling a delivery releases eligible resources correctly
  it('11. Completing or cancelling a delivery releases eligible resources correctly', async () => {
    // First assign V-101 and D-01 to D-204
    await request(app)
      .post('/api/deliveries/D-204/assign')
      .set(getDispatcherAuth())
      .send({ vehicleId: 'V-101', driverId: 'D-01' });

    // Transition: assigned -> in_transit
    const transitRes = await request(app)
      .patch('/api/deliveries/D-204/status')
      .set(getDispatcherAuth())
      .send({ status: 'in_transit' });
    expect(transitRes.status).toBe(200);

    // Transition: in_transit -> delivered
    const deliveredRes = await request(app)
      .patch('/api/deliveries/D-204/status')
      .set(getDispatcherAuth())
      .send({ status: 'delivered' });
    expect(deliveredRes.status).toBe(200);

    // Resources should now be released back to 'available'
    const vehicle = await prisma.vehicle.findUnique({ where: { vehicleId: 'V-101' } });
    const driver = await prisma.driver.findUnique({ where: { driverId: 'D-01' } });
    const assignment = await prisma.assignment.findFirst({ where: { deliveryId: 'D-204' } });

    expect(vehicle?.status).toBe('available');
    expect(driver?.availabilityStatus).toBe('available');
    expect(assignment?.assignmentStatus).toBe('completed');
  });

  // Test 12: Dashboard and analytics metrics match persisted records
  it('12. Dashboard and analytics metrics match persisted database records', async () => {
    const summaryRes = await request(app)
      .get('/api/dashboard/summary')
      .set(getDispatcherAuth());
    expect(summaryRes.status).toBe(200);

    const metrics = summaryRes.body.data.metrics;
    const actualVehicleCount = await prisma.vehicle.count();
    const actualDriverCount = await prisma.driver.count();
    const actualDeliveryCount = await prisma.delivery.count();

    expect(metrics.totalVehicles).toBe(actualVehicleCount);
    expect(metrics.totalDrivers).toBe(actualDriverCount);
    expect(metrics.totalDeliveries).toBe(actualDeliveryCount);

    const analyticsRes = await request(app)
      .get('/api/analytics')
      .set(getDispatcherAuth());
    expect(analyticsRes.status).toBe(200);
    expect(analyticsRes.body.data.summary.totalDeliveries).toBe(actualDeliveryCount);
  });

  // Test 13: Audit entries are created for successful and rejected dispatch operations
  it('13. Audit entries are created for successful and rejected dispatch operations', async () => {
    // Successful assignment
    await request(app)
      .post('/api/deliveries/D-204/assign')
      .set(getDispatcherAuth())
      .send({ vehicleId: 'V-101', driverId: 'D-01' });

    // Rejected assignment
    await request(app)
      .post('/api/deliveries/D-205/assign')
      .set(getDispatcherAuth())
      .send({ vehicleId: 'V-101', driverId: 'D-02' });

    const auditRes = await request(app)
      .get('/api/activity')
      .set(getDispatcherAuth());

    expect(auditRes.status).toBe(200);
    const logs = auditRes.body.logs;

    const successLog = logs.find((l: any) => l.action === 'ASSIGNMENT_CREATED' && l.entityId === 'D-204');
    expect(successLog).toBeDefined();

    const rejectLog = logs.find((l: any) => l.action === 'ASSIGNMENT_REJECTED' && l.entityId === 'D-205');
    expect(rejectLog).toBeDefined();
  });

  // Test 14: System health endpoint accurately reflects database connectivity
  it('14. System health endpoint accurately reflects real database connectivity', async () => {
    const healthRes = await request(app).get('/api/health');
    expect(healthRes.status).toBe(200);
    expect(healthRes.body.status).toBe('healthy');
    expect(healthRes.body.database.status).toBe('connected');
    expect(healthRes.body.database.provider).toBe('sqlite');
    expect(typeof healthRes.body.database.latencyMs).toBe('number');
  });

  // Test 15: User management CRUD for Administrators
  it('15. Administrator can create, list, update, and manage user accounts', async () => {
    const newUsername = `dispatcher_${Date.now()}`;
    const createRes = await request(app)
      .post('/api/users')
      .set(getAdminAuth())
      .send({
        email: `${newUsername}@fleetwise.in`,
        username: newUsername,
        name: 'New Logistics Dispatcher',
        password: 'Password@123',
        role: 'DISPATCHER',
      });

    expect(createRes.status).toBe(201);
    const createdUserId = createRes.body.data.id;

    // Update status
    const updateRes = await request(app)
      .put(`/api/users/${createdUserId}`)
      .set(getAdminAuth())
      .send({ isActive: false });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.isActive).toBe(false);

    // Delete user
    const deleteRes = await request(app)
      .delete(`/api/users/${createdUserId}`)
      .set(getAdminAuth());
    expect(deleteRes.status).toBe(200);
  });
});
