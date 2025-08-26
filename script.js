import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// 🔧 Twoje dane Supabase
const SUPABASE_URL = 'https://nugkonuaednqzhhxvptq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51Z2tvbnVhZWRucXpoaHh2cHRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMTk5NDEsImV4cCI6MjA3MTc5NTk0MX0.tCNCVi-hmvz_cIbTqOUHgpmxKpy6epQ7v29Q7wj0kBU';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 🔐 Stan użytkownika
let session = null;

// 📌 Elementy DOM
const btnLogin = document.getElementById('btnLogin');
const btnLogout = document.getElementById('btnLogout');
const userEmail = document.getElementById('userEmail');
const loginModal = document.getElementById('loginModal');
const btnSignIn = document.getElementById('btnSignIn');
const btnSignUp = document.getElementById('btnSignUp');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const loginMsg = document.getElementById('loginMsg');

const discountForm = document.getElementById('discountForm');
const discountCode = document.getElementById('discountCode');
const discountResult = document.getElementById('discountResult');

const ordersSection = document.getElementById('ordersSection');
const ordersList = document.getElementById('ordersList');

// 🧠 Funkcje pomocnicze
function updateAuthUI() {
  const loggedIn = !!session?.user;
  btnLogin.classList.toggle('hidden', loggedIn);
  btnLogout.classList.toggle('hidden', !loggedIn);
  userEmail.classList.toggle('hidden', !loggedIn);
  if (loggedIn) userEmail.textContent = session.user.email;
  ordersSection.classList.toggle('hidden', !loggedIn);
}

async function loadOrders() {
  if (!session?.user) return;
  const { data, error } = await supabase
    .from('orders')
    .select('product_id, amount, created_at')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  ordersList.innerHTML = '';
  if (data?.length) {
    data.forEach(order => {
      const li = document.createElement('li');
      li.textContent = `🧾 ${order.product_id} – ${order.amount} zł – ${new Date(order.created_at).toLocaleString()}`;
      ordersList.appendChild(li);
    });
  } else {
    ordersList.innerHTML = '<li>Brak zamówień.</li>';
  }
}

// 🔐 Logowanie / Rejestracja
btnLogin.addEventListener('click', () => loginModal.showModal());
btnLogout.addEventListener('click', async () => {
  await supabase.auth.signOut();
});

btnSignIn.addEventListener('click', async () => {
  loginMsg.textContent = 'Logowanie...';
  const { error } = await supabase.auth.signInWithPassword({
    email: loginEmail.value.trim(),
    password: loginPassword.value
  });
  loginMsg.textContent = error ? 'Błąd: ' + error.message : 'Zalogowano!';
  if (!error) loginModal.close();
});

btnSignUp.addEventListener('click', async () => {
  loginMsg.textContent = 'Rejestracja...';
  const { error } = await supabase.auth.signUp({
    email: loginEmail.value.trim(),
    password: loginPassword.value
  });
  loginMsg.textContent = error ? 'Błąd: ' + error.message : 'Konto utworzone!';
  if (!error) loginModal.close();
});

// 🎟️ Sprawdzenie kodu rabatowego
discountForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const code = discountCode.value.trim();
  if (!code) return;

  discountResult.textContent = 'Sprawdzam...';
  const { data, error } = await supabase
    .from('discount_codes')
    .select('*')
    .eq('code', code)
    .single();

  if (error || !data) {
    discountResult.textContent = 'Kod nieprawidłowy lub wygasł.';
  } else {
    discountResult.textContent = `✅ Kod aktywny: -${data.value} zł`;
  }
});

// 🔄 Zmiana stanu logowania
supabase.auth.onAuthStateChange((_event, newSession) => {
  session = newSession;
  updateAuthUI();
  loadOrders();
});

// 🔁 Inicjalizacja
(async () => {
  const { data } = await supabase.auth.getSession();
  session = data.session;
  updateAuthUI();
  loadOrders();
})();