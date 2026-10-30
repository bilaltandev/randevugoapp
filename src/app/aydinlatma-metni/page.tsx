import type { Metadata } from "next";
import Link from "next/link";
import { PRIVACY_NOTICE_VERSION } from "@/lib/privacyNotice";

export const metadata: Metadata = {
  title: "Aydınlatma Metni | CalendlyGo",
  description: "CalendlyGo kişisel verilerin işlenmesine ilişkin aydınlatma metni.",
};

// The data controller (a natural person for now: there is no company yet). Must be filled in before this page goes live.
const CONTROLLER = {
  name: "Bilal Tan",
  address: "Adana/Seyhan",
  email: "vastlab@calendlygo.com",
};

const SECTIONS: { title: string; paragraphs?: string[]; items?: string[] }[] = [
  {
    title: "1. Veri sorumlusu",
    paragraphs: [
      `6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusu: ${CONTROLLER.name} (Adres: ${CONTROLLER.address}). Bu metin, CalendlyGo web sitesi ve mobil uygulamasına kayıt olan işletme sahipleri ile ekip üyelerini bilgilendirmek için hazırlanmıştır.`,
    ],
  },
  {
    title: "2. İşlenen kişisel veriler",
    items: [
      "Kimlik ve iletişim: ad soyad, e-posta adresi, telefon numarası",
      "İşletme bilgileri: işletme adı, sektör, şehir, adres, WhatsApp numarası",
      "Hesap ve güvenlik: şifrenizin özeti (şifrenin kendisi saklanmaz), oturum kayıtları, IP adresi",
      "Cihaz bilgileri: mobil uygulamada cihaz adı, platform, uygulama sürümü ve bildirim anahtarı",
      "İşlem kayıtları: abonelik, ödeme bildirimi ve destek talepleri",
    ],
  },
  {
    title: "3. İşleme amaçları",
    items: [
      "Hesabınızı oluşturmak ve hizmeti sunmak",
      "Randevu bildirimlerini ve hizmetle ilgili mesajları iletmek",
      "Abonelik ve ödeme süreçlerini yürütmek",
      "Destek taleplerini yanıtlamak",
      "Hizmetin güvenliğini sağlamak ve kötüye kullanımı önlemek",
      "Yasal yükümlülükleri yerine getirmek",
    ],
  },
  {
    title: "4. Toplama yöntemi ve hukuki sebepler",
    paragraphs: [
      "Verileriniz, kayıt formları, panel ve mobil uygulama üzerinden elektronik ortamda toplanır. KVKK'nın 5. maddesi uyarınca sözleşmenin kurulması ve ifası, hukuki yükümlülüğün yerine getirilmesi ve temel hak ve özgürlüklerinize zarar vermemek kaydıyla meşru menfaat hukuki sebeplerine dayanılarak işlenir.",
    ],
  },
  {
    title: "5. Aktarım",
    paragraphs: [
      "Verileriniz, hizmetin sunulması için çalıştığımız barındırma, veritabanı, e-posta ve bildirim altyapısı sağlayıcılarıyla ve talep edilmesi halinde yetkili kamu kurumlarıyla paylaşılabilir. Bu sağlayıcıların sunucuları yurt dışında bulunabildiğinden aktarımlar KVKK'nın 9. maddesine uygun olarak yapılır.",
    ],
  },
  {
    title: "6. Saklama süresi",
    paragraphs: [
      "Verileriniz, işleme amacının gerektirdiği süre ve ilgili mevzuattaki saklama süreleri boyunca tutulur; bu süreler sona erdiğinde silinir, yok edilir veya anonim hale getirilir.",
    ],
  },
  {
    title: "7. Haklarınız",
    paragraphs: ["KVKK'nın 11. maddesi uyarınca veri sorumlusuna başvurarak şu haklarınızı kullanabilirsiniz:"],
    items: [
      "Kişisel verilerinizin işlenip işlenmediğini öğrenme ve bilgi talep etme",
      "İşlenme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme",
      "Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme",
      "Eksik veya yanlış işlenmişse düzeltilmesini isteme",
      "Mevzuattaki şartlar çerçevesinde silinmesini veya yok edilmesini isteme",
      "Düzeltme ve silme işlemlerinin aktarıldığı üçüncü kişilere bildirilmesini isteme",
      "Otomatik sistemlerle analiz sonucu aleyhinize çıkan sonuca itiraz etme",
      "Kanuna aykırı işleme nedeniyle uğradığınız zararın giderilmesini talep etme",
    ],
  },
  {
    title: "8. Başvuru",
    paragraphs: [
      `Taleplerinizi ${CONTROLLER.email} adresine iletebilirsiniz. Başvurunuz, talebin niteliğine göre en geç 30 gün içinde sonuçlandırılır.`,
    ],
  },
];

export default function PrivacyNoticePage() {
  return (
    <main className="min-h-dvh bg-canvas px-4 py-10 text-ink sm:px-8">
      <article className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm font-medium text-brand hover:text-brand-hover">
          CalendlyGo
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Kişisel Verilerin İşlenmesine İlişkin Aydınlatma Metni</h1>
        <p className="mt-2 text-sm text-ink-3">Sürüm: {PRIVACY_NOTICE_VERSION}</p>

        <div className="mt-8 space-y-7">
          {SECTIONS.map((section) => (
            <section key={section.title} className="space-y-2 text-sm leading-6 text-ink-2">
              <h2 className="text-base font-semibold text-ink">{section.title}</h2>
              {section.paragraphs?.map((text) => <p key={text}>{text}</p>)}
              {section.items && (
                <ul className="list-disc space-y-1 pl-5">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
