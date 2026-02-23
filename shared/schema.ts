import { pgTable, text, serial, integer, boolean, uuid, timestamp, decimal, jsonb, primaryKey, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles enum
export const userRoleEnum = ["customer", "pharmacy", "admin", "laboratory", "developer_admin"] as const;
export type UserRole = typeof userRoleEnum[number];

// User status enum
export const userStatusEnum = ["pending", "verified", "suspended", "rejected"] as const;
export type UserStatus = typeof userStatusEnum[number];

// Language codes
export const languageCodeEnum = ["en", "si", "ta"] as const;
export type LanguageCode = typeof languageCodeEnum[number];

// Payment status
export const paymentStatusEnum = ["pending", "processing", "completed", "failed"] as const;
export type PaymentStatus = typeof paymentStatusEnum[number];

// Profiles table (equivalent to Supabase profiles)
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  role: text("role").notNull().$type<UserRole>().default("customer"),
  status: text("status").notNull().$type<UserStatus>().default("pending"),
  emailVerified: timestamp("email_verified"),
  preferredLanguage: text("preferred_language").$type<LanguageCode>().default("en"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email verification tokens
export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Pharmacy details
export const pharmacyDetails = pgTable("pharmacy_details", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => profiles.id, { onDelete: "cascade" }),
  businessName: text("business_name").notNull(),
  registrationNumber: text("registration_number").notNull().unique(),
  pharmacistCertificateUrl: text("pharmacist_certificate_url"),
  businessRegistrationUrl: text("business_registration_url"),
  address: text("address").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  operatingHours: jsonb("operating_hours"),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  verificationNotes: text("verification_notes"),
  verifiedAt: timestamp("verified_at"),
  verifiedBy: uuid("verified_by").references(() => profiles.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Laboratory details
export const laboratoryDetails = pgTable("laboratory_details", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => profiles.id, { onDelete: "cascade" }),
  businessName: text("business_name").notNull(),
  registrationNumber: text("registration_number").notNull().unique(),
  address: text("address").notNull(),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  operatingHours: jsonb("operating_hours"),
  servicesOffered: text("services_offered").array(),
  homeVisitAvailable: boolean("home_visit_available").default(true),
  homeVisitCharges: decimal("home_visit_charges", { precision: 10, scale: 2 }),
  verifiedAt: timestamp("verified_at"),
  verifiedBy: uuid("verified_by").references(() => profiles.id),
  verificationNotes: text("verification_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Lab bookings
export const labBookings = pgTable("lab_bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  laboratoryId: uuid("laboratory_id").references(() => laboratoryDetails.id, { onDelete: "cascade" }).notNull(),
  customerName: text("customer_name").notNull(),
  contactPhone: text("contact_phone").notNull(),
  address: text("address").notNull(),
  serviceType: text("service_type").notNull(),
  preferredDate: text("preferred_date").notNull(),
  preferredTime: text("preferred_time").notNull(),
  specialInstructions: text("special_instructions"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Commission transactions
export const commissionTransactions = pgTable("commission_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  pharmacyId: uuid("pharmacy_id").references(() => pharmacyDetails.id, { onDelete: "cascade" }),
  laboratoryId: uuid("laboratory_id").references(() => laboratoryDetails.id, { onDelete: "cascade" }),
  prescriptionId: uuid("prescription_id"),
  amountLkr: decimal("amount_lkr", { precision: 10, scale: 2 }).notNull().default("100.00"),
  description: text("description"),
  status: text("status").$type<PaymentStatus>().default("completed"),
  transactionDate: timestamp("transaction_date").defaultNow(),
});

// Site configuration
export const siteConfig = pgTable("site_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  configKey: text("config_key").notNull().unique(),
  configValue: text("config_value"),
  description: text("description"),
  updatedBy: uuid("updated_by").references(() => profiles.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Prescriptions
export const prescriptions = pgTable("prescriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").references(() => profiles.id, { onDelete: "cascade" }),
  pharmacyId: uuid("pharmacy_id").references(() => pharmacyDetails.id, { onDelete: "set null" }),
  imageUrl: text("image_url").notNull(),
  ocrRawText: text("ocr_raw_text"),
  ocrConfidence: decimal("ocr_confidence", { precision: 3, scale: 2 }).default("0.0"),
  status: text("status").default("pending"),
  totalAmountLkr: decimal("total_amount_lkr", { precision: 10, scale: 2 }).default("0.00"),
  serviceFee: decimal("service_fee_lkr", { precision: 10, scale: 2 }).default("100.00"),
  notes: text("notes"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Prescription medications
export const prescriptionMedications = pgTable("prescription_medications", {
  id: uuid("id").primaryKey().defaultRandom(),
  prescriptionId: uuid("prescription_id").references(() => prescriptions.id, { onDelete: "cascade" }),
  medicationName: text("medication_name").notNull(),
  dosage: text("dosage"),
  frequency: text("frequency"),
  duration: text("duration"),
  quantity: integer("quantity"),
  unitPrice: decimal("unit_price_lkr", { precision: 10, scale: 2 }),
  totalPrice: decimal("total_price_lkr", { precision: 10, scale: 2 }),
  confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }).default("0.0"),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertProfileSchema = createInsertSchema(profiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  emailVerified: true,
});

export const insertPharmacyDetailsSchema = createInsertSchema(pharmacyDetails).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLaboratoryDetailsSchema = createInsertSchema(laboratoryDetails).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLabBookingSchema = createInsertSchema(labBookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommissionTransactionSchema = createInsertSchema(commissionTransactions).omit({
  id: true,
  transactionDate: true,
});

export const insertPrescriptionSchema = createInsertSchema(prescriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPrescriptionMedicationSchema = createInsertSchema(prescriptionMedications).omit({
  id: true,
  createdAt: true,
});

// Subscription status
export const subscriptionStatusEnum = ["ACTIVE", "PAUSED", "EXPIRED", "CANCELLED"] as const;
export type SubscriptionStatus = typeof subscriptionStatusEnum[number];

// Subscriptions table for Google Play billing
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  businessType: text("business_type").notNull().$type<"pharmacy" | "laboratory">(),
  skuId: text("sku_id").notNull(),
  purchaseToken: text("purchase_token").notNull().unique(),
  orderId: text("order_id").notNull().unique(),
  status: text("status").notNull().$type<SubscriptionStatus>().default("ACTIVE"),
  purchaseDate: timestamp("purchase_date").notNull(),
  expiryDate: timestamp("expiry_date").notNull(),
  renewalDate: timestamp("renewal_date"),
  isAutoRenew: boolean("is_auto_renew").default(true),
  priceAmountMicros: integer("price_amount_micros").notNull(),
  currencyCode: text("currency_code").default("LKR"),
  lastVerifiedAt: timestamp("last_verified_at"),
  googleResponse: jsonb("google_response"),
  cancellationDate: timestamp("cancellation_date"),
  cancellationReason: text("cancellation_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Purchase events audit log
export const purchaseEvents = pgTable("purchase_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscriptionId: uuid("subscription_id").notNull().references(() => subscriptions.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull().$type<"PURCHASE" | "RENEWAL" | "CANCELLATION" | "PAUSE" | "RESUME" | "REFUND">(),
  eventData: jsonb("event_data"),
  googleNotificationId: text("google_notification_id"),
  processedAt: timestamp("processed_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPurchaseEventSchema = createInsertSchema(purchaseEvents).omit({
  id: true,
  createdAt: true,
});

export const insertEmailVerificationTokenSchema = createInsertSchema(emailVerificationTokens).omit({
  id: true,
  createdAt: true,
});

// Types
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;

export type EmailVerificationToken = typeof emailVerificationTokens.$inferSelect;
export type InsertEmailVerificationToken = z.infer<typeof insertEmailVerificationTokenSchema>;

export type PharmacyDetails = typeof pharmacyDetails.$inferSelect;
export type InsertPharmacyDetails = z.infer<typeof insertPharmacyDetailsSchema>;

export type LaboratoryDetails = typeof laboratoryDetails.$inferSelect;
export type InsertLaboratoryDetails = z.infer<typeof insertLaboratoryDetailsSchema>;

export type LabBooking = typeof labBookings.$inferSelect;
export type InsertLabBooking = z.infer<typeof insertLabBookingSchema>;

export type CommissionTransaction = typeof commissionTransactions.$inferSelect;
export type InsertCommissionTransaction = z.infer<typeof insertCommissionTransactionSchema>;

export type Prescription = typeof prescriptions.$inferSelect;
export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;

export type PrescriptionMedication = typeof prescriptionMedications.$inferSelect;
export type InsertPrescriptionMedication = z.infer<typeof insertPrescriptionMedicationSchema>;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

export type PurchaseEvent = typeof purchaseEvents.$inferSelect;
export type InsertPurchaseEvent = z.infer<typeof insertPurchaseEventSchema>;

// Legacy compatibility - keeping the original users table structure
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
