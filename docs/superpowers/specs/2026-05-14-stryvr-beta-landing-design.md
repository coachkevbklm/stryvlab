# STRYVR Beta Landing Page — Design Spec

**Date:** 2026-05-14  
**Produit:** STRYVR (app mobile native, sous-projet de STRYVLAB)  
**Route:** `/stryvr` dans le repo STRYVLAB (Next.js App Router)

---

## Contexte

STRYVR est l'app mobile native (React Native/Expo) qui accompagne la plateforme coach STRYVLAB. Elle cible les **clients finaux** — personnes coachées via STRYVR. Cette landing page annonce l'accès bêta, collecte les emails des testeurs intéressés, et crée de la désirabilité avant le lancement en Belgique et France.

---

## Objectif

Convertir les visiteurs en inscrits bêta via un formulaire prénom + email, avec sentiment d'urgence (places limitées, lancement géo-ciblé). Page single-scroll, conversion-first.

---

## Public cible

Clients finaux (pas coaches). Personnes qui veulent être coachées de façon ultra-personnalisée, qui en ont marre des apps génériques, et qui veulent quelque chose de différent.

---

## Direction visuelle

**Light mode premium** — inspiré des références fournies (Urbanist font, fond blanc/gris très clair, accents orange vif → adaptés en vert STRYVR).

| Token | Valeur |
|-------|--------|
| Background | `#FAFAFA` |
| Surface cards | `#FFFFFF` |
| Accent primaire | `#1F8A65` (vert STRYVR) |
| Texte primaire | `#0A0A0A` |
| Texte secondaire | `#6B6B6B` |
| Texte muted | `#A0A0A0` |
| Border subtile | `#E8E8E8` |
| Font headline | Urbanist (Google Fonts) — bold, aéré |
| Font body | Inter (déjà dans le projet) |

**Principes visuels :**
- Zéro ombre décorative, zéro gradient
- Hiérarchie par taille typographique et opacité
- Chiffres massifs isolés (style refs : "95", "5 min", "100%")
- Mockup app en perspective 3D CSS tilt — frame iPhone stylisé en `#0A0A0A` avec UI dark à l'intérieur (contraste intentionnel light/dark)
- Arrondis généreux : `rounded-3xl` blocs, `rounded-2xl` cards, `rounded-xl` inputs/boutons

---

## Structure de la page

### 1. Navbar (sticky, minimal)
- Logo STRYVR (texte Unbounded ou Urbanist bold) + badge "BÊTA"
- Bouton CTA sticky à droite : "Rejoindre la bêta" → scroll vers formulaire

### 2. Hero (above the fold, conversion-first)
- **Headline :** "95% abandonnent.\nPas toi." — typographie massive (clamp 3.5rem–6rem), Urbanist ExtraBold
- **Sous-titre :** "STRYVR adapte ton programme en temps réel selon tes données. Coaching ultra-personnalisé, 5 min par jour."
- **Formulaire inline :** Prénom + Email + CTA "Rejoindre la liste bêta"
- **Compteur social :** "X personnes déjà sur la liste" (récupéré depuis Supabase count ou valeur statique initiale)
- **Badge géo :** "🇧🇪 Belgique · 🇫🇷 France · Places bêta limitées"
- **Mockup app :** iPhone tilté en perspective CSS, visible à droite sur desktop, en-dessous du form sur mobile

### 3. Features (3 cards — section courte)
- "Programme adapté en temps réel" — icône + titre + 1 ligne
- "5 min/jour, zéro friction" — icône + titre + 1 ligne
- "Ton coach dans ta poche" — icône + titre + 1 ligne

### 4. Stat bar (chiffres isolés, typographie massive)
- `95%` des gens abandonnent leur programme en 12 semaines
- `5 min` par jour suffisent pour des résultats réels
- `0` configuration technique requise

### 5. Formulaire de repeat (pour ceux qui ont scrollé)
- Identique au hero, avec tagline "Tu es encore là ? C'est bon signe."
- Même champs prénom + email + CTA

### 6. Footer minimal
- Logo + "© 2026 STRYVR by STRYVLAB" + lien mentions légales + "Belgique & France"

---

## Formulaire & Backend

**Champs :** `first_name` (text, required) + `email` (email, required)

**Server Action Next.js** → insert dans table Supabase `beta_waitlist` :
```sql
CREATE TABLE beta_waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  source TEXT DEFAULT 'stryvr-landing'
);
```

**RLS :** insert public (anon), select coach-only (authenticated).

**Validation serveur :**
- email format
- dedup sur email → message "Tu es déjà sur la liste ✓"
- trim whitespace

**UX post-submit :** message de confirmation inline (pas de redirect), avec prénom : "Bienvenue [prénom] ! Tu es sur la liste. On te contacte en premier."

**Compteur social :** Server Component qui fetch `COUNT(*)` depuis `beta_waitlist` au load. Arrondi à la dizaine inférieure pour éviter l'effet "exactement 0".

---

## Route

`/app/stryvr/page.tsx` — Server Component wrapper + `BetaLandingClient` Client Component pour les interactions (form submit, animations).

Server Action : `/app/stryvr/actions.ts`

---

## Animations

Framer Motion (déjà dans le projet) :
- Headline : fade-up à l'entrée
- Formulaire : stagger des champs
- Mockup app : parallax subtil au scroll (translateY -20px sur 300px scroll)
- Confirmation form : scale+fade in

---

## Responsive

- Mobile : hero stack vertical, formulaire full-width, mockup en dessous
- Desktop : hero split — texte+form à gauche, mockup à droite
- Navbar : CTA disparaît sur mobile (remplacé par bouton dans hero)

---

## Ce qui est hors-scope

- Pas d'auth / login
- Pas de page de confirmation séparée
- Pas d'email transactionnel (Phase 2)
- Pas de multi-langue
