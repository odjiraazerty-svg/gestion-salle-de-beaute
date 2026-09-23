import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: './server/.env' });

console.log('====================================================');
console.log('🚀 SUITE DE TESTS - CONNEXION & DONNÉES SUPABASE');
console.log('====================================================');
console.log('📍 Target DATABASE_URL :', process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@') : 'NON DÉFINIE');

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

async function runTests() {
  let passed = 0;
  let failed = 0;

  // TEST 1 : Ping Supabase
  try {
    const res = await pool.query('SELECT NOW() as now, current_database() as db, version() as version');
    console.log('\n[TEST 1] ✅ Connexion directe Supabase réussie');
    console.log(`   - Base : ${res.rows[0].db}`);
    console.log(`   - Heure serveur Supabase : ${res.rows[0].now}`);
    passed++;
  } catch (err) {
    console.error('\n[TEST 1] ❌ Échec de la connexion Supabase :', err.message);
    failed++;
  }

  // TEST 2 : Structure des tables
  try {
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    const tables = tablesRes.rows.map(r => r.table_name);
    console.log('\n[TEST 2] ✅ Tables publiques Supabase détectées :');
    console.log('   - ' + tables.join(', '));
    passed++;
  } catch (err) {
    console.error('\n[TEST 2] ❌ Erreur lors de la lecture des tables :', err.message);
    failed++;
  }

  // TEST 3 : Comptage des données existantes
  try {
    console.log('\n[TEST 3] 📊 État actuel des données dans Supabase :');
    const counts = [
      { name: 'Utilisateurs (users)', query: 'SELECT COUNT(*) FROM users' },
      { name: 'Salons (salons)', query: 'SELECT COUNT(*) FROM salons' },
      { name: 'Services (services)', query: 'SELECT COUNT(*) FROM services' },
      { name: 'Prestations par Salon (prestation_salons)', query: 'SELECT COUNT(*) FROM prestation_salons' },
      { name: 'Collaborateurs (staff)', query: 'SELECT COUNT(*) FROM staff' },
      { name: 'Clients (clients)', query: 'SELECT COUNT(*) FROM clients' },
      { name: 'Rendez-vous (appointments)', query: 'SELECT COUNT(*) FROM appointments' },
    ];

    for (const item of counts) {
      try {
        const cRes = await pool.query(item.query);
        console.log(`   - ${item.name} : ${cRes.rows[0].count} enregistrement(s)`);
      } catch (e) {
        console.log(`   - ${item.name} : Table absente ou erreur (${e.message})`);
      }
    }
    passed++;
  } catch (err) {
    console.error('\n[TEST 3] ❌ Erreur lors du comptage :', err.message);
    failed++;
  }

  // TEST 4 : Test de l'API HTTP locale
  try {
    console.log('\n[TEST 4] 🌐 Test des endpoints API locaux (http://localhost:5000) :');
    
    // Health check
    const healthRes = await fetch('http://localhost:5000/api/health').then(r => r.json()).catch(() => null);
    if (healthRes && healthRes.database === 'connected') {
      console.log('   - /api/health : ✅ OK (Base connectée)');
    } else {
      console.log('   - /api/health : ⚠️ Non joignable ou base déconnectée');
    }

    // Salons
    const salonsRes = await fetch('http://localhost:5000/api/salons').then(r => r.json()).catch(() => null);
    if (Array.isArray(salonsRes)) {
      console.log(`   - /api/salons : ✅ OK (${salonsRes.length} salons renvoyés)`);
    } else {
      console.log('   - /api/salons : ⚠️ Réponse inattendue');
    }

    // Services
    const servicesRes = await fetch('http://localhost:5000/api/services').then(r => r.json()).catch(() => null);
    if (Array.isArray(servicesRes)) {
      console.log(`   - /api/services : ✅ OK (${servicesRes.length} services renvoyés)`);
    } else {
      console.log('   - /api/services : ⚠️ Réponse inattendue');
    }

    passed++;
  } catch (err) {
    console.error('\n[TEST 4] ⚠️ Erreur lors du test API :', err.message);
  }

  console.log('\n====================================================');
  console.log(`🏁 FIN DES TESTS : ${passed} réussi(s), ${failed} échoué(s)`);
  console.log('====================================================\n');

  await pool.end();
}

runTests();
