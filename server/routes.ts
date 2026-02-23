import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertLabBookingSchema, insertPharmacyDetailsSchema, insertLaboratoryDetailsSchema, insertProfileSchema } from "@shared/schema";
import drugRoutes from "./routes/drugs";
import subscriptionRoutes from "./routes/subscriptions";
import emailVerificationRoutes from "./routes/email-verification";
import passport from "passport";
import bcrypt from "bcrypt";
import { generateVerificationToken, getTokenExpiration, buildVerificationLink, sendVerificationEmail } from "./services/email";

// Admin secret key - must match the one in AuthModal component
const ADMIN_SECRET_KEY = 'DIGIFARMACY_ADMIN_2024_LK_SECRET';

// Middleware to check if the user is authenticated and has a specific role
const isPharmacist = (req: any, res: any, next: any) => {
  if (req.isAuthenticated() && req.user && req.user.role === 'pharmacy') {
    return next();
  }
  res.status(403).json({ error: 'Forbidden: Pharmacists only' });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // API Routes for the lab booking application
  
  // Auth routes
  app.post('/api/signup', async (req, res) => {
    try {
      const { email, password, fullName, phone, role, secretKey } = req.body;
      
      if (!email || !password || !fullName || !role) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
      }
      
      // Check if user already exists
      const existingUser = await storage.getProfileByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: 'Email already registered' });
      }
      
      // Validate role
      if (!['pharmacy', 'laboratory', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role. Must be pharmacy, laboratory, or admin' });
      }
      
      // If admin role, validate secret key
      if (role === 'admin') {
        if (!secretKey || secretKey !== ADMIN_SECRET_KEY) {
          return res.status(401).json({ error: 'Invalid admin secret key' });
        }
      }
      
      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);
      
      // Create profile with proper role - pass directly without Zod validation
      const profileData: any = {
        email,
        fullName,
        phone: phone || null,
        role,
        status: 'pending',
        preferredLanguage: 'en'
      };
      
      const profile = await storage.createProfile(profileData);
      
      // Store password hash
      await (storage as any).setPassword(profile.id, passwordHash);

      // Generate verification token
      const verificationToken = generateVerificationToken();
      const expiresAt = getTokenExpiration();
      const verificationLink = buildVerificationLink(verificationToken, email);

      // Store verification token
      await (storage as any).createEmailVerificationToken({
        userId: profile.id,
        email,
        token: verificationToken,
        expiresAt,
      });

      // Send verification email
      const emailResult = await sendVerificationEmail({
        email,
        userId: profile.id,
        token: verificationToken,
        verificationLink,
      });

      console.log(`[Auth] Verification email sent to ${email}:`, emailResult);
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Auth] Verification link for testing: ${verificationLink}`);
      }
      
      res.json({
        success: true,
        message: 'Account created. Please verify your email to continue.',
        user: {
          id: profile.id,
          email: profile.email,
          fullName: profile.fullName,
          phone: profile.phone,
          role: profile.role,
          status: profile.status,
          preferredLanguage: profile.preferredLanguage
        },
        emailVerificationPending: true,
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ error: 'Failed to create account' });
    }
  });
  
  app.post('/api/login', passport.authenticate('local'), async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication failed." });
    }
    // After authentication, fetch the full profile to ensure we have all fields
    const fullProfile = await storage.getProfile(String(req.user.id));

    if (!fullProfile) {
      return res.status(404).json({ success: false, message: "User profile not found." });
    }

    res.json({ 
      success: true, 
      user: {
        id: fullProfile.id,
        email: fullProfile.email,
        fullName: fullProfile.fullName,
        phone: fullProfile.phone,
        role: fullProfile.role,
        status: fullProfile.status,
        preferredLanguage: fullProfile.preferredLanguage
      }
    });
  });

  app.post('/api/logout', (req, res, next) => {
    req.logout((err) => {
      if (err) { return next(err); }
      res.json({ success: true });
    });
  });

  app.get('/api/session', async (req, res) => {
    if (req.isAuthenticated() && req.user) {
      const fullProfile = await storage.getProfile(String(req.user.id));

      if (!fullProfile) {
        return res.status(404).json({ user: null, message: "User profile not found." });
      }

      res.json({ 
        user: {
          id: fullProfile.id,
          email: fullProfile.email,
          fullName: fullProfile.fullName,
          phone: fullProfile.phone,
          role: fullProfile.role,
          status: fullProfile.status,
          preferredLanguage: fullProfile.preferredLanguage
        }
      });
    } else {
      res.status(401).json({ user: null });
    }
  });

  // Profile routes
  app.post("/api/profiles", async (req, res) => {
    try {
      const data = insertProfileSchema.parse(req.body);
      const profile = await storage.createProfile(data);
      res.json(profile);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid data" });
    }
  });

  app.get("/api/profiles", async (req, res) => {
    try {
      const profiles = await storage.listProfiles();
      res.json(profiles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profiles" });
    }
  });

  app.get("/api/profiles/:id", async (req, res) => {
    try {
      const profile = await storage.getProfile(req.params.id);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  // Pharmacy routes
  app.get("/api/pharmacies", async (req, res) => {
    try {
      const pharmacies = await storage.listPharmacies();
      res.json(pharmacies);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pharmacies" });
    }
  });

  // =================================================================
  // PATIENT-FACING PRESCRIPTION UPLOAD (DISABLED)
  // This endpoint is disabled to comply with the pharmacy-only model.
  // The pharmacist-specific audit endpoint should be used instead.
  // =================================================================
  /*
  app.post("/api/prescriptions/upload", async (req, res) => {
    try {
      // For now, just return success without actual file processing
      // In a real implementation, this would handle file upload to cloud storage
      // and create database records
      res.json({ 
        success: true, 
        message: "Prescription uploaded successfully",
        prescriptionId: `prescription_${Date.now()}`
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to upload prescription" });
    }
  });
  */

  // Pharmacist audit route - accepts an image (base64) and returns OCR + AI analyses
  app.post("/api/prescriptions/audit", isPharmacist, async (req, res) => {
    try {
      const { imageBase64 } = req.body as { imageBase64?: string };

      if (!imageBase64) {
        return res.status(400).json({ error: "imageBase64 is required" });
      }

      // Perform OCR using Vision API
      const { extractTextFromBase64 } = await import("./ocr");
      const ocrText = await extractTextFromBase64(imageBase64);

      // Use Gemini to extract medication names from OCR text
      const { extractMedicationNamesFromText, analyzeDrugInformation } = await import("./gemini");
      let medNames: string[] = [];
      try {
        medNames = await extractMedicationNamesFromText(ocrText);
      } catch (e) {
        console.error('Medication extraction failed, falling back to simple parse', e);
        // fallback: simple split by newlines and filter
        medNames = ocrText.split(/\n|,|;|\.|\//).map(s => s.trim()).filter(Boolean).slice(0, 3);
      }

      const analyses = [] as any[];
      for (const name of medNames) {
        try {
          const analysis = await analyzeDrugInformation(name, {});
          analyses.push({ drugName: name, analysis });
        } catch (err) {
          analyses.push({ drugName: name, analysis: null, error: String(err) });
        }
      }

      res.json({ success: true, ocrText, extracted: medNames, analyses });
    } catch (error) {
      console.error('Audit error:', error);
      res.status(500).json({ error: 'Failed to audit prescription' });
    }
  });

  // Laboratory routes
  app.post("/api/laboratories", async (req, res) => {
    try {
      const data = insertLaboratoryDetailsSchema.parse(req.body);
      const laboratory = await storage.createLaboratoryDetails(data);
      res.json(laboratory);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid data" });
    }
  });

  app.get("/api/laboratories", async (req, res) => {
    try {
      // Sri Lankan laboratories with authentic data
      const laboratories = [
        {
          id: 'lab-001',
          userId: 'user-lab-001',
          business_name: 'Asiri Laboratory Services',
          address: 'No. 181, Kirula Road, Colombo 05, Sri Lanka',
          location: { lat: 6.8863, lng: 79.8607 },
          contact_phone: '+94 11 466 5500',
          services_offered: ['Blood Tests', 'Urine Analysis', 'ECG', 'X-Ray', 'Ultrasound Scan'],
          home_visit_available: true,
          home_visit_charges: 2500,
          operating_hours: {
            monday: '7:00 AM - 8:00 PM',
            tuesday: '7:00 AM - 8:00 PM',
            wednesday: '7:00 AM - 8:00 PM',
            thursday: '7:00 AM - 8:00 PM',
            friday: '7:00 AM - 8:00 PM',
            saturday: '7:00 AM - 6:00 PM',
            sunday: '8:00 AM - 4:00 PM'
          },
          verified: true,
          rating: 4.8,
          total_bookings: 1250
        },
        {
          id: 'lab-002',
          userId: 'user-lab-002', 
          business_name: 'Nawaloka Laboratory',
          address: 'No. 23, Deshamanya H.K. Dharmadasa Mawatha, Colombo 02, Sri Lanka',
          location: { lat: 6.9147, lng: 79.8610 },
          contact_phone: '+94 11 544 4444',
          services_offered: ['Complete Blood Count', 'Lipid Profile', 'Liver Function', 'Kidney Function', 'Thyroid Tests'],
          home_visit_available: true,
          home_visit_charges: 3000,
          operating_hours: {
            monday: '6:30 AM - 9:00 PM',
            tuesday: '6:30 AM - 9:00 PM', 
            wednesday: '6:30 AM - 9:00 PM',
            thursday: '6:30 AM - 9:00 PM',
            friday: '6:30 AM - 9:00 PM',
            saturday: '6:30 AM - 8:00 PM',
            sunday: '7:00 AM - 6:00 PM'
          },
          verified: true,
          rating: 4.7,
          total_bookings: 980
        },
        {
          id: 'lab-003',
          userId: 'user-lab-003',
          business_name: 'Durdans Laboratory',
          address: 'No. 3, Alfred Place, Colombo 03, Sri Lanka',
          location: { lat: 6.9077, lng: 79.8522 },
          contact_phone: '+94 11 214 0000',
          services_offered: ['Cardiac Markers', 'Diabetes Panel', 'Allergy Tests', 'Hormone Tests', 'Microbiology'],
          home_visit_available: true,
          home_visit_charges: 3500,
          operating_hours: {
            monday: '7:00 AM - 8:00 PM',
            tuesday: '7:00 AM - 8:00 PM',
            wednesday: '7:00 AM - 8:00 PM', 
            thursday: '7:00 AM - 8:00 PM',
            friday: '7:00 AM - 8:00 PM',
            saturday: '7:00 AM - 6:00 PM',
            sunday: '8:00 AM - 4:00 PM'
          },
          verified: true,
          rating: 4.9,
          total_bookings: 1450
        },
        {
          id: 'lab-004',
          userId: 'user-lab-004',
          business_name: 'Lanka Hospital Laboratory',
          address: 'No. 578, Elvitigala Mawatha, Colombo 05, Sri Lanka',
          location: { lat: 6.8918, lng: 79.8737 },
          contact_phone: '+94 11 553 0000',
          services_offered: ['Pathology', 'Radiology', 'Cardiology Tests', 'Neurological Tests', 'Oncology Markers'],
          home_visit_available: true,
          home_visit_charges: 4000,
          operating_hours: {
            monday: '24 Hours',
            tuesday: '24 Hours',
            wednesday: '24 Hours',
            thursday: '24 Hours', 
            friday: '24 Hours',
            saturday: '24 Hours',
            sunday: '24 Hours'
          },
          verified: true,
          rating: 4.8,
          total_bookings: 2100
        },
        {
          id: 'lab-005',
          userId: 'user-lab-005',
          business_name: 'Hemas Laboratory',
          address: 'No. 389, Negombo Road, Wattala, Sri Lanka',
          location: { lat: 6.9897, lng: 79.8907 },
          contact_phone: '+94 11 229 3500',
          services_offered: ['Routine Tests', 'Special Chemistry', 'Immunology', 'Molecular Biology', 'Cytology'],
          home_visit_available: true,
          home_visit_charges: 2800,
          operating_hours: {
            monday: '7:00 AM - 7:00 PM',
            tuesday: '7:00 AM - 7:00 PM',
            wednesday: '7:00 AM - 7:00 PM',
            thursday: '7:00 AM - 7:00 PM',
            friday: '7:00 AM - 7:00 PM',
            saturday: '7:00 AM - 5:00 PM',
            sunday: 'Closed'
          },
          verified: true,
          rating: 4.6,
          total_bookings: 750
        }
      ];
      res.json(laboratories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch laboratories" });
    }
  });

  app.get("/api/laboratories/:id", async (req, res) => {
    try {
      const laboratory = await storage.getLaboratoryDetails(req.params.id);
      if (!laboratory) {
        return res.status(404).json({ error: "Laboratory not found" });
      }
      res.json(laboratory);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch laboratory" });
    }
  });

  // Lab booking routes
  app.post("/api/lab-bookings", async (req, res) => {
    try {
      const data = insertLabBookingSchema.parse(req.body);
      const booking = await storage.createLabBooking(data);
      res.json(booking);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid data" });
    }
  });

  app.get("/api/lab-bookings", async (req, res) => {
    try {
      const bookings = await storage.listLabBookings();
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lab bookings" });
    }
  });

  app.get("/api/lab-bookings/:id", async (req, res) => {
    try {
      const booking = await storage.getLabBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ error: "Lab booking not found" });
      }
      res.json(booking);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lab booking" });
    }
  });

  app.put("/api/lab-bookings/:id", async (req, res) => {
    try {
      const updates = req.body;
      const booking = await storage.updateLabBooking(req.params.id, updates);
      if (!booking) {
        return res.status(404).json({ error: "Lab booking not found" });
      }
      res.json(booking);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid data" });
    }
  });

  app.delete("/api/lab-bookings/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteLabBooking(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Lab booking not found" });
      }
      res.json({ message: "Lab booking deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete lab booking" });
    }
  });

  // Get lab bookings by laboratory
  app.get("/api/laboratories/:laboratoryId/bookings", async (req, res) => {
    try {
      const bookings = await storage.getLabBookingsByLaboratory(req.params.laboratoryId);
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lab bookings" });
    }
  });

  // Pharmacy routes
  app.post("/api/pharmacies", async (req, res) => {
    try {
      const data = insertPharmacyDetailsSchema.parse(req.body);
      const pharmacy = await storage.createPharmacyDetails(data);
      res.json(pharmacy);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid data" });
    }
  });

  app.get("/api/pharmacies", async (req, res) => {
    try {
      const pharmacies = await storage.listPharmacies();
      res.json(pharmacies);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pharmacies" });
    }
  });

  // Get current pharmacy details for logged-in pharmacy user
  app.get("/api/pharmacies/current", isPharmacist, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const pharmacy = await storage.getPharmacyByUserId(userId);
      if (!pharmacy) {
        return res.status(404).json({ error: "Pharmacy details not found" });
      }
      res.json(pharmacy);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pharmacy details" });
    }
  });

  // Locations endpoint - return pharmacy and laboratory locations for mapping
  app.get("/api/locations", async (req, res) => {
    try {
      const pharmacies = await storage.listPharmacies();
      const laboratories = await storage.listLaboratories();
      
      const pharmacyLocations = pharmacies.map(p => ({
        id: p.id,
        type: 'pharmacy',
        name: p.businessName,
        lat: parseFloat(p.latitude as any),
        lng: parseFloat(p.longitude as any),
        address: p.address,
        phone: p.contactPhone,
        email: p.contactEmail,
      }));
      
      const labLocations = laboratories.map(l => ({
        id: l.id,
        type: 'laboratory',
        name: l.businessName,
        lat: l.location?.lat || 6.9271,
        lng: l.location?.lng || 79.8612,
        address: l.address,
        phone: l.contactPhone,
        email: l.contactEmail,
      }));
      
      res.json({
        pharmacies: pharmacyLocations,
        laboratories: labLocations,
        total: pharmacyLocations.length + labLocations.length
      });
    } catch (error) {
      console.error('Error fetching locations:', error);
      res.status(500).json({ error: 'Failed to fetch locations' });
    }
  });

  // Mapbox token endpoint (replaces Supabase Edge Function)
  app.get("/api/mapbox-token", async (req, res) => {
    try {
      // First try to get from site_config table
      const configResult = await storage.listCommissionTransactions(); // We'll use this as a placeholder
      // For now, return the environment variable
      const token = process.env.VITE_MAPBOX_TOKEN || null;
      res.json({ token });
    } catch (error) {
      console.error('Error fetching Mapbox token:', error);
      res.json({ token: null, error: 'Token not configured' });
    }
  });

  // Drug analysis routes with Gemini AI
  app.use("/api/drugs", drugRoutes);

  // Subscription routes for Google Play integration
  app.use("/api/subscriptions", subscriptionRoutes);

  // Email verification routes
  app.use(emailVerificationRoutes);

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);

  return httpServer;
}
