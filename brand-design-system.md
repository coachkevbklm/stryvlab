# STRYVR — Brand Design System v2.1

> **Source de vérité unique** pour le branding, le design system UI, et l'implémentation front-end.
> Version 2.1 — Palette chromatique finalisée (2026-04-05). Système light crème + îlots dark + accent jaune acide.
> Aucune interface, composant, animation ou visuel ne doit être produit sans conformité stricte à ce document.

---

## 1. Positionnement & Identité de Marque

### Nature du produit

STRYVR est un **outil professionnel de performance** — un système de pilotage pour coachs exigeants.
L'interface est un instrument, pas une vitrine. Elle doit communiquer : puissance, précision, maîtrise.

### Archétype visuel de référence

- Logiciel professionnel haut de gamme — Notion, Linear, Salesforce Lightning (dense, neutre, lisible)
- Espace de travail épuré — fond crème chaud, typographie noire serrée, accents chirurgicaux
- "Cutting edge" sans futurisme — moderne par la rigueur, pas par l'effet

### Ton global

| Dimension | Valeur |
|-----------|--------|
| Ambiance | Lumineuse, structurée, professionnelle |
| Énergie | Puissante mais contenue — autorité calme |
| Signal | Précision technique, fiabilité, clarté |
| Contraste | Zones claires pour lire. Zones sombres pour agir. |

### Ce que la marque évite absolument

- Coloré / festif / marketing
- Dark mode générique (noir uniforme sans intention)
- Futurisme décoratif / cyberpunk
- Soft / kawaii / friendly app
- Corporate blanc stérile sans caractère thermique

---

## 2. Système Chromatique

> Système **light crème + îlots dark + accent jaune acide**.
> Les surfaces claires dominent (lisibilité, espace, chaleur). Les zones sombres (`#343434`) signalent la navigation et les actions d'autorité. L'accent `#FCF76E` est le seul signal chaud — chirurgical, non-négociable.

### 2.1 Structure des surfaces (Layout)

| Rôle | Hex | Variable Tailwind | Usage stratégique |
|------|-----|-------------------|-------------------|
| Fond global (body) | `#F0EFE7` | `bg-background` | Base de l'application — clarté, espace, chaleur crème |
| Surface primaire (cards) | `#D8D7CE` | `bg-surface` | Conteneurs de données — blocs structurants |
| Surface secondaire | `#E2E1D9` | `bg-surface-alt` | Hover listes, inputs inactifs, zones d'interaction |
| Surface élevée / puits | `#FEFEFE` | `bg-surface-raised` | Focus pur — inputs actifs, zones de lecture, modals |
| Surface sombre (dark) | `#343434` | `bg-dark` | Top bar navigation, panels d'autorité, états sombres |

### 2.2 Système typographique (Textes)

| Rôle | Hex | Variable Tailwind | Usage |
|------|-----|-------------------|-------|
| Texte titre / gras | `#1A1A1A` | `text-primary` | Noms, titres de sections sur fond clair |
| Texte navigation (zones dark) | `#FEFEFE` | `text-on-dark` | Contraste maximal — top bar et zones `#343434` |
| Texte secondaire (zones dark) | `#535353` | `text-secondary` | Descriptions et données contextuelles dans les zones sombres |
| Texte muted / labels | `#8A8A85` | `text-muted` | Libellés ("Title", "Phone") — ne pollue pas la donnée |

### 2.3 Accents & Interactions (Branding)

| Rôle | Hex | Variable Tailwind | Application |
|------|-----|-------------------|-------------|
| Accent principal | `#FCF76E` | `accent` | CTA final (Merge, tab actif Leads) — jaune acide |
| Accent statut autorité | `#343434` | `accent-dark` | Validation d'étape (Contacted) — le noir marque l'autorité |
| Sémantique info / données froides | `#DEDEDE` | `accent-info` | Graphiques de données neutres, barres secondaires |
| Hover ultra-subtil (light) | `#F2F2F2` | `accent-hover-light` | Survol sur surfaces blanches / puits |

> **Pourquoi `#FCF76E` ?** Jaune acide — suffisamment chaud pour casser la neutralité crème sans agresser. Sur fond dark `#343434`, contraste ~9:1. Sur fond `#F0EFE7`, c'est un signal pur d'action, pas une décoration. C'est l'unique couleur chaude autorisée — son autorité vient de sa solitude.

### 2.4 Bordures & Séparateurs

| Rôle | Hex | Variable Tailwind | Fonction |
|------|-----|-------------------|----------|
| Ligne de division | `#BCBCB8` | `border-subtle` | Séparateur horizontal discret entre lignes de données |
| Bordure focus | `#111111` | `border-active` | Champ sélectionné — utilisé avec parcimonie |

### 2.5 Couleurs sémantiques

| Rôle | Hex | Variable |
|------|-----|----------|
| Succès | `#22c55e` | `success` |
| Erreur / danger | `#ef4444` | `danger` |
| Warning | `#f59e0b` | `warning` |

Réservées aux états fonctionnels (badges, alertes, validations). **Jamais décoratives.**

### 2.6 Règles chromatiques strictes

1. **Une seule couleur chaude** dans l'interface fonctionnelle : `#FCF76E`. Aucune autre.
2. **Les zones dark (`#343434`) sont des îlots** — top bar, panels d'autorité. Jamais fond de page entière.
3. **`#FEFEFE` (blanc pur)** est réservé aux inputs actifs et zones de lecture — pas aux cards ou fonds généraux.
4. **Jamais de dégradé** dans les composants fonctionnels (boutons, cards, nav).
5. **Texte `#1A1A1A` sur fond crème** — jamais `#000000` pur sur `#F0EFE7`.
6. **Hover states** : toujours `#E2E1D9` sur fond `#F0EFE7` ou `#D8D7CE`. Jamais de couleur vive.
7. **Sur fond dark `#343434`** : texte `#FEFEFE`, labels `#535353`, accent `#FCF76E` pour la sélection active.

---

## 3. Typographie

### 3.1 Police principale — SP Pro Display

| Propriété | Valeur                                                           |
| --------- | ---------------------------------------------------------------- |
| Famille   | SP Pro Display (variable font, ou Neue Haas Grotesk en fallback) |
| Fallback  | `'Inter', 'Helvetica Neue', sans-serif`                          |
| Style     | Géométrique ultra-light à medium — sans empattement              |
| Caractère | Espacement large, formes ouvertes, lecture à haute densité       |

> SP Pro Display est une police géométrique display d'une grande neutralité. Son poids light sur fond sombre crée un effet visuel de précision technique — proche de ce qu'on voit dans les interfaces Bloomberg Terminal ou les dashboards Figma.

### 3.2 Hiérarchie typographique

| Usage              | Taille  | Poids         | Letter-spacing | Line-height |
| ------------------ | ------- | ------------- | -------------- | ----------- |
| Display / Hero     | 48–72px | 300 (Light)   | -0.03em        | 1.1         |
| Titre page (H1)    | 24px    | 500 (Medium)  | -0.02em        | 1.2         |
| Titre section (H2) | 18px    | 500 (Medium)  | -0.02em        | 1.3         |
| Titre card (H3)    | 14px    | 500 (Medium)  | -0.01em        | 1.4         |
| Corps / Paragraphe | 14px    | 400 (Regular) | -0.01em        | 1.6         |
| Label / Meta       | 12px    | 400 (Regular) | 0em            | 1.5         |
| Caption / Footnote | 11px    | 400 (Regular) | 0.02em         | 1.4         |
| Données numériques | 13–14px | 500 (Medium)  | -0.01em        | 1.0         |

### 3.3 Règles typographiques

1. **Pas de titres massifs dans l'interface fonctionnelle** — la hiérarchie se crée par le poids et la couleur, pas la taille.
2. **Données numériques** (sets, reps, poids, KPIs) : `font-mono` ou SP Pro Display Medium — toujours avec unité.
3. **Pas de UPPERCASE décoratif** — les majuscules sont réservées aux abréviations (RPE, RIR, kg).
4. **Labels** : text-muted, 12px, tracking normal. Jamais en gras.
5. **Couleur texte actif / sélectionné** : `#f0f0f0`. Texte inactif : `#5a5a5a`.

---

## 4. Iconographie

### Style

- **Outline uniquement** — trait 1.5px, jointures arrondies
- Bibliothèque de référence : Lucide Icons (gratuit, cohérent, outline)
- Taille standard : 16px (interface dense) / 20px (navigation, actions visibles)
- Couleur par défaut : `#5a5a5a` (text-muted)
- Couleur état actif : `#f0f0f0` (text-primary)
- Couleur accent (action primaire) : `#D9F220`

### Règles

- Pas d'icônes filled (remplies)
- Pas d'icônes colorées décoratives
- Pas de taille > 24px dans l'interface dense
- Toujours accompagnées d'un label sauf dans la navigation primaire compacte

---

## 5. Architecture des Pages — Règles Signature

> Ces règles définissent **comment les écrans STRYVR sont construits** — pas seulement leurs couleurs, mais leur logique spatiale, leur hiérarchie visuelle, et la manière dont l'information est présentée et empilée. Toute déviation doit être justifiée.

---

### 5.1 Shell Global — Structure des couches

Le shell est composé de **3 couches verticales fixes** :

