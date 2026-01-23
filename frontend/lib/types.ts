import { Timestamp } from 'firebase/firestore';

// User Types
export interface User {
  email: string;
  createdAt: Timestamp;
  localName: string;
  localDescription: string;
  localAddress?: string;
  publicSlug: string;
  telegramChatId?: string;
  telegramBotToken?: string;
  timezone: string;
  isActive: boolean;
}

// Service Types
export interface Service {
  id?: string;
  name: string;
  durationMinutes: number;
  isActive: boolean;
  createdAt: Timestamp;
  order: number;
}

// Availability Types
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface TimeSlot {
  startTime: string; // "09:00"
  endTime: string;   // "18:00"
}

export interface Availability {
  isAvailable: boolean;
  timeSlots: TimeSlot[];
  slotIntervalMinutes: number;
}

// Exception Types
export type ExceptionType = 'blocked' | 'custom';

export interface Exception {
  id?: string;
  date: string; // "2026-01-25"
  type: ExceptionType;
  reason?: string;
  timeSlots?: TimeSlot[];
}

// Appointment Types
export type AppointmentStatus = 
  | 'confirmed' 
  | 'cancelled' 
  | 'completed_attended' 
  | 'completed_no_show' 
  | 'expired';

export interface Appointment {
  id?: string;
  userId: string;
  serviceId: string;
  serviceName: string;
  durationMinutes: number;
  date: string; // "2026-01-25"
  startTime: string; // "14:00"
  endTime: string; // "15:00"
  clientName: string;
  clientPhone: string;
  status: AppointmentStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  cancelledAt?: Timestamp;
  cancelledBy?: string;
  completedAt?: Timestamp;
  notificationsSent: string[];
}

// Queue Types
export type QueueStatus = 'waiting' | 'active' | 'expired';

export interface QueueClient {
  sessionId: string;
  position: number;
  joinedAt: Timestamp;
  lastActivity: Timestamp;
  status: QueueStatus;
  clientIP?: string;
}

export interface QueueControl {
  currentCount: number;
  lastPosition: number;
  updatedAt: Timestamp;
}

// Problem Clients Types
export interface ProblemClient {
  clientPhone: string;
  clientName: string;
  noShowCount: number;
  lastNoShowDate: Timestamp;
  appointments: string[]; // appointment IDs
  addedAt: Timestamp;
  isBlocked: boolean;
}

// History Types
export interface HistoryAppointment {
  appointmentId: string;
  date: string;
  clientName: string;
  serviceName: string;
  status: AppointmentStatus;
}

export interface HistoryStats {
  totalAppointments: number;
  attended: number;
  noShows: number;
  cancelled: number;
}

export interface History {
  month: string; // "2026-01"
  appointments: HistoryAppointment[];
  stats: HistoryStats;
}

// Cloud Function Request/Response Types
export interface JoinQueueRequest {
  userId: string;
  sessionId: string;
}

export interface JoinQueueResponse {
  position: number;
  sessionId: string;
}

export interface GetAvailableSlotsRequest {
  userId: string;
  serviceId: string;
  date: string;
}

export interface GetAvailableSlotsResponse {
  slots: string[]; // ["09:00", "09:30", "10:00"]
}

export interface CreateAppointmentRequest {
  userId: string;
  serviceId: string;
  date: string;
  startTime: string;
  clientName: string;
  clientPhone: string;
  sessionId: string;
}

export interface CreateAppointmentResponse {
  appointmentId: string;
  appointment: Appointment;
}
