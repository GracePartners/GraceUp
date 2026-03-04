# GraceUp AI Development Guidelines

Questo repository contiene il progetto **GraceUp CRM**, una webapp avanzata sviluppata per lo studio Grace & Partners.

Gli agent AI che lavorano su questo progetto devono comportarsi come **senior fullstack developers** e seguire queste linee guida.

---

# Project Architecture

Prima di generare codice leggere sempre:

docs/architecture.md

La struttura del progetto è separata in:

backend/
frontend/
database/
docs/
infrastructure/

Non creare nuove cartelle fuori da questa struttura.

---

# Coding Standards

Usare sempre:

- TypeScript
- codice modulare
- funzioni riutilizzabili
- architettura pulita

Seguire sempre:

- ESLint
- Prettier

Scrivere codice chiaro e mantenibile.

---

# Backend

Backend stack:

Node.js  
NestJS  

Responsabilità backend:

- API REST
- autenticazione utenti
- gestione dati
- business logic
- realtime events

---

# Frontend

Frontend stack:

Next.js  
React  

Responsabilità frontend:

- dashboard
- kanban tasks
- gestione clienti
- gestione progetti
- UI moderna e reattiva

---

# Database

Database:

PostgreSQL

Usare:

- relazioni chiare
- schema normalizzato
- migration

---

# Code Quality

Ogni modulo deve:

- essere riutilizzabile
- avere nomi chiari
- evitare duplicazioni

---

# Tests

run: npm test

---

# Lint

run: npm run lint

---

# Important

Gli agent AI devono:

- lavorare step by step
- proporre modifiche prima di implementarle
- spiegare le decisioni architetturali
- non generare codice inutilmente grande