```
┌──────────────────────────────────────────────────────────────────┐
│  LAYER 1 — TOP BAR PRINCIPALE   [fond #343434]  h=44px  shrink-0 │
│  [logo pill] [nav items] [tab actif pill jaune] [actions]        │
├──────────────────────────────────────────────────────────────────┤
│  LAYER 2 — SOUS-NAV / STEPPER   [fond #343434]  h=40px  shrink-0 │
│  (optionnel selon contexte — voir 5.3)                           │
├──────────────────────────────────────────────────────────────────┤
│  LAYER 3 — CONTENT AREA         [fond #F0EFE7]  flex-1  scroll   │
│                                                                  │
│  ┌──────────────────┬───────────────────┬──────────────────────┐ │
│  │  COL PRINCIPALE  │  COL SECONDAIRE   │  COL DARK PANEL      │ │
│  │  fond crème      │  fond crème       │  fond #343434        │ │
│  │  flex ~50%       │  flex ~25%        │  w=320–400px         │ │
│  └──────────────────┴───────────────────┴──────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

**Règles impératives du shell :**
1. Les 2 barres dark sont **toujours au top, jamais en sidebar** — navigation horizontale pure.
2. Le content area `#F0EFE7` est le seul espace scrollable — les barres restent fixes.
3. Le panel droit dark `#343434` est optionnel (contextuel : doublons, suggestions, détails rapides).
4. Aucun autre fond que `#F0EFE7` dans le content area — pas de sections dark intégrées dans le scroll.

---

### 5.2 Layer 1 — Top Bar Principale

**Fond :** `#343434` — hauteur : `44px` — `shrink-0`

```
┌─────────────────────────────────────────────────────────────────┐
│ [●] │ Home  Opport.  [Leads ▼]  Tasks  Files  Accounts  ...  │ 🔍 🔔 [avatar] │
│      ↑logo pill      ↑tab actif pill #FCF76E                              │
└─────────────────────────────────────────────────────────────────┘
```

**Anatomie de gauche à droite :**

| Zone | Contenu | Style |
|------|---------|-------|
| Logo / brand pill | Identifiant app ou lettre | `w-7 h-7 rounded-full bg-[#FEFEFE]` — blanc sur dark |
| Séparateur vertical | `|` ou `div` 1px | `bg-white/10 h-4 mx-3` |
| Items nav inactifs | Texte page | `text-[#FEFEFE] text-sm font-normal px-3 py-1.5` |
| Item nav actif | Pill jaune | `bg-accent text-[#1A1A1A] text-sm font-semibold px-3 py-1.5 rounded-full` |
| Dropdown chevron | Flèche sur item actif | `ChevronDown size=12 ml-1 text-[#1A1A1A]` |
| Zone droite — actions | Icônes utilitaires | `text-[#FEFEFE]/70 hover:text-[#FEFEFE]` — search, notifs |
| Avatar utilisateur | Photo ou initiales | `w-7 h-7 rounded-full bg-surface` |

**Règles Top Bar :**
- Hauteur fixe `44px` — jamais agrandie pour du contenu
- Jamais de bordure bottom — la rupture de fond dark→crème crée la séparation
- Le logo est un **pill**, pas un logo texte long
- Max 8–10 items nav — au-delà, utiliser un "More" dropdown
- L'item actif est **toujours** en pill `#FCF76E` avec texte `#1A1A1A`
- Les items inactifs sont en texte simple, jamais encadrés

```tsx
<header className="h-11 bg-dark flex items-center px-3 gap-1 shrink-0 z-50">
  {/* Logo */}
  <div className="w-7 h-7 rounded-full bg-surface-raised flex items-center justify-center mr-2">
    <span className="text-xs font-bold text-primary">S</span>
  </div>
  <div className="w-px h-4 bg-white/10 mx-2" />

  {/* Nav items */}
  <nav className="flex items-center gap-0.5 flex-1">
    {navItems.map(item => (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-all",
          isActive(item.href)
            ? "bg-accent text-[#1A1A1A] font-semibold"
            : "text-[#FEFEFE] font-normal hover:bg-white/10"
        )}
      >
        {item.label}
        {item.hasDropdown && isActive(item.href) && (
          <ChevronDown size={12} />
        )}
      </Link>
    ))}
  </nav>

  {/* Actions droite */}
  <div className="flex items-center gap-2 ml-auto">
    <button className="text-white/60 hover:text-white transition-colors">
      <Search size={16} />
    </button>
    <button className="text-white/60 hover:text-white transition-colors">
      <Bell size={16} />
    </button>
    <div className="w-7 h-7 rounded-full bg-surface overflow-hidden">
      <img src="/avatar.jpg" alt="Coach" className="w-full h-full object-cover" />
    </div>
  </div>
</header>
```

---

### 5.3 Layer 2 — Sous-Navigation / Stepper de Contexte

**Fond :** `#343434` — hauteur : `40px` — `shrink-0` — **optionnel, présent sur les pages de workflow**

La sous-nav est une **barre de progression contextuelle** : elle indique où l'on est dans un processus (dossier client, création de programme, check-in) ou propose une navigation secondaire dans une section.

```
┌──────────────────────────────────────────────────────────────────┐
│  [✓ Contacted]  [Nurturing]  [Unqualified]  [Connected]  [Next →]│
│   fond #FCF76E   texte blanc  texte blanc    texte blanc  pill jaune│
└──────────────────────────────────────────────────────────────────┘
```

**Deux variantes :**

#### Variante A — Stepper de workflow (progression étapes)
```tsx
<div className="h-10 bg-dark flex items-center px-4 gap-2 shrink-0">
  {steps.map((step, i) => {
    const isDone    = i < currentStep
    const isActive  = i === currentStep
    return (
      <button
        key={step}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all",
          isDone   && "bg-accent text-[#1A1A1A]",           // étape validée → jaune
          isActive && "bg-white/15 text-[#FEFEFE]",          // courante → blanc léger
          !isDone && !isActive && "text-white/40 cursor-default" // future → muted
        )}
      >
        {isDone && <Check size={10} strokeWidth={3} />}
        {step}
      </button>
    )
  })}

  {/* CTA "Next" — pill jaune à droite */}
  <button className="ml-auto bg-accent text-[#1A1A1A] text-xs font-semibold px-4 py-1.5 rounded-full flex items-center gap-1">
    Next <ChevronRight size={12} />
  </button>
</div>
```

#### Variante B — Tabs de section (navigation dans un dossier)
```tsx
<div className="h-10 bg-dark flex items-center px-4 gap-0.5 shrink-0">
  {tabs.map(tab => (
    <button
      key={tab.id}
      onClick={() => setActive(tab.id)}
      className={cn(
        "px-3 py-1 rounded-full text-xs font-medium transition-all",
        active === tab.id
          ? "bg-accent text-[#1A1A1A] font-semibold"
          : "text-white/60 hover:text-white hover:bg-white/10"
      )}
    >
      {tab.label}
    </button>
  ))}
</div>
```

**Règles Sous-Nav :**
- Fond identique à la top bar : `#343434` — les 2 barres forment un **bloc dark monolithique** au top
- Étape validée = pill `#FCF76E` + icône check + texte `#1A1A1A`
- Étape courante = fond `white/15` + texte `#FEFEFE`
- Étapes futures = texte `white/40` non-cliquables
- CTA "Next" toujours à droite, toujours en pill jaune
- Jamais de séparateur entre les 2 barres dark — elles fusionnent visuellement

---

### 5.4 Layer 3 — Content Area et Grilles

**Fond :** `#F0EFE7` — `flex-1 overflow-y-auto`

#### Page Header (premier élément du content area)

```
┌──────────────────────────────────────────────────────────────────┐
│  [avatar 48px]  Ms. Bertha B.  [Lead badge]   [Clone] [Edit] [Delete] │
│                 Director of Vendor Relations                      │
│                 Farmers Coop. of Florida  ·  (850) 644-0000      │
└──────────────────────────────────────────────────────────────────┘
```

```tsx
<div className="px-6 py-4 border-b border-subtle bg-[#F0EFE7]">
  <div className="flex items-start justify-between">
    <div className="flex items-center gap-3">
      {/* Avatar */}
      <div className="w-12 h-12 rounded-full bg-surface overflow-hidden shrink-0">
        <img src={client.avatar} alt={client.name} className="w-full h-full object-cover" />
      </div>
      {/* Identity block */}
      <div>
        <div className="flex items-center gap-2">
          <button className="text-muted hover:text-primary"><Star size={14} /></button>
          <h1 className="text-2xl font-semibold text-primary tracking-tight">{client.name}</h1>
          <span className="text-sm font-normal text-secondary ml-1">{client.type}</span>
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted">
          <span>{client.title}</span>
          <span className="text-subtle">·</span>
          <span>{client.company}</span>
          <span className="text-subtle">·</span>
          <a href={`tel:${client.phone}`} className="text-primary font-medium hover:underline">{client.phone}</a>
          <span className="text-subtle">·</span>
          <a href={`mailto:${client.email}`} className="text-accent hover:underline">{client.email}</a>
        </div>
      </div>
    </div>
    {/* Actions */}
    <div className="flex items-center gap-2">
      <button className="px-3 py-1.5 rounded-btn bg-surface border border-subtle text-xs font-medium text-primary hover:bg-surface-alt transition-colors">Clone</button>
      <button className="px-3 py-1.5 rounded-btn bg-surface border border-subtle text-xs font-medium text-primary hover:bg-surface-alt transition-colors">Edit</button>
      <button className="px-3 py-1.5 rounded-btn bg-danger/10 border border-danger/20 text-xs font-medium text-danger hover:bg-danger/20 transition-colors">Delete</button>
    </div>
  </div>
</div>
```

#### Grilles de contenu

**3 archétypes de layout pour le content area :**

**Archétype 1 — Vue Dossier (split 2+1)**
```
┌────────────────────────────────┬─────────────────────┐
│  COL PRINCIPALE                │  COL DARK PANEL     │
│  bg-[#F0EFE7]  flex-1  p-6    │  bg-dark  w-96      │
│  [card form éditable]          │  [cards suggestions]│
│  [card historique]             │  [card duplicate]   │
│  [card data KPI]               │                     │
└────────────────────────────────┴─────────────────────┘
```

