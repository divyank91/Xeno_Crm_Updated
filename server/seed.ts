import { db } from "./db";
import { users, customers, orders } from "@shared/schema";

async function seedDatabase() {
  try {
    console.log("Starting database seeding...");

    // Create a demo user
    const [user] = await db.insert(users).values({
      email: "demo@example.com",
      name: "Demo User"
    }).onConflictDoNothing().returning();

    console.log("User created or exists:", user?.email || "demo@example.com");

    // Create sample customers
    const customerData = [
      {
        email: "alice.johnson@email.com",
        name: "Alice Johnson",
        totalSpent: "15500.00",
        visitCount: 8,
        lastVisit: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        status: "vip",
        location: "Mumbai",
        emailVerified: true
      },
      {
        email: "bob.smith@email.com",
        name: "Bob Smith",
        totalSpent: "8200.00",
        visitCount: 3,
        lastVisit: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        status: "active",
        location: "Delhi",
        emailVerified: true
      },
      {
        email: "carol.davis@email.com",
        name: "Carol Davis",
        totalSpent: "22100.00",
        visitCount: 12,
        lastVisit: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        status: "vip",
        location: "Bangalore",
        emailVerified: true
      },
      {
        email: "david.wilson@email.com",
        name: "David Wilson",
        totalSpent: "3500.00",
        visitCount: 2,
        lastVisit: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
        status: "inactive",
        location: "Chennai",
        emailVerified: false
      },
      {
        email: "emma.brown@email.com",
        name: "Emma Brown",
        totalSpent: "12800.00",
        visitCount: 6,
        lastVisit: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        status: "active",
        location: "Pune",
        emailVerified: true
      },
      {
        email: "frank.miller@email.com",
        name: "Frank Miller",
        totalSpent: "5900.00",
        visitCount: 4,
        lastVisit: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 21 days ago
        status: "active",
        location: "Hyderabad",
        emailVerified: true
      },
      {
        email: "grace.taylor@email.com",
        name: "Grace Taylor",
        totalSpent: "18700.00",
        visitCount: 9,
        lastVisit: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        status: "vip",
        location: "Kolkata",
        emailVerified: true
      },
      {
        email: "henry.anderson@email.com",
        name: "Henry Anderson",
        totalSpent: "1200.00",
        visitCount: 1,
        lastVisit: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
        status: "inactive",
        location: "Ahmedabad",
        emailVerified: false
      },
      {
        email: "ivy.thomas@email.com",
        name: "Ivy Thomas",
        totalSpent: "9800.00",
        visitCount: 5,
        lastVisit: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        status: "active",
        location: "Jaipur",
        emailVerified: true
      },
      {
        email: "jack.jackson@email.com",
        name: "Jack Jackson",
        totalSpent: "25000.00",
        visitCount: 15,
        lastVisit: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        status: "vip",
        location: "Mumbai",
        emailVerified: true
      }
    ];

    console.log("Inserting customers...");
    const insertedCustomers = await db.insert(customers)
      .values(customerData)
      .onConflictDoNothing()
      .returning();

    console.log(`Inserted ${insertedCustomers.length} customers`);

    // Create sample orders for some customers
    const orderData = [
      { customerId: 1, amount: "5500.00", status: "completed" },
      { customerId: 1, amount: "10000.00", status: "completed" },
      { customerId: 2, amount: "3200.00", status: "completed" },
      { customerId: 2, amount: "5000.00", status: "completed" },
      { customerId: 3, amount: "8100.00", status: "completed" },
      { customerId: 3, amount: "14000.00", status: "completed" },
      { customerId: 4, amount: "3500.00", status: "completed" },
      { customerId: 5, amount: "6800.00", status: "completed" },
      { customerId: 5, amount: "6000.00", status: "completed" },
      { customerId: 6, amount: "2900.00", status: "completed" },
      { customerId: 6, amount: "3000.00", status: "completed" },
      { customerId: 7, amount: "9700.00", status: "completed" },
      { customerId: 7, amount: "9000.00", status: "completed" },
      { customerId: 8, amount: "1200.00", status: "completed" },
      { customerId: 9, amount: "4800.00", status: "completed" },
      { customerId: 9, amount: "5000.00", status: "completed" },
      { customerId: 10, amount: "12000.00", status: "completed" },
      { customerId: 10, amount: "13000.00", status: "completed" }
    ];

    console.log("Inserting orders...");
    const insertedOrders = await db.insert(orders)
      .values(orderData)
      .onConflictDoNothing()
      .returning();

    console.log(`Inserted ${insertedOrders.length} orders`);

    console.log("Database seeding completed successfully!");

  } catch (error) {
    console.error("Database seeding failed:", error);
    throw error;
  }
}

// Run seeding if this file is executed directly
seedDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

export { seedDatabase };