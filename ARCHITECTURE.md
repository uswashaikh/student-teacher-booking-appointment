# System Architecture Document
## Talent AI - Recruitment & Screening Platform

## 1. Architecture Overview

### 1.1 Executive Summary
Talent AI is a cloud-based recruitment and screening platform built on a monolithic Django architecture with modular app design. The system supports scalable MCQ-based assessments with real-time proctoring, automated scoring, and comprehensive analytics.

### 1.2 Architecture Goals
- **Scalability:** Handle 10,000+ concurrent test takers
- **Reliability:** 99.9% uptime SLA
- **Performance:** <200ms average response time
- **Security:** SOC 2 compliant data protection
- **Maintainability:** Modular, testable codebase

---

## 2. High-Level Architecture

### 2.1 System Context Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                     External Users                           │
├─────────────────────────────────────────────────────────────┤
│  Recruiters    │    Admins    │    Candidates               │
└────────┬────────────┬──────────────┬─────────────────────────┘
         │            │              │
         │   HTTPS    │    HTTPS     │    HTTPS
         │            │              │
┌────────▼────────────▼──────────────▼─────────────────────────┐
│                   Load Balancer (Nginx)                       │
│                  SSL Termination / Rate Limiting              │
└────────┬──────────────────────────────────────────────────────┘
         │
         │
┌────────▼──────────────────────────────────────────────────────┐
│                  Application Layer                             │
│  ┌──────────────────────────────────────────────────────┐    │
│  │         Django Application Servers (Gunicorn)        │    │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │    │
│  │  │  Instance  │  │  Instance  │  │  Instance  │    │    │
│  │  │     1      │  │     2      │  │     3      │    │    │
│  │  └────────────┘  └────────────┘  └────────────┘    │    │
│  └──────────────────────────────────────────────────────┘    │
└───────────┬───────────────────────────┬────────────────────────┘
            │                           │
            │                           │
     ┌──────▼──────┐           ┌───────▼────────┐
     │  PostgreSQL │           │  Redis Cluster │
     │   Database  │           │   (Cache +     │
     │   (Primary) │           │   Sessions)    │
     │             │           │                │
     │  ┌────────┐ │           └────────────────┘
     │  │Replica │ │
     │  └────────┘ │
     └─────────────┘
            │
            │
     ┌──────▼──────────────┐
     │  Celery Workers     │
     │  (Background Tasks) │
     │  - Score calc       │
     │  - Email sending    │
     │  - Analytics gen    │
     └─────────────────────┘
```

### 2.2 Deployment Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    Cloud Provider (AWS/GCP)                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Availability Zone 1                   │    │
│  │  ┌──────────────┐  ┌──────────────┐               │    │
│  │  │  Web Server  │  │  Web Server  │               │    │
│  │  │   (Nginx)    │  │   (Nginx)    │               │    │
│  │  └──────┬───────┘  └──────┬───────┘               │    │
│  │         │                  │                        │    │
│  │  ┌──────▼──────┐  ┌───────▼──────┐                │    │
│  │  │  App Server │  │  App Server  │                │    │
│  │  │  (Gunicorn) │  │  (Gunicorn)  │                │    │
│  │  └─────────────┘  └──────────────┘                │    │
│  └────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Availability Zone 2                   │    │
│  │  ┌──────────────┐  ┌──────────────┐               │    │
│  │  │  Web Server  │  │  Web Server  │               │    │
│  │  │   (Nginx)    │  │   (Nginx)    │               │    │
│  │  └──────┬───────┘  └──────┬───────┘               │    │
│  │         │                  │                        │    │
│  │  ┌──────▼──────┐  ┌───────▼──────┐                │    │
│  │  │  App Server │  │  App Server  │                │    │
│  │  │  (Gunicorn) │  │  (Gunicorn)  │                │    │
│  │  └─────────────┘  └──────────────┘                │    │
│  └────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Data Layer (Multi-AZ)                     │   │
│  │  ┌────────────────┐        ┌────────────────┐      │   │
│  │  │   PostgreSQL   │◄──────►│   PostgreSQL   │      │   │
│  │  │    Primary     │  Sync  │     Replica    │      │   │
│  │  └────────────────┘        └────────────────┘      │   │
│  │                                                       │   │
│  │  ┌────────────────┐        ┌────────────────┐      │   │
│  │  │  Redis Master  │◄──────►│  Redis Replica │      │   │
│  │  └────────────────┘        └────────────────┘      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Background Processing                      │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐   │   │
│  │  │   Celery   │  │   Celery   │  │   Celery   │   │   │
│  │  │  Worker 1  │  │  Worker 2  │  │  Worker 3  │   │   │
│  │  └────────────┘  └────────────┘  └────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Storage & CDN                              │   │
│  │  ┌────────────────┐        ┌────────────────┐      │   │
│  │  │   S3 Bucket    │        │   CloudFront   │      │   │
│  │  │  (Static Files)│◄───────┤      (CDN)     │      │   │
│  │  └────────────────┘        └────────────────┘      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## 3. Component Architecture

### 3.1 Application Layer Components

#### Django Application Structure
```
talent_ai/
├── config/                    # Project configuration
│   ├── settings/
│   │   ├── base.py           # Base settings
│   │   ├── development.py    # Dev environment
│   │   ├── production.py     # Prod environment
│   │   └── testing.py        # Test environment
│   ├── urls.py               # Root URL configuration
│   └── wsgi.py               # WSGI application
│
├── recruitment/              # Main recruitment module
│   └── screening/
│       └── mcq_test/         # MCQ testing app
│           ├── models/       # Data models
│           ├── views/        # View controllers
│           ├── forms/        # Form handling
│           ├── services/     # Business logic
│           ├── templates/    # HTML templates
│           ├── static/       # CSS, JS, images
│           └── tests/        # Test suite
│
├── accounts/                 # User management
│   ├── models.py             # User profiles
│   ├── views.py              # Authentication
│   └── templates/
│
├── common/                   # Shared utilities
│   ├── middleware/           # Custom middleware
│   ├── utils/                # Helper functions
│   └── decorators/           # Custom decorators
│
└── components/               # Reusable UI components
    ├── templatetags/         # Custom template tags
    └── components/           # Django components
