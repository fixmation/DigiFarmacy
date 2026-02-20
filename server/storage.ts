// Simple in-memory storage implementation for DigiFarmacy
// This provides a working storage layer while database connectivity is being resolved

import { 
  type Profile,
  type PharmacyDetails,
  type LaboratoryDetails,
  type LabBooking,
  type CommissionTransaction,
  type Prescription,
  type PrescriptionMedication,
  type InsertProfile,
  type InsertPharmacyDetails,
  type InsertLaboratoryDetails,
  type InsertLabBooking,
  type InsertCommissionTransaction,
  type InsertPrescription,
  type InsertPrescriptionMedication,
  type User,
  type InsertUser
} from "@shared/schema";

export interface MedicineBatch {
  id: string;
  gtin: string;
  batchId: string;
  medicineName: string;
  expiryDate: Date;
  stockCount: number;
  costPrice: number;
  sellingPrice: number;
  isPromotional: boolean;
  location: string;
}

// Database storage interface
export interface IStorage {
  // Users (legacy support)
  createUser(user: InsertUser): Promise<User>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  updateUser(id: number, updates: Partial<User>): Promise<User | null>;
  deleteUser(id: number): Promise<boolean>;
  listUsers(): Promise<User[]>;

  // Profiles
  createProfile(profile: InsertProfile): Promise<Profile>;
  getProfile(id: string): Promise<Profile | null>;
  getProfileByEmail(email: string): Promise<Profile | null>;
  updateProfile(id: string, updates: Partial<Profile>): Promise<Profile | null>;
  listProfiles(): Promise<Profile[]>;

  // Pharmacy Details
  createPharmacyDetails(pharmacy: InsertPharmacyDetails): Promise<PharmacyDetails>;
  getPharmacyDetails(id: string): Promise<PharmacyDetails | null>;
  getPharmacyByUserId(userId: string): Promise<PharmacyDetails | null>;
  updatePharmacyDetails(id: string, updates: Partial<PharmacyDetails>): Promise<PharmacyDetails | null>;
  listPharmacies(): Promise<PharmacyDetails[]>;

  // Laboratory Details
  createLaboratoryDetails(laboratory: InsertLaboratoryDetails): Promise<LaboratoryDetails>;
  getLaboratoryDetails(id: string): Promise<LaboratoryDetails | null>;
  getLaboratoryByUserId(userId: string): Promise<LaboratoryDetails | null>;
  updateLaboratoryDetails(id: string, updates: Partial<LaboratoryDetails>): Promise<LaboratoryDetails | null>;
  listLaboratories(): Promise<LaboratoryDetails[]>;

  // Lab Bookings
  createLabBooking(booking: InsertLabBooking): Promise<LabBooking>;
  getLabBooking(id: string): Promise<LabBooking | null>;
  getLabBookingsByLaboratory(laboratoryId: string): Promise<LabBooking[]>;
  updateLabBooking(id: string, updates: Partial<LabBooking>): Promise<LabBooking | null>;
  deleteLabBooking(id: string): Promise<boolean>;
  listLabBookings(): Promise<LabBooking[]>;

  // Commission Transactions
  createCommissionTransaction(transaction: InsertCommissionTransaction): Promise<CommissionTransaction>;
  getCommissionTransaction(id: string): Promise<CommissionTransaction | null>;
  getCommissionTransactionsByPharmacy(pharmacyId: string): Promise<CommissionTransaction[]>;
  getCommissionTransactionsByLaboratory(laboratoryId: string): Promise<CommissionTransaction[]>;
  listCommissionTransactions(): Promise<CommissionTransaction[]>;

  // Prescriptions
  createPrescription(prescription: InsertPrescription): Promise<Prescription>;
  getPrescription(id: string): Promise<Prescription | null>;
  getPrescriptionsByPharmacy(pharmacyId: string): Promise<Prescription[]>;
  updatePrescription(id: string, updates: Partial<Prescription>): Promise<Prescription | null>;
  deletePrescription(id: string): Promise<boolean>;
  listPrescriptions(): Promise<Prescription[]>;

