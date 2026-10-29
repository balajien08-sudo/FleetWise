import prisma from '../src/prisma';
import { AuthService } from '../src/services/authService';

export async function seedDemoData() {
  console.log('--- Ensuring Default Users Provisioned ---');
  await AuthService.ensureDefaultUsers();

  console.log('--- Cleaning operational database tables ---');
  await prisma.activityLog.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.driver.deleteMany();

  console.log('--- Seeding Vehicles ---');
  const vehicles = await Promise.all([
    prisma.vehicle.create({
      data: {
        vehicleId: 'V-101',
        registrationNo: 'KA-01-EA-1234',
        type: 'Delivery Van',
        capacity: 1200,
        status: 'available',
        notes: 'Equipped with GPS tracking and tail-lift. Prime condition.',
      },
    }),
    prisma.vehicle.create({
      data: {
        vehicleId: 'V-102',
        registrationNo: 'KA-04-MK-5678',
        type: 'Medium Truck',
        capacity: 2500,
        status: 'available',
        notes: 'Heavy duty cargo truck, suitable for intercity routes.',
      },
    }),
    prisma.vehicle.create({
      data: {
        vehicleId: 'V-103',
        registrationNo: 'MH-02-CD-9012',
        type: 'Refrigerated Van',
        capacity: 900,
        status: 'available',
        notes: 'Temperature-controlled cold chain unit (-18C to +4C).',
      },
    }),
    prisma.vehicle.create({
      data: {
        vehicleId: 'V-104',
        registrationNo: 'DL-01-AB-3456',
        type: 'Cargo E-Van',
        capacity: 800,
        status: 'available',
        notes: 'Eco-friendly electric delivery van for urban express deliveries.',
      },
    }),
    prisma.vehicle.create({
      data: {
        vehicleId: 'V-105',
        registrationNo: 'TN-09-XY-7890',
        type: 'Heavy Truck',
        capacity: 5000,
        status: 'available',
        notes: 'High volume logistics carrier with hydraulic ramp.',
      },
    }),
    prisma.vehicle.create({
      data: {
        vehicleId: 'V-106',
        registrationNo: 'KA-05-ZZ-9999',
        type: 'Delivery Van',
        capacity: 1100,
        status: 'maintenance',
        notes: 'Brake pad replacement and periodic 40,000 km overhaul scheduled.',
      },
    }),
    prisma.vehicle.create({
      data: {
        vehicleId: 'V-107',
        registrationNo: 'TS-08-KL-4321',
        type: 'Delivery Van',
        capacity: 1400,
        status: 'assigned', // Occupied by active delivery
        notes: 'Currently dispatched on active express delivery.',
      },
    }),
  ]);

  console.log('--- Seeding Drivers ---');
  const drivers = await Promise.all([
    prisma.driver.create({
      data: {
        driverId: 'D-01',
        name: 'Rajesh Kumar',
        phone: '+91 98765 43210',
        email: 'rajesh.kumar@fleetwise.in',
        availabilityStatus: 'available',
        notes: 'Commercial HGV license. 8+ years experience in express logistics.',
      },
    }),
    prisma.driver.create({
      data: {
        driverId: 'D-02',
        name: 'Vikram Singh',
        phone: '+91 98450 11223',
        email: 'vikram.singh@fleetwise.in',
        availabilityStatus: 'available',
        notes: 'Specialized in cold-chain and temperature sensitive transit.',
      },
    }),
    prisma.driver.create({
      data: {
        driverId: 'D-03',
        name: 'Priya Sharma',
        phone: '+91 97312 88765',
        email: 'priya.sharma@fleetwise.in',
        availabilityStatus: 'available',
        notes: 'Clean safety record, urban express delivery specialist.',
      },
    }),
    prisma.driver.create({
      data: {
        driverId: 'D-04',
        name: 'Mohammed Arshad',
        phone: '+91 96200 44556',
        email: 'arshad.m@fleetwise.in',
        availabilityStatus: 'available',
        notes: 'Long haul route driver, hazmat handling certified.',
      },
    }),
    prisma.driver.create({
      data: {
        driverId: 'D-05',
        name: 'Sunil Rao',
        phone: '+91 99001 77889',
        email: 'sunil.rao@fleetwise.in',
        availabilityStatus: 'unavailable',
        notes: 'On approved medical leave until next Monday.',
      },
    }),
    prisma.driver.create({
      data: {
        driverId: 'D-06',
        name: 'Anand Patel',
        phone: '+91 98112 33445',
        email: 'anand.patel@fleetwise.in',
        availabilityStatus: 'assigned', // Occupied by active delivery
        notes: 'Currently in-transit on active delivery route.',
      },
    }),
  ]);

  console.log('--- Seeding Deliveries ---');
  const now = new Date();

  // Completed delivery (yesterday)
  const d200Time = new Date(now.getTime() - 24 * 3600 * 1000);
  const delivery200 = await prisma.delivery.create({
    data: {
      deliveryId: 'D-200',
      pickup: 'Amazon Fulfillment Center, Peenya, Bangalore',
      dropoff: 'Nexus Mall, Koramangala, Bangalore',
      scheduledTime: d200Time,
      priority: 'high',
      status: 'delivered',
      packageDescription: 'Retail Electronics Pallet (32 cartons)',
      requiredCapacity: 650,
    },
  });

  // Historical completed assignment
  await prisma.assignment.create({
    data: {
      deliveryId: 'D-200',
      vehicleId: 'V-101',
      driverId: 'D-01',
      assignedAt: new Date(d200Time.getTime() - 4 * 3600 * 1000),
      endedAt: d200Time,
      assignmentStatus: 'completed',
    },
  });

  // Active in-transit delivery
  const d201Time = new Date(now.getTime() + 2 * 3600 * 1000);
  const delivery201 = await prisma.delivery.create({
    data: {
      deliveryId: 'D-201',
      pickup: 'Biocon Park, Electronics City Phase 1, Bangalore',
      dropoff: 'Apollo Hospitals, Bannerghatta Road, Bangalore',
      scheduledTime: d201Time,
      priority: 'urgent',
      status: 'in_transit',
      packageDescription: 'Critical Cold-Chain Medical Supplies (200kg)',
      requiredCapacity: 350,
    },
  });

  // Active assignment for D-201 using V-107 and D-06
  await prisma.assignment.create({
    data: {
      deliveryId: 'D-201',
      vehicleId: 'V-107',
      driverId: 'D-06',
      assignedAt: new Date(now.getTime() - 90 * 60 * 1000),
      assignmentStatus: 'active',
    },
  });

  // Target demo delivery D-204 (Pending - ready for judge demo!)
  const d204Time = new Date(now.getTime() + 4 * 3600 * 1000);
  const delivery204 = await prisma.delivery.create({
    data: {
      deliveryId: 'D-204',
      pickup: 'Tata Consultancy Services, Whitefield, Bangalore',
      dropoff: 'Kempegowda International Airport (Cargo Terminal), Bangalore',
      scheduledTime: d204Time,
      priority: 'high',
      status: 'pending',
      packageDescription: 'High-Value Server Components & Secure Hardware',
      requiredCapacity: 500,
    },
  });

  // Additional pending deliveries
  await prisma.delivery.create({
    data: {
      deliveryId: 'D-205',
      pickup: 'ITC Infotech Park, Banaswadi, Bangalore',
      dropoff: 'Manyata Tech Park, Nagavara, Bangalore',
      scheduledTime: new Date(now.getTime() + 6 * 3600 * 1000),
      priority: 'urgent',
      status: 'pending',
      packageDescription: 'Urgent Spare Machinery Parts',
      requiredCapacity: 250,
    },
  });

  await prisma.delivery.create({
    data: {
      deliveryId: 'D-206',
      pickup: 'Wholesale Food Terminal, Yeshwanthpur, Bangalore',
      dropoff: 'Prestige Falcon City, Kanakapura Road, Bangalore',
      scheduledTime: new Date(now.getTime() + 8 * 3600 * 1000),
      priority: 'medium',
      status: 'pending',
      packageDescription: 'Organic Produce & Dairy Cartons',
      requiredCapacity: 750,
    },
  });

  await prisma.delivery.create({
    data: {
      deliveryId: 'D-207',
      pickup: 'IKEA Nagasandra, Tumkur Road, Bangalore',
      dropoff: 'Sobha Dream Acres, Panathur, Bangalore',
      scheduledTime: new Date(now.getTime() + 24 * 3600 * 1000),
      priority: 'low',
      status: 'pending',
      packageDescription: 'Flatpack Furniture Shipment (8 items)',
      requiredCapacity: 950,
    },
  });

  console.log('--- Seeding Activity Logs ---');
  await prisma.activityLog.createMany({
    data: [
      {
        action: 'SYSTEM_BOOT',
        entityType: 'SYSTEM',
        entityId: 'SYSTEM',
        details: JSON.stringify({ message: 'FleetWise system initialization and database sync complete.' }),
        actorId: 'System',
        createdAt: new Date(now.getTime() - 48 * 3600 * 1000),
      },
      {
        action: 'ASSIGNMENT_CREATED',
        entityType: 'ASSIGNMENT',
        entityId: 'D-200',
        details: JSON.stringify({
          deliveryId: 'D-200',
          vehicleId: 'V-101',
          driverId: 'D-01',
          pickup: 'Amazon Fulfillment Center',
          dropoff: 'Nexus Mall',
        }),
        actorId: 'Dispatcher',
        createdAt: new Date(d200Time.getTime() - 4 * 3600 * 1000),
      },
      {
        action: 'STATUS_UPDATED',
        entityType: 'DELIVERY',
        entityId: 'D-200',
        details: JSON.stringify({
          from: 'in_transit',
          to: 'delivered',
          message: 'Delivery D-200 completed successfully.',
        }),
        actorId: 'Dispatcher',
        createdAt: d200Time,
      },
      {
        action: 'RESOURCES_RELEASED',
        entityType: 'ASSIGNMENT',
        entityId: 'D-200',
        details: JSON.stringify({
          deliveryId: 'D-200',
          releasedVehicleId: 'V-101',
          releasedDriverId: 'D-01',
          reason: 'Delivery completed successfully.',
        }),
        actorId: 'Dispatcher',
        createdAt: d200Time,
      },
      {
        action: 'ASSIGNMENT_CREATED',
        entityType: 'ASSIGNMENT',
        entityId: 'D-201',
        details: JSON.stringify({
          deliveryId: 'D-201',
          vehicleId: 'V-107',
          driverId: 'D-06',
          pickup: 'Biocon Park',
          dropoff: 'Apollo Hospitals',
        }),
        actorId: 'Dispatcher',
        createdAt: new Date(now.getTime() - 90 * 60 * 1000),
      },
      {
        action: 'STATUS_UPDATED',
        entityType: 'DELIVERY',
        entityId: 'D-201',
        details: JSON.stringify({
          from: 'assigned',
          to: 'in_transit',
          message: 'Delivery D-201 is now In Transit.',
        }),
        actorId: 'Dispatcher',
        createdAt: new Date(now.getTime() - 60 * 60 * 1000),
      },
      {
        action: 'DELIVERY_CREATED',
        entityType: 'DELIVERY',
        entityId: 'D-204',
        details: JSON.stringify({
          pickup: 'Tata Consultancy Services, Whitefield',
          dropoff: 'Kempegowda International Airport',
          priority: 'high',
        }),
        actorId: 'Dispatcher',
        createdAt: new Date(now.getTime() - 30 * 60 * 1000),
      },
    ],
  });

  console.log('--- Seed completed successfully! ---');
  return {
    vehiclesCount: vehicles.length,
    driversCount: drivers.length,
    deliveriesCount: 5,
  };
}

if (require.main === module) {
  seedDemoData()
    .then(() => {
      console.log('Database seeded.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error seeding database:', err);
      process.exit(1);
    });
}
