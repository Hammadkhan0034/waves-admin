// ─── Enums ───────────────────────────────────────────────────────────────────

export type UserRole = 'customer' | 'operator' | 'admin'
export type UserStatus = 'pending_verification' | 'active' | 'suspended' | 'deleted'
export type AuthProvider = 'phone' | 'google' | 'apple'
export type DocumentStatus = 'pending' | 'approved' | 'rejected' | 'expired'
export type UserDocType = 'government_id' | 'drivers_license' | 'passport' | 'boating_safety_card' | 'other'
export type OperatorStatus = 'pending' | 'approved' | 'suspended' | 'rejected'
export type OperatorDocType = 'insurance_certificate' | 'vessel_registration' | 'operator_license'
export type VesselStatus = 'draft' | 'pending_approval' | 'active' | 'inactive' | 'suspended'
export type VesselCategory = 'taxi' | 'jetski' | 'partyboat' | 'leisure'
export type BookingStatus =
  | 'draft' | 'pending_payment' | 'pending_operator' | 'accepted'
  | 'rejected' | 'canceled' | 'expired' | 'in_progress'
  | 'completed' | 'refunded' | 'disputed'
export type PaymentStatus =
  | 'created' | 'requires_action' | 'succeeded' | 'failed'
  | 'canceled' | 'refunded' | 'partially_refunded'
export type RideRequestStatus =
  | 'searching' | 'operator_accepted' | 'price_quoted' | 'payment_pending'
  | 'in_progress' | 'completed' | 'canceled' | 'expired'
export type WithdrawalStatus = 'pending' | 'approved' | 'rejected'

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string
  email?: string
  phone?: string
  role: UserRole
  status: UserStatus
  authProvider: AuthProvider
  lastLoginAt?: string
  createdAt: string
  profile?: UserProfile
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string
  name?: string
  avatar?: string
  dateOfBirth?: string
  gender?: string
  bio?: string
  locale?: string
  preferredLanguage?: string
  timezone?: string
  currency?: string
  marketingOptIn?: boolean
  hasAcceptedTerms?: boolean
}

export interface UserDocument {
  id: string
  authId: string
  docType: UserDocType
  status: DocumentStatus
  fileUrl: string
  expiresOn?: string
  reviewNotes?: string
  createdAt: string
  updatedAt: string
  user?: AuthUser
}

// ─── Operator ─────────────────────────────────────────────────────────────────

export interface Operator {
  id: string
  ownerUserId: string
  businessName?: string
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  status: OperatorStatus
  onboardingStep: number
  reviewNotes?: string
  createdAt: string
  updatedAt: string
  owner?: AuthUser
  documents?: OperatorDocument[]
  vessels?: Vessel[]
}

export interface OperatorDocument {
  id: string
  operatorId: string
  docType: OperatorDocType
  status: DocumentStatus
  fileUrl: string
  expiresOn?: string
  reviewNotes?: string
  createdAt: string
  updatedAt: string
}

// ─── Vessel ───────────────────────────────────────────────────────────────────

export interface Vessel {
  id: string
  operatorId: string
  category: VesselCategory
  title: string
  description?: string
  capacity: number
  year?: number
  makeModel?: string
  amenities?: string[]
  rules?: Record<string, string>
  pickupNotes?: string
  status: VesselStatus
  reviewNotes?: string
  createdAt: string
  updatedAt: string
  operator?: Operator
  media?: VesselMedia[]
  location?: VesselLocation
  pricing?: VesselPricing[]
}

export interface VesselMedia {
  id: string
  vesselId: string
  url: string           // matches backend entity column 'url'
  mediaType: 'image' | 'video'  // matches backend entity column 'media_type'
  sortOrder: number
}

export interface VesselLocation {
  id: string
  vesselId: string
  latitude: number
  longitude: number
  address?: string
  updatedAt: string
}

