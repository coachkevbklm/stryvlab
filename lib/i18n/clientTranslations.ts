// lib/i18n/clientTranslations.ts

export type ClientLang = 'fr' | 'en' | 'es'

export const clientDict = {
  // ── BottomNav ──
  'nav.home':       { fr: 'Accueil',   en: 'Home',        es: 'Inicio' },
  'nav.programme':  { fr: 'Programme', en: 'Program',      es: 'Programa' },
  'nav.progress':   { fr: 'Progrès',   en: 'Progress',     es: 'Progreso' },
  'nav.bilans':     { fr: 'Bilans',    en: 'Assessments',  es: 'Evaluaciones' },
  'nav.nutrition':  { fr: 'Nutrition', en: 'Nutrition',    es: 'Nutrición' },
  'nav.profil':     { fr: 'Profil',    en: 'Profile',      es: 'Perfil' },

  // ── Nutrition page ──
  'nutrition.section':         { fr: 'Nutrition',           en: 'Nutrition',           es: 'Nutrición' },
  'nutrition.noProtocol':      { fr: 'Aucun protocole actif', en: 'No active protocol', es: 'Sin protocolo activo' },
  'nutrition.noProtocol.desc': { fr: 'Ton coach prépare ton protocole nutritionnel.', en: 'Your coach is preparing your nutrition protocol.', es: 'Tu coach está preparando tu protocolo nutricional.' },
  'nutrition.kcal':            { fr: 'kcal / jour',         en: 'kcal / day',           es: 'kcal / día' },
  'nutrition.protein':         { fr: 'Protéines',           en: 'Protein',              es: 'Proteínas' },
  'nutrition.carbs':           { fr: 'Glucides',            en: 'Carbs',                es: 'Carbohidratos' },
  'nutrition.fat':             { fr: 'Lipides',             en: 'Fat',                  es: 'Grasas' },
  'nutrition.hydration':       { fr: 'Hydratation',         en: 'Hydration',            es: 'Hidratación' },
  'nutrition.carbCycle':       { fr: 'Carb Cycling',        en: 'Carb Cycling',         es: 'Carb Cycling' },
  'nutrition.cycleSync':       { fr: 'Phase du cycle',      en: 'Cycle phase',          es: 'Fase del ciclo' },
  'nutrition.recommendations': { fr: 'Recommandations',     en: 'Recommendations',      es: 'Recomendaciones' },

  // ── Home page ──
  'home.section':             { fr: 'Accueil',    en: 'Home',      es: 'Inicio' },
  'home.noProgram.title':     { fr: 'Pas encore de programme', en: 'No program yet', es: 'Aún sin programa' },
  'home.noProgram.desc':      { fr: "Ton coach prépare ton programme personnalisé. Tu seras notifié dès qu'il est prêt.", en: 'Your coach is preparing your personalised program. You will be notified when it is ready.', es: 'Tu coach está preparando tu programa personalizado. Te notificaremos cuando esté listo.' },
  'home.session.label':       { fr: 'Séance du jour', en: "Today's session", es: 'Sesión de hoy' },
  'home.session.start':       { fr: 'Commencer la séance', en: 'Start session', es: 'Empezar sesión' },
  'home.session.duration':    { fr: 'Durée', en: 'Duration', es: 'Duración' },
  'home.session.sets':        { fr: 'Sets',   en: 'Sets',      es: 'Series' },
  'home.session.exercises':   { fr: 'Exercices', en: 'Exercises', es: 'Ejercicios' },
  'home.rest.noSession':      { fr: "Pas de séance aujourd'hui", en: 'No session today', es: 'Sin sesión hoy' },
  'home.rest.next':           { fr: 'Prochaine :', en: 'Next:', es: 'Siguiente:' },
  'home.rest.seeProgram':     { fr: 'Voir le programme', en: 'See program', es: 'Ver programa' },
  'home.rest.noActive':       { fr: 'Aucun programme actif', en: 'No active program', es: 'Sin programa activo' },
  'home.week.label':          { fr: 'Cette semaine', en: 'This week', es: 'Esta semana' },
  'home.coachMsg.label':      { fr: 'Message de ton coach', en: 'Message from your coach', es: 'Mensaje de tu coach' },
  'home.bilans.one':          { fr: 'Bilan en attente', en: 'Pending assessment', es: 'Evaluación pendiente' },
  'home.bilans.many':         { fr: '{n} bilans en attente', en: '{n} pending assessments', es: '{n} evaluaciones pendientes' },
  'home.bilans.cta':          { fr: 'Remplis-le pour ton coach', en: 'Fill it in for your coach', es: 'Complétala para tu coach' },

  // ── Programme page ──
  'programme.section':        { fr: 'Programme', en: 'Program',  es: 'Programa' },
  'programme.rest.today':     { fr: "Repos aujourd'hui", en: 'Rest today', es: 'Descanso hoy' },
  'programme.week.label':     { fr: 'Programme de la semaine', en: 'Weekly schedule', es: 'Programa semanal' },
  'programme.noProgram':      { fr: 'Aucun programme actif', en: 'No active program', es: 'Sin programa activo' },
  'programme.noProgram.desc': { fr: "Ton coach n'a pas encore assigné de programme.", en: 'Your coach has not assigned a program yet.', es: 'Tu coach aún no ha asignado un programa.' },
  'programme.session.start':  { fr: 'Commencer', en: 'Start', es: 'Empezar' },
  'programme.session.duration':{ fr: 'Durée est.', en: 'Est. duration', es: 'Duración est.' },
  'programme.session.sets':   { fr: 'Sets', en: 'Sets', es: 'Series' },
  'programme.session.exercises':{ fr: 'exercices', en: 'exercises', es: 'ejercicios' },
  'programme.session.rest':   { fr: 'Repos moy.', en: 'Avg rest', es: 'Descanso med.' },
  'programme.session.rir':    { fr: 'RIR moy.', en: 'Avg RIR', es: 'RIR med.' },
  'programme.days.short':     { fr: ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'], en: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], es: ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'] },
  'programme.days.full':      { fr: ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'], en: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'], es: ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'] },

  // ── SessionLogger ──
  'logger.section':           { fr: 'Programme', en: 'Program', es: 'Programa' },
  'logger.set':               { fr: 'Série', en: 'Set', es: 'Serie' },
  'logger.target.label':      { fr: 'Prévu', en: 'Target', es: 'Objetivo' },
  'logger.actual.label':      { fr: 'Réalisé', en: 'Actual', es: 'Realizado' },
  'logger.reps':              { fr: 'reps', en: 'reps', es: 'reps' },
  'logger.rir.label':         { fr: 'RIR ressenti', en: 'Actual RIR', es: 'RIR real' },
  'logger.rir.target':        { fr: 'RIR cible', en: 'Target RIR', es: 'RIR objetivo' },
  'logger.side.left':         { fr: 'Gauche', en: 'Left', es: 'Izquierda' },
  'logger.side.right':        { fr: 'Droite', en: 'Right', es: 'Derecha' },
  'logger.rest.title':        { fr: 'Repos', en: 'Rest', es: 'Descanso' },
  'logger.rest.skip':         { fr: 'Passer le repos', en: 'Skip rest', es: 'Saltar descanso' },
  'logger.rest.overtime':     { fr: 'Dépassement', en: 'Overtime', es: 'Sobrepasado' },
  'logger.note.placeholder':  { fr: 'Note de ressenti…', en: 'Session note…', es: 'Nota de sesión…' },
  'logger.finish':            { fr: 'Terminer la séance', en: 'Finish session', es: 'Finalizar sesión' },
  'logger.finish.confirm':    { fr: 'Terminer ?', en: 'Finish?', es: '¿Finalizar?' },
  'logger.finish.incomplete': { fr: 'sets non complétés', en: 'sets not completed', es: 'series sin completar' },
  'logger.finish.action':     { fr: 'Terminer quand même', en: 'Finish anyway', es: 'Finalizar de todos modos' },
  'logger.finish.cancel':     { fr: 'Continuer', en: 'Continue', es: 'Continuar' },
  'logger.demo.show':         { fr: 'Voir la démo', en: 'View demo', es: 'Ver demostración' },
  'logger.demo.hide':         { fr: 'Réduire', en: 'Collapse', es: 'Reducir' },
  'logger.lastPerf':          { fr: 'Dernière perf', en: 'Last perf', es: 'Último rend.' },

  // ── Recap page ──
  'recap.section':            { fr: 'Programme', en: 'Program', es: 'Programa' },
  'recap.title':              { fr: 'Récap séance', en: 'Session recap', es: 'Resumen sesión' },
  'recap.duration':           { fr: 'Durée', en: 'Duration', es: 'Duración' },
  'recap.sets':               { fr: 'Sets', en: 'Sets', es: 'Series' },
  'recap.volume':             { fr: 'Volume', en: 'Volume', es: 'Volumen' },
  'recap.exercises':          { fr: 'Exercices', en: 'Exercises', es: 'Ejercicios' },
  'recap.perEx.weight':       { fr: 'Charge', en: 'Weight', es: 'Carga' },
  'recap.perEx.reps':         { fr: 'Reps', en: 'Reps', es: 'Reps' },
  'recap.perEx.rir':          { fr: 'RIR', en: 'RIR', es: 'RIR' },
  'recap.backHome':           { fr: 'Retour accueil', en: 'Back to home', es: 'Volver al inicio' },

  // ── Bilans page ──
  'bilans.section':           { fr: 'Suivi', en: 'Tracking', es: 'Seguimiento' },
  'bilans.title':             { fr: 'Mes bilans', en: 'My assessments', es: 'Mis evaluaciones' },
  'bilans.empty.title':       { fr: 'Aucun bilan pour le moment', en: 'No assessments yet', es: 'Sin evaluaciones aún' },
  'bilans.empty.desc':        { fr: "Ton coach t'enverra un bilan à remplir prochainement.", en: 'Your coach will send you an assessment to fill in soon.', es: 'Tu coach te enviará pronto una evaluación.' },
  'bilans.todo.section':      { fr: 'À remplir', en: 'To fill in', es: 'Para completar' },
  'bilans.todo.sentOn':       { fr: 'Envoyé le', en: 'Sent on', es: 'Enviado el' },
  'bilans.todo.cta':          { fr: 'Remplir le bilan', en: 'Fill in assessment', es: 'Completar evaluación' },
  'bilans.history.section':   { fr: 'Historique', en: 'History', es: 'Historial' },
  'bilans.status.pending':    { fr: 'En attente', en: 'Pending', es: 'Pendiente' },
  'bilans.status.in_progress':{ fr: 'En cours', en: 'In progress', es: 'En curso' },
  'bilans.status.completed':  { fr: 'Complété', en: 'Completed', es: 'Completado' },
  'bilans.status.expired':    { fr: 'Expiré', en: 'Expired', es: 'Expirado' },
  'bilans.count':             { fr: '{n} bilan{pl}', en: '{n} assessment{pl}', es: '{n} evaluación{pl}' },

  // ── Progress page ──
  'progress.section':         { fr: 'Progression', en: 'Progress', es: 'Progreso' },
  'progress.streak.title':    { fr: 'Streak', en: 'Streak', es: 'Racha' },
  'progress.streak.days':     { fr: '{n} jour{pl}', en: '{n} day{pl}', es: '{n} día{pl}' },
  'progress.streak.record':   { fr: 'Record', en: 'Record', es: 'Récord' },
  'progress.streak.zero':     { fr: 'Lance-toi !', en: 'Get started!', es: '¡Empieza!' },
  'progress.streak.fire':     { fr: 'En feu 🔥', en: 'On fire 🔥', es: '¡En racha! 🔥' },
  'progress.period.7':        { fr: '7j',  en: '7d',  es: '7d' },
  'progress.period.30':       { fr: '30j', en: '30d', es: '30d' },
  'progress.period.90':       { fr: '90j', en: '90d', es: '90d' },
  'progress.period.all':      { fr: 'Tout', en: 'All', es: 'Todo' },
  'progress.kpi.sessions':    { fr: 'Séances', en: 'Sessions', es: 'Sesiones' },
  'progress.kpi.volume':      { fr: 'Volume', en: 'Volume', es: 'Volumen' },
  'progress.kpi.sets':        { fr: 'Sets', en: 'Sets', es: 'Series' },
  'progress.kpi.avgDuration': { fr: 'Durée moy.', en: 'Avg duration', es: 'Duración med.' },
  'progress.history.title':   { fr: 'Historique séances', en: 'Session history', es: 'Historial sesiones' },
  'progress.history.setsLabel':{ fr: 'sets', en: 'sets', es: 'series' },
  'progress.history.noSessions':{ fr: 'Aucune séance sur cette période', en: 'No sessions in this period', es: 'Sin sesiones en este período' },
  'progress.prs.title':       { fr: 'Records personnels', en: 'Personal records', es: 'Récords personales' },
  'progress.heatmap.months':  {
    fr: ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'],
    en: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
    es: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
  },
  'progress.heatmap.days':    {
    fr: ['L','M','M','J','V','S','D'],
    en: ['M','T','W','T','F','S','S'],
    es: ['L','M','X','J','V','S','D'],
  },

  // ── Profil page ──
  'profil.section':               { fr: 'Compte', en: 'Account', es: 'Cuenta' },
  'profil.title':                 { fr: 'Mon profil', en: 'My profile', es: 'Mi perfil' },
  'profil.status.active':         { fr: 'Actif', en: 'Active', es: 'Activo' },
  'profil.section.info':          { fr: 'Informations personnelles', en: 'Personal information', es: 'Información personal' },
  'profil.section.notif':         { fr: 'Notifications', en: 'Notifications', es: 'Notificaciones' },
  'profil.section.prefs':         { fr: "Préférences d'affichage", en: 'Display preferences', es: 'Preferencias de visualización' },
  'profil.section.security':      { fr: 'Sécurité', en: 'Security', es: 'Seguridad' },
  'profil.memberSince':           { fr: 'Membre depuis', en: 'Member since', es: 'Miembro desde' },
  'profil.logout':                { fr: 'Se déconnecter', en: 'Log out', es: 'Cerrar sesión' },
  'profil.logout.confirm.title':  { fr: 'Se déconnecter ?', en: 'Log out?', es: '¿Cerrar sesión?' },
  'profil.logout.confirm.desc':   { fr: 'Tu seras redirigé vers la page de connexion.', en: 'You will be redirected to the login page.', es: 'Serás redirigido a la página de inicio de sesión.' },
  'profil.logout.cancel':         { fr: 'Annuler', en: 'Cancel', es: 'Cancelar' },
  'profil.logout.action':         { fr: 'Déconnecter', en: 'Log out', es: 'Cerrar sesión' },
  'profil.logout.loading':        { fr: 'Déconnexion…', en: 'Logging out…', es: 'Cerrando sesión…' },

  // ── Preferences form ──
  'prefs.weight':   { fr: 'Unité de poids', en: 'Weight unit', es: 'Unidad de peso' },
  'prefs.height':   { fr: 'Unité de taille', en: 'Height unit', es: 'Unidad de altura' },
  'prefs.language': { fr: 'Langue', en: 'Language', es: 'Idioma' },
  'prefs.save':     { fr: 'Sauvegarder', en: 'Save', es: 'Guardar' },
  'prefs.saving':   { fr: 'Sauvegarde…', en: 'Saving…', es: 'Guardando…' },
  'prefs.saved':    { fr: 'Sauvegardé', en: 'Saved', es: 'Guardado' },

  // ── Greeting ──
  'greeting.session.morning':   { fr: "C'est jour de séance, {name} 💪", en: "It's session day, {name} 💪", es: 'Es día de sesión, {name} 💪' },
  'greeting.session.afternoon': { fr: "Ta séance t'attend, {name} 💪", en: 'Your session is waiting, {name} 💪', es: 'Tu sesión te espera, {name} 💪' },
  'greeting.session.evening':   { fr: 'Bonne séance ce soir, {name} 💪', en: 'Great session tonight, {name} 💪', es: 'Buena sesión esta noche, {name} 💪' },
  'greeting.rest.morning':      { fr: "Bonjour {name} — jour de récup aujourd'hui", en: 'Good morning {name} — recovery day today', es: 'Buenos días {name} — día de recuperación' },
  'greeting.rest.afternoon':    { fr: 'Bonne après-midi {name} — profite de ta récup', en: 'Good afternoon {name} — enjoy your rest', es: 'Buenas tardes {name} — disfruta tu descanso' },
  'greeting.rest.evening':      { fr: 'Bonne soirée {name} — repose-toi bien', en: 'Good evening {name} — rest well', es: 'Buenas noches {name} — descansa bien' },

  // ── Common ──
  'common.loading': { fr: 'Chargement…', en: 'Loading…', es: 'Cargando…' },
  'common.error':   { fr: 'Erreur', en: 'Error', es: 'Error' },
  'common.cancel':  { fr: 'Annuler', en: 'Cancel', es: 'Cancelar' },
  'common.confirm': { fr: 'Confirmer', en: 'Confirm', es: 'Confirmar' },
  'common.min':     { fr: 'min', en: 'min', es: 'min' },
  'common.sec':     { fr: 's', en: 's', es: 's' },
  'common.kg':      { fr: 'kg', en: 'kg', es: 'kg' },
} satisfies Record<string, { fr: string | string[]; en: string | string[]; es: string | string[] }>

export type ClientDictKey = keyof typeof clientDict

/** Get a translated string, interpolating {vars} */
export function ct(lang: ClientLang, key: ClientDictKey, vars?: Record<string, string | number>): string {
  const entry = clientDict[key]
  const raw = entry[lang] as string
  if (!vars) return raw
  return raw.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''))
}

/** Plural helper: replaces {pl} with 's' (EN) or '' (FR/ES) when n !== 1 */
export function ctp(lang: ClientLang, key: ClientDictKey, n: number): string {
  const raw = ct(lang, key, { n })
  const pl = lang === 'en' ? (n !== 1 ? 's' : '') : ''
  return raw.replace('{pl}', pl)
}

/** Returns the string[] for array-valued keys (days, months) */
export function cta(lang: ClientLang, key: ClientDictKey): string[] {
  const entry = clientDict[key]
  return entry[lang] as string[]
}