**Archétype 2 — Vue Liste (full width)**
```
┌────────────────────────────────────────────────────────┐
│  FULL CONTENT  bg-[#F0EFE7]  p-6                       │
│  [header liste + filters]                              │
│  [table rows denses]                                   │
│  [pagination]                                          │
└────────────────────────────────────────────────────────┘
```

**Archétype 3 — Vue 3 colonnes (split large)**
```
┌───────────────┬───────────────┬────────────────────────┐
│  COL GAUCHE   │  COL CENTRALE │  COL DARK PANEL        │
│  bg-crème     │  bg-crème     │  bg-dark  w-96         │
│  [form/edit]  │  [data champs]│  [doublons/suggestions]│
└───────────────┴───────────────┴────────────────────────┘
```

---

### 5.5 Système de Cards — Règles Signature

Les cards sont le **motif structurant principal** du content area. Elles organisent l'information par domaines sémantiques.

#### Card Standard (fond crème)

```tsx
<div className="bg-surface rounded-card border border-subtle overflow-hidden">
  {/* Card Header */}
  <div className="flex items-center justify-between px-4 py-3 border-b border-subtle">
    <div className="flex items-center gap-2">
      <[SectionIcon] size={14} className="text-muted" />
      <h3 className="text-sm font-medium text-primary">Titre de section</h3>
      {count && <span className="text-xs text-muted">({count})</span>}
    </div>
    <button className="text-xs text-muted hover:text-primary flex items-center gap-1">
      View all <ChevronRight size={12} />
    </button>
  </div>
  {/* Card Body */}
  <div className="p-4 space-y-3">
    {children}
  </div>
</div>
```

#### Card Dark Panel (côté droit `#343434`)

```tsx
<div className="bg-dark rounded-card overflow-hidden">
  {/* Header dark */}
  <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
    <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden">
      <img src={item.avatar} />
    </div>
    <div>
      <p className="text-sm font-medium text-on-dark">{item.name}</p>
      <p className="text-xs text-white/40">{item.role}</p>
    </div>
    <div className="ml-auto flex items-center gap-1">
      {/* Checkbox de sélection */}
      <div className="w-5 h-5 rounded bg-accent flex items-center justify-center">
        <Check size={10} className="text-[#1A1A1A]" strokeWidth={3} />
      </div>
    </div>
  </div>
  {/* Body dark — données empilées */}
  <div className="p-4 space-y-3">
    {fields.map(f => (
      <DataFieldDark key={f.label} label={f.label} value={f.value} />
    ))}
  </div>
  {/* Historique activité */}
  <div className="border-t border-white/10 px-4 py-3">
    <p className="text-xs text-white/40 mb-2">Engagement History (4)</p>
    {events.map(e => <ActivityRowDark key={e.id} event={e} />)}
  </div>
</div>
```

---

### 5.6 Empilements de Données — Patterns Signature

L'information dans STRYVR est présentée selon **4 patterns d'empilement** distincts. Chaque pattern a un contexte précis.

#### Pattern A — Champ Éditable Inline

Le pattern le plus fréquent dans les dossiers. Label en dessus, valeur en dessous, icône crayon à droite.

```
┌─────────────────────────────────────────────┐
│  Title                                 [✏]  │
│  Director of Vendor Relations               │
├─────────────────────────────────────────────┤
│  Company                               [✏]  │
│  Farmers Coop. of Florida                   │
├─────────────────────────────────────────────┤
│  Phone                                 [✏]  │
│  (850) 644-0000                             │
└─────────────────────────────────────────────┘
```

```tsx
const DataFieldEditable = ({ label, value, onEdit }: Props) => (
  <div className="flex items-start justify-between py-2.5 border-b border-subtle last:border-0 group">
    <div className="space-y-0.5 flex-1 min-w-0">
      <p className="text-[11px] text-muted font-medium uppercase tracking-wide">{label}</p>
      <p className="text-sm text-primary truncate">{value || <span className="text-muted italic">—</span>}</p>
    </div>
    <button
      onClick={onEdit}
      className="opacity-0 group-hover:opacity-100 ml-2 text-muted hover:text-primary transition-all shrink-0 mt-0.5"
    >
      <Pencil size={12} />
    </button>
  </div>
)
```

**Règles Pattern A :**
- Label : `11px uppercase tracking-wide text-muted` — jamais en gras
- Valeur : `14px text-primary` — jamais de placeholder visible en lecture
- Icône edit : apparaît au hover du groupe entier (`group-hover`)
- Séparateur : `border-b border-subtle` entre chaque champ
- Dernier champ : `last:border-0`

#### Pattern B — Donnée Lecture Seule (dark panel)

Même structure, version dark. Sur fond `#343434`.

```tsx
const DataFieldDark = ({ label, value }: Props) => (
  <div className="space-y-0.5">
    <div className="flex items-center gap-1">
      <p className="text-[11px] text-white/40 font-medium uppercase tracking-wide">{label}</p>
      <Info size={10} className="text-white/20" />
    </div>
    <p className="text-sm text-on-dark">{value}</p>
  </div>
)
```

#### Pattern C — Stat KPI (grande donnée)

Utilisé dans les sections Data/Analytics. Chiffre dominant + label + mini-chart optionnel.

```
┌──────────────────────────┐
│  Data                    │
│                          │
│  2.2h                    │  ← 32px font-semibold
│  Communication with Lead │  ← 12px text-muted
│                          │
│  [sparkline chart]       │
│  [0% bar] [+15%] [6%]   │
└──────────────────────────┘
```

```tsx
const StatKPI = ({ label, value, unit, subtitle, trend }: Props) => (
  <div className="bg-surface-raised rounded-widget p-4 space-y-1">
    <p className="text-xs text-muted font-medium">{label}</p>
    <div className="flex items-baseline gap-1">
      <span className="text-[32px] font-semibold text-primary leading-none">{value}</span>
      {unit && <span className="text-sm text-muted">{unit}</span>}
    </div>
    {subtitle && <p className="text-xs text-secondary">{subtitle}</p>}
    {trend && (
      <div className="flex items-center gap-1 mt-2">
        <span className={cn("text-xs font-medium", trend > 0 ? "text-success" : "text-danger")}>
          {trend > 0 ? "+" : ""}{trend}%
        </span>
        <span className="text-xs text-muted">vs mois précédent</span>
      </div>
    )}
  </div>
)
```

#### Pattern D — Ligne d'Activité (historique)

Utilisé dans les sections "Engagement History". Icône action + label + timestamp.

```
┌─────────────────────────────────────────────────────┐
│ [□]  Form View                   2 mos 8 days ago   │
│      Form: Demo Request                             │
├─────────────────────────────────────────────────────┤
│ [□]  Form View                   2 mos 14 days ago  │
│      Form: Event Registration                       │
└─────────────────────────────────────────────────────┘
```

```tsx
const ActivityRow = ({ event, dark = false }: Props) => (
  <div className={cn(
    "flex items-start gap-2.5 py-2.5 border-b last:border-0",
    dark ? "border-white/10" : "border-subtle"
  )}>
    {/* Icône type d'événement */}
    <div className={cn(
      "w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5",
      dark ? "bg-white/10" : "bg-surface-alt"
    )}>
      <[EventIcon] size={12} className={dark ? "text-white/60" : "text-muted"} />
    </div>
    {/* Contenu */}
    <div className="flex-1 min-w-0 space-y-0.5">
      <p className={cn("text-xs font-medium truncate", dark ? "text-on-dark" : "text-primary")}>
        {event.type}
      </p>
      <p className={cn("text-[11px] truncate", dark ? "text-white/40" : "text-muted")}>
        {event.source}
      </p>
    </div>
    {/* Timestamp */}
    <span className={cn("text-[11px] shrink-0", dark ? "text-white/30" : "text-muted")}>
      {event.time}
    </span>
  </div>
)
```

---

### 5.7 Dark Panel Latéral — Architecture

Le panel droit `#343434` est une **zone d'autorité contextuelle** — suggestions de doublons, actions critiques, informations de confirmation. Il est toujours à droite, jamais intégré dans le scroll principal.

```tsx
<aside className="w-96 bg-dark shrink-0 flex flex-col overflow-y-auto">
  {/* En-tête panel */}
  <div className="px-4 py-3 border-b border-white/10">
    <p className="text-xs text-white/60">We found 2 potential duplicates of this lead</p>
    <p className="text-[11px] text-white/30 mt-0.5">Last change 6 minutes ago · Showing up to 3 leads</p>
  </div>

  {/* Action bar dark */}
  <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10">
    <button className="px-3 py-1.5 rounded-full bg-accent text-[#1A1A1A] text-xs font-semibold">
      New Lead
    </button>
    <button className="px-3 py-1.5 rounded-full bg-white/10 text-on-dark text-xs font-medium">
      Delete
    </button>
    <button className="px-3 py-1.5 rounded-full bg-white/10 text-on-dark text-xs font-medium">
      Merge
    </button>
  </div>

  {/* Liste de cards dark */}
  <div className="flex-1 divide-y divide-white/10">
    {duplicates.map(d => (
      <DuplicateCard key={d.id} data={d} />
    ))}
  </div>
</aside>
```

**Règles Dark Panel :**
- Fond : `#343434` — jamais un gris intermédiaire
- Cards internes : pas de fond différent — les sections sont séparées par `border-white/10`
- Texte principal : `#FEFEFE`
- Texte secondaire / labels : `rgba(255,255,255,0.40)` (`text-white/40`)
- Texte muted / timestamps : `rgba(255,255,255,0.30)`
- CTAs dans le panel : pill `#FCF76E` pour l'action primaire, `white/10` pour les actions secondaires
- Icônes de données : `text-white/40`, avec `(i)` info icon pour les champs ambigus
- Checkbox de sélection item : fond `#FCF76E` + check `#1A1A1A`

