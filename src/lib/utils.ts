import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `0 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith("0")) {
    return `${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9, 11)}`;
  }
  return phone;
}

export function getWhatsAppBookingUrl(options: {
  phone: string;
  businessName: string;
  customerName: string;
  serviceName: string;
  employeeName: string;
  date: string;
  time: string;
  notes?: string | null;
}): string {
  let cleanPhone = options.phone.replace(/\D/g, "");
  if (cleanPhone.startsWith("0")) {
    cleanPhone = "90" + cleanPhone.slice(1);
  } else if (!cleanPhone.startsWith("90")) {
    cleanPhone = "90" + cleanPhone;
  }

  const message = `Merhaba *${options.businessName}*, RandevuGo üzerinden yeni bir rezervasyon oluşturuldu:

📅 *Tarih:* ${options.date}
⏰ *Saat:* ${options.time}
✂️ *Hizmet:* ${options.serviceName}
👤 *Uzman:* ${options.employeeName}
🙋‍♂️ *Müşteri:* ${options.customerName}${options.notes ? `\n📝 *Not:* ${options.notes}` : ""}

RandevuGo üzerinden onayınızı bekliyoruz!`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export const SECTORS = [
  { id: "BERBER", name: "Erkek Kuaförü & Berber", icon: "Scissors", description: "Saç, sakal, bakım ve stil hizmetleri" },
  { id: "GUZELLIK", name: "Güzellik & Cilt Bakımı", icon: "Sparkles", description: "Lazer, cilt bakımı, tırnak ve makyaj paketleri" },
  { id: "RESTORAN", name: "Restoran & Kafe", icon: "Utensils", description: "Masa rezervasyonu, kişi sayısı ve menü seçimleri" },
  { id: "KLINIK", name: "Klinik & Sağlık Merkezi", icon: "Stethoscope", description: "Doktor randevuları, tetkik ve uzman konsültasyonları" },
  { id: "OTO_SERVIS", name: "Oto Servis & Ekspertiz", icon: "Car", description: "Periyodik bakım, mekanik onarım, plaka ve araç kayıt" },
  { id: "DIGER", name: "Diğer Hizmet Sektörleri", icon: "Briefcase", description: "Diyetisyen, psikolog, özel ders ve danışmanlık" },
] as const;

export type SectorType = (typeof SECTORS)[number]["id"];
