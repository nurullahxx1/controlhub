# ControlHub — Kişisel Yönetim ve Takip Paneli

ControlHub; derleme, paket yöneticisi, harici CDN veya uzaktan kütüphane gerektirmeyen; saf **HTML5**, **CSS3** ve **Vanilla JavaScript** ile geliştirilmiş, üretime hazır, modüler ve güvenilir bir kişisel yönetim ve takip sistemidir.

---

## 1. Projenin Amacı ve Felsefesi

ControlHub; karmaşık kurulumlar, devasa node_modules paketleri veya build/transpile adımları olmaksızın, doğrudan herhangi bir modern web tarayıcısında çalışabilen kurumsal kalitede bir çalışma alanı sunmak amacıyla tasarlanmıştır.

- **Sıfır Bağımlılık (Zero Dependency):** Harici CDN, font servisi veya ikon paketi gerekmez. Tüm stil ve SVG ikonlar yereldir.
- **Doğrudan Açılabilirlik:** Ana dizindeki `index.html` dosyasına çift tıklanarak (`file://` protokolü altında) veya yerel bir HTTP sunucusu üzerinden sorunsuz çalışır.
- **Veri Güvenliği ve Yerellik:** Verileriniz asla bilinmeyen bir sunucuya gitmez; kullanıcının tarayıcısında `localStorage` üzerinde şifresiz/şeffaf, JSON dışa aktarma uyumlu olarak saklanır.
- **Yüksek Güvenlik Standartları:** DOM-tabanlı XSS açıklarına karşı kullanıcı verileri `textContent` ve güvenli kaçış (`escapeHTML`) fonksiyonlarıyla işlenir. CSV çıktılarında formül enjeksiyonu koruması (`sanitizeCSV`) bulunur.

---

## 2. Modüller ve Özellik Listesi

### 1. Genel Bakış (Dashboard)
- Günün tarihine ve saat dilimine göre dinamik selamlama ("Günaydın", "İyi günler", "İyi akşamlar", "İyi geceler").
- Tamamı gerçek uygulama kayıtlarından dinamik hesaplanan KPI kartları:
  - Aktif Görevler (Bekleyen & Devam Eden)
  - Tamamlanan Görev Sayısı
  - Bekleyen Görev Sayısı
  - Geciken Görev Sayısı (Bitiş tarihi bugünden önce olan ve tamamlanmamış görevler)
  - Devam Eden Proje Sayısı
  - Günlük Alışkanlık Tamamlama Oranı (%)
- Yaklaşan görevler widget'ı (doğrudan işaretlenebilir kutucuklar ile).
- Proje ilerleme çubukları.
- Bugünkü alışkanlıklar hızlı tamamlama listesi.
- Son finans hareketleri özeti.

### 2. Görev Yönetimi (Tasks CRUD & Kanban)
- **Tam CRUD:** Oluşturma, listeleme, güncelleme, silme ve tamamlama.
- **Görünüm Modları:** Liste Görünümü ve 3 Sütunlu Kanban Panosu (*Bekliyor*, *Devam Ediyor*, *Tamamlandı*).
- **Öncelik Seviyeleri:** Düşük, Normal, Yüksek, Kritik.
- **Filtreleme & Sıralama:** Duruma, önceliğe, projeye, etikete ve arama metnine göre anlık filtreleme; bitiş tarihine, önceliğe ve eklenme tarihine göre sıralama.
- **Gecikme Tespiti:** Günü geçmiş görevlerde kırmızı görsel uyarı kenarlığı.

### 3. Proje Yönetimi (Projects)
- Proje kartları, renk vurgusu, başlangıç ve bitiş tarihleri.
- **Dinamik İlerleme:** İlerleme yüzdesi sabit bir sayı değildir; projeye bağlı görevlerin tamamlanma durumundan (`tamamlanan / toplam * 100`) gerçek zamanlı hesaplanır.
- **Proje Detay Görünümü:** Projeye bağlı tüm görevlerin listesi ve durumları.
- **Güvenli Silme Politikası:** Bir proje silindiğinde bağlı görevler silinmez; veri kaybını önlemek için bağımsız (ilişkisiz) görevler olarak muhafaza edilir.

### 4. Not Defteri (Notes)
- Fikir, toplantı ve proje notlarının yönetimi.
- Başa sabitleme (pin) özelliği ile önemli notları üstte tutma.
- Kategori ve arama filtreleri.
- Otomatik kayıt durumu göstergesi ("Kaydedildi", "Değişiklik var...").
- Canlı kelime ve karakter sayacı.
- XSS korumalı güvenli metin render motoru.