---

### 5.8 Spacing & Densité

Base unit : **4px**

| Token | Valeur | Usage |
|-------|--------|-------|
| `space-1` | 4px | Micro-gaps internes (icône/label) |
| `space-2` | 8px | Gap éléments dans un champ |
| `space-3` | 12px | Gap entre champs dans une card |
| `space-4` | 16px | Padding interne card standard |
| `space-5` | 20px | Padding card mobile |
| `space-6` | 24px | Gap entre cards |
| `space-8` | 32px | Espacement sections majeures |
| `space-12` | 48px | Zones distinctes (header → content) |

**Densité par contexte :**

| Zone | Row height | Padding cellule | Max colonnes |
|------|-----------|-----------------|-------------|
| Tableau liste coach | 40px | 8px 12px | 6 |
| Tableau dense | 32px | 6px 10px | 8 |
| Champ éditable inline | auto (min 36px) | 10px 0 | 1 |
| Card dark panel | auto (min 40px) | 12px 16px | 1 |
| Mobile client | 52px | 12px 16px | 3 |

---

## 6. Système de Bordures & Profondeur

### 6.1 Border-radius

| Élément              | Rayon | Token Tailwind   |
| -------------------- | ----- | ---------------- |
| Cards principales    | 16px  | `rounded-card`   |
| Sous-cards / widgets | 12px  | `rounded-widget` |
| Boutons              | 8px   | `rounded-btn`    |
| Pills (tabs, badges) | 999px | `rounded-full`   |
| Inputs               | 8px   | `rounded-input`  |
| Modals               | 20px  | `rounded-modal`  |

### 6.2 Ombres & Profondeur

**Le système dark n'utilise pas le neumorphisme** (invalide sur fond sombre). La profondeur est créée par la différenciation des niveaux de fond et les bordures subtiles.

```css
/* Card standard */
background: #1c1c1c;
border: 1px solid #2a2a2a;

/* Card elevated (modal, dropdown) */
background: #252525;
border: 1px solid #333333;
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);

/* Focus ring */
box-shadow: 0 0 0 2px rgba(217, 242, 32, 0.4);

/* Accent glow (bouton primaire actif) */
box-shadow: 0 4px 16px rgba(217, 242, 32, 0.25);
```

### 6.3 Règles de profondeur

| Niveau | Fond | Bordure | Usage |
|--------|------|---------|-------|
| 0 — Global | `#F0EFE7` | — | Body, layout (crème chaud) |
| 1 — Surface | `#D8D7CE` | `#BCBCB8` | Cards, panels principaux |
| 2 — Hover / alt | `#E2E1D9` | `#BCBCB8` | Sub-items, hover, inputs inactifs |
| 3 — Puits / focus | `#FEFEFE` | `#111111` (focus only) | Inputs actifs, modals, zones de lecture |
| 4 — Dark (autorité) | `#343434` | — | Top bar, panels navigation, états sombres |

---

## 7. Composants UI

### 7.1 Boutons

#### Bouton Primaire (CTA principal)

```css
/* Fond : jaune acide sur dark — contraste maximal */
background: #FCF76E;
color: #1A1A1A;
font-weight: 600;
font-size: 13px;
padding: 8px 16px;
border-radius: 8px;
border: none;
transition: opacity 150ms, transform 80ms;

/* Hover */
opacity: 0.88;

/* Active */
transform: scale(0.98);
```

#### Bouton Secondaire

```css
/* Surface grise — visible sur fond crème sans agresser */
background: #D8D7CE;
color: #1A1A1A;
font-weight: 500;
font-size: 13px;
padding: 8px 16px;
border-radius: 8px;
border: 1px solid #BCBCB8;
transition: background 150ms, border-color 150ms;

/* Hover */
background: #E2E1D9;
border-color: #8A8A85;
```

#### Bouton Autorité / Statut (validation d'étape)

```css
/* Noir sur fond clair — marque l'autorité sans jaune */
background: #343434;
color: #FEFEFE;
font-weight: 600;
font-size: 13px;
padding: 8px 16px;
border-radius: 8px;
border: none;
transition: opacity 150ms;

/* Hover */
opacity: 0.88;
```

#### Bouton Ghost / Destructif

```css
background: transparent;
color: #ef4444;
border: 1px solid #ef4444;
/* usage : actions destructives uniquement */
```

### 7.2 Inputs & Formulaires

```css
/* Input inactif */
background: #E2E1D9;
border: 1px solid #BCBCB8;
color: #1A1A1A;
font-size: 13px;
padding: 8px 12px;
border-radius: 8px;
placeholder-color: #8A8A85;
transition: background 150ms, border-color 150ms;

/* Input focus (puits) */
background: #FEFEFE;
border-color: #111111;
outline: none;
box-shadow: none;
```

### 7.3 Cards & Panels

```tsx
// Card standard
<div className="bg-surface border border-subtle rounded-card p-4">
  {/* contenu */}
</div>

// Card avec header
<div className="bg-surface border border-subtle rounded-card overflow-hidden">
  <div className="px-4 py-3 border-b border-subtle flex items-center justify-between">
    <span className="text-sm font-medium text-primary">Titre</span>
    <button className="text-muted hover:text-primary">...</button>
  </div>
  <div className="p-4">
    {/* contenu */}
  </div>
</div>
```

### 7.4 Navigation Tabs (Pills) — Top Bar

Navigation dans la top bar dark — pills sur fond `#343434`, actif en jaune acide.

```tsx
// Dans la top bar (#343434)
<nav className="flex items-center gap-1 h-full px-2">
  {tabs.map((tab) => (
    <button
      key={tab}
      className={cn(
        "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
        active === tab
          ? "bg-accent text-[#1A1A1A]"           // #FCF76E + noir
          : "text-[#FEFEFE] hover:bg-white/10"    // blanc sur dark
      )}
    >
      {tab}
    </button>
  ))}
</nav>

// Tabs secondaires dans le contenu (fond crème)
<div className="flex gap-0 border-b border-subtle">
  {tabs.map((tab) => (
    <button
      key={tab}
      className={cn(
        "px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
        active === tab
          ? "border-[#1A1A1A] text-primary"
          : "border-transparent text-muted hover:text-primary hover:border-subtle"
      )}
    >
      {tab}
    </button>
  ))}
</div>
```

### 7.5 Tableaux & Listes denses

```css
/* Table — fond crème, données sombres */
background: #F0EFE7;

/* Table row */
height: 40px;
border-bottom: 1px solid #BCBCB8;
transition: background 80ms;

/* Hover */
background: #E2E1D9;

/* Selected */
background: rgba(252, 247, 110, 0.12);
border-left: 2px solid #FCF76E;
```

### 7.6 Badges & Statuts

```tsx
// Badge générique (fond crème)
<span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium
                 bg-surface-alt text-primary border border-subtle">
  Label
</span>

// Badge succès
<span className="... bg-green-50 text-green-700 border border-green-200">Actif</span>

// Badge danger
<span className="... bg-red-50 text-red-600 border border-red-200">Inactif</span>

// Badge accent (valeur importante — PRIORITY)
<span className="... bg-accent text-[#1A1A1A] border-0 font-semibold">PRIORITY</span>

// Badge autorité (Contacted — étape validée)
<span className="... bg-[#343434] text-[#FEFEFE] border-0 font-medium">Contacted</span>
```

### 7.7 Modals de Confirmation

**Jamais de `confirm()` natif.** Toujours un modal branded.

```tsx
{
  confirmTarget && (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-raised border border-active rounded-modal shadow-[0_24px_64px_rgba(0,0,0,0.8)] p-6 w-full max-w-sm">
        <h3 className="font-medium text-primary text-base mb-2">
          Titre de l'action ?
        </h3>
        <p className="text-sm text-secondary mb-5">
          Description de ce qui va se passer.{" "}
          <span className="text-primary font-medium">
            "{confirmTarget.name}"
          </span>{" "}
          sera supprimé.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setConfirmTarget(null)}
            className="flex-1 py-2.5 rounded-btn bg-surface-alt border border-subtle text-sm text-secondary hover:text-primary transition-colors font-medium"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-btn bg-danger text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? "Suppression…" : "Supprimer"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 7.8 Navigation — Top Bar (remplace la sidebar)

> **Il n'y a pas de sidebar verticale dans STRYVR.** La navigation est intégralement horizontale dans la top bar `#343434`. Voir section 5.2 pour l'implémentation complète.

La navigation suit ce modèle :

```
[Logo pill] | Home  Opport.  [Leads ▼]  Tasks  ...  | [🔍] [🔔] [avatar]
                              ↑ pill #FCF76E actif
```

**Anti-patterns à bannir :**
- Sidebar verticale avec icônes
- Navigation en bas de page sur desktop (réservée à la PWA mobile client)
- Breadcrumb comme seul repère de navigation (toujours doublé par le tab actif en top bar)

**Pour la PWA mobile client uniquement :**

```tsx
// Bottom nav mobile — remplace la top bar sur < md
<nav className="fixed bottom-0 inset-x-0 h-[68px] bg-dark border-t border-white/10
                flex items-center justify-around px-2 pb-safe">
  {navItems.map(item => {
    const isActive = pathname.startsWith(item.href)
    return (
      <Link key={item.href} href={item.href}
        className="flex flex-col items-center gap-1 py-2 px-3">
        <item.icon size={22}
          className={isActive ? "text-accent" : "text-white/40"}
          strokeWidth={isActive ? 2 : 1.5} />
        <span className={cn("text-[10px] font-medium",
          isActive ? "text-accent" : "text-white/40")}>
          {item.label}
        </span>
      </Link>
    )
  })}
</nav>
```