  // Prescription Medications
  createPrescriptionMedication(medication: InsertPrescriptionMedication): Promise<PrescriptionMedication>;
  getPrescriptionMedication(id: string): Promise<PrescriptionMedication | null>;
  getPrescriptionMedicationsByPrescription(prescriptionId: string): Promise<PrescriptionMedication[]>;
  updatePrescriptionMedication(id: string, updates: Partial<PrescriptionMedication>): Promise<PrescriptionMedication | null>;
  deletePrescriptionMedication(id: string): Promise<boolean>;
  
  // Medicine Batches
  getRotationNeededBatches(minDays: number, maxDays: number): Promise<MedicineBatch[]>;
  getExpiringBatches(daysUntilExpiry: number): Promise<MedicineBatch[]>;
  updateBatchForPromotion(batchId: string, updates: Partial<MedicineBatch>): Promise<MedicineBatch | null>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: User[] = [];
  private profiles: Profile[] = [];
  private pharmacies: PharmacyDetails[] = [];
  private laboratories: LaboratoryDetails[] = [];
  private labBookings: LabBooking[] = [];
  private commissionTransactions: CommissionTransaction[] = [];
  private prescriptions: Prescription[] = [];
  private prescriptionMedications: PrescriptionMedication[] = [];
  private medicineBatches: MedicineBatch[] = [];

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Add sample profiles
    this.profiles = [
      {
        id: "user-pharmacy-001",
        email: "pharmacist@test.com",
        fullName: "Test Pharmacist",
        phone: "123456789",
        role: "pharmacy",
        status: "verified",
        preferredLanguage: "en",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "user-lab-001",
        email: "lab@test.com",
        fullName: "Test Lab",
        phone: "987654321",
        role: "laboratory",
        status: "verified",
        preferredLanguage: "en",
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];
    // Add sample pharmacies across Sri Lanka
    this.pharmacies = [
      {
        id: "pharmacy-001",
        userId: "user-pharmacy-001",
        businessName: "New Cross Hospital Pharmacy",
        registrationNumber: "PH001",
        address: "357 Galle Road, Colombo 03",
        latitude: "6.9271",
        longitude: "79.8612",
        contactPhone: "+94112574757",
        contactEmail: "pharmacy@newcross.lk",
        operatingHours: { "monday": "8:00-20:00", "tuesday": "8:00-20:00", "wednesday": "8:00-20:00", "thursday": "8:00-20:00", "friday": "8:00-20:00", "saturday": "8:00-18:00", "sunday": "9:00-17:00" },
        pharmacistCertificateUrl: null,
        businessRegistrationUrl: null,
        verificationNotes: null,
        verifiedAt: new Date(),
        verifiedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "pharmacy-002", 
        userId: "user-pharmacy-002",
        businessName: "Nawaloka Pharmacy",
        registrationNumber: "PH002",
        address: "23 Deshamanya H. K. Dharmadasa Mawatha, Colombo 02",
        latitude: "6.9147",
        longitude: "79.8525",
        contactPhone: "+94112544444",
        contactEmail: "pharmacy@nawaloka.com",
        operatingHours: { "monday": "7:00-22:00", "tuesday": "7:00-22:00", "wednesday": "7:00-22:00", "thursday": "7:00-22:00", "friday": "7:00-22:00", "saturday": "7:00-22:00", "sunday": "8:00-20:00" },
        pharmacistCertificateUrl: null,
        businessRegistrationUrl: null,
        verificationNotes: null,
        verifiedAt: new Date(),
        verifiedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    // Add sample laboratories
    this.laboratories = [
      {
        id: "lab-001",
        userId: "user-lab-001",
        businessName: "Asiri Central Hospital Laboratory",
        registrationNumber: "LAB001",
        address: "114 Norris Canal Road, Colombo 10",
        contactPhone: "+94112665500",
        contactEmail: "lab@asiri.lk",
        operatingHours: { "monday": "6:00-18:00", "tuesday": "6:00-18:00", "wednesday": "6:00-18:00", "thursday": "6:00-18:00", "friday": "6:00-18:00", "saturday": "6:00-16:00", "sunday": "7:00-12:00" },
        servicesOffered: ["Blood Tests", "Urine Tests", "X-Rays", "ECG", "Ultrasound"],
        homeVisitAvailable: true,
        homeVisitCharges: "2500.00",
        verifiedAt: new Date(),
        verifiedBy: null,
        verificationNotes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];
    // Add sample medicine batches
    this.medicineBatches = [
      // A batch that is already expired
      {
        id: 'batch_001', gtin: '67890123456789', batchId: 'EXP001', medicineName: 'Expired Med A',
        expiryDate: new Date(new Date().setDate(new Date().getDate() - 10)),
        stockCount: 50, costPrice: 80, sellingPrice: 100, isPromotional: false, location: 'Shelf C-1'
      },
      // A batch expiring in 30 days
      {
        id: 'batch_002', gtin: '78901234567890', batchId: 'NEAR_EXP002', medicineName: 'Amlodipine 5mg',
        expiryDate: new Date(new Date().setDate(new Date().getDate() + 30)),
        stockCount: 120, costPrice: 150, sellingPrice: 180, isPromotional: false, location: 'Shelf B-4'
      },
      // A batch expiring in 90 days (will be picked up by the new rotation job)
      {
        id: 'batch_003', gtin: '89012345678901', batchId: 'GOOD_EXP003', medicineName: 'Metformin 500mg',
        expiryDate: new Date(new Date().setDate(new Date().getDate() + 90)),
        stockCount: 300, costPrice: 50, sellingPrice: 60, isPromotional: false, location: 'Shelf A-1'
      },
      // Another batch expiring in 45 days
      {
        id: 'batch_004', gtin: '90123456789012', batchId: 'NEAR_EXP004', medicineName: 'Paracetamol 500mg',
        expiryDate: new Date(new Date().setDate(new Date().getDate() + 45)),
        stockCount: 500, costPrice: 20, sellingPrice: 25, isPromotional: false, location: 'Shelf D-8'
      },
        // A batch expiring in 75 days (should be picked up for rotation)
      {
        id: 'batch_005', gtin: '12345678901234', batchId: 'ROTATE_ME_005', medicineName: 'Lisinopril 10mg',
        expiryDate: new Date(new Date().setDate(new Date().getDate() + 75)),
        stockCount: 250, costPrice: 90, sellingPrice: 110, isPromotional: false, location: 'Shelf F-2'
      },
    ];
  }

  // User methods (legacy support)
  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      id: this.users.length + 1,
      username: user.username,
      password: user.password,
    };
    this.users.push(newUser);
    return newUser;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(user => user.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(user => user.username === username);
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | null> {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) return null;
    
    this.users[userIndex] = { ...this.users[userIndex], ...updates };
    return this.users[userIndex];
  }

  async deleteUser(id: number): Promise<boolean> {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) return false;
    
    this.users.splice(userIndex, 1);
    return true;
  }

  async listUsers(): Promise<User[]> {
    return [...this.users];
  }

  // Profile methods
  async createProfile(profile: InsertProfile): Promise<Profile> {
    const newProfile: Profile = {
      id: profile.id || `profile_${Date.now()}`,
      email: profile.email,
      fullName: profile.fullName,
      phone: profile.phone || null,
      role: "customer" as any,
      status: "pending" as any,
      preferredLanguage: "en" as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.profiles.push(newProfile);
    return newProfile;
  }

  async getProfile(id: string): Promise<Profile | null> {
    return this.profiles.find(profile => profile.id === id) || null;
  }

  async getProfileByEmail(email: string): Promise<Profile | null> {
    return this.profiles.find(p => p.email === email) || null;
  }

  async updateProfile(id: string, updates: Partial<Profile>): Promise<Profile | null> {
    const profileIndex = this.profiles.findIndex(profile => profile.id === id);
    if (profileIndex === -1) return null;
    
    this.profiles[profileIndex] = { ...this.profiles[profileIndex], ...updates, updatedAt: new Date() };
    return this.profiles[profileIndex];
  }

  async listProfiles(): Promise<Profile[]> {
    return this.profiles;
  }

  // Pharmacy Details methods
  async createPharmacyDetails(pharmacy: InsertPharmacyDetails): Promise<PharmacyDetails> {
    const newPharmacy: PharmacyDetails = {
      id: `pharmacy_${Date.now()}`,
      userId: null,
      businessName: pharmacy.businessName,
      registrationNumber: pharmacy.registrationNumber,
      address: pharmacy.address,
      latitude: null,
      longitude: null,
      contactPhone: null,
      contactEmail: null,
      operatingHours: null,
      pharmacistCertificateUrl: null,
      businessRegistrationUrl: null,
      verificationNotes: null,
      verifiedAt: null,
      verifiedBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.pharmacies.push(newPharmacy);
    return newPharmacy;
  }

  async getPharmacyDetails(id: string): Promise<PharmacyDetails | null> {
    return this.pharmacies.find(pharmacy => pharmacy.id === id) || null;
  }

  async getPharmacyByUserId(userId: string): Promise<PharmacyDetails | null> {
    return this.pharmacies.find(pharmacy => pharmacy.userId === userId) || null;
  }

  async updatePharmacyDetails(id: string, updates: Partial<PharmacyDetails>): Promise<PharmacyDetails | null> {
    const pharmacyIndex = this.pharmacies.findIndex(pharmacy => pharmacy.id === id);
    if (pharmacyIndex === -1) return null;
    
    this.pharmacies[pharmacyIndex] = { ...this.pharmacies[pharmacyIndex], ...updates, updatedAt: new Date() };
    return this.pharmacies[pharmacyIndex];
  }

  async listPharmacies(): Promise<PharmacyDetails[]> {
    return [...this.pharmacies];
  }

  // Simplified laboratory methods
  async createLaboratoryDetails(laboratory: InsertLaboratoryDetails): Promise<LaboratoryDetails> {
    const newLaboratory: LaboratoryDetails = {
      id: `lab_${Date.now()}`,
      userId: null,
      businessName: laboratory.businessName,
      registrationNumber: laboratory.registrationNumber,
      address: laboratory.address,
      contactPhone: null,
      contactEmail: null,
      operatingHours: null,
      servicesOffered: null,
      homeVisitAvailable: null,
      homeVisitCharges: null,
      verifiedAt: null,
      verifiedBy: null,
      verificationNotes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.laboratories.push(newLaboratory);
    return newLaboratory;
  }

  async getLaboratoryDetails(id: string): Promise<LaboratoryDetails | null> {
    return this.laboratories.find(lab => lab.id === id) || null;
  }

  async getLaboratoryByUserId(userId: string): Promise<LaboratoryDetails | null> {
    return this.laboratories.find(lab => lab.userId === userId) || null;
  }

  async updateLaboratoryDetails(id: string, updates: Partial<LaboratoryDetails>): Promise<LaboratoryDetails | null> {
    const labIndex = this.laboratories.findIndex(lab => lab.id === id);
    if (labIndex === -1) return null;
    
    this.laboratories[labIndex] = { ...this.laboratories[labIndex], ...updates, updatedAt: new Date() };
    return this.laboratories[labIndex];
  }

  async listLaboratories(): Promise<LaboratoryDetails[]> {
    return [...this.laboratories];
  }

  // Simplified lab booking methods
  async createLabBooking(booking: InsertLabBooking): Promise<LabBooking> {
    const newBooking: LabBooking = {
      id: `booking_${Date.now()}`,
      laboratoryId: booking.laboratoryId,
      customerName: booking.customerName,
      contactPhone: booking.contactPhone,
      address: booking.address,
      serviceType: booking.serviceType,
      preferredDate: booking.preferredDate,
      preferredTime: booking.preferredTime,
      specialInstructions: null,
      status: "pending" as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.labBookings.push(newBooking);
    return newBooking;
  }

  async getLabBooking(id: string): Promise<LabBooking | null> {
    return this.labBookings.find(booking => booking.id === id) || null;
  }

  async getLabBookingsByLaboratory(laboratoryId: string): Promise<LabBooking[]> {
    return this.labBookings.filter(booking => booking.laboratoryId === laboratoryId);
  }

  async updateLabBooking(id: string, updates: Partial<LabBooking>): Promise<LabBooking | null> {
    const bookingIndex = this.labBookings.findIndex(booking => booking.id === id);
    if (bookingIndex === -1) return null;
    
    this.labBookings[bookingIndex] = { ...this.labBookings[bookingIndex], ...updates, updatedAt: new Date() };
    return this.labBookings[bookingIndex];
  }

  async deleteLabBooking(id: string): Promise<boolean> {
    const bookingIndex = this.labBookings.findIndex(booking => booking.id === id);
    if (bookingIndex === -1) return false;
    
    this.labBookings.splice(bookingIndex, 1);
    return true;
  }

  async listLabBookings(): Promise<LabBooking[]> {
    return [...this.labBookings];
  }

  // Simplified commission transaction methods
  async createCommissionTransaction(transaction: InsertCommissionTransaction): Promise<CommissionTransaction> {
    const newTransaction: CommissionTransaction = {
      id: `commission_${Date.now()}`,
      pharmacyId: null,
      laboratoryId: null,
      prescriptionId: null,
      amountLkr: "0.00",
      description: null,
      status: "pending" as any,
      transactionDate: new Date(),
    };
    this.commissionTransactions.push(newTransaction);
    return newTransaction;
  }

  async getCommissionTransaction(id: string): Promise<CommissionTransaction | null> {
    return this.commissionTransactions.find(transaction => transaction.id === id) || null;
  }

  async getCommissionTransactionsByPharmacy(pharmacyId: string): Promise<CommissionTransaction[]> {
    return this.commissionTransactions.filter(transaction => transaction.pharmacyId === pharmacyId);
  }

  async getCommissionTransactionsByLaboratory(laboratoryId: string): Promise<CommissionTransaction[]> {
    return this.commissionTransactions.filter(transaction => transaction.laboratoryId === laboratoryId);
  }

  async listCommissionTransactions(): Promise<CommissionTransaction[]> {
    return [...this.commissionTransactions];
  }

  // Simplified prescription methods
  async createPrescription(prescription: InsertPrescription): Promise<Prescription> {
    const newPrescription: Prescription = {
      id: `prescription_${Date.now()}`,
      customerId: null,
      pharmacyId: null,
      imageUrl: prescription.imageUrl,
      status: "pending" as any,
      ocrRawText: null,
      ocrConfidence: null,
      totalAmountLkr: null,
      serviceFee: null,
      notes: null,
      processedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.prescriptions.push(newPrescription);
    return newPrescription;
  }

  async getPrescription(id: string): Promise<Prescription | null> {
    return this.prescriptions.find(prescription => prescription.id === id) || null;
  }

  async getPrescriptionsByPharmacy(pharmacyId: string): Promise<Prescription[]> {
    return this.prescriptions.filter(prescription => prescription.pharmacyId === pharmacyId);
  }

  async updatePrescription(id: string, updates: Partial<Prescription>): Promise<Prescription | null> {
    const prescriptionIndex = this.prescriptions.findIndex(prescription => prescription.id === id);
    if (prescriptionIndex === -1) return null;
    
    this.prescriptions[prescriptionIndex] = { ...this.prescriptions[prescriptionIndex], ...updates, updatedAt: new Date() };
    return this.prescriptions[prescriptionIndex];
  }

  async deletePrescription(id: string): Promise<boolean> {
    const prescriptionIndex = this.prescriptions.findIndex(prescription => prescription.id === id);
    if (prescriptionIndex === -1) return false;
    
    this.prescriptions.splice(prescriptionIndex, 1);
    return true;
  }

  async listPrescriptions(): Promise<Prescription[]> {
    return [...this.prescriptions];
  }

  // Simplified prescription medication methods
  async createPrescriptionMedication(medication: InsertPrescriptionMedication): Promise<PrescriptionMedication> {
    const newMedication: PrescriptionMedication = {
      id: `medication_${Date.now()}`,
      prescriptionId: null,
      medicationName: medication.medicationName,
      dosage: null,
      frequency: null,
      duration: null,
      quantity: null,
      unitPrice: null,
      totalPrice: null,
      verified: null,
      confidenceScore: null,
      createdAt: new Date(),
    };
    this.prescriptionMedications.push(newMedication);
    return newMedication;
  }

  async getPrescriptionMedication(id: string): Promise<PrescriptionMedication | null> {
    return this.prescriptionMedications.find(medication => medication.id === id) || null;
  }

  async getPrescriptionMedicationsByPrescription(prescriptionId: string): Promise<PrescriptionMedication[]> {
    return this.prescriptionMedications.filter(medication => medication.prescriptionId === prescriptionId);
  }

  async updatePrescriptionMedication(id: string, updates: Partial<PrescriptionMedication>): Promise<PrescriptionMedication | null> {
    const medicationIndex = this.prescriptionMedications.findIndex(medication => medication.id === id);
    if (medicationIndex === -1) return null;
    
    this.prescriptionMedications[medicationIndex] = { ...this.prescriptionMedications[medicationIndex], ...updates };
    return this.prescriptionMedications[medicationIndex];
  }

  async deletePrescriptionMedication(id: string): Promise<boolean> {
    const medicationIndex = this.prescriptionMedications.findIndex(medication => medication.id === id);
    if (medicationIndex === -1) return false;
    
    this.prescriptionMedications.splice(medicationIndex, 1);
    return true;
  }

  // --- Medicine Batch Methods ---
  async getRotationNeededBatches(minDays: number, maxDays: number): Promise<MedicineBatch[]> {
    const minThresholdDate = new Date();
    minThresholdDate.setDate(minThresholdDate.getDate() + minDays);

    const maxThresholdDate = new Date();
    maxThresholdDate.setDate(maxThresholdDate.getDate() + maxDays);

    // Find batches expiring strictly after minDays and up to/including maxDays
    return this.medicineBatches.filter(batch =>
      batch.expiryDate > minThresholdDate &&
      batch.expiryDate <= maxThresholdDate
    );
  }
  
  async getExpiringBatches(daysUntilExpiry: number): Promise<MedicineBatch[]> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysUntilExpiry);

    return this.medicineBatches.filter(batch => 
      batch.expiryDate <= thresholdDate &&
      batch.expiryDate > new Date() && // Ensure it's not already expired
      !batch.isPromotional // Only pick up items that are not already promotional
    );
  }

  async updateBatchForPromotion(batchId: string, updates: Partial<MedicineBatch>): Promise<MedicineBatch | null> {
    const batchIndex = this.medicineBatches.findIndex(b => b.id === batchId);
    if (batchIndex === -1) {
      return null;
    }
    this.medicineBatches[batchIndex] = { ...this.medicineBatches[batchIndex], ...updates };
    return this.medicineBatches[batchIndex];
  }
}

export const storage = new MemStorage();