### 5. Alışkanlık Takibi (Habits & Streaks)
- Günlük rutinler, hedef sıklığı ve renk kodları.
- **7 Günlük Takvim Matrisi:** Son 7 günün tamamlanma durumunu gösteren interaktif takvim noktaları.
- **Hatasız Seri (Streak) Hesabı:** Yerel takvim tarihleri (`YYYY-MM-DD`) üzerinden UTC kaymalarından arındırılmış ardışık gün takip algoritması.

### 6. Finans ve Harcama Takibi (Finance)
- Gelir ve gider (harcama) kayıtları.
- Kuruş hassasiyetinde (`cents`) tam sayı aritmetiği ile kayan nokta (floating point) toplama hatalarını önleyen hesaplama motoru.
- Toplam Gelir, Toplam Gider ve Net Bakiye KPI şeridi.
- Kategoriye ve tarih aralığına göre filtreleme.

### 7. Raporlar ve Analitik (Reports)
- Harici kütüphane veya CDN kullanmaksızın saf yerel SVG ile üretilen grafikler:
  - Görev Durum Dağılımı Donut Grafiği
  - 7 Günlük Görev Tamamlama Trendi Çubuk Grafiği
  - Kategori Bazında Harcama Dağılım İlerleme Çubukları
- **Güvenli CSV Dışa Aktarma:** Excel formül enjeksiyonu (`=`, `+`, `-`, `@`) korumalı ve Türkçe karakter destekli UTF-8 BOM CSV çıktısı.

### 8. Global Arama ve Hızlı İşlemler
- Klavye kısayolu: `Ctrl + K` veya `Cmd + K`.
- 5 modül üzerinde (Görevler, Projeler, Notlar, Alışkanlıklar, Finans) eş zamanlı arama.
- Sonuca tıklandığında ilgili modüle ve detaya doğrudan geçiş.
- Hızlı işlem menüsü ile tek tıkla görev, proje, not, alışkanlık veya harcama ekleme.

### 9. Ayarlar, Tema ve Yedekleme (Backup & Restore)
- **Tema Seçenekleri:** Varsayılan Koyu Tema (Dark) ve Açık Tema (Light).
- Para birimi simgesi ve varsayılan açılış sayfası yapılandırması.
- **JSON Yedek İndirme:** Tüm çalışma alanını tek bir JSON dosyasında arşivleme.
- **Şema Doğrulamalı Geri Yükleme:** JSON yedeği yüklenmeden önce şema sürümü, dizi yapıları ve benzersiz ID kontrolleri yapılır.
- **İçe Aktarma Seçenekleri:** "Tam Üzerine Yaz" veya "Mevcut Verilerle Birleştir".
- Örnek verileri geri yükleme ve güvenli tümünü temizleme kontrolleri.

---

## 3. Dosya ve Klasör Mimarisi

```
ControlHub/
├── index.html              # Uygulamanın ana giriş noktası ve anlamsal HTML5 yapısı
├── README.md               # Detaylı mimari ve kullanım kılavuzu
├── css/
│   ├── variables.css       # Tasarım tokenları (renkler, boşluklar, gölgeler, yarıçaplar)
│   ├── reset.css           # Modern CSS sıfırlama ve erişilebilir odak kuralları
│   ├── typography.css      # Tipografi ölçeği ve tabular rakam desteği
│   ├── layout.css          # Kenar çubuğu, üst bar ve ana çalışma alanı düzeni
│   ├── components.css      # Butonlar, formlar, kartlar, modal, toast ve rozetler
│   ├── dashboard.css       # Genel bakış bileşenleri, KPI kartları ve widget düzenleri
│   ├── modules.css         # Görevler, kanban, projeler, notlar, alışkanlıklar ve finans stilleri
│   ├── responsive.css      # 360px, 390px, 768px, 1024px, 1440px medya sorguları
│   └── themes.css          # Koyu ve açık tema CSS değişken eşleştirmeleri
└── js/
    ├── config.js           # Sistem sabitleri, kategoriler, durumlar ve öncelikler
    ├── utils.js            # XSS kaçış, CSV temizleme, tarih ve para birimi yardımcıları
    ├── validation.js       # Varlık formları ve JSON yedek şema doğrulayıcısı
    ├── storage.js          # LocalStorage sarmalayıcısı ve bellek fallback katmanı
    ├── state.js            # Reaktif durum yöneticisi ve örnek veri yükleyicisi
    ├── events.js           # Modüller arası bağımsız pub/sub olay veri yolu
    ├── notifications.js    # Erişilebilir aria-live toast bildirim yöneticisi
    ├── modal.js            # Odak hapsi (focus trap) özellikli erişilebilir modal yöneticisi
    ├── theme.js            # Tema değiştirme ve kalıcılık yöneticisi
    ├── router.js           # Hash-tabanlı istemci tarafı SPA yönlendiricisi
    ├── tasks.js            # Görevler modülü (CRUD, liste/kanban görünümleri)
    ├── projects.js         # Projeler modülü (CRUD ve dinamik görev metrikleri)
    ├── notes.js            # Notlar modülü (CRUD, sabitleme, canlı sayaç)
    ├── habits.js           # Alışkanlıklar modülü (7 günlük matris ve streak takibi)
    ├── finance.js          # Finans modülü (Gelir/gider CRUD ve kesin bütçe hesabı)
    ├── reports.js          # Raporlar modülü (Yerel SVG grafikleri ve CSV çıktısı)
    ├── dashboard.js        # Dashboard yönetimi ve canlı KPI senkronizasyonu
    ├── search.js           # Global arama motoru (Ctrl+K) ve hızlı işlemler
    ├── settings.js         # Kullanıcı tercihleri ve tehlikeli bölge yönetimi
    ├── backup.js           # Atomik JSON yedek dışa aktarma ve geri yükleme
    └── app.js              # Uygulama başlatıcısı ve bootstrap orkestratörü
```