```

### 3.2 Data Flow Architecture

#### Request-Response Flow
```
┌──────────┐
│  Client  │
│ (Browser)│
└────┬─────┘
     │
     │ 1. HTTP Request
     │
┌────▼──────────────┐
│  Nginx (Reverse   │
│  Proxy + SSL)     │
└────┬──────────────┘
     │
     │ 2. Proxied Request
     │
┌────▼──────────────┐
│  Gunicorn (WSGI)  │
│  Application      │
│  Server           │
└────┬──────────────┘
     │
     │ 3. WSGI Handler
     │
┌────▼──────────────┐
│  Django Middleware│
│  - Security       │
│  - Session        │
│  - Auth           │
│  - CSRF           │
└────┬──────────────┘
     │
     │ 4. URL Routing
     │
┌────▼──────────────┐
│  View Controller  │
│  - Validate input │
│  - Business logic │
│  - Call services  │
└────┬──────────────┘
     │
     │ 5. Data Access
     │
┌────▼──────────────┐     ┌──────────────┐
│  Models/ORM       │────►│  PostgreSQL  │
│  - Queries        │◄────│  Database    │
│  - Validation     │     └──────────────┘
└────┬──────────────┘
     │
     │ 6. Cache Check
     │
┌────▼──────────────┐     ┌──────────────┐
│  Cache Layer      │────►│    Redis     │
│  - Session data   │◄────│              │
│  - Query results  │     └──────────────┘
└────┬──────────────┘
     │
     │ 7. Template Rendering
     │
┌────▼──────────────┐
│  Template Engine  │
│  - Django DTL     │
│  - Context data   │
└────┬──────────────┘
     │
     │ 8. HTTP Response
     │
┌────▼─────┐
│  Client  │
└──────────┘
```

#### Test-Taking Flow
```
┌─────────────┐
│  Candidate  │
│  Visits URL │
└──────┬──────┘
       │
       ▼
┌────────────────────┐
│  Test Start View   │
│  - Validate access │
│  - Create attempt  │
└──────┬─────────────┘
       │
       │ Creates TestAttempt
       │ Status: 'initiated'
       ▼
┌────────────────────┐     ┌──────────────────┐
│  Question View     │────►│  Load Questions  │
│  - Show question   │     │  - From config   │
│  - Track time      │     │  - Apply rules   │
│  - Monitor events  │     └──────────────────┘
└──────┬─────────────┘
       │
       │ Submits Answer (AJAX/HTMX)
       ▼
┌────────────────────┐
│  Answer Handler    │
│  - Validate input  │
│  - Save to attempt │
│  - Update status   │
└──────┬─────────────┘
       │
       │ All questions answered
       ▼
┌────────────────────┐     ┌──────────────────┐
│  Submit Test View  │────►│  Celery Task     │
│  - Finalize        │     │  - Calculate     │
│  - Change status   │     │    score         │
└──────┬─────────────┘     │  - Generate      │
       │                   │    analytics     │
       │                   └──────────────────┘
       ▼
