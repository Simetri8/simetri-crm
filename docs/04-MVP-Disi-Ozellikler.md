⏺ Dokümantasyonda tanımlanan MVP dışı özellikler şunlar:

📦 1. Opsiyonel Özellikler (1.3. bölümünde belirtilen)

Git Entegrasyonları ve Otomasyonları

- Commit/PR bazlı zaman takibi
- Otomatik task durumu güncelleme
- Branch-task bağlantıları
- Code review süreç entegrasyonu  


Gantt/Timeline ile Kaynak Planlama

- Zaman çizelgesi görünümü
- Kaynak (personel) doluluk oranı
- İş yükü dağılımı ve çakışma tespiti
- Kritik yol analizi  


Offline-First / PWA

- Offline çalışabilme
- Progressive Web App özellikleri
- Service worker implementasyonu
- Sync mekanizması  


🔧 2. Koleksiyon Bazlı Opsiyonel Özellikler

Katalog (catalog_items) - "Opsiyonel ama önerilir"

- Mevcut durumda: /crm/catalog rotası var ama tam implemente edilmemiş
- Önerilen: Standart hizmet/ürün tanımları
- Fayda: Teklif hazırlığında hız  


Change Requests (Kapsam Değişiklikleri) - "Opsiyonel ama önerilir"

- İş emri kapsam değişiklik talepleri
- Onay akışı
- Etki analizi (low/medium/high)
- Mevcut durum: Veri modeli tanımlı ama UI yok  


👥 3. Rol ve Yetkilendirme (RBAC)

MVP'de: Sadece admin rolü var, herkes her şeyi yapabilir

MVP Dışı:

- Roller: admin, pm, developer, client
- Yetki matrisi:
  - PM: Teklif onayı, iş emri oluşturma, timesheet onayı
  - Developer: Zaman girişi, task güncelleme
  - Client: Sadece okuma, teklif onayı
- Departman bazlı erişim kontrolü
- Timesheet onay hiyerarşisi  


📊 4. Dashboard Gelişmiş KPI'lar (Phase 2)

Dokümanda "istenirse sonraya bırakılır" denilen:

Finans KPI'ları

- Tahsil durumu
- Açık faturalar
- Aylık gelir projeksiyonu
- Karlılık analizi  


Kaynak Doluluk KPI'ları

- Ekip üyesi bazlı doluluk oranı
- Planlı vs gerçekleşen süre karşılaştırması
- Tahmin doğruluğu metrikleri
- Kapasiteli/aşırı yüklenme uyarıları  


📈 5. Raporlama ve Analitik

MVP'de yok, sonraki fazlarda eklenebilir:

- Müşteri bazlı karlılık raporu
- Proje tahmini vs gerçekleşen karşılaştırması
- Satış hunisi dönüşüm oranları
- Takım performans metrikleri
- Zaman dağılım raporları (billable vs non-billable)  


🔔 6. Bildirim ve Entegrasyonlar

MVP'de minimal/yok:

- E-posta bildirimleri (deadline yaklaşıyor, onay bekliyor vs)
- Slack/Teams entegrasyonu
- Takvim entegrasyonu (Google Calendar, Outlook)
- Webhook'lar (3. parti sistemlere bildirim)  


📱 7. Mobil Uygulama

- Native iOS/Android uygulaması
- Mobil-öncelikli responsive tasarım (mevcut responsive var ama "mobil-öncelikli" değil)
- Push notifications  


🎨 8. Gelişmiş UI Özellikleri

- Drag & drop ile task/deliverable sıralama
- Toplu düzenleme (bulk edit)
- Gelişmiş filtreleme ve arama
- Özelleştirilebilir dashboard widget'ları
- Dark mode (mevcut tema desteği var ama tam optimize değil)
- Klavye kısayolları  


📎 9. Dosya ve Döküman Yönetimi

MVP'de minimal:

- Dosya yükleme/indirme (Activity'de type: file var ama storage entegrasyonu tam değil)
- Versiyon kontrolü
- Döküman şablonları
- E-imza entegrasyonu
- Teklif/iş emri şablonları  


🔄 10. Otomasyon ve İş Akışı

- Otomatik hatırlatmalar (next action deadline'i yaklaşınca)
- Şartlı otomasyon (deal kazanınca X yap, Y ise Z olsun)
- E-posta otomasyonu (teklif gönderimi, takip e-postaları)
- Webhook tabanlı entegrasyonlar  


---

📝 Mevcut Durum Özeti

✅ Var ve çalışıyor: Tüm MVP özellikleri  
 ⚠️ Tanımlı ama implementasyon yok: Change Requests, tam Katalog  
 ❌ MVP kapsamı dışı: Yukarıdaki tüm liste

Bu özellikler kullanıcı ihtiyacına ve önceliğine göre sonraki fazlarda eklenebilir. MVP'nin amacı core iş akışını çalıştırmak - bu başarıyla tamamlandı.