---

## 8. Données & Visualisations

### 8.1 Typographie des données

| Donnée            | Style                                          |
| ----------------- | ---------------------------------------------- |
| KPI principal     | 28–36px, Weight 600, `text-primary`            |
| Unité KPI         | 14px, Weight 400, `text-secondary`             |
| Delta / variation | 12px, avec couleur sémantique (success/danger) |
| Valeur tableau    | 13px, Weight 500, font-mono, `text-primary`    |
| Label tableau     | 12px, Weight 400, `text-secondary`             |

### 8.2 Charts (Recharts)

```javascript
// Palette chart — système light crème
const CHART_COLORS = {
  primary: '#1A1A1A',              // série principale — noir sur crème
  accent: '#FCF76E',               // highlight accent jaune
  secondary: '#535353',            // série secondaire — gris moyen
  tertiary: '#DEDEDE',             // données froides / neutres
  area: 'rgba(26, 26, 26, 0.06)', // fill area très subtil
  grid: '#BCBCB8',                 // grid lines discrets
  axis: '#8A8A85',                 // labels d'axe muted
}

// Style général Recharts (fond crème)
<CartesianGrid stroke="#BCBCB8" strokeDasharray="4 4" />
<XAxis stroke="#BCBCB8" tick={{ fill: '#8A8A85', fontSize: 11 }} />
<YAxis stroke="#BCBCB8" tick={{ fill: '#8A8A85', fontSize: 11 }} />
<Tooltip
  contentStyle={{
    background: '#FEFEFE',
    border: '1px solid #BCBCB8',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#1A1A1A',
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
  }}
/>
```

---

## 9. Configuration Technique — Tailwind