---

## 4. Uygulama Nasıl Çalıştırılır?

ControlHub hiçbir derleme veya dönüştürme (transpilation) işlemi gerektirmez.

### Yöntem 1: Doğrudan Çift Tıklayarak (En Basit Yöntem)
1. Proje klasöründeki `index.html` dosyasına çift tıklayın veya tarayıcınıza sürükleyin (`file:///.../index.html`).
2. Uygulama tüm stilleri, SVG ikonları ve script dosyalarını doğrudan yükleyerek çalışacaktır.

### Yöntem 2: Yerel HTTP Sunucusu ile (Tavsiye Edilen Geliştirici Yöntemi)
Herhangi bir yerel statik sunucu aracını kullanabilirsiniz:

- **Python 3 ile:**
  ```bash
  python3 -m http.server 3000
  ```
- **Node.js / npx ile:**
  ```bash
  npx serve .
  ```
- **Tarayıcıda:**
  `http://localhost:3000` adresini açmanız yeterlidir.

---

## 5. Bilinen Tarayıcı Davranışları ve Sınırları

- **Gizli / Özel Sekme (Incognito):** Tarayıcıların gizli pencerelerinde `localStorage` pencere kapatıldığında otomatik olarak temizlenir. Verilerinizin kalıcı olmasını istiyorsanız normal tarayıcı profilinde kullanınız veya Ayarlar bölümünden JSON yedeği alınız.
- **file:// Protokolü:** ControlHub, `file://` kısıtlamalarını dikkate alarak modül yüklemelerini `fetch()` yerine standart `<script>` sıralaması ve `window.ControlHub` ad alanı ile organize etmiştir. Bu sayede hiçbir CORS engeline takılmaz.
- **Depolama Sınırı:** Modern tarayıcılarda `localStorage` sınırı genellikle alan adı başına 5-10 MB arasındadır. Bu kapasite yüz binlerce görev ve not kaydı için yeterlidir.

---

## 6. Yeni Bir Modül Ekleme Rehberi

ControlHub modüler bir mimariye sahiptir. Yeni bir modül (örneğin: `bookmarks.js`) eklemek için:

1. `js/bookmarks.js` dosyasını oluşturun ve `window.ControlHub.bookmarks = { init: function() { ... } };` biçiminde tanımlayın.
2. `index.html` içerisindeki `<aside class="app-sidebar">` menüsüne yeni bir buton (`data-route="bookmarks"`) ekleyin.
3. `<main class="app-main">` içerisine `<section class="module-view" id="view-bookmarks">` konteynerini yerleştirin.
4. `js/router.js` içerisindeki `routes` nesnesine yeni rotanızı kaydedin.
5. `index.html` altına `<script src="js/bookmarks.js"></script>` etiketini ekleyin.
6. `js/app.js` içerisindeki `ControlHub.init` fonksiyonunda modülünüzün `init()` metodunu çağırın.

---

## 7. Güvenlik ve Kalite Güvence Kontrolleri

- [x] Tüm HTML form girdileri tip ve uzunluk doğrulamasına tabi tutulur.
- [x] Kullanıcı girdileri `escapeHTML` ve `textContent` ile DOM'a aktarılır.
- [x] JSON yedekleri içe aktarılmadan önce şema ve ID doğrulaması yapılır.
- [x] CSV dışa aktarımları elektronik tablo formül enjeksiyonuna karşı tek tırnak ile nötrlenir.
- [x] Sayfa içi odaklanmalar (focus management) ve klavye gezinimi WCAG 2.1 AA standartlarına uygundur.
