// Simple client-side auth for testing (LocalStorage + WebCrypto PBKDF2)
(() => {
  const USERS_KEY = 'users';
  const SESSION_KEY = 'session';

  const enc = new TextEncoder();

  function toBase64(bytes) {
    return btoa(String.fromCharCode(...bytes));
  }

  function fromBase64(b64) {
    return new Uint8Array(atob(b64).split('').map(ch => ch.charCodeAt(0)));
  }

  function getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); } catch { return []; }
  }

  function setUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function setSession(userId, remember) {
    const store = remember ? localStorage : sessionStorage;
    store.setItem(SESSION_KEY, JSON.stringify({ userId, ts: Date.now() }));
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  }

  function getSession() {
    const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  async function pbkdf2(password, saltBytes, iterations = 100000, length = 32) {
    const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: saltBytes, iterations, hash: 'SHA-256' }, key, length * 8);
    return new Uint8Array(bits);
  }

  function randomSalt(len = 16) {
    const salt = new Uint8Array(len);
    crypto.getRandomValues(salt);
    return salt;
  }

  function normalizeEmail(email) {
    return (email || '').trim().toLowerCase();
  }

  async function signUp({ email, name, password, remember = true }) {
    email = normalizeEmail(email);
    if (!email || !password || !name) throw new Error('Заполните все поля');
    const users = getUsers();
    if (users.some(u => u.email === email)) throw new Error('Email уже зарегистрирован');
    const salt = randomSalt();
    const hash = await pbkdf2(password, salt);
    const user = {
      id: crypto.randomUUID(),
      email,
      name,
      passwordHash: toBase64(hash),
      salt: toBase64(salt),
      createdAt: Date.now()
    };
    users.push(user);
    setUsers(users);
    setSession(user.id, remember);
    // Sync to backend customers API (best-effort)
    try {
      await fetch('../api/customers.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          email: user.email,
          name: user.name,
          passwordHash: user.passwordHash
        })
      });
    } catch {}
    return { id: user.id, email: user.email, name: user.name };
  }

  async function signIn({ email, password, remember = false }) {
    email = normalizeEmail(email);
    const users = getUsers();
    const user = users.find(u => u.email === email);
    if (!user) throw new Error('Пользователь не найден');
    const salt = fromBase64(user.salt);
    const hash = await pbkdf2(password, salt);
    const ok = toBase64(hash) === user.passwordHash;
    if (!ok) throw new Error('Неверный пароль');
    setSession(user.id, remember);
    return { id: user.id, email: user.email, name: user.name };
  }

  function getCurrentUser() {
    const session = getSession();
    if (!session) return null;
    const users = getUsers();
    const user = users.find(u => u.id === session.userId);
    if (!user) return null;
    return { id: user.id, email: user.email, name: user.name };
  }

  function requireAuth(redirect = 'login.html') {
    if (!getCurrentUser()) {
      window.location.href = redirect;
    }
  }

  function signOut() {
    clearSession();
  }

  window.Auth = { signUp, signIn, signOut, getCurrentUser, requireAuth };
})();