Le `tailwind.config.ts` doit impérativement refléter ce système :

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── Surfaces (light crème) ──────────────────
        background: "#F0EFE7",        // fond global — crème chaud
        surface: "#D8D7CE",           // cards / panels principaux
        "surface-alt": "#E2E1D9",     // hover, inputs inactifs
        "surface-raised": "#FEFEFE",  // inputs actifs, modals, puits
        dark: "#343434",              // top bar, zones d'autorité

        // ── Bordures ────────────────────────────────
        subtle: "#BCBCB8",            // séparateurs, bordures cards
        active: "#111111",            // focus champ sélectionné

        // ── Accent ──────────────────────────────────
        accent: "#FCF76E",            // jaune acide — CTA, tab actif
        "accent-hover": "#EDE45A",    // jaune légèrement plus soutenu
        "accent-info": "#DEDEDE",     // données froides, graphiques neutres
        "accent-hover-light": "#F2F2F2", // hover ultra-subtil sur blanc

        // ── Textes ──────────────────────────────────
        primary: "#1A1A1A",           // titres, texte principal (sur clair)
        "on-dark": "#FEFEFE",         // texte sur zones #343434
        secondary: "#535353",         // descriptions dans zones sombres
        muted: "#8A8A85",             // labels, meta, placeholders
        disabled: "#BCBCB8",          // éléments désactivés

        // ── Sémantiques ─────────────────────────────
        success: "#22c55e",
        danger: "#ef4444",
        warning: "#f59e0b",
      },
      borderColor: {
        subtle: "#BCBCB8",
        active: "#111111",
      },
      borderRadius: {
        card: "16px",
        widget: "12px",
        btn: "8px",
        input: "8px",
        modal: "20px",
      },
      fontFamily: {
        sans: ["SP Pro Display", "Inter", "Helvetica Neue", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      fontSize: {
        "2xs": ["11px", { lineHeight: "1.4", letterSpacing: "0.02em" }],
        xs: ["12px", { lineHeight: "1.5", letterSpacing: "0em" }],
        sm: ["13px", { lineHeight: "1.5", letterSpacing: "-0.01em" }],
        base: ["14px", { lineHeight: "1.6", letterSpacing: "-0.01em" }],
        lg: ["16px", { lineHeight: "1.4", letterSpacing: "-0.01em" }],
        xl: ["18px", { lineHeight: "1.3", letterSpacing: "-0.02em" }],
        "2xl": ["24px", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
      },
      boxShadow: {
        card: "0 1px 4px rgba(0, 0, 0, 0.06)",
        elevated: "0 4px 16px rgba(0, 0, 0, 0.10)",
        modal: "0 8px 32px rgba(0, 0, 0, 0.14)",
        "focus-field": "none",  // pas de ring — border #111 suffit
        "glow-accent": "0 2px 12px rgba(252, 247, 110, 0.40)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { opacity: "0", transform: "translateX(8px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 150ms ease-out",
        "slide-in": "slide-in 150ms ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## 10. CSS Global (globals.css)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ── Font ────────────────────────────────────────── */
@font-face {
  font-family: "SP Pro Display";
  src: url("/fonts/SPProDisplay-Light.woff2") format("woff2");
  font-weight: 300;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "SP Pro Display";
  src: url("/fonts/SPProDisplay-Regular.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "SP Pro Display";
  src: url("/fonts/SPProDisplay-Medium.woff2") format("woff2");
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "SP Pro Display";
  src: url("/fonts/SPProDisplay-SemiBold.woff2") format("woff2");
  font-weight: 600;
  font-style: normal;
  font-display: swap;
}

/* ── Base ────────────────────────────────────────── */
*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

/* ── Variables CSS ───────────────────────────────── */
:root {
  --background:      #F0EFE7;
  --surface:         #D8D7CE;
  --surface-alt:     #E2E1D9;
  --surface-raised:  #FEFEFE;
  --dark:            #343434;
  --border-subtle:   #BCBCB8;
  --border-active:   #111111;
  --accent:          #FCF76E;
  --accent-rgb:      252, 247, 110;
  --text-primary:    #1A1A1A;
  --text-on-dark:    #FEFEFE;
  --text-secondary:  #535353;
  --text-muted:      #8A8A85;
}

body {
  background-color: #F0EFE7;
  color: #1A1A1A;
  font-family: "SP Pro Display", "Inter", sans-serif;
  font-size: 14px;
  line-height: 1.6;
  letter-spacing: -0.01em;
}

/* ── Scrollbar ───────────────────────────────────── */
::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #BCBCB8;
  border-radius: 999px;
}
::-webkit-scrollbar-thumb:hover {
  background: #8A8A85;
}

/* ── Selection ───────────────────────────────────── */
::selection {
  background: rgba(252, 247, 110, 0.35);
  color: #1A1A1A;
}

/* ── Focus visible ───────────────────────────────── */
:focus-visible {
  outline: none;
  /* Les inputs utilisent border #111 — pas de ring global */
}
```

---

## 11. Animations & Micro-interactions

### Principes

- Durée max : **200ms** pour les transitions d'état
- Durée max : **300ms** pour les apparitions/disparitions
- Easing : `ease-out` pour les entrées, `ease-in` pour les sorties
- Pas d'animation décorative — chaque animation a une fonction (feedback, guidage de l'attention)

### Catalogue

| Interaction      | Animation                      | Durée |
| ---------------- | ------------------------------ | ----- |
| Hover button     | `opacity: 0.92`                | 100ms |
| Active button    | `scale(0.98)`                  | 80ms  |
| Tab switch       | `background` color             | 150ms |
| Row hover        | `background` color             | 80ms  |
| Card apparition  | `fade-in` (translateY 4px → 0) | 150ms |
| Modal open       | `fade-in` + `scale(0.98 → 1)`  | 200ms |
| Sidebar collapse | `width` transition             | 200ms |
| Dropdown open    | `slide-in`                     | 150ms |

### Ce qui est interdit

- Animations de rotation décoratives
- Transitions > 300ms (perçu comme lent)
- Parallax ou scroll-driven effects dans l'interface fonctionnelle
- Skeleton loaders animés complexes (simple `bg-surface-alt` suffit)

---

## 12. Architecture des Pages Clés STRYVR

> Chaque type de page a une **structure fixe et reproductible**. Un développeur ou designer doit pouvoir reconstruire l'écran sans voir de maquette, à partir de ces règles seules.

### 12.1 Page — Liste Clients / Leads

```
[TOP BAR] [SOUS-NAV optionnelle avec filtres]
[CONTENT : fond #F0EFE7]
  [Page header : titre + compteur + bouton CTA jaune à droite]
  [Barre filtres / recherche]
  [Table dense pleine largeur]
    [Row = avatar + nom + badge statut + données + actions]
  [Pagination]
```

**Règles spécifiques :**
- Titre de page : `text-2xl font-semibold text-primary` — jamais de subtitle
- Bouton "Nouveau client" : `bg-accent text-[#1A1A1A]` — toujours à droite
- Barre filtres : fond `bg-surface` `rounded-card` padding 12px — inline avec la table
- Table : pleine largeur, row height 40px, hover `bg-surface-alt`, selected `bg-accent/8 border-l-2 border-accent`
- Colonne nom : avatar 28px + `text-sm font-medium text-primary`
- Données : `text-sm text-primary` pour les valeurs, `text-xs text-muted` pour les labels
- Actions row : icônes apparaissent au hover (`group-hover`) — jamais visibles en permanence

### 12.2 Page — Dossier Client (vue détail)

```
[TOP BAR]
[SOUS-NAV stepper : Contacted → Nurturing → Unqualified → Connected | Next →]
[CONTENT : fond #F0EFE7]
  [Page Header : avatar + nom + infos de contact + boutons Clone/Edit/Delete]
  ─────────────────────────────────────────────────
  [COL PRINCIPALE flex-1]    │  [DARK PANEL w-96]
  ─────────────────────────  │  ────────────────────
  [Card : champs éditables]  │  [Doublons / suggestions]
  [Card : historique activ.] │  [Card duplicate 1]
  [Card : data KPI]          │  [Card duplicate 2]
```

**Règles spécifiques :**
- Le stepper de sous-nav reflète le statut CRM du client — jamais statique
- Col principale : `flex-1 p-6 space-y-4 overflow-y-auto`
- Dark panel : `w-96 bg-dark shrink-0 overflow-y-auto` — scrolle indépendamment
- Cards dans col principale : fond `bg-surface` border `border-subtle` `rounded-card`
- Cards dans dark panel : fond `bg-dark`, séparateurs `border-white/10`
- Champs éditables : Pattern A (label 11px uppercase + valeur 14px + crayon hover)
- Data KPI : Pattern C (grande valeur + label + mini chart `#DEDEDE`)
- Historique : Pattern D (icône + label + timestamp muted)

### 12.3 Page — Dashboard Performance Coach

```
[TOP BAR]
[CONTENT : fond #F0EFE7]
  [Page Header : "Dashboard" + sélecteur période à droite]
  [Grid 4 colonnes : cards KPI]
    [KPI card : valeur 32px + label + delta %]
  [Grid 2 colonnes]
    [Card area chart — évolution volume]
    [Card radar chart — muscles]
  [Card full width : progression exercices]
```

**Règles spécifiques :**
- KPI cards : fond `bg-surface-raised (#FEFEFE)` pour les faire ressortir sur crème
- Valeur KPI : `text-[32px] font-semibold text-primary leading-none`
- Delta positif : `text-success` — delta négatif : `text-danger`
- Charts : palette définie section 8.2 (noir + accent jaune + gris)
- Grid KPIs : `grid-cols-4 gap-4` sur desktop, `grid-cols-2` sur tablette

### 12.4 Page — Éditeur Programme (coach)

```
[TOP BAR]
[SOUS-NAV tabs : Aperçu | Séances | Exercices | Allocations]
[CONTENT : fond #F0EFE7]
  [Header : nom programme + statut badge + actions]
  [Grid 3 colonnes]
    [COL config semaine]
    [COL séances drag & drop]
    [COL détail exercice sélectionné]
```

**Règles spécifiques :**
- Séances : cards `bg-surface` draggables — drag indicator `border-l-2 border-accent`
- Exercice sélectionné : ouvre dans col 3 (jamais modal) — fond `bg-surface`
- Bouton "Générer programme" : `bg-accent text-[#1A1A1A]` prominent — dans le header

### 12.5 Page — Builder Check-in

```
[TOP BAR]
[SOUS-NAV stepper 4 étapes : Template | Config | Mode | Lancement]
[CONTENT : fond #F0EFE7]
  [Stepper visuel horizontal dans le content — état en cours]
  [Card étape active — formulaire de configuration]
  [Footer fixe : Précédent | Suivant / Lancer]
```

**Règles spécifiques :**
- Le stepper dans la sous-nav `#343434` est la source de vérité visuelle de progression
- Le contenu de chaque étape est dans une seule card centrée (max-width 640px) — pas de split
- Footer fixe : `h-14 bg-[#F0EFE7] border-t border-subtle flex items-center justify-between px-6`
- Bouton "Lancer" : `bg-accent text-[#1A1A1A]` — jamais `bg-dark`

### 12.6 Page — Runner Check-in (client, public)

```
[TOP BAR minimaliste : logo + titre bilan]
[CONTENT : fond #F0EFE7]
  [Progress bar fine accent en haut]
  [Question courante — card centrée max-w-lg]
  [Widget de réponse]
  [Navigation : Précédent | Suivant]
```

**Règles spécifiques :**
- Pas de sous-nav — le runner est séquentiel, pas tabulaire
- Progress bar : `h-1 bg-accent` en haut du content, largeur = `(step/total * 100)%`
- Cards question : fond `bg-surface-raised (#FEFEFE)` — "puits" de concentration
- SCALE widget : dots ronds, actif en `bg-accent text-[#1A1A1A]`
- Pas d'action visible sauf "Précédent" et "Suivant"

---

## 12b. Règles Composants Spécifiques STRYVR

### 12b.1 Dashboard Performance Coach (composants)

- KPIs en cards individuelles : fond `bg-surface`, valeur large, delta coloré
- Area chart : fill `accent/8`, stroke `accent`, grid `#1f1f1f`
- Radar chart muscles : stroke `accent`, fill `accent/10`, gridlines `#2a2a2a`

### 12.2 Client Mini-App (PWA)

L'app client utilise le **même système dark** mais avec une densité réduite et des éléments plus grands (touch-first).

| Différence    | Règle                        |
| ------------- | ---------------------------- |
| Taille texte  | +2px partout vs dashboard    |
| Touch targets | min 44×44px                  |
| Bottom nav    | 60px hauteur, icons 22px     |
| Cards         | padding 20px (vs 16px coach) |

### 12.3 Log de Séance

- Chronomètre : affichage `font-mono`, très grand (32px), `text-accent`
- Sets complétés : icône check `text-accent`
- Sets restants : `text-muted`
- Poids / reps : `font-mono text-primary font-medium`

### 12.4 Check-in / Bilan

- Scores 0–100 : progress bars fines (4px), couleur selon score (danger/warning/success)
- SCALE widget : dots ou slider avec accent jaune
- Photos : aspect-ratio 3/4, rounded-card, border subtle

---

## 13. Ce qui Change vs v1 (Migration)

| Élément v1 | Élément v2.1 | Action |
|------------|-------------|--------|
| Light mode `#ededed` (neumorphique) | Light crème `#F0EFE7` (chaud, premium) | Remplacer tout |
| Accent vert `#0e8c5b` | Accent jaune acide `#FCF76E` | Remplacer tout |
| Neumorphisme — `shadow-soft-out/in` | Bordures subtiles `#BCBCB8` | Supprimer box-shadows soft |
| Police Lufga | SP Pro Display | Remplacer |
| `rounded-card: 24px` | `rounded-card: 16px` | Ajuster |
| `bg-background: #ededed` | `bg-background: #F0EFE7` | Remplacer |
| Boutons vert glow | Boutons `#FCF76E` + `text-[#1A1A1A]` | Remplacer |
| `text-primary: #1f1f1f` sur clair | `text-primary: #1A1A1A` sur clair | Affiner hex |
| Pas de zone dark en v1 | `bg-dark: #343434` pour top bar et zones d'autorité | Ajouter |
| `bg-surface-raised` dark pour modals | `bg-surface-raised: #FEFEFE` blanc pur pour modals | Inverser |
| Texte clair `#f0f0f0` global | Texte sombre `#1A1A1A` global (sauf zones `bg-dark`) | Inverser |

---

## 14. États UI — Loading, Erreur, Empty

### 14.1 États de chargement (Skeleton)

Pas de spinners animés complexes dans les listes denses. Le skeleton est une surface statique légèrement plus claire que le fond.

```tsx
// Skeleton ligne
<div className="h-4 bg-surface-alt rounded-full animate-pulse" style={{ width: '60%' }} />

// Skeleton card
<div className="bg-surface border border-subtle rounded-card p-4 space-y-3">
  <div className="h-3 bg-surface-alt rounded-full w-1/3 animate-pulse" />
  <div className="h-3 bg-surface-alt rounded-full w-2/3 animate-pulse" />
  <div className="h-3 bg-surface-alt rounded-full w-1/2 animate-pulse" />
</div>
```

```css
/* Couleur pulse override — dark mode */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}
```

### 14.2 États d'erreur

```tsx
// Erreur inline (champ formulaire)
<p className="text-xs text-danger mt-1 flex items-center gap-1">
  <AlertCircle size={12} />
  Message d'erreur explicite
</p>

// Banner erreur (top de section)
<div className="flex items-start gap-3 p-3 rounded-widget bg-red-950/40 border border-red-900/50 text-sm text-red-400">
  <AlertCircle size={14} className="shrink-0 mt-0.5" />
  <span>Description de l'erreur et action corrective possible.</span>
</div>

// État erreur page entière (data fetch fail)
<div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
  <div className="w-10 h-10 rounded-widget bg-surface-alt flex items-center justify-center text-danger">
    <AlertCircle size={18} />
  </div>
  <p className="text-sm text-secondary">Impossible de charger les données.</p>
  <button className="text-xs text-accent hover:underline">Réessayer</button>
</div>
```

### 14.3 Empty States

Les empty states doivent être **utiles, pas décoratifs**. Pas d'illustration. Une icône, un message, une action.

```tsx
// Empty state standard
<div className="flex flex-col items-center justify-center py-16 gap-4">
  <div className="w-12 h-12 rounded-card bg-surface-alt flex items-center justify-center">
    <[ContextIcon] size={20} className="text-muted" />
  </div>
  <div className="text-center space-y-1">
    <p className="text-sm font-medium text-primary">Aucun [élément] pour l'instant</p>
    <p className="text-xs text-secondary">Créez votre premier [élément] pour commencer.</p>
  </div>
  <button className="px-4 py-2 rounded-btn bg-accent text-[#141414] text-sm font-semibold">
    Créer un [élément]
  </button>
</div>

// Empty state compact (dans une card)
<div className="flex items-center gap-3 py-6 px-4 text-secondary">
  <[ContextIcon] size={16} className="text-muted shrink-0" />
  <span className="text-sm">Aucun résultat. <button className="text-accent hover:underline">Ajouter</button></span>
</div>
```

---

## 15. Formulaires — Patterns Complets

### 15.1 Anatomy d'un formulaire STRYVR

```tsx
// Groupe de champ standard
<div className="space-y-1.5">
  <label className="text-xs text-secondary font-medium">
    Label du champ
    {required && <span className="text-danger ml-0.5">*</span>}
  </label>
  <input
    className="w-full bg-surface border border-subtle rounded-input px-3 py-2 text-sm text-primary placeholder:text-muted
               focus:border-accent/50 focus:ring-0 focus:outline-none
               transition-colors duration-150
               disabled:opacity-40 disabled:cursor-not-allowed"
    placeholder="Placeholder…"
  />
  {error && (
    <p className="text-2xs text-danger flex items-center gap-1">
      <AlertCircle size={10} />
      {error}
    </p>
  )}
  {hint && !error && <p className="text-2xs text-muted">{hint}</p>}
</div>
```

### 15.2 Select

```tsx
<select
  className="w-full bg-surface border border-subtle rounded-input px-3 py-2 text-sm text-primary
                   focus:border-accent/50 focus:outline-none
                   appearance-none cursor-pointer"
>
  <option value="" className="bg-surface-raised">
    Choisir…
  </option>
</select>
```

### 15.3 Textarea

```tsx
<textarea
  rows={4}
  className="w-full bg-surface border border-subtle rounded-input px-3 py-2 text-sm text-primary
             placeholder:text-muted resize-none
             focus:border-accent/50 focus:outline-none
             transition-colors"
/>
```

### 15.4 Checkbox & Toggle

```tsx
// Toggle (switch)
// État ON : bg-accent, État OFF : bg-surface-alt border border-subtle
<button
  role="switch"
  aria-checked={checked}
  className={cn(
    "relative w-9 h-5 rounded-full transition-colors duration-200",
    checked ? "bg-accent" : "bg-surface-alt border border-subtle"
  )}
>
  <span className={cn(
    "absolute top-0.5 w-4 h-4 rounded-full transition-transform duration-200",
    checked
      ? "translate-x-4 bg-[#141414]"
      : "translate-x-0.5 bg-muted"
  )} />
</button>

// Checkbox
<div className={cn(
  "w-4 h-4 rounded flex items-center justify-center border transition-colors",
  checked
    ? "bg-accent border-accent"
    : "bg-surface border-subtle"
)}>
  {checked && <Check size={10} strokeWidth={3} className="text-[#141414]" />}
</div>
```

### 15.5 Section de formulaire (group)

```tsx
<section className="space-y-4">
  <div className="flex items-center gap-2 pb-3 border-b border-subtle">
    <[SectionIcon] size={14} className="text-muted" />
    <h3 className="text-sm font-medium text-primary">Titre de section</h3>
  </div>
  <div className="grid grid-cols-2 gap-4">
    {/* champs */}
  </div>
</section>
```

---

## 16. Navigation & Routing Patterns

### 16.1 Breadcrumb

```tsx
<nav className="flex items-center gap-1.5 text-xs text-muted">
  <Link href="/coach" className="hover:text-secondary transition-colors">
    Dashboard
  </Link>
  <ChevronRight size={12} className="text-disabled" />
  <Link
    href="/coach/clients"
    className="hover:text-secondary transition-colors"
  >
    Clients
  </Link>
  <ChevronRight size={12} className="text-disabled" />
  <span className="text-secondary font-medium">Marie Dupont</span>
</nav>
```

### 16.2 Page Header

```tsx
<header className="flex items-start justify-between mb-6">
  <div className="space-y-1">
    <nav>{/* breadcrumb */}</nav>
    <h1 className="text-2xl font-medium text-primary tracking-tight">
      Titre de page
    </h1>
    <p className="text-sm text-secondary">
      Sous-titre ou description contextuelle.
    </p>
  </div>
  <div className="flex items-center gap-2">
    {/* actions principales */}
    <button className="px-4 py-2 rounded-btn bg-accent text-[#141414] text-sm font-semibold shadow-glow-accent">
      Action primaire
    </button>
  </div>
</header>
```

### 16.3 Onglets Dossier Client (8 onglets)

Référence : les onglets dossier sont en **pills horizontaux scrollables** — même pattern que les images de référence.

```tsx
// Container tabs dossier
<div className="flex items-center gap-1 overflow-x-auto scrollbar-none border-b border-subtle pb-0 mb-6">
  {tabs.map((tab) => (
    <button
      key={tab.id}
      onClick={() => setActive(tab.id)}
      className={cn(
        "shrink-0 px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
        active === tab.id
          ? "text-accent border-accent"
          : "text-secondary border-transparent hover:text-primary hover:border-subtle",
      )}
    >
      {tab.label}
    </button>
  ))}
</div>
```

---

## 17. Responsive & Mobile (Client Mini-App)

### 17.1 Breakpoints

| Breakpoint | Largeur | Usage                           |
| ---------- | ------- | ------------------------------- |
| `sm`       | 640px   | —                               |
| `md`       | 768px   | Tablette (coach en déplacement) |
| `lg`       | 1024px  | Laptop (coach dashboard)        |
| `xl`       | 1280px  | Desktop (coach workstation)     |

Le **dashboard coach** est conçu pour `lg` et `xl`.
La **mini-app client** est conçue pour mobile (`< md`) en priorité.

### 17.2 Layout Mobile (PWA client)

```tsx
// Shell PWA
<div className="flex flex-col h-dvh bg-background">
  {/* Contenu scrollable */}
  <main className="flex-1 overflow-y-auto pb-[72px]">{children}</main>

  {/* Bottom navigation fixe */}
  <nav
    className="fixed bottom-0 inset-x-0 h-[68px] bg-surface border-t border-subtle
                  flex items-center justify-around px-2 pb-safe"
  >
    {navItems.map((item) => {
      const isActive = pathname.startsWith(item.href);
      return (
        <Link
          key={item.href}
          href={item.href}
          className="flex flex-col items-center gap-1 py-2 px-3"
        >
          <item.icon
            size={22}
            className={isActive ? "text-accent" : "text-muted"}
            strokeWidth={isActive ? 2 : 1.5}
          />
          <span
            className={cn(
              "text-[10px] font-medium",
              isActive ? "text-accent" : "text-muted",
            )}
          >
            {item.label}
          </span>
        </Link>
      );
    })}
  </nav>
</div>
```

### 17.3 Cards Mobile

```tsx
// Card mobile (padding plus grand, touch-friendly)
<div className="bg-surface border border-subtle rounded-card p-5 space-y-4">
  {/* contenu */}
</div>

// List item mobile (hauteur min 56px)
<div className="flex items-center gap-3 px-4 py-4 border-b border-subtle min-h-[56px]">
  <div className="w-10 h-10 rounded-widget bg-surface-alt flex items-center justify-center shrink-0">
    <[Icon] size={18} className="text-secondary" />
  </div>
  <div className="flex-1 min-w-0">
    <p className="text-sm font-medium text-primary truncate">Titre</p>
    <p className="text-xs text-secondary">Sous-titre</p>
  </div>
  <ChevronRight size={16} className="text-muted shrink-0" />
</div>
```

---

## 18. Patterns Spécifiques — Log de Séance

Le log de séance est l'écran le plus utilisé côté client. La lisibilité sous effort physique est critique.

### 18.1 Chronomètre de repos

```tsx
// Timer — fond sombre, chiffres très grands, accent jaune
<div className="flex flex-col items-center gap-2 py-8">
  <span className="text-xs text-secondary uppercase tracking-widest">
    Repos
  </span>
  <span className="text-[64px] font-mono font-medium text-accent leading-none tabular-nums">
    {formatTime(remaining)}
  </span>
  <div className="w-48 h-1 bg-surface-alt rounded-full overflow-hidden">
    <div
      className="h-full bg-accent rounded-full transition-all duration-1000"
      style={{ width: `${(remaining / total) * 100}%` }}
    />
  </div>
</div>
```

### 18.2 Ligne de set

```tsx
// Set row — données très lisibles, actions accessibles
<div
  className={cn(
    "flex items-center gap-3 px-4 py-3 rounded-widget transition-colors",
    set.completed ? "bg-surface-alt" : "bg-surface",
  )}
>
  {/* Numéro set */}
  <span className="w-6 text-xs text-muted font-mono shrink-0">
    {set.number}
  </span>

  {/* Poids */}
  <div className="flex-1">
    <input
      type="number"
      className="w-full bg-transparent text-lg font-mono font-medium text-primary text-center
                 border-b border-subtle focus:border-accent outline-none pb-0.5"
      placeholder="–"
    />
    <span className="block text-[10px] text-muted text-center">kg</span>
  </div>

  {/* Reps */}
  <div className="flex-1">
    <input
      type="number"
      className="w-full bg-transparent text-lg font-mono font-medium text-primary text-center
                 border-b border-subtle focus:border-accent outline-none pb-0.5"
      placeholder="–"
    />
    <span className="block text-[10px] text-muted text-center">reps</span>
  </div>

  {/* RPE */}
  <div className="flex-1">
    <input
      type="number"
      min={1}
      max={10}
      step={0.5}
      className="w-full bg-transparent text-lg font-mono font-medium text-primary text-center
                 border-b border-subtle focus:border-accent outline-none pb-0.5"
      placeholder="–"
    />
    <span className="block text-[10px] text-muted text-center">RPE</span>
  </div>

  {/* Check */}
  <button
    onClick={() => markComplete(set.id)}
    className={cn(
      "w-8 h-8 rounded-widget flex items-center justify-center transition-all shrink-0",
      set.completed
        ? "bg-accent text-[#141414]"
        : "bg-surface-alt border border-subtle text-muted hover:text-primary",
    )}
  >
    <Check size={14} strokeWidth={2.5} />
  </button>
</div>
```

---

## 19. Patterns Spécifiques — Check-in / Bilan

### 19.1 Score KPI bar

```tsx
// Score domain (0–100) avec gradient sémantique
<div className="space-y-1.5">
  <div className="flex items-center justify-between">
    <span className="text-xs text-secondary">{label}</span>
    <span className={cn("text-xs font-mono font-medium", scoreColor(value))}>
      {value}/100
    </span>
  </div>
  <div className="h-1 bg-surface-alt rounded-full overflow-hidden">
    <div
      className={cn(
        "h-full rounded-full transition-all duration-500",
        scoreBarColor(value),
      )}
      style={{ width: `${value}%` }}
    />
  </div>
</div>;

// Helpers couleur
function scoreColor(v: number) {
  if (v >= 75) return "text-success";
  if (v >= 50) return "text-warning";
  return "text-danger";
}
function scoreBarColor(v: number) {
  if (v >= 75) return "bg-success";
  if (v >= 50) return "bg-warning";
  return "bg-danger";
}
```

### 19.2 SCALE widget (1–10)

```tsx
// Dots cliquables — lisible, rapide, touch-friendly
<div className="flex items-center gap-2">
  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
    <button
      key={n}
      onClick={() => setValue(n)}
      className={cn(
        "w-7 h-7 rounded-full text-xs font-medium transition-all",
        value === n
          ? "bg-accent text-[#141414] shadow-glow-accent scale-110"
          : n < (value ?? 0)
            ? "bg-accent/20 text-accent"
            : "bg-surface-alt border border-subtle text-muted hover:border-active hover:text-primary",
      )}
    >
      {n}
    </button>
  ))}
</div>
```

---

## 20. Guide de Migration v1 → v2

### 20.1 Ordre d'exécution recommandé

```
Phase 1 — Tokens (1 jour)
  1. Mettre à jour tailwind.config.ts — nouveaux tokens couleur/radius/shadow
  2. Mettre à jour globals.css — dark base + font declarations
  3. Tester visuellement sur layout.tsx

Phase 2 — Layout Shell (1–2 jours)
  4. Refondre app/layout.tsx — bg-background dark
  5. Refondre sidebar + topbar nav — dark + accent jaune sur actif
  6. Vérifier les routes coach et client séparément

Phase 3 — Composants (2–3 jours)
  7. Boutons (primaire → jaune #D9F220 text dark, secondaire → dark border)
  8. Inputs (fond surface dark, focus accent jaune)
  9. Cards (fond surface dark, border subtle)
  10. Badges (fond dark translucide + couleurs sémantiques)
  11. Tables (rows dark, hover surface-alt, selected accent/6)
  12. Modals (fond raised dark, overlay black/60)

Phase 4 — Screens (3–5 jours)
  13. Dashboard coach — KPIs, charts (palette recharts)
  14. Dossier client — 8 onglets
  15. Éditeur programme
  16. Check-in builder + runner + analytics
  17. Log de séance (chrono + sets)
  18. Client mini-app PWA (bottom nav, home, programme, profil)

Phase 5 — Polish (1 jour)
  19. Vérification checklist qualité (section 14)
  20. Contraste WCAG AA sur tous les écrans critiques
  21. Scrollbars, sélection texte, focus rings
```

### 20.2 Rechercher / Remplacer — Find & Replace prioritaires

| Chercher (obsolète) | Remplacer (v2.1) | Fichiers |
|---------------------|------------------|---------|
| `#141414` `#1c1c1c` `#212121` `#252525` (fonds dark) | `#F0EFE7` / `#D8D7CE` / `#E2E1D9` / `#FEFEFE` | `**/*.tsx` `**/*.css` |
| `#D9F220` `#d9f220` `#f9f16b` (ancien jaune) | `#FCF76E` | `**/*.tsx` `**/*.css` |
| `#0e8c5b` (vert v1) | `#FCF76E` | `**/*.tsx` |
| `text-[#f0f0f0]` / texte clair sur dark | `text-primary` (`#1A1A1A`) sauf zones `bg-dark` | `**/*.tsx` |
| `bg-accent text-[#141414]` | `bg-accent text-[#1A1A1A]` | `**/*.tsx` |
| `rgba(217, 242, 32` (ancien accent) | `rgba(252, 247, 110` | `**/*.css` `**/*.tsx` |
| `shadow-soft-out` `shadow-soft-in` (neumorphisme v1) | `border border-subtle` | `**/*.tsx` |
| `#2a2a2a` `#3a3a3a` (bordures dark) | `#BCBCB8` | `**/*.tsx` `**/*.css` |
| `bg-surface-raised ... shadow-[0_24px_64px_rgba(0,0,0,0.8)]` | `bg-surface-raised ... shadow-modal` | `**/*.tsx` |

### 20.3 Variables CSS — globals.css (déjà intégrées section 10)

```css
:root {
  --background:      #F0EFE7;
  --surface:         #D8D7CE;
  --surface-alt:     #E2E1D9;
  --surface-raised:  #FEFEFE;
  --dark:            #343434;
  --border-subtle:   #BCBCB8;
  --border-active:   #111111;
  --accent:          #FCF76E;
  --accent-rgb:      252, 247, 110;
  --text-primary:    #1A1A1A;
  --text-on-dark:    #FEFEFE;
  --text-secondary:  #535353;
  --text-muted:      #8A8A85;
}
```

---

## 21. Accessibilité (A11y)

### Contrastes WCAG AA (minimum)

| Paire texte / fond | Ratio estimé | Statut |
|--------------------|-------------|--------|
| `#1A1A1A` sur `#F0EFE7` (body) | ~16:1 | ✅ AAA |
| `#1A1A1A` sur `#D8D7CE` (surface) | ~12:1 | ✅ AAA |
| `#1A1A1A` sur `#E2E1D9` (surface-alt) | ~13:1 | ✅ AAA |
| `#1A1A1A` sur `#FEFEFE` (puits) | ~18:1 | ✅ AAA |
| `#1A1A1A` sur `#FCF76E` (bouton CTA) | ~13:1 | ✅ AAA |
| `#FEFEFE` sur `#343434` (top bar) | ~11:1 | ✅ AAA |
| `#FCF76E` sur `#343434` (tab actif dark) | ~9.2:1 | ✅ AAA |
| `#535353` sur `#343434` (texte secondaire dark) | ~2.9:1 | ⚠️ AA Large only — réserver aux labels 16px+ |
| `#8A8A85` sur `#F0EFE7` (muted sur body) | ~3.8:1 | ⚠️ AA Large only — labels non-interactifs 14px+ |
| `#8A8A85` sur `#D8D7CE` (muted sur surface) | ~3.1:1 | ⚠️ Réserver aux placeholders uniquement |

> **Règle** : `text-muted` (`#8A8A85`) est réservé aux placeholders, libellés de champs, et captions. **Jamais** pour du texte interactif ou critique.
> `#535353` dans les zones dark : uniquement pour des informations secondaires de grande taille.

### Focus management

- Focus des inputs : `border-color: #111111` — pas de box-shadow ring
- Les modals trapent le focus (Radix Dialog gère ça nativement)
- Les dropdowns ferment avec `Escape`
- Les sidebars collapsibles maintiennent le focus sur l'élément déclencheur
- Keyboard nav visible : `outline: 2px solid #1A1A1A; outline-offset: 2px` sur les éléments non-input

### Aria

- Boutons sans texte visible : `aria-label` obligatoire
- Toggles : `role="switch"` + `aria-checked`
- Tabs : `role="tablist"` / `role="tab"` / `aria-selected`
- Loaders : `aria-busy="true"` sur le conteneur
- Badges statut : `aria-label` si la couleur seule porte l'information

---

## 22. Checklist Qualité Visuelle

Avant de livrer tout écran ou composant :

**Couleurs**

- [ ] Fond global est `#F0EFE7` (crème) — pas de `#ffffff` pur ni dark global
- [ ] Zones dark (`#343434`) uniquement pour top bar et panels d'autorité
- [ ] Seul accent chaud visible est `#FCF76E` (ou couleur sémantique justifiée)
- [ ] Aucun gradient dans les composants fonctionnels
- [ ] Bordures en `#BCBCB8` (clair) — jamais dark sur fond crème
- [ ] Boutons CTA : `bg-accent (#FCF76E) text-[#1A1A1A]` — jamais `text-white` sur jaune
- [ ] Hover states : `#E2E1D9` sur `#F0EFE7`, jamais couleur vive

**Typographie**

- [ ] Texte sombre `#1A1A1A` sur fond clair, `#FEFEFE` sur zones dark
- [ ] `text-muted (#8A8A85)` uniquement pour labels non-interactifs ≥ 14px
- [ ] Données numériques en `font-mono` ou SP Pro Medium avec unité
- [ ] Labels en 12px `text-muted` — pas en gras

**Spacing & Layout**

- [ ] Spacing sur grille 4px base
- [ ] Border-radius correspond au token (card=16px, widget=12px, btn=8px)
- [ ] Padding cards : 16px coach / 20px mobile client

**Interactions**

- [ ] États hover/focus/active implémentés sur tous les éléments interactifs
- [ ] Focus input : `border-color: #111111`, pas de ring jaune
- [ ] Boutons désactivés : `opacity-40 cursor-not-allowed`
- [ ] Loading states sur toutes les actions asynchrones

**Accessibilité**

- [ ] Ratio contraste texte/fond ≥ 4.5:1 pour le texte principal (voir table section 21)
- [ ] `#535353` sur `#343434` : uniquement labels 16px+ non-critiques
- [ ] Boutons icône-only ont un `aria-label`
- [ ] Aucun `confirm()` ou `alert()` natif du navigateur

**Cohérence système**

- [ ] Aucune shadow neumorphique (v1 obsolète)
- [ ] Aucune valeur hex light-mode hardcodée (`#ffffff`, `#f5f5f5`, etc.)
- [ ] Scrollbars fines (4px) et discrètes
- [ ] Sélection texte avec `bg-accent/20`
