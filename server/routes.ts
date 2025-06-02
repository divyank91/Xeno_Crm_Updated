import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertCustomerSchema, 
  insertOrderSchema, 
  insertCampaignSchema,
  type SegmentRule 
} from "@shared/schema";
import { convertNaturalLanguageToRules, generateCampaignMessage } from "./openai";
import { z } from "zod";

// AUTHENTICATION SYSTEM
// Simplified auth for demo - production would use Google OAuth 2.0
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
  };
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: Function) {
  // Demo user - in production this would verify JWT tokens
  if (!req.user) {
    req.user = {
      id: 1,
      email: "demo@example.com", 
      name: "Demo User"
    };
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Authentication routes (simplified)
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, name } = req.body;
      
      let user = await storage.getUserByEmail(email);
      if (!user) {
        user = await storage.createUser({ email, name });
      }
      
      res.json({ user, token: "demo-token" });
    } catch (error) {
      res.status(500).json({ message: "Authentication failed" });
    }
  });

  app.get("/api/auth/me", requireAuth, (req: AuthenticatedRequest, res) => {
    res.json({ user: req.user });
  });

  // Customer management
  app.get("/api/customers", requireAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const customers = await storage.getCustomers(limit, offset);
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.post("/api/customers", requireAuth, async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(validatedData);
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid customer data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create customer" });
      }
    }
  });

  // Orders management
  app.post("/api/orders", requireAuth, async (req, res) => {
    try {
      const validatedData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(validatedData);
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid order data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create order" });
      }
    }
  });

  // AI FEATURE 1: Natural Language to Database Rules
  // Converts "customers who spent over 10000" to database queries
  app.post("/api/ai/convert-rules", requireAuth, async (req, res) => {
    try {
      const { naturalLanguage } = req.body;
      
      if (!naturalLanguage || typeof naturalLanguage !== 'string') {
        return res.status(400).json({ message: "Natural language input is required" });
      }

      const rules = await convertNaturalLanguageToRules(naturalLanguage);
      const audienceSize = await storage.getAudienceSize(rules);
      
      res.json({ rules, audienceSize });
    } catch (error) {
      console.error("AI conversion error:", error);
      res.status(500).json({ message: "Failed to convert natural language to rules" });
    }
  });

  // AI FEATURE 2: Campaign Message Generation
  // Creates multiple message variants with engagement predictions
  app.post("/api/ai/generate-message", requireAuth, async (req, res) => {
    try {
      const { objective, audienceDescription } = req.body;
      
      const messages = await generateCampaignMessage(objective, audienceDescription);
      res.json({ messages });
    } catch (error) {
      console.error("AI message generation error:", error);
      res.status(500).json({ message: "Failed to generate campaign messages" });
    }
  });

  // Audience size calculation
  app.post("/api/audience/size", requireAuth, async (req, res) => {
    try {
      const { rules } = req.body;
      
      if (!Array.isArray(rules)) {
        return res.status(400).json({ message: "Rules must be an array" });
      }

      const audienceSize = await storage.getAudienceSize(rules as SegmentRule[]);
      res.json({ size: audienceSize });
    } catch (error) {
      res.status(500).json({ message: "Failed to calculate audience size" });
    }
  });

  // Campaign management
  app.get("/api/campaigns", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const campaigns = await storage.getCampaigns(req.user!.id);
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.post("/api/campaigns", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = insertCampaignSchema.parse({
        ...req.body,
        createdBy: req.user!.id
      });

      const campaign = await storage.createCampaign(validatedData);
      
      // Start campaign delivery process
      await initiateCampaignDelivery(campaign.id);
      
      res.status(201).json(campaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid campaign data", errors: error.errors });
      } else {
        console.error("Campaign creation error:", error);
        res.status(500).json({ message: "Failed to create campaign" });
      }
    }
  });

  // Vendor API simulation (for external delivery service)
  app.post("/api/vendor/send", async (req, res) => {
    const { messageId, customerId, message } = req.body;
    
    // Simulate delivery success/failure (90% success rate)
    const isSuccess = Math.random() > 0.1;
    
    setTimeout(async () => {
      try {
        // Call our delivery receipt API
        await fetch(`http://localhost:5000/api/delivery/receipt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messageId,
            status: isSuccess ? 'sent' : 'failed',
            failureReason: isSuccess ? undefined : 'Delivery service unavailable'
          })
        });
      } catch (error) {
        console.error("Failed to send delivery receipt:", error);
      }
    }, Math.random() * 5000 + 1000); // Random delay between 1-6 seconds

    res.json({ 
      status: 'accepted',
      messageId,
      estimatedDelivery: '1-5 seconds'
    });
  });

  // Delivery receipt API
  app.post("/api/delivery/receipt", async (req, res) => {
    try {
      const { messageId, status, failureReason } = req.body;
      
      await storage.updateCommunicationLogStatus(
        parseInt(messageId), 
        status, 
        failureReason
      );
      
      res.json({ success: true });
    } catch (error) {
      console.error("Delivery receipt error:", error);
      res.status(500).json({ message: "Failed to process delivery receipt" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      // Calculate various stats for dashboard
      const customers = await storage.getCustomers(1000); // Get sample for calculation
      const campaigns = await storage.getCampaigns(req.user!.id);
      
      const totalCustomers = customers.length;
      const activeCampaigns = campaigns.filter(c => c.status === 'sending' || c.status === 'scheduled').length;
      
      const totalSent = campaigns.reduce((sum, c) => sum + c.sentCount, 0);
      const totalFailed = campaigns.reduce((sum, c) => sum + c.failedCount, 0);
      const deliveryRate = totalSent + totalFailed > 0 ? (totalSent / (totalSent + totalFailed)) * 100 : 0;
      
      // Mock revenue impact calculation
      const revenueImpact = totalSent * 150; // Assume ₹150 average revenue per successful message
      
      res.json({
        totalCustomers,
        activeCampaigns,
        deliveryRate: deliveryRate.toFixed(1),
        revenueImpact: Math.floor(revenueImpact)
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// CAMPAIGN DELIVERY SYSTEM
// Simulates real-world delivery with vendor API integration
async function initiateCampaignDelivery(campaignId: number) {
  try {
    const campaign = await storage.getCampaign(campaignId);
    if (!campaign) return;

    // Step 1: Mark campaign as actively sending
    await storage.updateCampaignStatus(campaignId, 'sending');

    // Step 2: Find customers matching the campaign rules
    const audience = await storage.getCustomersBySegmentRules(campaign.rules as SegmentRule[]);

    // Step 3: Create personalized messages for each customer
    for (const customer of audience) {
      const personalizedMessage = campaign.message.replace('{{name}}', customer.name);
      
      // Log the message attempt
      const log = await storage.createCommunicationLog({
        campaignId,
        customerId: customer.id,
        message: personalizedMessage,
        status: 'pending'
      });

      // Step 4: Send to vendor API (simulated with realistic delays)
      setTimeout(async () => {
        try {
          await fetch('http://localhost:5000/api/vendor/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messageId: log.id,
              customerId: customer.id,
              message: personalizedMessage
            })
          });
        } catch (error) {
          console.error("Vendor API unreachable:", error);
          await storage.updateCommunicationLogStatus(log.id, 'failed', 'Vendor API unreachable');
        }
      }, Math.random() * 10000); // Realistic processing delay: 0-10 seconds
    }

    // Step 5: Mark campaign as completed after processing
    setTimeout(async () => {
      await storage.updateCampaignStatus(campaignId, 'completed');
    }, 15000); // Allow time for all messages to process

  } catch (error) {
    console.error("Campaign delivery failed:", error);
    await storage.updateCampaignStatus(campaignId, 'failed');
  }
}
