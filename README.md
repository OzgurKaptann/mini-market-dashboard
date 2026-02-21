# 🚀 Mini Market Dashboard

## Production-Aware SaaS Simulation \| FastAPI + Next.js

------------------------------------------------------------------------

# 🇹🇷 Türkçe

## 🎯 Projenin Vizyonu

Mini Market Dashboard, yalnızca kripto fiyatlarını gösteren bir uygulama
değildir.

Bu proje:

-   Backend proxy mimarisini zorunlu kılar
-   Kullanıcı bazlı plan kontrolü uygular
-   Rate limiting ve cache stratejisini gerçek SaaS mantığında tasarlar
-   Production ortamını dikkate alarak deploy edilir

Bu çalışma, veri tüketen bir Data Analyst yaklaşımından, sistem
tasarlayan bir Data Engineer düşünce yapısına geçiş pratiğidir.

------------------------------------------------------------------------

## 🏗️ Mimari Tasarım

    [ Next.js Frontend ]
              |
              v
    [ FastAPI Backend Layer ]
              |
              v
    [ CoinGecko Public API ]

### Kritik Mimari Karar

Frontend doğrudan CoinGecko API'ye bağlanamaz.

Tüm veri akışı backend proxy üzerinden geçer. Bu sayede:

-   Authentication enforce edilir
-   Rate limit kontrol edilir
-   Cache uygulanır
-   API anahtarı (gerekiyorsa) korunur

------------------------------------------------------------------------

## 🔐 Authentication & Security

-   JWT Authentication
-   Argon2 password hashing (bcrypt alternatifi, daha güçlü)
-   Protected endpoints
-   Plan bazlı erişim kontrolü

Public: - POST /register - POST /login - GET /health

Protected: - GET /me - GET /api/coins/markets

------------------------------------------------------------------------

## 📊 Rate Limiting Tasarımı

### Free Plan

-   10 upstream API çağrısı / gün

### Pro Plan

-   Limitsiz

### Uygulama Detayı

Sadece CoinGecko'ya yapılan gerçek upstream çağrılar sayılır. Cache hit
olan istekler kotaya dahil edilmez.

Bu karar:

-   Public API kotasını korur
-   Cache verimliliğini teşvik eder
-   Gerçek backend kaynak tüketimini baz alır
-   SaaS quota design mantığını simüle eder

------------------------------------------------------------------------

## ⚡ Cache Stratejisi

-   In-memory TTL cache
-   Parametre bazlı cache key üretimi

### Assignment Notu

Görev dokümanında TTL = 60 saniye olarak belirtilmiştir.

Demo ortamında TTL = 600 saniye kullanılmıştır.

Sebep:

Render free tier tek instance çalıştırır. Kısa TTL gereksiz upstream
çağrılarını artırabilir.

Bu ayar production-awareness göstergesidir.

TTL ortam değişkeni:

    CACHE_TTL_SECONDS

------------------------------------------------------------------------

## 🗂️ Veritabanı Tasarımı

### USERS

  Field                 Description
  --------------------- ---------------------
  id                    Primary Key
  email                 Unique
  password_hash         Secure hash
  plan_type             Free / Pro
  daily_request_count   Daily quota counter
  last_request_date     Reset control
  created_at            Timestamp

------------------------------------------------------------------------

## 📱 Frontend Özellikleri

-   Register / Login
-   Dashboard
-   Coin arama
-   Favorilere ekleme
-   Plan yükseltme simülasyonu
-   Mobil uyumlu tasarım (375px destekli)

------------------------------------------------------------------------

## 💼 İş Modeli Perspektifi

### Cache Olmazsa

-   Her refresh upstream çağrı üretir
-   Latency artar
-   Public API throttle riski oluşur

### 10.000 Kullanıcı Senaryosu

-   SQLite write contention
-   Instance-level cache limitation
-   Horizontal scaling ihtiyacı

### Production Ölçeklendirme

-   PostgreSQL
-   Redis cache
-   Redis rate limit counter
-   Multi-instance deployment
-   Load balancer

------------------------------------------------------------------------

## 🚀 Deployment

Frontend: Vercel\
Backend: Render

Live Demo:

Frontend: https://mini-market-dashboard-six.vercel.app/

Backend: https://mini-market-dashboard.onrender.com/

------------------------------------------------------------------------

# 🇬🇧 English

## 🎯 Vision

This project simulates a real SaaS architecture using the CoinGecko
public API.

It demonstrates:

-   Backend proxy enforcement
-   Plan-based quota design
-   Production-aware caching strategy
-   Authentication & authorization
-   Deployment configuration management

------------------------------------------------------------------------

## 📊 Rate Limiting Philosophy

Free users are limited to 10 upstream API calls per day.

Only real upstream calls are counted. Cache hits do not consume quota.

This reflects real SaaS billing logic.

------------------------------------------------------------------------

## ⚡ Production Awareness

Assignment TTL: 60 seconds\
Demo TTL: 600 seconds

Reason: Single-instance free hosting environments require higher TTL to
avoid excessive upstream throttling.

------------------------------------------------------------------------

## ✅ What This Project Demonstrates

-   SaaS simulation mindset
-   Secure authentication flow
-   Quota-based access control
-   Cache + rate limit interaction
-   Deployment awareness
-   Analyst → Engineer thinking evolution

------------------------------------------------------------------------

## 👨‍💻 Author

Designed as a practical full-stack SaaS simulation to demonstrate
architectural thinking beyond data analysis.