┌────────────────────┐
│  Results View      │
│  - Show score      │
│  - Performance     │
│  - Breakdown       │
└────────────────────┘
```

---

## 4. Technology Stack Details

### 4.1 Backend Technologies

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Framework | Django | 4.2+ | Web application framework |
| Language | Python | 3.11+ | Programming language |
| WSGI Server | Gunicorn | 21.0+ | Application server |
| Task Queue | Celery | 5.3+ | Asynchronous task processing |
| Message Broker | Redis | 7.0+ | Task queue backend |

### 4.2 Database Layer

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Primary DB | PostgreSQL | 14+ | Relational data storage |
| Cache | Redis | 7.0+ | Session + query caching |
| ORM | Django ORM | 4.2+ | Database abstraction |

### 4.3 Frontend Technologies

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| CSS Framework | Bootstrap | 5.3+ | UI components |
| JavaScript | Vanilla JS | ES6+ | Client-side logic |
| HTMX | HTMX | 1.9+ | Dynamic interactions |
| Template Engine | Django DTL | 4.2+ | Server-side rendering |

### 4.4 Infrastructure

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Web Server | Nginx | Reverse proxy, load balancing |
| Container | Docker | Application containerization |
| Orchestration | Docker Compose | Local development |
| Cloud Platform | AWS/GCP | Production hosting |
| CDN | CloudFront/Cloud CDN | Static file delivery |
| Storage | S3/Cloud Storage | File storage |

---

## 5. Scalability Architecture

### 5.1 Horizontal Scaling Strategy

#### Application Layer
```
Load Balancer (Nginx)
        │
        ├─────► App Server 1 (Gunicorn workers: 4)
        ├─────► App Server 2 (Gunicorn workers: 4)
        ├─────► App Server 3 (Gunicorn workers: 4)
        └─────► App Server N (Gunicorn workers: 4)

Auto-scaling rules:
- Scale up: CPU > 70% for 5 minutes
- Scale down: CPU < 30% for 10 minutes
- Min instances: 2
- Max instances: 20
```

#### Worker Layer
```
Celery Workers
        │
        ├─────► Worker 1 (Concurrency: 10)
        ├─────► Worker 2 (Concurrency: 10)
        ├─────► Worker 3 (Concurrency: 10)
        └─────► Worker N (Concurrency: 10)

Queue prioritization:
1. High priority: Score calculation
2. Medium priority: Email notifications
3. Low priority: Analytics generation
```

### 5.2 Database Scaling

#### Read Replicas
```
┌──────────────┐
│   Primary    │
│  PostgreSQL  │
│ (Write only) │
└──────┬───────┘
       │
       │ Streaming replication
       │
       ├──────────────────┬──────────────────┐
       │                  │                  │
┌──────▼───────┐  ┌──────▼───────┐  ┌──────▼───────┐
│   Replica 1  │  │   Replica 2  │  │   Replica 3  │
│ (Read only)  │  │ (Read only)  │  │ (Read only)  │
└──────────────┘  └──────────────┘  └──────────────┘

Connection routing:
- Writes → Primary
- Reads → Round-robin replicas
- Lag monitoring: <1 second
```

#### Connection Pooling
```python
# PgBouncer configuration
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'HOST': 'pgbouncer.internal',
        'PORT': 6432,
        'CONN_MAX_AGE': 600,
        'OPTIONS': {
            'pool_size': 20,
            'max_overflow': 10,
            'pool_recycle': 3600,
        }
    }
}
```

### 5.3 Caching Strategy

#### Multi-Level Cache
```
┌────────────────────────────────────────────────┐
│              Application Layer                 │
│                                                │
│  Request → 1. Check Local Cache               │
│           ↓                                    │
│         Miss? → 2. Check Redis Cache           │
│                ↓                               │
│              Miss? → 3. Query Database         │
│                     ↓                          │
│                   Store in Redis               │
│                     ↓                          │
│                   Return to user               │
└────────────────────────────────────────────────┘

