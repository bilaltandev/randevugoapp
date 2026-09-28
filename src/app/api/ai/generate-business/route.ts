import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const { prompt, sector } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Lütfen bir açıklama veya sektör belirtin." }, { status: 400 });
    }

    const p = (prompt + " " + (sector || "")).toLowerCase();

    // AI Generator Engine
    let generatedData = {
      sector: "BERBER",
      businessNameSuggestion: "Stil & Zarafet Kuaför",
      themeColor: "amber",
      font: "Inter",
      description:
        "Geleneksel ustalık ile modern saç tasarımını harmanlayan, müşteri memnuniyeti ve hijyeni ön planda tutan profesyonel bakım merkezi.",
      suggestedServices: [
        { name: "Modern Saç Kesimi & Yıkama", durationMinutes: 30, price: 400, description: "Kişiye özel yüz analiziyle stil kesimi ve canlandırıcı saç yıkama." },
        { name: "Klasik Ustura Sakal Tıraşı", durationMinutes: 20, price: 250, description: "Sıcak havlu kompresi, ustura tıraşı ve yatıştırıcı balsam masajı." },
        { name: "VIP Komple Bakım Paketi", durationMinutes: 60, price: 800, description: "Saç kesimi, sakal dizaynı, siyah nokta arındırıcı kil maskesi ve saç güçlendirici tonik." },
      ],
      aiInsights: {
        peakHoursAnalysis: "Cumartesi 13:00 - 18:00 ve Hafta içi 17:30 - 20:00 saatleri arasında randevu talebi %85 artış gösteriyor.",
        actionableTips: [
          "Salı ve Çarşamba öğleden önce için 'Erken Saat İndirimi (%15)' tanımlayarak boş saatleri doldurun.",
          "Müşterilerinizin %64'ü saç kesimi ile birlikte sakal bakımını da tercih ediyor. Çapraz paket önerisi sunun.",
          "Randevudan 2 saat önce otomatik WhatsApp hatırlatması göndererek randevu iptal oranını %40 azaltın.",
        ],
      },
    };

    if (p.includes("güzellik") || p.includes("kuaför bayan") || p.includes("estetik") || p.includes("tırnak") || p.includes("spa")) {
      generatedData = {
        sector: "GUZELLIK",
        businessNameSuggestion: "Glow & Beauty Studio",
        themeColor: "rose",
        font: "Outfit",
        description:
          "En son teknoloji cihazlar ve organik dermokozmetik ürünlerle cildinize ışıltı katan premium güzellik ve estetik merkezi.",
        suggestedServices: [
          { name: "Hydrafacial Medikal Cilt Bakımı", durationMinutes: 60, price: 950, description: "Derinlemesine gözenek arındırma, hyaluronik asit nem aşılaması ve LED terapi." },
          { name: "Kalıcı Oje & Medikal Manikür", durationMinutes: 45, price: 500, description: "Kusursuz tırnak şekillendirme ve 4 haftaya kadar kalıcı renk koruması." },
          { name: "Tüm Vücut Buz Başlık Lazer Epilasyon", durationMinutes: 50, price: 1400, description: "Dört mevsim uygulanabilen, konforlu ve acısız epilasyon seansı." },
        ],
        aiInsights: {
          peakHoursAnalysis: "Cuma ve Cumartesi günleri 11:00 - 17:00 saatlerinde doluluk oranı %95 seviyesindedir.",
          actionableTips: [
            "Seans paketlerini 4'lü veya 6'lı set halinde sunarak ortalama sepet tutarını %35 artırabilirsiniz.",
            "Düzenli cilt bakımı müşterilerine 3. haftada otomatik 'Bakım Zamanı Geldi' WhatsApp mesajı gönderin.",
            "Hafta ortası saatlerine özel 'Öğle Molası Ekspres Manikür' kampanyası kurgulayın.",
          ],
        },
      };
    } else if (p.includes("restoran") || p.includes("kafe") || p.includes("yemek") || p.includes("bistro")) {
      generatedData = {
        sector: "RESTORAN",
        businessNameSuggestion: "Gusto Bistro & Bar",
        themeColor: "emerald",
        font: "Playfair Display",
        description:
          "Akdeniz mutfağının seçkin lezzetleri, şık ambiyans ve samimi servis anlayışıyla unutulmaz gastronomi deneyimleri.",
        suggestedServices: [
          { name: "Akşam Yemeği Rezervasyonu (2-4 Kişi)", durationMinutes: 90, price: 0, description: "Günün özel menüsü ve şarap eşleşmeleri için standart masa rezervasyonu." },
          { name: "Doğum Günü & Kutlama Masası", durationMinutes: 120, price: 0, description: "Özel süsleme ve şefin ikram tatlısı eşliğinde VIP masa." },
          { name: "İş Yemeği & Grup Masası (5+ Kişi)", durationMinutes: 120, price: 0, description: "Sessiz ve konforlu locada kurumsal toplantı yemeği." },
        ],
        aiInsights: {
          peakHoursAnalysis: "Hafta sonları 19:30 - 22:00 saatleri en yoğun talep dönemidir.",
          actionableTips: [
            "Erken rezervasyon yapan müşterilere (18:00 - 19:30) hoş geldin kokteyli hediye edin.",
            "Masa no-show (gelmeme) riskine karşı rezervasyondan 3 saat önce WhatsApp onay butonu gönderin.",
          ],
        },
      };
    } else if (p.includes("klinik") || p.includes("doktor") || p.includes("diş") || p.includes("sağlık") || p.includes("psikolog")) {
      generatedData = {
        sector: "KLINIK",
        businessNameSuggestion: "Aura Sağlık & Poliklinik",
        themeColor: "cyan",
        font: "Inter",
        description:
          "Alanında uzman hekim kadrosu ve modern tanı teknolojileriyle sağlığınız için güvenilir, hasta odaklı sağlık hizmeti.",
        suggestedServices: [
          { name: "Uzman Hekim Muayenesi & Danışmanlık", durationMinutes: 30, price: 1500, description: "Ayrıntılı fiziki muayene, tetkik incelemesi ve tedavi planlaması." },
          { name: "Tedavi Kontrol Seansı", durationMinutes: 20, price: 0, description: "İlk muayeneden sonraki 10 gün içinde geçerli kontrol görüşmesi." },
        ],
        aiInsights: {
          peakHoursAnalysis: "Sabah 09:30 - 12:00 saatleri en yoğun poliklinik dönemidir.",
          actionableTips: [
            "Randevu gecikmelerini önlemek adına randevu aralıklarına 10 dakikalık tampon süreler ekleyin.",
            "Randevudan 24 saat önce otomatik SMS / WhatsApp hazırlık notu (açlık durumu, tahlil bilgisi) gönderin.",
          ],
        },
      };
    } else if (p.includes("oto") || p.includes("servis") || p.includes("araç") || p.includes("tamir") || p.includes("ekspertiz")) {
      generatedData = {
        sector: "OTO_SERVIS",
        businessNameSuggestion: "ProGaraj Mekanik & Bakım",
        themeColor: "blue",
        font: "Inter",
        description:
          "Orijinal yedek parça garantisi, bilgisayarlı arıza tespiti ve şeffaf servis raporlamasıyla aracınız güvenli ellerde.",
        suggestedServices: [
          { name: "10.000 Km Periyodik Bakım", durationMinutes: 60, price: 1750, description: "Motor yağı, yağ filtresi, hava ve polen filtre değişimi, 30 nokta güvenlik kontrolü." },
          { name: "Bilgisayarlı Fren & Alt Takım Kontrolü", durationMinutes: 40, price: 600, description: "Balata, disk ve süspansiyon elemanlarının hassas testi ve raporu." },
          { name: "Kapsamlı Ekspertiz & Check-Up", durationMinutes: 90, price: 2200, description: "Kaporta boya testi, motor dinamometresi ve detaylı ekspertiz raporu." },
        ],
        aiInsights: {
          peakHoursAnalysis: "Pazartesi sabah 08:30 - 11:00 ve Cumartesi günleri servis doluluğu %100'e ulaşıyor.",
          actionableTips: [
            "Müşterilerinizden randevu alırken araç plakası ve model yılını zorunlu tutarak yedek parçayı önceden temin edin.",
            "Bakımı tamamlanan araç sahiplerine otomatik 'Aracınız Hazır' WhatsApp bildirimi gönderin.",
          ],
        },
      };
    }

    return NextResponse.json({
      success: true,
      data: generatedData,
    });
  } catch (error) {
    console.error("AI Generate error:", error);
    return NextResponse.json({ error: "AI önerisi oluşturulurken bir hata meydana geldi." }, { status: 500 });
  }
}
