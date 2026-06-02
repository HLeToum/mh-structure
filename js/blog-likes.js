/**
 * MH Structure — Blog Likes
 * Firebase Realtime Database (gratuit, Spark plan)
 *
 * ⚙️  CONFIGURATION :
 *   Remplacer les valeurs ci-dessous par celles de votre projet Firebase.
 *   (Firebase Console → Paramètres du projet → Vos applications → SDK)
 *
 * RÈGLES REALTIME DATABASE (à copier dans Firebase Console → Règles) :
 * {
 *   "rules": {
 *     "likes": {
 *       "$articleId": {
 *         ".read": true,
 *         ".write": true,
 *         ".validate": "newData.isNumber() && newData.val() >= 0"
 *       }
 *     }
 *   }
 * }
 */

const FIREBASE_CONFIG = {
  apiKey:            "VOTRE_API_KEY",
  authDomain:        "VOTRE_PROJECT.firebaseapp.com",
  databaseURL:       "https://VOTRE_PROJECT-default-rtdb.europe-west1.firebasedatabase.app",
  projectId:         "VOTRE_PROJECT",
  storageBucket:     "VOTRE_PROJECT.appspot.com",
  messagingSenderId: "VOTRE_SENDER_ID",
  appId:             "VOTRE_APP_ID"
};

/* ─── Classe LikeManager ─────────────────────────────────── */
class LikeManager {
  constructor(articleId) {
    this.articleId = articleId;
    this.storageKey = `mh-liked-${articleId}`;
    this.db = null;
    this.countEl = document.getElementById('like-count');
    this.btn = document.getElementById('like-btn');
    this.countLabelEl = document.getElementById('like-count-label');

    // Affichage initial immédiat (localStorage)
    this._applyLocalState();

    // Si Firebase configuré, charger depuis la DB
    if (FIREBASE_CONFIG.apiKey !== "VOTRE_API_KEY") {
      this._initFirebase();
    } else {
      // Mode dégradé : compteur local uniquement
      this._initLocal();
    }
  }

  /* ─── Firebase mode ─────────────────────────────────────── */
  async _initFirebase() {
    try {
      // Import dynamique des modules Firebase (CDN ESM)
      const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
      const { getDatabase, ref, onValue, runTransaction } =
        await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js');

      const app = initializeApp(FIREBASE_CONFIG, 'mh-blog');
      this.db = getDatabase(app);
      const likeRef = ref(this.db, `likes/${this.articleId}`);

      // Écoute temps réel du compteur
      onValue(likeRef, (snap) => {
        const val = snap.val() || 0;
        this._setCount(val);
      });

      // Bouton like
      if (this.btn) {
        this.btn.addEventListener('click', () => {
          const liked = this._isLiked();
          runTransaction(likeRef, (current) => {
            const c = current || 0;
            return liked ? Math.max(0, c - 1) : c + 1;
          });
          this._toggleLiked();
        });
      }
    } catch (e) {
      console.warn('[MH Blog] Firebase unavailable, fallback to local mode', e);
      this._initLocal();
    }
  }

  /* ─── Mode local (fallback) ─────────────────────────────── */
  _initLocal() {
    const count = parseInt(localStorage.getItem(`mh-like-count-${this.articleId}`)) || 0;
    this._setCount(count);

    if (this.btn) {
      this.btn.addEventListener('click', () => {
        const liked = this._isLiked();
        const current = parseInt(localStorage.getItem(`mh-like-count-${this.articleId}`)) || 0;
        const next = liked ? Math.max(0, current - 1) : current + 1;
        localStorage.setItem(`mh-like-count-${this.articleId}`, next);
        this._setCount(next);
        this._toggleLiked();
      });
    }
  }

  /* ─── Helpers ─────────────────────────────────────────────── */
  _isLiked() {
    return localStorage.getItem(this.storageKey) === '1';
  }

  _toggleLiked() {
    const next = !this._isLiked();
    localStorage.setItem(this.storageKey, next ? '1' : '0');
    this._applyLocalState();
  }

  _applyLocalState() {
    if (!this.btn) return;
    if (this._isLiked()) {
      this.btn.classList.add('liked');
      this.btn.setAttribute('aria-pressed', 'true');
    } else {
      this.btn.classList.remove('liked');
      this.btn.setAttribute('aria-pressed', 'false');
    }
  }

  _setCount(n) {
    if (this.countEl) this.countEl.textContent = n;
    if (this.countLabelEl) {
      this.countLabelEl.textContent = n <= 1 ? 'personne a trouvé cet article utile' : 'personnes ont trouvé cet article utile';
    }
  }
}

/* ─── Init auto via data-article-id ─────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('like-btn');
  if (btn && btn.dataset.articleId) {
    window._likeManager = new LikeManager(btn.dataset.articleId);
  }
});
