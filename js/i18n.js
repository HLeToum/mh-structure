/**
 * MH-Structure — i18n (FR / EN)
 * Applique les traductions via attributs data-i18n, data-i18n-html, data-i18n-ph
 */
(function () {

  // ── Dictionnaire ──────────────────────────────────────
  const dict = {
    fr: {
      /* Navbar */
      'nav.home':       'Accueil',
      'nav.prevention': 'Prévention',
      'nav.about':      'À propos',
      'nav.services':   'Services',
      'nav.contact':    'Devis',
      'nav.cta':        'Devis gratuit',

      /* Hero */
      'hero.tag':         'Bureau d\'Études Techniques — Structure',
      'hero.h1':          'Ingénierie<br><em>Structurelle</em><br>Partout en France',
      'hero.desc':        'Étude de structures · Diagnostic d\'ouvrages · Contrôle réglementaire<br>Des solutions techniques adaptées à chaque situation.',
      'hero.btn-primary': 'Demander un devis',
      'hero.btn-ghost':   'Voir nos cas prévention',
      'hero.scroll':      'Défiler',

      /* Metrics */
      'metric.years.unit':     ' ans',
      'metric.years.label':    'Expérience en ingénierie structure',
      'metric.location.label': 'Interventions en France entière',
      'metric.delay.unit':     'h',
      'metric.delay.label':    'Délai de réponse garanti',
      'metric.smabtp.label':   'RC Pro & Décennale — Assuré',

      /* Prevention */
      'prev.eyebrow':    'Prévention',
      'prev.h2':         'Reconnaître les pathologies<br>structurelles',
      'prev.sub':        'Des cas types illustrés pour vous aider à identifier les désordres courants sur votre ouvrage.',
      'prev.disclaimer': '<strong>Chaque projet est unique.</strong> Ces cas types sont présentés à titre informatif et éducatif. L\'identification d\'un désordre similaire ne constitue pas un diagnostic. Seule une inspection technique par un ingénieur structure permet d\'évaluer la sévérité réelle et de préconiser les mesures adaptées à votre ouvrage.',
      'prev.label.obs':  'Observation',
      'prev.label.inv':  'À investiguer',

      'prev.c01.cat':   'Poteau · Structure',
      'prev.c01.title': 'Fissure diagonale sur poteau de façade',
      'prev.c01.obs':   'Fissure inclinée traversant un poteau béton armé au droit d\'un nœud poutre-poteau. L\'angle caractéristique et la continuité de la fissure sur la hauteur de l\'élément sont des indicateurs à ne pas ignorer.',
      'prev.c01.inv':   'L\'ouverture de fissure, la présence d\'armatures apparentes et l\'historique de l\'ouvrage (séisme, surcharge, tassement) permettent d\'orienter l\'analyse et de statuer sur l\'urgence d\'une intervention.',

      'prev.c02.cat':   'Mur · Ouverture',
      'prev.c02.title': 'Fissure oblique en pied de mur',
      'prev.c02.obs':   'Fissure se propageant en diagonale depuis la base d\'un mur jusqu\'à l\'encadrement d\'une porte. La trajectoire et la localisation au droit d\'une discontinuité géométrique sont caractéristiques.',
      'prev.c02.inv':   'Il convient d\'établir si la fissure affecte l\'enduit uniquement ou s\'étend à la maçonnerie porteuse. Son évolution dans le temps et l\'éventuelle présence d\'humidité associée sont des éléments déterminants.',

      'prev.c03.cat':   'Voile · Réhabilitation',
      'prev.c03.title': 'Fissuration multiple en zone de travaux',
      'prev.c03.obs':   'Réseau de fissures d\'orientations variées (verticales, obliques) sur un voile en contexte de réhabilitation. La coexistence de plusieurs directions peut suggérer des mécanismes simultanés.',
      'prev.c03.inv':   'En phase de rénovation, les modifications de distribution des charges et les interfaces anciens/nouveaux matériaux sont des zones de fragilité. Un état des lieux structurel s\'impose avant toute reprise.',

      'prev.c04.cat':   'Façade · Étanchéité',
      'prev.c04.title': 'Exfiltration d\'eau en façade béton',
      'prev.c04.obs':   'Traces de ruissellement et auréoles d\'humidité sur une façade en béton armé, indiquant une migration d\'eau à travers ou le long de la paroi. Les dépôts blanchâtres (efflorescences) peuvent accompagner ce désordre.',
      'prev.c04.inv':   'L\'origine de l\'eau (toiture, acrotère, fissure traversante, défaut de joint) et la présence de carbonatation ou de chlorures associés conditionnent le risque de dégradation des armatures sur le long terme.',

      'prev.c05.cat':   'Façade · Infiltration',
      'prev.c05.title': 'Infiltrations répétées sur façade',
      'prev.c05.obs':   'Infiltrations d\'eau visibles sur plusieurs niveaux d\'une façade béton, concentrées aux angles des ouvertures et aux zones de jonction structure/menuiserie. Le caractère répété et généralisé est significatif.',
      'prev.c05.inv':   'Un défaut d\'étanchéité généralisé peut accélérer la corrosion des armatures de façade. L\'évaluation de la profondeur d\'humidité, l\'état des joints de menuiserie et la présence de fissures traversantes sont des points clés.',

      'prev.c06.cat':   'Soutènement · Structure',
      'prev.c06.title': 'Déversement et fissuration d\'un mur de soutènement',
      'prev.c06.obs':   'Inclinaison progressive du parement vers l\'extérieur, accompagnée de fissures verticales ou obliques sur le voile béton armé. Un dévers visible à l\'œil nu indique un déséquilibre des forces agissant sur l\'ouvrage.',
      'prev.c06.inv':   'La poussée des terres, l\'absence ou la dégradation du drainage, et l\'état des armatures sont à évaluer en priorité. Un calcul de stabilité au glissement et au renversement est indispensable avant toute décision d\'intervention.',

      'prev.c07.cat':   'Soutènement · Drainage',
      'prev.c07.title': 'Infiltrations et défaut de drainage en pied de mur',
      'prev.c07.obs':   'Remontées d\'humidité, suintements en parement ou stagnation d\'eau en pied de mur de soutènement. Un drainage insuffisant génère une surpression hydrostatique qui amplifie considérablement la poussée exercée sur le voile.',
      'prev.c07.inv':   'L\'état du drain perforé, du géotextile et des barbacanes est à contrôler. Une étude géotechnique permet d\'évaluer la perméabilité des sols et de dimensionner un système de drainage adapté pour pérenniser l\'ouvrage.',

      'prev.c08.cat':   'Dallage · Tassement',
      'prev.c08.title': 'Fissuration du dallage industriel par tassement de plateforme',
      'prev.c08.obs':   'Fissures traversantes en étoile ou en réseau sur un dallage béton, parfois accompagnées de soulèvements ou d\'affaissements locaux. Ce mode de rupture est typique d\'un défaut de compactage de la plateforme support : le sol se tasse de façon différentielle sous la dalle, qui n\'est pas armée pour reprendre ces déformations.',
      'prev.c08.inv':   'L\'état de compactage de la plateforme support est à vérifier (essais à la plaque, pénétromètre dynamique). La présence de vides sous dallage peut être détectée par géoradar. Selon la sévérité, les solutions vont de l\'injection de résine expansive à la reprise complète du dallage avec compactage renforcé de la plateforme.',

      'prev.cta.q':   'Vous reconnaissez un de ces signes sur votre bâtiment ?',
      'prev.cta.sub': 'Chaque situation est unique. Un examen par un ingénieur structure est indispensable pour évaluer le niveau de risque réel.',
      'prev.cta.btn': 'Demander un diagnostic',

      /* About */
      'about.eyebrow':      'À propos',
      'about.badge.title':  'Bureau d\'Études',
      'about.badge.sub':    'Ingénierie Structure',
      'about.h2':           'Bureau d\'études structure — Partout en France',
      'about.p1':           'Nous travaillons directement avec architectes, maîtres d\'ouvrage et particuliers — de la conception jusqu\'à la réception de chantier. Pas d\'intermédiaire : votre dossier est suivi par notre ingénieur structure, du début à la fin.',
      'about.p2':           'Notes de calcul béton armé, plans d\'exécution, diagnostics structuraux, attestations parasismiques AT1/AT2 : nous couvrons l\'ensemble du cycle structure de votre projet, sur tout le territoire français.',
      'about.clients.label':'Nous intervenons pour',
      'about.client.1':     'Architectes',
      'about.client.2':     'Maîtres d\'ouvrage',
      'about.client.3':     'Promoteurs',
      'about.client.4':     'Particuliers',
      'about.client.5':     'Collectivités',
      'about.client.6':     'Entreprises de construction',
      'about.btn':          'Discutons de votre projet',
      'about.map.label':    'Carmaux — Tarn (81)',

      /* Services */
      'svc.eyebrow': 'Services',
      'svc.h2':      'Nos prestations',
      'svc.sub':     'Du dimensionnement à la certification réglementaire, nous intervenons sur toutes les étapes techniques de votre projet.',

      'svc.01.title': 'Notes de Calcul Structurel',
      'svc.01.desc':  'Dimensionnement et vérification des éléments porteurs selon les Eurocodes — fondations, voiles, planchers, poteaux, poutres, escaliers. Justification de stabilité générale.',
      'svc.01.t1': 'Eurocode 2', 'svc.01.t2': 'Béton armé', 'svc.01.t3': 'Fondations', 'svc.01.t4': 'Stabilité',

      'svc.02.title': 'Diagnostic Visuel Structurel',
      'svc.02.desc':  'Inspection visuelle approfondie de l\'ouvrage : identification et classification des désordres (fissures, éclatements, déformations), évaluation de la sévérité et recommandations.',
      'svc.02.t1': 'Pathologies', 'svc.02.t2': 'Fissures', 'svc.02.t3': 'Rapport technique',

      'svc.03.title': 'Diagnostic Sismique',
      'svc.03.desc':  'Évaluation de la vulnérabilité des ouvrages existants vis-à-vis du risque sismique : analyse de la structure, vérification réglementaire et recommandations techniques adaptées.',
      'svc.03.t1': 'Eurocode 8', 'svc.03.t2': 'Vulnérabilité', 'svc.03.t3': 'Réglementation',

      'svc.04.title': 'Attestation Parasismique — Dépôt de PC',
      'svc.04.desc':  'Établissement de l\'attestation réglementaire à joindre au dépôt de permis de construire, certifiant la prise en compte des règles parasismiques (PS-MI / Eurocode 8) dans la conception du projet.',
      'svc.04.t1': 'PS-MI', 'svc.04.t2': 'Permis de construire', 'svc.04.t3': 'Réglementation',

      'svc.05.title': 'Attestation de Fin de Chantier — AT2',
      'svc.05.desc':  'Établissement de l\'attestation AT2 à l\'achèvement des travaux, après visite de fin de chantier et vérification de la conformité des dispositions constructives aux exigences réglementaires.',
      'svc.05.t1': 'AT2', 'svc.05.t2': 'Fin de chantier', 'svc.05.t3': 'Conformité',

      /* Contact */
      'contact.eyebrow':     'Devis',
      'contact.h2':          'Parlons de<br>votre projet.',
      'contact.desc':        'Un ouvrage à dimensionner, diagnostiquer ou modéliser ? Réponse garantie sous 48h.',
      'contact.email.label': 'Email',
      'contact.phone.label': 'Téléphone',
      'contact.loc.label':   'Localisation',
      'contact.loc.val':     'France métropolitaine &amp; DOM-TOM',

      /* Form */
      'form.nom.label':      'Nom complet *',
      'form.nom.ph':         'Jean Dupont…',
      'form.email.label':    'Email *',
      'form.email.ph':       'jean@exemple.fr',
      'form.tel.label':      'Téléphone',
      'form.addr.section':   'Adresse du projet',
      'form.addr.label':     'Adresse',
      'form.addr.ph':        'N° et rue…',
      'form.cp.label':       'Code postal',
      'form.cp.ph':          '45500',
      'form.ville.label':    'Ville',
      'form.ville.ph':       'Gien…',
      'form.type.label':     'Type de prestation *',
      'form.type.default':   'Sélectionner…',
      'form.type.calcul':    'Notes de calcul structurel',
      'form.type.diag-vis':  'Diagnostic visuel structurel',
      'form.type.diag-sis':  'Diagnostic sismique',
      'form.type.att-pc':    'Attestation parasismique — Dépôt PC',
      'form.type.att-at2':   'Attestation fin de chantier AT2',
      'form.type.autre':     'Autre / Question',
      'form.msg.label':      'Description du projet *',
      'form.msg.ph':         'Décrivez votre projet, le type d\'ouvrage, la localisation, les délais souhaités…',
      'form.rgpd.label':     'J\'accepte que mes données soient utilisées pour traiter ma demande de devis, conformément à la <a href="politique-confidentialite" class="rgpd-link">politique de confidentialité</a>.',
      'form.submit':         'Envoyer ma demande',

      /* Footer */
      'footer.nav.title':  'Navigation',
      'footer.nav.home':   'Accueil',
      'footer.nav.prev':   'Prévention',
      'footer.nav.about':  'À propos',
      'footer.nav.svc':    'Services',
      'footer.nav.contact':'Devis',
      'footer.svc.title':  'Prestations',
      'footer.svc.1':      'Notes de Calcul',
      'footer.svc.2':      'Diagnostic Visuel',
      'footer.svc.3':      'Diagnostic Sismique',
      'footer.svc.4':      'Attestation PC',
      'footer.svc.5':      'Attestation AT2',
      'footer.copy':       '© 2026 MH Structure. Tous droits réservés.',
      'footer.legal':      'Mentions légales',
      'footer.privacy':    'Politique de confidentialité',

      /* Cookie banner */
      'cookie.text':   'Ce site utilise uniquement un stockage local pour mémoriser votre préférence de thème (clair / sombre). Aucun cookie tiers ni outil de suivi.',
      'cookie.learn':  'Politique de confidentialité',
      'cookie.accept': 'J\'ai compris',
    },

    en: {
      /* Navbar */
      'nav.home':       'Home',
      'nav.prevention': 'Prevention',
      'nav.about':      'About',
      'nav.services':   'Services',
      'nav.contact':    'Quote',
      'nav.cta':        'Free Quote',

      /* Hero */
      'hero.tag':         'Structural Engineering Consultancy',
      'hero.h1':          'Structural<br><em>Engineering</em><br>Across France',
      'hero.desc':        'Structural analysis · Building diagnostics · Regulatory compliance<br>Technical solutions tailored to every situation.',
      'hero.btn-primary': 'Request a quote',
      'hero.btn-ghost':   'View case studies',
      'hero.scroll':      'Scroll',

      /* Metrics */
      'metric.years.unit':     ' yrs',
      'metric.years.label':    'Experience in structural engineering',
      'metric.location.label': 'Nationwide service across France',
      'metric.delay.unit':     'h',
      'metric.delay.label':    'Guaranteed response time',
      'metric.smabtp.label':   'Professional & Decennial liability — Insured',

      /* Prevention */
      'prev.eyebrow':    'Prevention',
      'prev.h2':         'Recognising structural<br>pathologies',
      'prev.sub':        'Illustrated case studies to help you identify common structural defects on your building.',
      'prev.disclaimer': '<strong>Every project is unique.</strong> These case studies are presented for informational and educational purposes only. Identifying a similar defect does not constitute a diagnosis. Only a technical inspection by a structural engineer can assess the actual severity and recommend appropriate measures for your structure.',
      'prev.label.obs':  'Observation',
      'prev.label.inv':  'To investigate',

      'prev.c01.cat':   'Column · Structure',
      'prev.c01.title': 'Diagonal crack on a façade column',
      'prev.c01.obs':   'Inclined crack running through a reinforced concrete column at a beam-column joint. The characteristic angle and continuity of the crack along the element height are indicators not to be ignored.',
      'prev.c01.inv':   'The crack width, the presence of exposed reinforcement and the history of the structure (earthquake, overload, settlement) help guide the analysis and determine the urgency of any intervention.',

      'prev.c02.cat':   'Wall · Opening',
      'prev.c02.title': 'Oblique crack at the base of a wall',
      'prev.c02.obs':   'Crack propagating diagonally from the base of a wall to a door frame. The path and location at a geometric discontinuity are characteristic.',
      'prev.c02.inv':   'It is important to establish whether the crack affects the render only or extends into the load-bearing masonry. Its evolution over time and any associated moisture are key factors.',

      'prev.c03.cat':   'Wall · Rehabilitation',
      'prev.c03.title': 'Multiple cracking in a construction zone',
      'prev.c03.obs':   'Network of cracks in various directions (vertical, oblique) on a wall in a rehabilitation context. The coexistence of several directions may suggest simultaneous mechanisms.',
      'prev.c03.inv':   'During renovation, changes in load distribution and interfaces between old and new materials create vulnerability zones. A structural survey is required before any repair work.',

      'prev.c04.cat':   'Façade · Waterproofing',
      'prev.c04.title': 'Water exfiltration on a concrete façade',
      'prev.c04.obs':   'Runoff marks and moisture halos on a reinforced concrete façade, indicating water migration through or along the wall. White deposits (efflorescence) may accompany this defect.',
      'prev.c04.inv':   'The water source (roof, parapet, through-crack, failed joint) and the presence of associated carbonation or chlorides determine the long-term risk of reinforcement degradation.',

      'prev.c05.cat':   'Façade · Infiltration',
      'prev.c05.title': 'Repeated infiltrations on a façade',
      'prev.c05.obs':   'Water infiltration visible on multiple levels of a concrete façade, concentrated at opening corners and structure/joinery junctions. The repeated and widespread nature is significant.',
      'prev.c05.inv':   'A widespread waterproofing failure can accelerate façade reinforcement corrosion. Evaluating moisture depth, the condition of joinery seals and the presence of through-cracks are key points.',

      'prev.c06.cat':   'Retaining wall · Structure',
      'prev.c06.title': 'Tilting and cracking of a retaining wall',
      'prev.c06.obs':   'Progressive outward tilt of the facing, accompanied by vertical or oblique cracks on the reinforced concrete wall. A visible lean indicates an imbalance in the forces acting on the structure.',
      'prev.c06.inv':   'Soil pressure, the absence or deterioration of drainage, and the condition of the reinforcement are priority items. A sliding and overturning stability calculation is essential before any intervention decision.',

      'prev.c07.cat':   'Retaining wall · Drainage',
      'prev.c07.title': 'Infiltrations and drainage failure at the base of a retaining wall',
      'prev.c07.obs':   'Rising damp, seepage on the facing or water pooling at the base of a retaining wall. Insufficient drainage generates hydrostatic pressure that significantly amplifies the thrust on the wall.',
      'prev.c07.inv':   'The condition of the perforated drain, geotextile and weep holes must be checked. A geotechnical study assesses soil permeability and allows a suitable drainage system to be designed to ensure the long-term performance of the structure.',

      'prev.c08.cat':   'Floor slab · Settlement',
      'prev.c08.title': 'Industrial floor slab cracking due to subgrade settlement',
      'prev.c08.obs':   'Through cracks in a star pattern or network across a concrete floor slab, sometimes accompanied by local heaving or subsidence. This failure mode is typical of inadequate compaction of the supporting subgrade: the soil settles unevenly beneath the slab, which is not reinforced to accommodate these deformations.',
      'prev.c08.inv':   'The compaction level of the supporting subgrade should be assessed (plate load tests, dynamic penetrometer). Voids beneath the slab can be detected using ground-penetrating radar. Depending on severity, solutions range from expanding resin injection to full slab replacement with improved subgrade compaction.',

      'prev.cta.q':   'Do you recognise any of these signs on your building?',
      'prev.cta.sub': 'Every situation is unique. An inspection by a structural engineer is essential to assess the actual level of risk.',
      'prev.cta.btn': 'Request a diagnostic',

      /* About */
      'about.eyebrow':      'About',
      'about.badge.title':  'Engineering Firm',
      'about.badge.sub':    'Structural Engineering',
      'about.h2':           'Structural engineering firm — Across France',
      'about.p1':           'We work directly with architects, project owners and private clients — from design through to site completion. No middlemen: your file is handled by our structural engineer, start to finish.',
      'about.p2':           'Reinforced concrete calculations, execution drawings, structural diagnostics, seismic compliance certificates AT1/AT2 — we cover the full structural engineering cycle for your project, anywhere in France.',
      'about.clients.label':'We work with',
      'about.client.1':     'Architects',
      'about.client.2':     'Project owners',
      'about.client.3':     'Developers',
      'about.client.4':     'Private individuals',
      'about.client.5':     'Local authorities',
      'about.client.6':     'Construction companies',
      'about.btn':          'Let\'s discuss your project',
      'about.map.label':    'Carmaux — Tarn (81)',

      /* Services */
      'svc.eyebrow': 'Services',
      'svc.h2':      'Our services',
      'svc.sub':     'From structural sizing to regulatory certification, we cover every technical stage of your project.',

      'svc.01.title': 'Structural Calculations',
      'svc.01.desc':  'Sizing and verification of load-bearing elements according to the Eurocodes — foundations, walls, slabs, columns, beams, staircases. General stability justification.',
      'svc.01.t1': 'Eurocode 2', 'svc.01.t2': 'Reinforced concrete', 'svc.01.t3': 'Foundations', 'svc.01.t4': 'Stability',

      'svc.02.title': 'Visual Structural Diagnostic',
      'svc.02.desc':  'In-depth visual inspection of the structure: identification and classification of defects (cracks, spalling, deformations), severity assessment and recommendations.',
      'svc.02.t1': 'Pathologies', 'svc.02.t2': 'Cracks', 'svc.02.t3': 'Technical report',

      'svc.03.title': 'Seismic Assessment',
      'svc.03.desc':  'Assessment of existing structures\' vulnerability to seismic risk: structural analysis, regulatory compliance check and tailored technical recommendations.',
      'svc.03.t1': 'Eurocode 8', 'svc.03.t2': 'Vulnerability', 'svc.03.t3': 'Regulation',

      'svc.04.title': 'Seismic Compliance Certificate — Planning',
      'svc.04.desc':  'Preparation of the regulatory certificate to be submitted with the planning application, certifying that seismic design rules (PS-MI / Eurocode 8) have been considered in the project.',
      'svc.04.t1': 'PS-MI', 'svc.04.t2': 'Planning permit', 'svc.04.t3': 'Regulation',

      'svc.05.title': 'End-of-Works Certificate — AT2',
      'svc.05.desc':  'Preparation of the AT2 certificate at works completion, following a site visit and verification of compliance of construction details with regulatory requirements.',
      'svc.05.t1': 'AT2', 'svc.05.t2': 'Works completion', 'svc.05.t3': 'Compliance',

      /* Contact */
      'contact.eyebrow':     'Quote',
      'contact.h2':          'Let\'s talk about<br>your project.',
      'contact.desc':        'A structure to size, diagnose or model? Guaranteed response within 48h.',
      'contact.email.label': 'Email',
      'contact.phone.label': 'Phone',
      'contact.loc.label':   'Location',
      'contact.loc.val':     'Metropolitan France &amp; Overseas Territories',

      /* Form */
      'form.nom.label':      'Full name *',
      'form.nom.ph':         'John Smith…',
      'form.email.label':    'Email *',
      'form.email.ph':       'john@example.com',
      'form.tel.label':      'Phone',
      'form.addr.section':   'Project address',
      'form.addr.label':     'Address',
      'form.addr.ph':        'Street and number…',
      'form.cp.label':       'Postal code',
      'form.cp.ph':          '45500',
      'form.ville.label':    'City',
      'form.ville.ph':       'City…',
      'form.type.label':     'Service type *',
      'form.type.default':   'Select…',
      'form.type.calcul':    'Structural calculations',
      'form.type.diag-vis':  'Visual structural diagnostic',
      'form.type.diag-sis':  'Seismic assessment',
      'form.type.att-pc':    'Seismic certificate — Planning',
      'form.type.att-at2':   'End-of-works certificate AT2',
      'form.type.autre':     'Other / Question',
      'form.msg.label':      'Project description *',
      'form.msg.ph':         'Describe your project, structure type, location, desired timeline…',
      'form.rgpd.label':     'I agree that my data will be used to process my quote request, in accordance with the <a href="politique-confidentialite" class="rgpd-link">privacy policy</a>.',
      'form.submit':         'Send my request',

      /* Footer */
      'footer.nav.title':  'Navigation',
      'footer.nav.home':   'Home',
      'footer.nav.prev':   'Prevention',
      'footer.nav.about':  'About',
      'footer.nav.svc':    'Services',
      'footer.nav.contact':'Quote',
      'footer.svc.title':  'Services',
      'footer.svc.1':      'Calculations',
      'footer.svc.2':      'Visual Diagnostic',
      'footer.svc.3':      'Seismic Assessment',
      'footer.svc.4':      'Seismic Certificate',
      'footer.svc.5':      'End-of-Works AT2',
      'footer.copy':       '© 2026 MH Structure. All rights reserved.',
      'footer.legal':      'Legal notice',
      'footer.privacy':    'Privacy policy',

      /* Cookie banner */
      'cookie.text':   'This site only uses local storage to remember your theme preference (light / dark). No third-party cookies or tracking tools.',
      'cookie.learn':  'Privacy policy',
      'cookie.accept': 'Got it',
    },
  };

  // ── Moteur de traduction ──────────────────────────────
  function applyLang(lang) {
    const t = dict[lang] || dict.fr;
    const root = document.documentElement;

    // Texte simple
    root.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (t[key] !== undefined) el.textContent = t[key];
    });

    // HTML (contenu avec balises)
    root.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      if (t[key] !== undefined) el.innerHTML = t[key];
    });

    // Placeholders
    root.querySelectorAll('[data-i18n-ph]').forEach(el => {
      const key = el.getAttribute('data-i18n-ph');
      if (t[key] !== undefined) el.setAttribute('placeholder', t[key]);
    });

    // Attribut lang sur <html>
    root.setAttribute('lang', lang);
    localStorage.setItem('mh-lang', lang);

    // Bouton langue — état actif
    const btn = document.getElementById('langToggle');
    if (btn) {
      const frEl = btn.querySelector('.lt-fr');
      const enEl = btn.querySelector('.lt-en');
      if (frEl && enEl) {
        frEl.classList.toggle('lt-active', lang === 'fr');
        enEl.classList.toggle('lt-active', lang === 'en');
      }
      /* WCAG 2.5.3 : le nom accessible doit contenir le libellé visible (FR | EN) */
      btn.setAttribute('aria-label', lang === 'fr' ? 'FR | EN — Switch to English' : 'FR | EN — Passer en français');
    }
  }

  // ── Initialisation ────────────────────────────────────
  // Le thème est toujours sombre par défaut (anti-FOUC dans <head>)
  // La langue utilise le localStorage (défaut : fr)
  const savedLang = localStorage.getItem('mh-lang') || 'fr';
  applyLang(savedLang);

  // ── Bouton toggle ─────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    const btn = document.getElementById('langToggle');
    if (!btn) return;

    // Synchronise l'état visuel au chargement
    const curLang = document.documentElement.getAttribute('lang') || 'fr';
    const frEl = btn.querySelector('.lt-fr');
    const enEl = btn.querySelector('.lt-en');
    if (frEl && enEl) {
      frEl.classList.toggle('lt-active', curLang === 'fr');
      enEl.classList.toggle('lt-active', curLang === 'en');
    }

    btn.addEventListener('click', function () {
      const current = document.documentElement.getAttribute('lang') || 'fr';
      applyLang(current === 'fr' ? 'en' : 'fr');
    });
  });

  // Expose pour usage externe si besoin
  window.mhI18n = { apply: applyLang, dict };

})();