Cache TTL strategy:
- Test configurations: 1 hour
- Questions: 30 minutes
- User sessions: 2 hours
- Analytics: 5 minutes
- Static content: 24 hours
```

---

## 6. Security Architecture

### 6.1 Network Security

#### Security Layers
```
┌──────────────────────────────────────────────────┐
│  Layer 1: Perimeter Security                     │
│  - WAF (Web Application Firewall)                │
│  - DDoS protection                               │
│  - Rate limiting (100 req/min per IP)            │
└──────────────────────┬───────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────┐
│  Layer 2: Transport Security                     │
│  - TLS 1.3 only                                  │
│  - Strong cipher suites                          │
│  - HSTS enabled                                  │
└──────────────────────┬───────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────┐
│  Layer 3: Application Security                   │
│  - Django security middleware                    │
│  - CSRF protection                               │
│  - XSS prevention                                │
│  - SQL injection protection (ORM)                │
└──────────────────────┬───────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────┐
│  Layer 4: Data Security                          │
│  - Encryption at rest (AES-256)                  │
│  - Sensitive data hashing                        │
│  - Database access controls                      │
└──────────────────────────────────────────────────┘
```

### 6.2 Authentication & Authorization

#### User Authentication Flow
```
┌──────────────┐
│    Login     │
│   Request    │
└──────┬───────┘
       │
       ▼
┌────────────────────┐
│  Validate          │
│  Credentials       │
│  (bcrypt hash)     │
└──────┬─────────────┘
       │
       ▼
┌────────────────────┐
│  Create Session    │
│  - Session ID      │
│  - Store in Redis  │
│  - HTTPOnly cookie │
└──────┬─────────────┘
       │
       ▼
┌────────────────────┐
│  Check Permissions │
│  - Role-based      │
│  - Resource-based  │
└────────────────────┘
```

#### Permission Matrix
```
┌──────────────┬─────────┬──────────┬───────────┐
│ Resource     │ Admin   │ Recruiter│ Candidate │
├──────────────┼─────────┼──────────┼───────────┤
│ Create Test  │   ✓     │    ✓     │     ✗     │
│ Edit Test    │   ✓     │    ✓     │     ✗     │
│ Delete Test  │   ✓     │    ✗     │     ✗     │
│ Take Test    │   ✓     │    ✓     │     ✓     │
│ View Results │   ✓     │    ✓     │  Own only │
│ Analytics    │   ✓     │    ✓     │     ✗     │
└──────────────┴─────────┴──────────┴───────────┘
```

### 6.3 Test Security

#### Proctoring Architecture
```javascript
// Client-side monitoring
const ProctorMonitor = {
    events: [],
    
    trackFocusLoss() {
        window.addEventListener('blur', () => {
            this.logEvent('focus_loss');
            this.sendToServer();
        });
    },
    
    trackTabSwitch() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.logEvent('tab_switch');
                this.sendToServer();
            }
        });
    },
    
    preventCopyPaste() {
        document.addEventListener('copy', e => e.preventDefault());
        document.addEventListener('paste', e => e.preventDefault());
    },
    
    sendToServer() {
        fetch('/mcq/security-event/', {
            method: 'POST',
            body: JSON.stringify(this.events)
        });
    }
};
```

---

## 7. Disaster Recovery & Backup

### 7.1 Backup Strategy

#### Database Backups
```
┌────────────────────────────────────────────┐
│  Backup Schedule                           │
├────────────────────────────────────────────┤
│  Full Backup:     Daily at 2 AM UTC       │
│  Incremental:     Every 6 hours           │
│  Transaction Log: Continuous (5 min)      │
│  Retention:       30 days                 │
│  Off-site Copy:   AWS S3 Glacier          │
└────────────────────────────────────────────┘

Recovery objectives:
- RPO (Recovery Point Objective): 5 minutes
- RTO (Recovery Time Objective): 1 hour
```

#### Backup Verification
```bash
# Daily automated restore test
*/1 * * * * /scripts/backup_verify.sh

# Verify backup integrity
- Restore to staging environment
- Run smoke tests
- Alert if failures detected
```

### 7.2 High Availability Setup

#### Multi-Region Architecture
```
┌─────────────────────────────────────────────────┐
│  Primary Region (US-East)                       │
│  - Active application servers                   │
│  - Primary database (read/write)                │
│  - Redis master                                 │
└────────────────────┬────────────────────────────┘
                     │
                     │ Async replication
                     │
┌────────────────────▼────────────────────────────┐
│  Secondary Region (EU-West)                     │
│  - Standby application servers                  │
│  - Database replica (read-only)                 │
│  - Redis replica                                │
└─────────────────────────────────────────────────┘

