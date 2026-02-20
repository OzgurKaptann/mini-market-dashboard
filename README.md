# 🚀 Mini Market Dashboard (SaaS Simulation)
### FastAPI + Next.js | Mobile Ready | Auth + Rate Limit + Cache

---

# 🇹🇷 Türkçe

## 🎯 Projenin Amacı

Bu proje, gerçek bir SaaS ürün mimarisini simüle etmek amacıyla geliştirilmiştir.

Amaç yalnızca CoinGecko’dan veri çekmek değil, aynı zamanda:

- JWT Authentication uygulamak
- Kullanıcı bazlı günlük rate limit uygulamak
- In-memory cache ile performans optimizasyonu yapmak
- Frontend’in dış API’ye doğrudan bağlanmasını engellemek
- Mobil uyumlu bir dashboard arayüzü oluşturmak

Bu proje, bir Data Analyst olarak veri tüketmekten,  
bir Data Engineer gibi sistem kurma yaklaşımına geçiş adımıdır.

---

## 🏗️ Mimari Yapı

```
[ Next.js Frontend ]
          |
          v
[ FastAPI Backend (Auth + Rate Limit + Cache) ]
          |
          v
[ CoinGecko Public API ]
```

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

Public Endpoints:
- POST /register
- POST /login
- GET /health

Protected Endpoints (Bearer Token gerekir):
- GET /me
- GET /api/coins/markets

JWT olmadan erişim:

401 Unauthorized

---

## 📊 Rate Limiting

Free Plan:
- 10 istek / gün

Pro Plan:
- Sınırsız

Limit dolduğunda:

429 Daily request limit reached

Rate limit:
- Kullanıcı bazlıdır
- UTC gününe göre reset olur
- daily_request_count DB’de tutulur

---

## ⚡ Cache Stratejisi

- TTL: 60 saniye
- In-memory dictionary cache
- Parametre bazlı key oluşturulur

Log çıktısı:

CACHE MISS -> CoinGecko çağrıldı  
CACHE HIT  -> Memory cache kullanıldı  

Cache olmazsa:
- Her refresh upstream çağrı yapar
- Latency artar
- Upstream limit riski büyür

---

## 📈 10.000 Kullanıcı Senaryosu

Mevcut demo:
- SQLite
- Memory cache (instance bazlı)

Büyüdüğünde:
- SQLite write contention oluşur
- Cache instance bazlı kalır
- Horizontal scaling zorlaşır

Production yaklaşımı:
- PostgreSQL
- Redis cache
- Redis rate limit counter
- Multi worker + Load balancer

---

## 🧠 Redis Kullanım Alanı

1) Cache
2) Rate limit sayaçları

Örnek:

INCR user:{id}:requests:{YYYY-MM-DD}  
TTL 86400  

---

## 💳 Gerçek Pro Plan Entegrasyonu

- Stripe webhook endpoint
- Ödeme başarılı → webhook backend’e gelir
- plan_type = "Pro" olarak güncellenir
- Rate limit otomatik değişir

---

## 🛡️ Abuse Önleme

- IP throttling
- Short JWT expiry
- Email verification
- CAPTCHA
- Activity logging

---

## 🗂️ ER Yapısı

USERS
-----
id (PK)
email (unique)
password_hash
plan_type
daily_request_count
last_request_date
created_at

---

## ▶️ Local Çalıştırma

Backend:

cd backend  
.\.venv\Scripts\Activate.ps1  
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000  

Frontend:

cd frontend  
npm install  
npm run dev  

Frontend:
http://localhost:3000

Backend Docs:
http://127.0.0.1:8000/docs

---

# 🇬🇧 English

## Goal

This project simulates a real SaaS architecture.

It demonstrates:
- JWT authentication
- Plan-based rate limiting
- Backend proxy pattern
- Caching strategy
- Mobile-ready UI

Critical rule:
Frontend never calls the external API directly.
All data flows through the backend proxy.

---

## Result

This is not just a coin dashboard.

It is:
- A SaaS simulation
- An architectural demonstration
- A backend engineering practice
- A scalability awareness exercise