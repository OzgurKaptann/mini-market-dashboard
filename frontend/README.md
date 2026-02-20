# 🚀 Mini Market Dashboard  
### Mobil Uyumlu SaaS Simülasyonu (FastAPI + Next.js)

---

## 🎯 Projenin Amacı

Bu proje, gerçek bir SaaS ürün mimarisini simüle etmek amacıyla geliştirilmiştir.

Amaç yalnızca CoinGecko’dan veri çekmek değil, aynı zamanda:

- 🔐 JWT Authentication implement etmek  
- 🧠 Kullanıcı bazlı günlük rate limit uygulamak  
- ⚡ In-memory cache ile performans optimizasyonu yapmak  
- 🏗️ Frontend’in dış API’ye doğrudan bağlanmasını engellemek  
- 📊 Mobil uyumlu bir dashboard arayüzü oluşturmak  

Bu proje, bir **Data Analyst** olarak veri tüketen tarafta kalmak yerine,  
**Data Engineer bakış açısıyla sistem kurma pratiği** yapma amacını taşır.

---

## ❓ Neden Bu Proje?

Çoğu frontend uygulaması harici API’lere doğrudan bağlanır.

Bu yaklaşım:

- API güvenliğini zayıflatır  
- Rate limit kontrolünü zorlaştırır  
- Plan bazlı erişim modelini imkansız hale getirir  
- SaaS iş mantığını kurmaya engel olur  

Bu projede bilinçli olarak:

- **Frontend → Backend → External API** mimarisi kuruldu  
- Kullanıcı planına göre erişim kontrolü yapıldı  
- Günlük kullanım sınırı uygulandı  
- Cache stratejisi ile upstream yükü azaltıldı  

Bu yapı gerçek dünyadaki SaaS sistemlerinin temel mimarisini temsil eder.

---

## 🏗️ Mimari Yapı

```text
[ Next.js Frontend ]
          |
          v
[ FastAPI Backend (Auth + Rate Limit + Cache) ]
          |
          v
[ CoinGecko Public API ]
### Kritik Kural

Frontend hiçbir zaman dış API’ye doğrudan bağlanmaz.  
Tüm veri backend proxy üzerinden sağlanır.

---

## 🛠️ Kullanılan Teknolojiler

### Backend

- FastAPI  
- SQLAlchemy  
- SQLite  
- JWT Authentication  
- bcrypt password hashing  
- httpx (async upstream requests)  
- In-memory TTL cache  

### Frontend

- Next.js (App Router)  
- TypeScript  
- SessionStorage token yönetimi  
- Responsive layout (mobil uyum)  

---

## 🔐 Authentication & Authorization

- POST `/register` → kullanıcı oluşturur + JWT döner  
- POST `/login` → kullanıcı doğrular + JWT döner  
- Protected endpoint’ler → Bearer Token ister  

JWT olmadan erişim:
401 Unauthorized

---

## 📊 Rate Limiting (Plan Bazlı)

### Free Plan
- 10 istek / gün

### Pro Plan
- Sınırsız istek

Rate limit kontrolü:

- Kullanıcı bazlı  
- UTC gününe göre reset  
- DB’de `daily_request_count` tutulur  

Limit dolduğunda:
429 Daily request limit reached

---

## ⚡ Cache Stratejisi

- TTL: 60 saniye  
- In-memory dictionary cache  
- Parametre bazlı key oluşturulur  

Log çıktısı:
CACHE MISS -> CoinGecko çağrıldı
CACHE HIT -> Memory cache kullanıldı

### Cache Olmazsa Ne Olur?

- Her refresh upstream API çağrısı yapar  
- Rate limit riski artar  
- Latency yükselir  
- Production maliyeti artar  

---

## 📈 10.000 Kullanıcı Senaryosu

Mevcut demo mimarisi:

- SQLite  
- Memory cache (instance bazlı)  

10.000 kullanıcıda:

- SQLite write contention oluşur  
- Memory cache horizontal scaling’de paylaşılamaz  
- Worker sayısı artırılmalıdır  

Production önerisi:

- PostgreSQL  
- Redis cache  
- Redis rate-limit counter  
- Multiple backend workers  
- Load balancer  

---

## 🧠 Redis Nerede Kullanılır?

1) Cache için  
2) Rate limit counter için  

Örnek:
INCR user:{id}:requests:{YYYY-MM-DD}
TTL 86400

---

## 💳 Gerçek Pro Plan Entegrasyonu

Gerçek ödeme entegrasyonu için tipik akış:

- Stripe webhook endpoint  
- Ödeme başarılı → webhook backend’e gelir  
- `plan_type = "Pro"` olarak güncellenir  
- Rate limit logic otomatik değişir  

---

## 🛡️ Abuse Önleme Stratejileri

- IP-based throttling  
- Short JWT expiry  
- Email verification  
- CAPTCHA  
- Suspicious activity logging  

---

## 🗂️ ER Diagram

erDiagram
  USERS {
    int id PK
    string email
    string password_hash
    string plan_type
    int daily_request_count
    datetime last_request_date
    datetime created_at
  }
  
---

## 🎓 Bu Projede Ne Öğrendim?

- SaaS mimarisi nasıl kurulur  
- JWT auth nasıl uygulanır  
- Rate limiting nasıl tasarlanır  
- Cache stratejisi nasıl düşünülür  
- Frontend + Backend separation of concerns  
- Veri tüketen değil, veri sağlayan sistem kurma bakış açısı  

---

## 🔥 Sonuç

Bu proje bir coin dashboard değildir.

Bu proje:

- Bir SaaS simülasyonudur  
- Bir mimari düşünce göstergesidir  
- Backend disiplini pratiğidir  
- Ölçeklenebilirlik farkındalığıdır  