Failover strategy:
- DNS-based failover (Route 53 / Cloud DNS)
- Automatic promotion of secondary
- RTO: <15 minutes
```

---

## 8. Monitoring & Observability

### 8.1 Monitoring Stack

#### Infrastructure Monitoring
```
┌──────────────────────────────────────────────┐
│  Prometheus                                  │
│  - Metrics collection                        │
│  - Time-series database                      │
└────────────┬─────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│  Grafana Dashboards                          │
│  - System metrics (CPU, Memory, Disk)        │
│  - Application metrics (Request rate, etc)   │
│  - Database metrics (Query time, etc)        │
└──────────────────────────────────────────────┘
```

#### Application Performance Monitoring (APM)
```
┌──────────────────────────────────────────────┐
│  New Relic / Datadog / Sentry                │
│  - Request tracing                           │
│  - Error tracking                            │
│  - Performance profiling                     │
│  - Real user monitoring                      │
└──────────────────────────────────────────────┘
```

### 8.2 Key Metrics

#### System Health Metrics
- **Uptime:** 99.9% target
- **Response Time:** P95 <200ms
- **Error Rate:** <0.1%
- **Database Connections:** <80% pool usage
- **Cache Hit Rate:** >85%

#### Business Metrics
- **Test Completion Rate:** Track per test
- **Average Test Duration:** Monitor trends
- **Security Violations:** Alert threshold
- **Concurrent Users:** Peak capacity planning

---

## 9. Development & Deployment

### 9.1 CI/CD Pipeline

```
┌──────────────┐
│  Developer   │
│  Commits     │
└──────┬───────┘
       │
       ▼
┌─────────────────────┐
│  Git Push           │
│  (GitHub/GitLab)    │
└──────┬──────────────┘
       │
       │ Webhook trigger
       ▼
┌─────────────────────┐
│  CI Server          │
│  (GitHub Actions)   │
│  1. Run tests       │
│  2. Lint code       │
│  3. Security scan   │
└──────┬──────────────┘
       │
       │ Tests pass
       ▼
┌─────────────────────┐
│  Build Docker Image │
│  - Poetry install   │
│  - Collect static   │
│  - Tag version      │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Push to Registry   │
│  (Docker Hub/ECR)   │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Deploy to Staging  │
│  - Run migrations   │
│  - Smoke tests      │
└──────┬──────────────┘
       │
       │ Manual approval
       ▼
┌─────────────────────┐
│  Deploy to Prod     │
│  - Blue/green       │
│  - Health checks    │
│  - Rollback ready   │
└─────────────────────┘
```

### 9.2 Environment Configuration

#### Development
```yaml
# docker-compose.dev.yml
services:
  web:
    build: .
    command: python manage.py runserver 0.0.0.0:8000
    volumes:
      - .:/app
    environment:
      - DEBUG=True
      - DATABASE_URL=postgresql://localhost/talent_ai_dev
```

#### Production
```yaml
# docker-compose.prod.yml
services:
  web:
    image: talent-ai:latest
    command: gunicorn config.wsgi:application --workers 4
    environment:
      - DEBUG=False
      - DATABASE_URL=postgresql://prod-db/talent_ai
      - REDIS_URL=redis://prod-redis:6379
      - SECRET_KEY=${SECRET_KEY}
```

---

## 10. Cost Optimization

### 10.1 Resource Optimization

#### Compute Costs
```
Strategy:
- Auto-scaling based on demand
- Spot instances for Celery workers (50% cost savings)
- Reserved instances for base capacity (30% savings)
- Right-sizing: t3.medium for app servers

Estimated monthly cost:
- App servers (4x t3.medium): $120
- Database (db.t3.large): $150
- Redis (cache.t3.medium): $50
- Total: ~$320/month (small scale)
```

#### Storage Costs
```
Strategy:
- S3 lifecycle policies (move old data to Glacier)
- CDN caching reduces origin requests
- Database archival for old test attempts

Estimated monthly cost:
- S3 storage (100GB): $2.30
- CloudFront (1TB transfer): $85
- Database storage (50GB): $5
```

---

## 11. Compliance & Regulations

### 11.1 Data Privacy
- **GDPR Compliance:** Right to erasure, data portability
- **Data Retention:** Configurable per customer
- **Encryption:** At rest and in transit
- **Audit Logs:** All access tracked

### 11.2 Security Standards
- **SOC 2 Type II:** Annual audit
- **OWASP Top 10:** Protection implemented
- **Penetration Testing:** Quarterly external audits
- **Vulnerability Scanning:** Continuous automated scans

---

## 12. Future Roadmap

### 12.1 Phase 2 Enhancements
- Video proctoring integration
- AI-powered question generation
- Advanced analytics dashboard
- Mobile app (native iOS/Android)

### 12.2 Scalability Targets
- Support 100,000 concurrent users
- Multi-tenant architecture
- Global CDN distribution
- Edge computing for proctoring

---

**Architecture Version:** 1.0  
**Last Updated:** October 2025  
**Review Cycle:** Quarterly