export interface VesselPricing {
  id: string
  vesselId: string
  pricingModel: 'per_hour' | 'per_person' | 'per_km' | 'per_trip'
  basePrice: number
  currency: string
  minDuration?: number
  maxDuration?: number
  discountPercentage?: number
}

// ─── Booking ──────────────────────────────────────────────────────────────────

export interface Booking {
  id: string
  userId: string
  operatorId?: string
  vesselId?: string
  category: VesselCategory
  status: BookingStatus
  pickupLat?: number
  pickupLng?: number
  pickupLabel?: string
  dropoffLat?: number
  dropoffLng?: number
  dropoffLabel?: string
  startAt?: string
  endAt?: string
  durationMinutes?: number
  partySize?: number
  specialRequests?: string
  subtotalAmount?: number
  platformFeeAmount?: number
  taxAmount?: number
  totalAmount?: number
  currency?: string
  pricingSnapshot?: Record<string, unknown>
  createdAt: string
  updatedAt: string
  user?: AuthUser
  operator?: Operator
  vessel?: Vessel
  events?: BookingEvent[]
  payment?: Payment
}

export interface BookingEvent {
  id: string
  bookingId: string
  eventType: string
  metadata?: Record<string, unknown>
  createdAt: string
}

// ─── Payment ──────────────────────────────────────────────────────────────────

export interface Payment {
  id: string
  bookingId: string
  userId: string
  provider: string
  stripePaymentIntentId: string
  status: PaymentStatus
  amount: number
  currency: string
  createdAt: string
  updatedAt: string
  booking?: Booking
  user?: AuthUser
  refunds?: Refund[]
}

export interface Refund {
  id: string
  paymentId: string
  amount: number
  reason?: string
  stripeRefundId?: string
  createdAt: string
}

// ─── Ride Request ─────────────────────────────────────────────────────────────

export interface RideRequest {
  id: string
  userId?: string
  deviceId?: string
  operatorId?: string
  vesselId?: string
  category: VesselCategory
  status: RideRequestStatus
  pickupLat?: number
  pickupLng?: number
  pickupLabel?: string
  dropoffLat?: number
  dropoffLng?: number
  dropoffLabel?: string
  partySize?: number
  specialRequests?: string
  distanceKm?: number
  pricePerKm?: number
  pricePerPerson?: number
  subtotalAmount?: number
  platformFeeAmount?: number
  totalAmount?: number
  currency?: string
  stripePaymentIntentId?: string
  bookingId?: string
  expiresAt?: string
  createdAt: string
  updatedAt: string
  user?: AuthUser
  operator?: Operator
  vessel?: Vessel
  review?: RideReview
}

export interface RideReview {
  id: string
  rideRequestId: string
  rating: number
  comment?: string
  reviewedAt: string
}

// ─── Withdrawal ───────────────────────────────────────────────────────────────

export interface DriverPayoutAccount {
  id: string
  operatorId: string
  accountHolderName: string
  bankName: string
  accountNumber: string
  routingNumber?: string
  iban?: string
  country: string
  currency: string
  createdAt: string
  updatedAt: string
}

export interface WithdrawalRequest {
  id: string
  operatorId: string
  amount: number
  currency: string
  status: WithdrawalStatus
  adminNote?: string
  reviewedByUserId?: string
  reviewedAt?: string
  createdAt: string
  updatedAt: string
  payoutAccount?: DriverPayoutAccount
}

// ─── API Response Wrappers ────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiError {
  message: string
  statusCode: number
  error?: string
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export interface DashboardStats {
  totalUsers: number
  activeUsers: number
  suspendedUsers: number
  totalOperators: number
  pendingOperators: number
  approvedOperators: number
  totalVessels: number
  activeVessels: number
  pendingVessels: number
  totalBookings: number
  completedBookings: number
  canceledBookings: number
  totalRevenue: number
  monthRevenue: number
  totalRideRequests: number
  completedRideRequests: number
}
