export interface BookingService {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  description?: string | null;
  image?: string | null;
  category?: { name: string } | null;
}

export interface BookingEmployee {
  id: string;
  name: string;
  specialty?: string | null;
  photo?: string | null;
  employeeServices?: { serviceId: string }[];
}

export interface BookingBusiness {
  id: string;
  name: string;
  slug: string;
  sector: string;
  phone: string;
  whatsappNumber?: string | null;
  enableStaffSelection?: boolean;
  subscription?: { status: string; trialEndDate?: string | Date } | null;
}

/** Everything the public page reads from the business record. */
export interface BusinessPageData extends BookingBusiness {
  logo?: string | null;
  coverImage?: string | null;
  description?: string | null;
  city?: string | null;
  address?: string | null;
  isVerified?: boolean;
  workingHours?: import("./time").WorkingHour[];
}

export interface PublicReview {
  id: string;
  customerName: string;
  rating: number;
  comment?: string | null;
  businessReply?: string | null;
  createdAt?: string | Date | null;
}

export interface GalleryPhotoData {
  imageUrl: string;
  isActive?: boolean;
  altText?: string | null;
  title?: string | null;
}

/** Steps after a service has been picked from the catalog. */
export type FlowStep = "staff" | "datetime" | "details";
export type Stage = "browse" | FlowStep | "done";

export const STEP_LABELS: Record<FlowStep, string> = {
  staff: "Uzman",
  datetime: "Tarih ve saat",
  details: "Bilgileriniz",
};
