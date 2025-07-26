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

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData() {
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
    return this.profiles.find(profile => profile.email === email) || null;
  }

  async updateProfile(id: string, updates: Partial<Profile>): Promise<Profile | null> {
    const profileIndex = this.profiles.findIndex(profile => profile.id === id);
    if (profileIndex === -1) return null;
    
    this.profiles[profileIndex] = { ...this.profiles[profileIndex], ...updates, updatedAt: new Date() };
    return this.profiles[profileIndex];
  }

  async listProfiles(): Promise<Profile[]> {
    return [...this.profiles];
  }

  // Simplified pharmacy methods
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
}

export const storage = new MemStorage();