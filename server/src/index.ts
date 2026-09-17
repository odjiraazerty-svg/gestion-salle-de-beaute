import express, { Request, Response } from 'express';
import cors from 'cors';
import { pool } from './db';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logger middleware
app.use((req: Request, _res: Response, next) => {
  console.log(`📡 [${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const sanitized = { ...req.body };
    if (sanitized.image && sanitized.image.length > 200) sanitized.image = sanitized.image.slice(0, 50) + '...[base64]';
    if (sanitized.image_ulistration && sanitized.image_ulistration.length > 200) sanitized.image_ulistration = sanitized.image_ulistration.slice(0, 50) + '...[base64]';
    if (sanitized.logo && sanitized.logo.length > 200) sanitized.logo = sanitized.logo.slice(0, 50) + '...[base64]';
    if (sanitized.coverImage && sanitized.coverImage.length > 200) sanitized.coverImage = sanitized.coverImage.slice(0, 50) + '...[base64]';
    console.log('   Payload:', JSON.stringify(sanitized));
  }
  next();
});

app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time, version()');
    res.json({ status: 'ok', database: 'connected', time: result.rows[0].current_time });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Admin Reset Database (Truncate all tables)
app.post('/api/admin/reset-database', async (_req: Request, res: Response) => {
  try {
    await pool.query('TRUNCATE TABLE appointments, services, staff, clients, users, salons CASCADE');
    console.log('🧹 [DATABASE RESET] Toutes les tables ont été vidées avec succès.');
    res.json({ status: 'success', message: 'Toutes les tables ont été réinitialisées avec succès.' });
  } catch (err: any) {
    console.error('Error resetting database:', err);
    res.status(500).json({ error: err.message });
  }
});

// 1. SALONS
app.get('/api/salons', async (req: Request, res: Response) => {
  const { ownerId, userId, id_user, universe } = req.query;
  const filterOwner = ownerId || userId || id_user;
  try {
    let query = `
      SELECT 
        id, name, slug, tagline, address, city, postal_code as "postalCode", 
        phone, email, currency, logo, cover_image as "coverImage",
        COALESCE(universe, univers, 'mixte') as "universe",
        COALESCE(univers, universe, 'mixte') as "univers",
        json_build_object('days', opening_days, 'hours', opening_hours) as "openingHours",
        rating::float, reviews_count as "reviewsCount", 
        COALESCE(id_user, owner_id) as "id_user",
        COALESCE(id_user, owner_id) as "userId",
        COALESCE(owner_id, id_user) as "ownerId", 
        created_at as "createdAt"
      FROM salons
      WHERE 1=1
    `;
    const params: any[] = [];
    if (filterOwner) {
      params.push(filterOwner);
      query += ` AND (owner_id = $${params.length} OR id_user = $${params.length})`;
    }
    if (universe && universe !== 'all') {
      params.push(universe);
      query += ` AND (LOWER(COALESCE(universe, univers, 'mixte')) = LOWER($${params.length}) OR LOWER(COALESCE(universe, univers, 'mixte')) = 'mixte')`;
    }
    query += ` ORDER BY created_at DESC, name ASC`;
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create Salon
app.post('/api/salons', async (req: Request, res: Response) => {
  try {
    const {
      name,
      tagline,
      address,
      city,
      postalCode,
      phone,
      email,
      currency,
      universe,
      univers,
      universeType,
      logo,
      coverImage,
      openingDays,
      openingHours,
      ownerId,
      id_user,
      userId
    } = req.body;

    if (!name || !address || !city) {
      return res.status(400).json({ error: 'Nom, adresse et ville sont obligatoires' });
    }

    const finalUniverse = universe || univers || universeType || 'mixte';

    const id = `salon-${Date.now().toString().slice(-6)}`;
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    const defaultLogo = logo || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=150&auto=format&fit=crop&q=80';
    const defaultCover = coverImage || 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1000&auto=format&fit=crop&q=80';

    // Le owner_id DOIT correspondre strictement à l'id de l'utilisateur (propriétaire) dans la table users
    let finalOwnerId = id_user || userId || ownerId || null;

    if (finalOwnerId) {
      const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [finalOwnerId]);
      if (userCheck.rows.length === 0) {
        // L'ID n'existe pas encore dans users. Vérifier si un compte existe par email
        let matchedUserId: string | null = null;
        if (email) {
          const emailCheck = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
          if (emailCheck.rows.length > 0) {
            matchedUserId = emailCheck.rows[0].id;
          }
        }

        if (matchedUserId) {
          finalOwnerId = matchedUserId;
        } else {
          // Créer l'utilisateur propriétaire dans la table users pour garantir que owner_id existe dans users
          const ownerEmail = email && email.includes('@') ? email.trim().toLowerCase() : `owner-${finalOwnerId}@salon.com`;
          const ownerName = name ? `Propriétaire - ${name}` : 'Gérant Salon';
          await pool.query(`
            INSERT INTO users (id, email, password_hash, name, role, phone, city, address, avatar, salon_id, salon_name)
            VALUES ($1, $2, $3, $4, 'owner', $5, $6, $7, $8, $9, $10)
            ON CONFLICT (id) DO UPDATE SET salon_id = EXCLUDED.salon_id, salon_name = EXCLUDED.salon_name
          `, [
            finalOwnerId,
            ownerEmail,
            '1234',
            ownerName,
            phone || '',
            city || '',
            address || '',
            'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200',
            id,
            name
          ]);
          console.log(`👤 [AUTO-CREATE USER] Utilisateur propriétaire ${finalOwnerId} créé dans la table users.`);
        }
      }
    } else if (email) {
      const emailCheck = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
      if (emailCheck.rows.length > 0) {
        finalOwnerId = emailCheck.rows[0].id;
      } else {
        finalOwnerId = `usr-${Date.now().toString().slice(-6)}`;
        await pool.query(`
          INSERT INTO users (id, email, password_hash, name, role, phone, city, address, avatar, salon_id, salon_name)
          VALUES ($1, $2, $3, $4, 'owner', $5, $6, $7, $8, $9, $10)
        `, [
          finalOwnerId,
          email.trim().toLowerCase(),
          '1234',
          `Propriétaire - ${name}`,
          phone || '',
          city || '',
          address || '',
          'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200',
          id,
          name
        ]);
      }
    }

    const insertQuery = `
      INSERT INTO salons (
        id, name, slug, tagline, address, city, postal_code,
        phone, email, currency, univers, universe, logo, cover_image, opening_days, opening_hours, rating, reviews_count, owner_id, id_user
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11, $12, $13, $14, $15, 5.00, 0, $16, $17)
      RETURNING 
        id, name, slug, tagline, address, city, postal_code as "postalCode",
        phone, email, currency, 
        COALESCE(universe, univers, 'mixte') as "universe",
        COALESCE(univers, universe, 'mixte') as "univers",
        logo, cover_image as "coverImage",
        json_build_object('days', opening_days, 'hours', opening_hours) as "openingHours",
        rating::float, reviews_count as "reviewsCount", 
        owner_id as "ownerId", id_user as "id_user", id_user as "userId", created_at as "createdAt"
    `;

    const { rows } = await pool.query(insertQuery, [
      id,
      name,
      slug,
      tagline || 'Salon de Beauté, Soins & Coiffure Haute Gamme',
      address,
      city,
      postalCode || '',
      phone || '',
      email || '',
      currency || 'FCFA',
      finalUniverse,
      defaultLogo,
      defaultCover,
      openingDays || 'Mardi au Samedi',
      openingHours || '09:00 - 19:30',
      finalOwnerId || null,
      finalOwnerId || null
    ]);

    const createdSalon = rows[0];

    // Mettre à jour l'utilisateur propriétaire avec son salon actif s'il n'en a pas
    if (finalOwnerId) {
      await pool.query(
        'UPDATE users SET salon_id = $1, salon_name = $2 WHERE id = $3 AND (salon_id IS NULL OR salon_id = \'\')',
        [id, name, finalOwnerId]
      ).catch(e => console.warn('Erreur mise a jour user salon_id:', e));
    }

    // Enregistrement des prestations personnalisées du salon dans la table prestation_salons
    const { prestations, services: initialServices } = req.body;
    const selectedPrestations = (prestations || initialServices || []);
    if (Array.isArray(selectedPrestations) && selectedPrestations.length > 0) {
      console.log(`📦 [POST /api/salons] ${selectedPrestations.length} prestation(s) reçue(s) pour le salon ${id}:`, JSON.stringify(selectedPrestations));
      for (const p of selectedPrestations) {
        const srvId = p.serviceId || p.id_service || p.id;
        if (!srvId) continue;
        const cout = parseFloat(p.cout ?? p.price ?? 0);
        const duree = parseInt(p.duree ?? p.duration ?? 30, 10);
        const psId = `ps-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

        try {
          // Vérifier si le service existe dans la table services
          const srvCheck = await pool.query('SELECT id FROM services WHERE id = $1', [srvId]);
          if (srvCheck.rows.length === 0) {
            // Créer le service s'il s'agit d'une nouvelle prestation créée à la volée
            const srvNom = p.nom || p.name || 'Prestation Beauté';
            const srvUnivers = p.univers || p.universe || 'Dame';
            const srvDesc = p.description || 'Prestation personnalisée';
            const srvImg = p.image || p.image_ulistration || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=700';
            await pool.query(`
              INSERT INTO services (id, id_service, nom, name, description, univers, universe, image_ulistration, image, price, duration, salon_id, id_user)
              VALUES ($1, $1, $2, $2, $3, $4, $4, $5, $5, $6, $7, $8, $9)
            `, [srvId, srvNom, srvDesc, srvUnivers, srvImg, cout, duree, id, finalOwnerId]);
            console.log(`✨ [AUTO-CREATE SERVICE] Service ${srvNom} (${srvId}) inséré pour le salon ${id}`);
          }

          await pool.query(`
            INSERT INTO prestation_salons (id, id_salon, id_service, cout, duree, id_user)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (id_salon, id_service) 
            DO UPDATE SET cout = EXCLUDED.cout, duree = EXCLUDED.duree, id_user = COALESCE(EXCLUDED.id_user, prestation_salons.id_user)
          `, [psId, id, srvId, cout, duree, finalOwnerId]);
          console.log(`  -> Prestation liée: ${srvId} | Coût: ${cout} | Durée: ${duree}min | User: ${finalOwnerId}`);
        } catch (err: any) {
          console.warn(`⚠️ [PRESTATION_SALONS] Erreur insertion prestation ${srvId} pour salon ${id}:`, err.message || err);
        }
      }
      console.log(`✅ [PRESTATION_SALONS] Traitement terminé pour le salon ${name} (${id})`);
    }

    res.status(201).json(createdSalon);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Services assigned to a specific salon with their custom prices and durations
app.get('/api/salons/:id/services', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(`
      SELECT 
        s.id,
        COALESCE(s.id_service, s.id) as "id_service",
        COALESCE(s.nom, s.name) as "nom",
        COALESCE(s.name, s.nom) as "name",
        s.description,
        COALESCE(s.univers, s.universe) as "univers",
        COALESCE(s.universe, s.univers) as "universe",
        COALESCE(s.image_ulistration, s.image) as "image_ulistration",
        COALESCE(s.image, s.image_ulistration) as "image",
        COALESCE(s.sub_category, 'Prestation') as "subCategory",
        COALESCE(ps.cout, s.price, 0)::float as "price",
        COALESCE(ps.cout, s.price, 0)::float as "cout",
        COALESCE(ps.duree, s.duration, 30) as "duration",
        COALESCE(ps.duree, s.duration, 30) as "duree",
        ps.id as "prestationSalonId",
        $1 as "salonId",
        ps.created_at as "assignedAt"
      FROM prestation_salons ps
      JOIN services s ON s.id = ps.id_service
      WHERE ps.id_salon = $1
      ORDER BY s.nom ASC, s.name ASC
    `, [id]);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint global pour récupérer toutes les prestations répertoriées dans prestation_salons (filtrées par ville, quartier, univers, etc.)
app.get('/api/prestation-salons', async (req: Request, res: Response) => {
  const { city, ville, quartier, district, postalCode, universe, univers, salonId, search } = req.query;
  const filterCity = (city || ville || '').toString().trim();
  const filterQuartier = (quartier || district || postalCode || '').toString().trim();
  const filterUniverse = (universe || univers || '').toString().trim();
  const filterSearch = (search || '').toString().trim();
  const filterSalonId = (salonId || '').toString().trim();

  try {
    let query = `
      SELECT 
        ps.id as "id",
        ps.id as "prestationSalonId",
        ps.id_service as "id_service",
        s.id as "serviceId",
        COALESCE(s.nom, s.name) as "nom",
        COALESCE(s.name, s.nom) as "name",
        s.description,
        COALESCE(s.univers, s.universe) as "univers",
        COALESCE(s.universe, s.univers) as "universe",
        COALESCE(s.image_ulistration, s.image) as "image_ulistration",
        COALESCE(s.image, s.image_ulistration) as "image",
        COALESCE(s.sub_category, 'Prestation') as "subCategory",
        COALESCE(ps.cout, s.price, 0)::float as "price",
        COALESCE(ps.cout, s.price, 0)::float as "cout",
        COALESCE(ps.duree, s.duration, 30) as "duration",
        COALESCE(ps.duree, s.duration, 30) as "duree",
        ps.id_salon as "salonId",
        sal.name as "salonName",
        sal.city as "salonCity",
        sal.city as "city",
        COALESCE(sal.postal_code, sal.address, '') as "salonQuartier",
        COALESCE(sal.postal_code, sal.address, '') as "quartier",
        sal.address as "salonAddress",
        COALESCE(sal.currency, 'FCFA') as "salonCurrency",
        sal.logo as "salonLogo",
        sal.cover_image as "salonCoverImage",
        sal.rating as "salonRating",
        sal.reviews_count as "salonReviewsCount",
        COALESCE(ps.id_user, s.id_user) as "id_user",
        COALESCE(ps.id_user, s.id_user) as "userId",
        COALESCE(s.popular, false) as "popular",
        COALESCE(s.featured, false) as "featured",
        ps.created_at as "createdAt"
      FROM prestation_salons ps
      JOIN services s ON s.id = ps.id_service
      JOIN salons sal ON sal.id = ps.id_salon
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filterSalonId) {
      params.push(filterSalonId);
      query += ` AND ps.id_salon = $${params.length}`;
    }

    if (filterCity && filterCity !== 'all' && filterCity !== 'Toutes') {
      params.push(`%${filterCity}%`);
      query += ` AND LOWER(sal.city) LIKE LOWER($${params.length})`;
    }

    if (filterQuartier && filterQuartier !== 'all' && filterQuartier !== 'Tous') {
      params.push(`%${filterQuartier}%`);
      query += ` AND (LOWER(sal.postal_code) LIKE LOWER($${params.length}) OR LOWER(sal.address) LIKE LOWER($${params.length}))`;
    }

    if (filterUniverse && filterUniverse !== 'all') {
      params.push(filterUniverse);
      query += ` AND (LOWER(s.univers) = LOWER($${params.length}) OR LOWER(s.universe) = LOWER($${params.length}))`;
    }

    if (filterSearch) {
      params.push(`%${filterSearch}%`);
      query += ` AND (
        LOWER(s.nom) LIKE LOWER($${params.length}) OR 
        LOWER(s.name) LIKE LOWER($${params.length}) OR 
        LOWER(s.description) LIKE LOWER($${params.length}) OR 
        LOWER(s.sub_category) LIKE LOWER($${params.length}) OR 
        LOWER(sal.name) LIKE LOWER($${params.length})
      )`;
    }

    query += ' ORDER BY sal.city ASC, sal.name ASC, s.nom ASC';
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err: any) {
    console.error('❌ [GET /api/prestation-salons ERROR]:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update or add Services for a specific salon
app.post('/api/salons/:id/services', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { prestations, id_user, userId } = req.body;
  const finalUserId = id_user || userId || null;
  try {
    if (Array.isArray(prestations)) {
      for (const p of prestations) {
        const srvId = p.serviceId || p.id_service || p.id;
        if (!srvId) continue;
        const cout = parseFloat(p.cout || p.price || 0);
        const duree = parseInt(p.duree || p.duration || 30, 10);
        const psId = `ps-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
        await pool.query(`
          INSERT INTO prestation_salons (id, id_salon, id_service, cout, duree, id_user)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (id_salon, id_service) 
          DO UPDATE SET cout = EXCLUDED.cout, duree = EXCLUDED.duree, id_user = COALESCE(EXCLUDED.id_user, prestation_salons.id_user)
        `, [psId, id, srvId, cout, duree, finalUserId]);
      }
    }
    res.json({ success: true, message: 'Prestations enregistrées pour le salon avec succès.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Salon
app.put('/api/salons/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const {
      name,
      tagline,
      address,
      city,
      postalCode,
      phone,
      email,
      currency,
      universe,
      univers,
      universeType,
      logo,
      coverImage,
      openingDays,
      openingHours,
      prestations,
      ownerId,
      id_user,
      userId
    } = req.body;

    const finalUserId = id_user || userId || ownerId || null;
    const finalUniverse = universe || univers || universeType || null;

    const query = `
      UPDATE salons SET
        name = COALESCE($1, name),
        tagline = COALESCE($2, tagline),
        address = COALESCE($3, address),
        city = COALESCE($4, city),
        postal_code = COALESCE($5, postal_code),
        phone = COALESCE($6, phone),
        email = COALESCE($7, email),
        currency = COALESCE($8, currency),
        logo = COALESCE($9, logo),
        cover_image = COALESCE($10, cover_image),
        opening_days = COALESCE($11, opening_days),
        opening_hours = COALESCE($12, opening_hours),
        owner_id = COALESCE($13, owner_id),
        id_user = COALESCE($14, id_user, owner_id),
        univers = COALESCE($15, univers),
        universe = COALESCE($15, universe)
      WHERE id = $16
      RETURNING 
        id, name, slug, tagline, address, city, postal_code as "postalCode",
        phone, email, currency, 
        COALESCE(universe, univers, 'mixte') as "universe",
        COALESCE(univers, universe, 'mixte') as "univers",
        logo, cover_image as "coverImage",
        json_build_object('days', opening_days, 'hours', opening_hours) as "openingHours",
        rating::float, reviews_count as "reviewsCount",
        owner_id as "ownerId", id_user as "id_user", id_user as "userId"
    `;

    const { rows } = await pool.query(query, [
      name, tagline, address, city, postalCode, phone, email, currency,
      logo, coverImage, openingDays, openingHours, finalUserId, finalUserId, finalUniverse, id
    ]);

    if (rows.length === 0) return res.status(404).json({ error: 'Salon introuvable' });

    // Synchronize prestations if provided
    if (Array.isArray(prestations)) {
      console.log(`💈 [UPDATE SALON PRESTATIONS] Synchronisation de ${prestations.length} prestation(s) pour le salon ${id}`);
      
      // Delete existing prestations for this salon
      await pool.query(`DELETE FROM prestation_salons WHERE id_salon = $1`, [id]);
      
      for (const p of prestations) {
        const srvId = p.serviceId || p.id_service || p.id;
        if (!srvId) continue;
        const cout = parseFloat(p.cout || p.price || 0);
        const duree = parseInt(p.duree || p.duration || 30, 10);
        const psId = `ps-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
        
        // Ensure service row exists
        const checkSrv = await pool.query('SELECT id FROM services WHERE id = $1', [srvId]);
        if (checkSrv.rows.length === 0) {
          const srvName = p.nom || p.name || 'Prestation';
          const srvUniv = p.univers || p.universe || 'Mixte';
          const srvDesc = p.description || 'Prestation de beauté';
          const srvImg = p.image || p.image_ulistration || '';
          await pool.query(`
            INSERT INTO services (id, id_service, nom, name, description, univers, universe, image_ulistration, image, price, duration, salon_id, id_user)
            VALUES ($1, $1, $2, $2, $3, $4, $4, $5, $5, $6, $7, $8, $9)
          `, [srvId, srvName, srvDesc, srvUniv, srvImg, cout, duree, id, finalUserId]);
        }

        await pool.query(`
          INSERT INTO prestation_salons (id, id_salon, id_service, cout, duree, id_user)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (id_salon, id_service) 
          DO UPDATE SET cout = EXCLUDED.cout, duree = EXCLUDED.duree, id_user = COALESCE(EXCLUDED.id_user, prestation_salons.id_user)
        `, [psId, id, srvId, cout, duree, finalUserId]);
      }
    }

    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a specific service from a salon
app.delete('/api/salons/:id/services/:serviceId', async (req: Request, res: Response) => {
  const { id, serviceId } = req.params;
  try {
    await pool.query(`
      DELETE FROM prestation_salons 
      WHERE id_salon = $1 AND (id_service = $2 OR id = $2)
    `, [id, serviceId]);
    res.json({ success: true, message: 'Prestation retirée du salon avec succès.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Salon with cascade
app.delete('/api/salons/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    console.log(`🗑️ [DELETE SALON] Suppression demandée pour le salon id: ${id}`);
    await client.query('BEGIN');
    
    // 1. Supprimer toutes les liaisons prestation_salons liées au salon ou à ses services
    await client.query(`
      DELETE FROM prestation_salons 
      WHERE id_salon = $1 
         OR id_service IN (SELECT id FROM services WHERE salon_id = $1)
    `, [id]);

    // 2. Supprimer tous les rendez-vous liés au salon, à ses services ou à son staff
    await client.query(`
      DELETE FROM appointments 
      WHERE salon_id = $1 
         OR service_id IN (SELECT id FROM services WHERE salon_id = $1)
         OR staff_id IN (SELECT id FROM staff WHERE salon_id = $1)
    `, [id]);

    // 3. Supprimer les collaborateurs du salon
    await client.query('DELETE FROM staff WHERE salon_id = $1', [id]);

    // 4. Supprimer les services créés pour ce salon
    await client.query('DELETE FROM services WHERE salon_id = $1', [id]);

    // 5. Supprimer le salon
    const deleteRes = await client.query('DELETE FROM salons WHERE id = $1', [id]);
    await client.query('COMMIT');

    console.log(`✅ [DELETE SALON] Salon ${id} supprimé avec succès de la base PostgreSQL (lignes: ${deleteRes.rowCount})`);

    if (deleteRes.rowCount === 0) {
      return res.status(404).json({ error: 'Salon introuvable en base de données' });
    }
    res.json({ success: true, message: 'Salon et données associées supprimés avec succès.' });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error(`❌ [DELETE SALON ERROR] Erreur lors de la suppression du salon ${id}:`, err);
    res.status(500).json({ error: err.message || 'Erreur lors de la suppression' });
  } finally {
    client.release();
  }
});


// 2. SERVICES / PRESTATIONS
app.get('/api/services', async (req: Request, res: Response) => {
  let { universe, salonId, ownerId, userId, id_user } = req.query;
  const filterUser = id_user || userId || ownerId;
  try {
    if (salonId) {
      // Vérifier si le salon a des prestations personnalisées dans prestation_salons
      const psCheck = await pool.query('SELECT COUNT(*) as count FROM prestation_salons WHERE id_salon = $1', [salonId]);
      const hasCustomPrestations = parseInt(psCheck.rows[0].count, 10) > 0;
      if (hasCustomPrestations) {
        let psQuery = `
          SELECT 
            s.id,
            COALESCE(s.id_service, s.id) as "id_service",
            COALESCE(s.nom, s.name) as "nom",
            COALESCE(s.name, s.nom) as "name",
            s.description,
            COALESCE(s.univers, s.universe) as "univers",
            COALESCE(s.universe, s.univers) as "universe",
            COALESCE(s.image_ulistration, s.image) as "image_ulistration",
            COALESCE(s.image, s.image_ulistration) as "image",
            COALESCE(s.sub_category, 'Prestation') as "subCategory",
            COALESCE(ps.cout, s.price, 0)::float as "price",
            COALESCE(ps.cout, s.price, 0)::float as "cout",
            COALESCE(ps.duree, s.duration, 30) as "duration",
            COALESCE(ps.duree, s.duration, 30) as "duree",
            $1 as "salonId",
            COALESCE(ps.id_user, s.id_user) as "id_user",
            COALESCE(ps.id_user, s.id_user) as "userId",
            COALESCE(s.popular, false) as "popular",
            COALESCE(s.featured, false) as "featured",
            s.created_at as "createdAt"
          FROM prestation_salons ps
          JOIN services s ON s.id = ps.id_service
          WHERE ps.id_salon = $1
        `;
        const psParams: any[] = [salonId];
        if (universe && universe !== 'all') {
          psParams.push(universe);
          psQuery += ` AND (LOWER(s.univers) = LOWER($${psParams.length}) OR LOWER(s.universe) = LOWER($${psParams.length}))`;
        }
        psQuery += ' ORDER BY s.nom ASC, s.name ASC';
        const psRes = await pool.query(psQuery, psParams);
        return res.json(psRes.rows);
      }
    }

    let query = `
      SELECT 
        id,
        COALESCE(id_service, id) as "id_service",
        COALESCE(nom, name) as "nom",
        COALESCE(name, nom) as "name",
        description,
        COALESCE(univers, universe) as "univers",
        COALESCE(universe, univers) as "universe",
        COALESCE(image_ulistration, image) as "image_ulistration",
        COALESCE(image, image_ulistration) as "image",
        COALESCE(sub_category, 'Prestation') as "subCategory",
        COALESCE(price, 0)::float as "price",
        COALESCE(duration, 30) as "duration",
        salon_id as "salonId",
        id_user as "id_user",
        id_user as "userId",
        COALESCE(popular, false) as "popular",
        COALESCE(featured, false) as "featured",
        created_at as "createdAt"
      FROM services
      WHERE 1=1
    `;
    const params: any[] = [];
    if (universe && universe !== 'all') {
      params.push(universe);
      query += ` AND (LOWER(univers) = LOWER($${params.length}) OR LOWER(universe) = LOWER($${params.length}))`;
    }
    if (salonId) {
      params.push(salonId);
      query += ` AND (salon_id = $${params.length} OR salon_id IS NULL)`;
    }
    if (filterUser) {
      params.push(filterUser);
      query += ` AND (id_user = $${params.length} OR salon_id IN (SELECT id FROM salons WHERE owner_id = $${params.length} OR id_user = $${params.length}) OR salon_id IS NULL)`;
    }
    query += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err: any) {
    console.error('❌ Error getting services:', err);
    res.status(500).json({ error: err.message });
  }
});

// Create Service
app.post('/api/services', async (req: Request, res: Response) => {
  let { nom, name, description, univers, universe, image_ulistration, image, price, duration, subCategory, sub_category, salonId, salon_id, id_user, userId, ownerId } = req.body;
  try {
    const finalNom = (nom || name || '').trim();
    if (!finalNom) {
      return res.status(400).json({ error: 'Le nom de la prestation est obligatoire.' });
    }

    // Univers autorisé : Homme, Dame, Enfant, Adolescent
    let finalUnivers = univers || universe || 'Dame';
    const validUniverses = ['Homme', 'Dame', 'Enfant', 'Adolescent'];
    if (!validUniverses.includes(finalUnivers)) {
      if (finalUnivers.toLowerCase() === 'femme' || finalUnivers.toLowerCase() === 'dame') finalUnivers = 'Dame';
      else if (finalUnivers.toLowerCase() === 'homme') finalUnivers = 'Homme';
      else if (finalUnivers.toLowerCase() === 'enfant') finalUnivers = 'Enfant';
      else if (finalUnivers.toLowerCase() === 'adolescent' || finalUnivers.toLowerCase() === 'ado' || finalUnivers.toLowerCase() === 'mixte') finalUnivers = 'Adolescent';
      else finalUnivers = 'Dame';
    }

    const finalDescription = (description || '').trim();
    const finalImage = image_ulistration || image || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600';
    const finalPrice = typeof price === 'number' ? price : (parseFloat(price) || 0);
    const finalDuration = typeof duration === 'number' ? duration : (parseInt(duration, 10) || 30);
    const finalSubCategory = subCategory || sub_category || 'Prestation';
    const finalSalonId = salonId || salon_id || null;
    const finalUserId = id_user || userId || ownerId || null;
    
    // Génération automatique de l'ID à l'enregistrement
    const srvId = `srv-${Date.now().toString().slice(-6)}`;

    const query = `
      INSERT INTO services (
        id, id_service, nom, name, description, univers, universe, image_ulistration, image, price, duration, sub_category, salon_id, id_user
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING 
        id,
        COALESCE(id_service, id) as "id_service",
        COALESCE(nom, name) as "nom",
        COALESCE(name, nom) as "name",
        description,
        COALESCE(univers, universe) as "univers",
        COALESCE(universe, univers) as "universe",
        COALESCE(image_ulistration, image) as "image_ulistration",
        COALESCE(image, image_ulistration) as "image",
        COALESCE(sub_category, 'Prestation') as "subCategory",
        COALESCE(price, 0)::float as "price",
        COALESCE(duration, 30) as "duration",
        salon_id as "salonId",
        id_user as "id_user",
        id_user as "userId",
        created_at as "createdAt"
    `;
    const { rows } = await pool.query(query, [
      srvId,
      srvId,
      finalNom,
      finalNom,
      finalDescription,
      finalUnivers,
      finalUnivers.toLowerCase(),
      finalImage,
      finalImage,
      finalPrice,
      finalDuration,
      finalSubCategory,
      finalSalonId,
      finalUserId
    ]);

    console.log(`✅ [SERVICE CREATED] Prestation "${finalNom}" (${srvId}) - User: ${finalUserId} enregistrée dans PostgreSQL !`);
    res.status(201).json(rows[0]);
  } catch (err: any) {
    console.error('❌ Error creating service:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update Service
app.put('/api/services/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nom, name, description, univers, universe, image_ulistration, image, price, duration, subCategory, sub_category, id_user, userId, ownerId } = req.body;
  const finalUserId = id_user || userId || ownerId || null;
  try {
    const finalNom = (nom || name || '').trim();
    let finalUnivers = univers || universe;
    const validUniverses = ['Homme', 'Dame', 'Enfant', 'Adolescent'];
    if (finalUnivers && !validUniverses.includes(finalUnivers)) {
      if (finalUnivers.toLowerCase() === 'femme' || finalUnivers.toLowerCase() === 'dame') finalUnivers = 'Dame';
      else if (finalUnivers.toLowerCase() === 'homme') finalUnivers = 'Homme';
      else if (finalUnivers.toLowerCase() === 'enfant') finalUnivers = 'Enfant';
      else if (finalUnivers.toLowerCase() === 'adolescent' || finalUnivers.toLowerCase() === 'ado' || finalUnivers.toLowerCase() === 'mixte') finalUnivers = 'Adolescent';
      else finalUnivers = 'Dame';
    }

    const { rows } = await pool.query(`
      UPDATE services
      SET 
        nom = COALESCE($1, nom),
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        univers = COALESCE($3, univers),
        universe = COALESCE($4, universe),
        image_ulistration = COALESCE($5, image_ulistration),
        image = COALESCE($5, image),
        price = COALESCE($6, price),
        duration = COALESCE($7, duration),
        sub_category = COALESCE($8, sub_category),
        id_user = COALESCE($9, id_user)
      WHERE id = $10 OR id_service = $10
      RETURNING 
        id,
        COALESCE(id_service, id) as "id_service",
        COALESCE(nom, name) as "nom",
        COALESCE(name, nom) as "name",
        description,
        COALESCE(univers, universe) as "univers",
        COALESCE(universe, univers) as "universe",
        COALESCE(image_ulistration, image) as "image_ulistration",
        COALESCE(image, image_ulistration) as "image",
        COALESCE(sub_category, 'Prestation') as "subCategory",
        COALESCE(price, 0)::float as "price",
        COALESCE(duration, 30) as "duration",
        salon_id as "salonId",
        id_user as "id_user",
        id_user as "userId",
        created_at as "createdAt"
    `, [
      finalNom || null,
      description !== undefined ? description.trim() : null,
      finalUnivers || null,
      finalUnivers ? finalUnivers.toLowerCase() : null,
      image_ulistration || image || null,
      price !== undefined ? parseFloat(price) : null,
      duration !== undefined ? parseInt(duration, 10) : null,
      subCategory || sub_category || null,
      finalUserId,
      id
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Prestation introuvable' });
    }
    res.json(rows[0]);
  } catch (err: any) {
    console.error('❌ Error updating service:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete Service
app.delete('/api/services/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM services WHERE id = $1 OR id_service = $1', [id]);
    res.json({ status: 'success', message: 'Prestation supprimée avec succès' });
  } catch (err: any) {
    console.error('❌ Error deleting service:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. STAFF / PRATICIENS
// 3. STAFF / PRATICIENS
app.get('/api/staff', async (req: Request, res: Response) => {
  const { salonId, ownerId, userId, id_user } = req.query;
  const filterOwner = id_user || userId || ownerId;
  try {
    let query = `
      SELECT 
        id, salon_id as "salonId", owner_id as "ownerId", 
        COALESCE(id_user, owner_id) as "id_user",
        COALESCE(id_user, owner_id) as "userId",
        name, role, avatar, universe,
        rating::float, reviews_count as "reviewsCount", bio,
        working_days as "workingDays", working_hours as "workingHours", color
      FROM staff
      WHERE 1=1
    `;
    const params: any[] = [];
    if (salonId && filterOwner) {
      params.push(salonId, filterOwner);
      query += ` AND (salon_id = $1 OR owner_id = $2 OR id_user = $2)`;
    } else if (salonId) {
      params.push(salonId);
      query += ` AND salon_id = $1`;
    } else if (filterOwner) {
      params.push(filterOwner);
      query += ` AND (owner_id = $1 OR id_user = $1 OR salon_id IN (SELECT id FROM salons WHERE owner_id = $1 OR id_user = $1))`;
    }
    query += ' ORDER BY name ASC';
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create Staff Member
app.post('/api/staff', async (req: Request, res: Response) => {
  try {
    const {
      name,
      role,
      salonId,
      ownerId,
      id_user,
      userId,
      avatar,
      universe,
      bio,
      workingDays,
      workingHours,
      color,
      email,
      phone,
      password
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Le nom du collaborateur est obligatoire' });
    }

    let finalOwnerId = id_user || userId || ownerId || null;
    if (!finalOwnerId && salonId) {
      const salCheck = await pool.query('SELECT owner_id, id_user FROM salons WHERE id = $1', [salonId]);
      if (salCheck.rows.length > 0) {
        finalOwnerId = salCheck.rows[0].id_user || salCheck.rows[0].owner_id;
      }
    }

    const id = `staff-${Date.now().toString().slice(-6)}`;
    const defaultAvatar = avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200';
    const finalWorkingDays = workingDays || [1, 2, 3, 4, 5, 6];
    const finalWorkingHours = workingHours || { start: '09:00', end: '19:00' };
    const finalUniverse = universe || ['femme', 'homme', 'enfant', 'mixte'];

    const insertQuery = `
      INSERT INTO staff (
        id, salon_id, owner_id, id_user, name, role, avatar, universe, rating, reviews_count, bio, working_days, working_hours, color
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 5.00, 0, $9, $10, $11, $12)
      RETURNING 
        id, salon_id as "salonId", owner_id as "ownerId", 
        id_user as "id_user", id_user as "userId",
        name, role, avatar, universe,
        rating::float, reviews_count as "reviewsCount", bio,
        working_days as "workingDays", working_hours as "workingHours", color
    `;

    const { rows } = await pool.query(insertQuery, [
      id,
      salonId || null,
      finalOwnerId,
      finalOwnerId,
      name,
      role || 'Collaborateur & Praticien',
      defaultAvatar,
      JSON.stringify(finalUniverse),
      bio || 'Praticien passionné et dévoué au bien-être de la clientèle.',
      JSON.stringify(finalWorkingDays),
      JSON.stringify(finalWorkingHours),
      color || 'blue'
    ]);

    // If email provided, create or update user login account as employee
    if (email) {
      try {
        const cleanEmail = email.trim().toLowerCase();
        const userCheck = await pool.query('SELECT id FROM users WHERE LOWER(email) = $1', [cleanEmail]);
        if (userCheck.rows.length === 0) {
          const userId = `usr-${Date.now().toString().slice(-6)}`;
          await pool.query(`
            INSERT INTO users (id, email, password_hash, name, role, phone, avatar)
            VALUES ($1, $2, $3, $4, 'employee', $5, $6)
          `, [
            userId,
            cleanEmail,
            password || '1234',
            name,
            phone || '',
            defaultAvatar
          ]);
        }
      } catch (userErr) {
        console.warn('Staff user creation warning:', userErr);
      }
    }

    res.status(201).json(rows[0]);
  } catch (err: any) {
    console.error('Error creating staff member:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update Staff Member
app.put('/api/staff/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const {
      name,
      role,
      salonId,
      ownerId,
      id_user,
      userId,
      avatar,
      universe,
      bio,
      workingDays,
      workingHours,
      color,
      rating,
      reviewsCount
    } = req.body;

    const finalUserId = id_user || userId || ownerId;

    const { rows } = await pool.query(`
      UPDATE staff SET
        name = COALESCE($1, name),
        role = COALESCE($2, role),
        salon_id = $3,
        owner_id = COALESCE($4, owner_id),
        id_user = COALESCE($5, id_user, owner_id),
        avatar = COALESCE($6, avatar),
        universe = COALESCE($7::jsonb, universe),
        bio = COALESCE($8, bio),
        working_days = COALESCE($9::jsonb, working_days),
        working_hours = COALESCE($10::jsonb, working_hours),
        color = COALESCE($11, color),
        rating = COALESCE($12, rating),
        reviews_count = COALESCE($13, reviews_count)
      WHERE id = $14
      RETURNING 
        id, salon_id as "salonId", owner_id as "ownerId", 
        id_user as "id_user", id_user as "userId",
        name, role, avatar, universe,
        rating::float, reviews_count as "reviewsCount", bio,
        working_days as "workingDays", working_hours as "workingHours", color
    `, [
      name,
      role,
      salonId !== undefined ? salonId : null,
      ownerId !== undefined ? ownerId : null,
      finalUserId !== undefined ? finalUserId : null,
      avatar,
      universe ? JSON.stringify(universe) : null,
      bio,
      workingDays ? JSON.stringify(workingDays) : null,
      workingHours ? JSON.stringify(workingHours) : null,
      color,
      rating !== undefined ? parseFloat(rating) : null,
      reviewsCount !== undefined ? parseInt(reviewsCount, 10) : null,
      id
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Collaborateur introuvable' });
    }
    res.json(rows[0]);
  } catch (err: any) {
    console.error('Error updating staff member:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete Staff Member
app.delete('/api/staff/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM staff WHERE id = $1', [id]);
    res.json({ status: 'success', message: 'Collaborateur supprimé avec succès' });
  } catch (err: any) {
    console.error('Error deleting staff member:', err);
    res.status(500).json({ error: err.message });
  }
});

// 4. CLIENTS
app.get('/api/clients', async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        id, name, phone, email, avatar, universe_preference as "universePreference",
        visits_count as "visitsCount", total_spent::float as "totalSpent",
        loyalty_points as "loyaltyPoints", last_visit as "lastVisit",
        favorite_service as "favoriteService", technical_notes as "technicalNotes",
        id_user as "id_user", id_user as "userId"
      FROM clients
      ORDER BY visits_count DESC
    `);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create Client
app.post('/api/clients', async (req: Request, res: Response) => {
  try {
    const { name, phone, email, avatar, universePreference, id_user, userId } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'Nom et téléphone sont obligatoires' });
    }
    const id = `cli-${Date.now().toString().slice(-6)}`;
    const finalUserId = id_user || userId || null;
    const { rows } = await pool.query(`
      INSERT INTO clients (id, name, phone, email, avatar, universe_preference, visits_count, total_spent, loyalty_points, id_user)
      VALUES ($1, $2, $3, $4, $5, $6, 0, 0.00, 100, $7)
      RETURNING 
        id, name, phone, email, avatar, universe_preference as "universePreference",
        visits_count as "visitsCount", total_spent::float as "totalSpent",
        loyalty_points as "loyaltyPoints", id_user as "id_user", id_user as "userId"
    `, [
      id,
      name.trim(),
      phone.trim(),
      email?.trim() || null,
      avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
      universePreference || 'femme',
      finalUserId
    ]);
    res.status(201).json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. APPOINTMENTS / RENDEZ-VOUS
app.get('/api/appointments', async (req: Request, res: Response) => {
  const { salonId, phone, clientPhone, email, clientEmail, ownerId, staffId, userId, id_user, role } = req.query;
  const filterPhone = (clientPhone || phone || '').toString().trim();
  const filterEmail = (clientEmail || email || '').toString().trim();
  const filterOwner = ownerId;
  const filterUser = (id_user || userId || '').toString().trim();

  try {
    let query = `
      SELECT 
        a.id, a.salon_id as "salonId", 
        COALESCE(a.salon_name, sal.name, 'Salon Partenaire') as "salonName",
        sal.city as "salonCity",
        sal.address as "salonAddress",
        COALESCE(sal.currency, 'FCFA') as "salonCurrency",
        sal.logo as "salonLogo",
        a.client_name as "clientName", a.client_phone as "clientPhone", a.client_email as "clientEmail",
        a.service_id as "serviceId", a.service_name as "serviceName",
        a.staff_id as "staffId", a.staff_name as "staffName",
        a.date, a.time, a.duration, a.price::float, a.universe, a.status, a.notes,
        a.qr_code as "qrCode", a.paid, a.payment_method as "paymentMethod",
        a.id_user as "id_user", a.id_user as "userId",
        a.created_at as "createdAt"
      FROM appointments a
      LEFT JOIN salons sal ON sal.id = a.salon_id
      WHERE 1=1
    `;
    const params: any[] = [];

    // 1. Si rôle COLLABORATEUR (EMPLOYEE) : Filtrer UNIQUEMENT par le collaborateur connecté (pas par salon)
    if (role === 'employee' || (staffId && !salonId && !filterOwner)) {
      const staffConditions: string[] = [];
      if (staffId) {
        params.push(staffId);
        staffConditions.push(`a.staff_id = $${params.length} OR a.id_user = $${params.length}`);
      }
      if (req.query.staffName) {
        params.push((req.query.staffName as string).toLowerCase().trim());
        staffConditions.push(`LOWER(a.staff_name) = $${params.length}`);
      }
      if (filterUser && filterUser !== staffId) {
        params.push(filterUser);
        staffConditions.push(`a.id_user = $${params.length} OR a.staff_id IN (SELECT id FROM staff WHERE id_user = $${params.length} OR owner_id = $${params.length})`);
      }
      if (staffConditions.length > 0) {
        query += ` AND (${staffConditions.join(' OR ')})`;
      }
    }
    // 2. Si rôle CLIENT : Filtrer UNIQUEMENT par le client connecté (pas par salon)
    else if (role === 'client' && (filterUser || filterPhone || filterEmail)) {
      const clientConditions: string[] = [];
      if (filterUser) {
        params.push(filterUser);
        clientConditions.push(`a.id_user = $${params.length}`);
      }
      if (filterPhone) {
        params.push(filterPhone);
        clientConditions.push(`a.client_phone = $${params.length}`);
      }
      if (filterEmail) {
        params.push(filterEmail.toLowerCase());
        clientConditions.push(`LOWER(a.client_email) = $${params.length}`);
      }
      if (clientConditions.length > 0) {
        query += ` AND (${clientConditions.join(' OR ')})`;
      }
    } 
    // 3. Vue PRO (OWNER) ou ADMIN
    else {
      if (salonId) {
        params.push(salonId);
        query += ` AND a.salon_id = $${params.length}`;
      }
      if (filterOwner) {
        params.push(filterOwner);
        query += ` AND (a.id_user = $${params.length} OR a.salon_id IN (SELECT id FROM salons WHERE owner_id = $${params.length} OR id_user = $${params.length}))`;
      }
      if (staffId) {
        params.push(staffId);
        query += ` AND a.staff_id = $${params.length}`;
      }
      if (filterPhone) {
        params.push(filterPhone);
        query += ` AND a.client_phone = $${params.length}`;
      }
      if (filterEmail) {
        params.push(filterEmail.toLowerCase());
        query += ` AND LOWER(a.client_email) = $${params.length}`;
      }
      if (filterUser) {
        params.push(filterUser);
        query += ` AND a.id_user = $${params.length}`;
      }
    }

    query += ' ORDER BY a.date DESC, a.time DESC';
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create Appointment
app.post('/api/appointments', async (req: Request, res: Response) => {
  try {
    const {
      salonId,
      salonName,
      clientName,
      clientPhone,
      clientEmail,
      serviceId,
      serviceName,
      staffId,
      staffName,
      date,
      time,
      duration,
      price,
      universe,
      notes,
      id_user,
      userId
    } = req.body;

    if (!clientName || !clientPhone || !date || !time) {
      return res.status(400).json({ error: 'Nom, téléphone, date et heure sont obligatoires' });
    }

    const finalUserId = id_user || userId || null;

    // Resolve service details
    let finalServiceName = serviceName || 'Prestation Beauté & Soin';
    let finalPrice = price ? parseFloat(price) : 45.00;
    let finalDuration = duration ? parseInt(duration, 10) : 45;
    let finalUniverse = universe || 'mixte';

    if (serviceId) {
      const srvRes = await pool.query('SELECT name, price, duration, universe FROM services WHERE id = $1', [serviceId]);
      if (srvRes.rows.length > 0) {
        finalServiceName = srvRes.rows[0].name;
        finalPrice = parseFloat(srvRes.rows[0].price);
        finalDuration = parseInt(srvRes.rows[0].duration, 10);
        finalUniverse = srvRes.rows[0].universe;
      }
    }

    // Resolve staff details
    let finalStaffName = staffName || 'Praticien Expert';
    if (staffId) {
      const staffRes = await pool.query('SELECT name FROM staff WHERE id = $1', [staffId]);
      if (staffRes.rows.length > 0) {
        finalStaffName = staffRes.rows[0].name;
      }
    }

    // Resolve salon details
    let finalSalonName = salonName || 'Salon Partenaire';
    let finalSalonId = salonId || 'salon-1';
    if (salonId) {
      const salRes = await pool.query('SELECT name FROM salons WHERE id = $1', [salonId]);
      if (salRes.rows.length > 0) {
        finalSalonName = salRes.rows[0].name;
      }
    }

    const id = `apt-${Date.now().toString().slice(-6)}`;
    const qrCode = `PASS-${Date.now().toString().slice(-4)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const insertQuery = `
      INSERT INTO appointments (
        id, salon_id, salon_name, client_name, client_phone, client_email,
        service_id, service_name, staff_id, staff_name, date, time,
        duration, price, universe, status, notes, qr_code, paid, id_user
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'confirmed', $16, $17, FALSE, $18)
      RETURNING 
        id, salon_id as "salonId", salon_name as "salonName",
        client_name as "clientName", client_phone as "clientPhone", client_email as "clientEmail",
        service_id as "serviceId", service_name as "serviceName",
        staff_id as "staffId", staff_name as "staffName",
        date, time, duration, price::float, universe, status, notes,
        qr_code as "qrCode", paid, id_user as "id_user", id_user as "userId", created_at as "createdAt"
    `;

    const { rows } = await pool.query(insertQuery, [
      id,
      finalSalonId,
      finalSalonName,
      clientName,
      clientPhone,
      clientEmail || null,
      serviceId || `srv-${Date.now().toString().slice(-4)}`,
      finalServiceName,
      staffId || `stf-${Date.now().toString().slice(-4)}`,
      finalStaffName,
      date,
      time,
      finalDuration,
      finalPrice,
      finalUniverse,
      notes || null,
      qrCode,
      finalUserId
    ]);

    // Update or insert client
    try {
      const clientLookup = await pool.query('SELECT id, visits_count, total_spent, loyalty_points FROM clients WHERE phone = $1', [clientPhone]);
      if (clientLookup.rows.length > 0) {
        const existing = clientLookup.rows[0];
        await pool.query(`
          UPDATE clients SET
            visits_count = visits_count + 1,
            total_spent = total_spent + $1,
            loyalty_points = loyalty_points + 20,
            last_visit = $2,
            favorite_service = $3,
            id_user = COALESCE(id_user, $4)
          WHERE id = $5
        `, [finalPrice, date, finalServiceName, finalUserId, existing.id]);
      } else {
        await pool.query(`
          INSERT INTO clients (id, name, phone, email, avatar, universe_preference, visits_count, total_spent, loyalty_points, last_visit, favorite_service, id_user)
          VALUES ($1, $2, $3, $4, $5, $6, 1, $7, 20, $8, $9, $10)
        `, [
          `cli-${Date.now().toString().slice(-4)}`,
          clientName,
          clientPhone,
          clientEmail || null,
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
          finalUniverse,
          finalPrice,
          date,
          finalServiceName,
          finalUserId
        ]);
      }
    } catch (clientErr) {
      console.warn('Client update error:', clientErr);
    }

    res.status(201).json(rows[0]);
  } catch (err: any) {
    console.error('Error creating appointment:', err);
    res.status(500).json({ error: err.message });
  }
});


// Update appointment status
app.patch('/api/appointments/:id/status', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Rendez-vous introuvable' });
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Process payment
app.post('/api/appointments/:id/payment', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { method } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE appointments SET paid = TRUE, payment_method = $1, status = \'completed\' WHERE id = $2 RETURNING *',
      [method, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Rendez-vous introuvable' });
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Database auto-migration for tables
const initDatabaseSchema = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS staff (
        id VARCHAR(50) PRIMARY KEY,
        salon_id VARCHAR(50) REFERENCES salons(id) ON DELETE SET NULL,
        owner_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
        id_user VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(100) DEFAULT 'Collaborateur & Praticien',
        avatar TEXT,
        universe JSONB DEFAULT '["femme", "homme", "enfant", "mixte"]'::jsonb,
        rating NUMERIC(3,2) DEFAULT 5.00,
        reviews_count INT DEFAULT 0,
        bio TEXT,
        working_days JSONB DEFAULT '[1, 2, 3, 4, 5, 6]'::jsonb,
        working_hours JSONB DEFAULT '{"start": "09:00", "end": "19:00"}'::jsonb,
        color VARCHAR(50) DEFAULT 'amber',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE staff ADD COLUMN IF NOT EXISTS owner_id VARCHAR(50);
      ALTER TABLE staff ADD COLUMN IF NOT EXISTS id_user VARCHAR(50);
      CREATE INDEX IF NOT EXISTS idx_staff_salon ON staff(salon_id);
      CREATE INDEX IF NOT EXISTS idx_staff_owner ON staff(owner_id);
      CREATE INDEX IF NOT EXISTS idx_staff_id_user ON staff(id_user);

      CREATE TABLE IF NOT EXISTS prestation_salons (
        id VARCHAR(50) PRIMARY KEY,
        id_salon VARCHAR(50) NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
        id_service VARCHAR(50) NOT NULL REFERENCES services(id) ON DELETE CASCADE,
        cout NUMERIC(10,2) NOT NULL DEFAULT 0.00,
        duree INT NOT NULL DEFAULT 30,
        id_user VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_salon_service UNIQUE(id_salon, id_service)
      );
      ALTER TABLE prestation_salons ADD COLUMN IF NOT EXISTS id_user VARCHAR(50);
      CREATE INDEX IF NOT EXISTS idx_prestation_salons_salon ON prestation_salons(id_salon);
      CREATE INDEX IF NOT EXISTS idx_prestation_salons_service ON prestation_salons(id_service);
      CREATE INDEX IF NOT EXISTS idx_prestation_salons_id_user ON prestation_salons(id_user);

      ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
      ALTER TABLE salons ADD COLUMN IF NOT EXISTS owner_id VARCHAR(50);
      ALTER TABLE salons ADD COLUMN IF NOT EXISTS id_user VARCHAR(50);
      ALTER TABLE salons ADD COLUMN IF NOT EXISTS univers VARCHAR(50) DEFAULT 'mixte';
      ALTER TABLE salons ADD COLUMN IF NOT EXISTS universe VARCHAR(50) DEFAULT 'mixte';
      CREATE INDEX IF NOT EXISTS idx_salons_id_user ON salons(id_user);
      
      ALTER TABLE services ALTER COLUMN salon_id DROP NOT NULL;
      ALTER TABLE services ALTER COLUMN price SET DEFAULT 0.00;
      ALTER TABLE services ALTER COLUMN price DROP NOT NULL;
      ALTER TABLE services ALTER COLUMN duration SET DEFAULT 30;
      ALTER TABLE services ALTER COLUMN duration DROP NOT NULL;
      ALTER TABLE services ALTER COLUMN sub_category SET DEFAULT 'Prestation';
      ALTER TABLE services ALTER COLUMN sub_category DROP NOT NULL;
      ALTER TABLE services DROP CONSTRAINT IF EXISTS services_universe_check;
      ALTER TABLE services ADD COLUMN IF NOT EXISTS nom VARCHAR(255);
      ALTER TABLE services ADD COLUMN IF NOT EXISTS id_service VARCHAR(50);
      ALTER TABLE services ADD COLUMN IF NOT EXISTS univers VARCHAR(50);
      ALTER TABLE services ADD COLUMN IF NOT EXISTS image_ulistration TEXT;
      ALTER TABLE services ADD COLUMN IF NOT EXISTS id_user VARCHAR(50);
      CREATE INDEX IF NOT EXISTS idx_services_id_user ON services(id_user);

      ALTER TABLE clients ADD COLUMN IF NOT EXISTS id_user VARCHAR(50);
      CREATE INDEX IF NOT EXISTS idx_clients_id_user ON clients(id_user);

      ALTER TABLE appointments ADD COLUMN IF NOT EXISTS id_user VARCHAR(50);
      CREATE INDEX IF NOT EXISTS idx_appointments_id_user ON appointments(id_user);

      DO $$ 
      BEGIN
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
        ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('client', 'owner', 'employee', 'admin'));
      EXCEPTION
        WHEN OTHERS THEN NULL;
      END $$;
    `);

    // Pre-populate predefined system services if catalogue is empty or has very few items
    const srvCountRes = await pool.query('SELECT COUNT(*) as count FROM services WHERE salon_id IS NULL');
    const srvCount = parseInt(srvCountRes.rows[0].count, 10);
    if (srvCount < 5) {
      const PREDEFINED_SYSTEM_SERVICES = [
        {
          id: 'srv-cat-01',
          nom: 'Coupe Dame & Brushing',
          description: 'Shampoing traitant, coupe personnalisée et brushing volumateur.',
          univers: 'Dame',
          image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=700&auto=format&fit=crop&q=80',
          subCategory: 'Coiffure Dame',
          price: 8000,
          duration: 45
        },
        {
          id: 'srv-cat-02',
          nom: 'Tresses Africaines & Nattes Collées',
          description: 'Tresses et nattes artistiques avec ou sans rajouts.',
          univers: 'Dame',
          image: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=700&auto=format&fit=crop&q=80',
          subCategory: 'Tresses & Nattes',
          price: 15000,
          duration: 90
        },
        {
          id: 'srv-cat-03',
          nom: 'Lissage Brésilien & Soin Kératine',
          description: 'Soin thermo-actif à la kératine pure pour des cheveux lisses et brillants.',
          univers: 'Dame',
          image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=700&auto=format&fit=crop&q=80',
          subCategory: 'Soins Capillaires',
          price: 25000,
          duration: 120
        },
        {
          id: 'srv-cat-04',
          nom: 'Manucure Spa & Pose Gel',
          description: 'Beauté des mains, soin cuticules et pose de vernis longue durée.',
          univers: 'Dame',
          image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=700&auto=format&fit=crop&q=80',
          subCategory: 'Onglerie',
          price: 10000,
          duration: 45
        },
        {
          id: 'srv-cat-05',
          nom: 'Pédicure Spa Complète',
          description: 'Bain relaxant aux huiles essentielles, gommage et massage des pieds.',
          univers: 'Dame',
          image: 'https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?w=700&auto=format&fit=crop&q=80',
          subCategory: 'Onglerie & Soins',
          price: 12000,
          duration: 60
        },
        {
          id: 'srv-cat-06',
          nom: 'Soin du Visage Éclat & Hydratation',
          description: 'Nettoyage profond, vapeur d\'ozone, masque hydratant et modelage visage.',
          univers: 'Dame',
          image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=700&auto=format&fit=crop&q=80',
          subCategory: 'Soins Visage',
          price: 18000,
          duration: 60
        },
        {
          id: 'srv-cat-07',
          nom: 'Coupe Homme Dégradé & Taper',
          description: 'Coupe tendance aux ciseaux et tondeuse avec finitions soignées.',
          univers: 'Homme',
          image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=700&auto=format&fit=crop&q=80',
          subCategory: 'Coiffure Homme',
          price: 5000,
          duration: 30
        },
        {
          id: 'srv-cat-08',
          nom: 'Taille & Soin Barbe Serviette Chaude',
          description: 'Traçage au rasoir, huile nourrissante et serviette chaude relaxante.',
          univers: 'Homme',
          image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=700&auto=format&fit=crop&q=80',
          subCategory: 'Barbier',
          price: 4000,
          duration: 25
        },
        {
          id: 'srv-cat-09',
          nom: 'Forfait VIP Coupe + Barbe Prestige',
          description: 'Shampoing, coupe dégradée, taille barbe complète et soin visage express.',
          univers: 'Homme',
          image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=700&auto=format&fit=crop&q=80',
          subCategory: 'Forfaits Homme',
          price: 8000,
          duration: 50
        },
        {
          id: 'srv-cat-10',
          nom: 'Coupe Garçon Stylée',
          description: 'Coupe enfant moderne et adaptée avec rafraîchissement des contours.',
          univers: 'Enfant',
          image: 'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=700&auto=format&fit=crop&q=80',
          subCategory: 'Enfant',
          price: 3500,
          duration: 25
        },
        {
          id: 'srv-cat-11',
          nom: 'Tresses & Nattes Petite Fille',
          description: 'Coiffure protectrice pour enfants avec perles ou rubans.',
          univers: 'Enfant',
          image: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=700&auto=format&fit=crop&q=80',
          subCategory: 'Enfant',
          price: 7000,
          duration: 60
        },
        {
          id: 'srv-cat-12',
          nom: 'Coiffure Moderne Adolescent(e)',
          description: 'Coupe branchée ou coiffage tendance pour adolescents.',
          univers: 'Adolescent',
          image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=700&auto=format&fit=crop&q=80',
          subCategory: 'Adolescent',
          price: 5000,
          duration: 35
        }
      ];

      for (const s of PREDEFINED_SYSTEM_SERVICES) {
        await pool.query(`
          INSERT INTO services (id, id_service, nom, name, description, univers, universe, image_ulistration, image, price, duration, sub_category, salon_id)
          VALUES ($1, $1, $2, $2, $3, $4, $4, $5, $5, $6, $7, $8, NULL)
          ON CONFLICT (id) DO NOTHING
        `, [s.id, s.nom, s.description, s.univers, s.image, s.price, s.duration, s.subCategory]);
      }
      console.log(`✨ [CATALOGUE SEED] ${PREDEFINED_SYSTEM_SERVICES.length} prestations prédéfinies insérées dans le catalogue.`);
    }

    // Synchroniser owner_id et id_user dans la table salons pour garantir la correspondance exacte
    await pool.query(`
      UPDATE salons SET owner_id = id_user WHERE id_user IS NOT NULL AND (owner_id IS NULL OR owner_id != id_user);
      UPDATE salons SET id_user = owner_id WHERE owner_id IS NOT NULL AND id_user IS NULL;
    `).catch(() => {});

    // Assurer que chaque salon existant possède des prestations liées dans prestation_salons
    try {
      const allSalonsRes = await pool.query('SELECT id, univers, universe, id_user, owner_id FROM salons');
      for (const salon of allSalonsRes.rows) {
        const psCountRes = await pool.query('SELECT COUNT(*) as count FROM prestation_salons WHERE id_salon = $1', [salon.id]);
        if (parseInt(psCountRes.rows[0].count, 10) === 0) {
          const salonUniv = (salon.univers || salon.universe || 'mixte').toLowerCase();
          let srvQuery = 'SELECT id, price, duration FROM services WHERE salon_id IS NULL';
          const srvParams: any[] = [];
          if (salonUniv !== 'mixte' && salonUniv !== 'all') {
            srvParams.push(salonUniv);
            srvQuery += ' AND (LOWER(univers) = LOWER($1) OR LOWER(universe) = LOWER($1))';
          }
          const availableServices = await pool.query(srvQuery, srvParams);
          const owner = salon.id_user || salon.owner_id;
          for (const srv of availableServices.rows) {
            const psId = `ps-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
            await pool.query(`
              INSERT INTO prestation_salons (id, id_salon, id_service, cout, duree, id_user)
              VALUES ($1, $2, $3, $4, $5, $6)
              ON CONFLICT (id_salon, id_service) DO NOTHING
            `, [psId, salon.id, srv.id, srv.price || 0, srv.duration || 30, owner]);
          }
          console.log(`✨ [AUTO-POPULATE PRESTATIONS] ${availableServices.rows.length} prestations associées au salon ${salon.id}`);
        }
      }
    } catch (e: any) {
      console.warn('⚠️ [AUTO-POPULATE PRESTATIONS WARNING]', e.message);
    }

    console.log('✅ [DATABASE SCHEMA] Tables, colonnes et contraintes (dont prestation_salons) validées.');
  } catch (err) {
    console.warn('⚠️ [DATABASE SCHEMA WARNING]', err);
  }
};
initDatabaseSchema();

// 6. AUTHENTICATION
app.post('/api/auth/register', async (req: Request, res: Response) => {
  const { name, email, phone, role, password, city, address, universePreference } = req.body;
  try {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (name || '').trim();
    const cleanPhone = (phone || '').trim();
    const cleanCity = (city || '').trim();
    const cleanAddress = (address || '').trim();
    const cleanPassword = (password || '').trim();
    const finalRole = (role || 'client').toLowerCase();

    if (!cleanName || !cleanEmail || !cleanPhone || !cleanCity || !cleanAddress) {
      return res.status(400).json({ error: 'Le nom et prénoms, ville, adresse, email et numéro de téléphone sont obligatoires.' });
    }

    if (!cleanPassword || cleanPassword.length < 4) {
      return res.status(400).json({ error: 'Le mot de passe doit comporter au minimum 4 caractères.' });
    }

    const validRoles = ['client', 'owner', 'employee', 'admin'];
    if (!validRoles.includes(finalRole)) {
      return res.status(400).json({ error: `Type de compte invalide : ${finalRole}` });
    }

    const existing = await pool.query('SELECT id, email, role FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Un compte avec cette adresse email existe déjà. Veuillez vous connecter.' });
    }

    // Enregistrement dans la table users
    const userId = `usr-${Date.now().toString().slice(-6)}`;
    const defaultAvatar = finalRole === 'admin'
      ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'
      : finalRole === 'owner' 
      ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200' 
      : finalRole === 'employee' 
      ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200' 
      : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200';

    await pool.query(`
      INSERT INTO users (id, email, password_hash, name, role, phone, city, address, avatar)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      userId,
      cleanEmail,
      cleanPassword,
      cleanName,
      finalRole,
      cleanPhone,
      cleanCity,
      cleanAddress,
      defaultAvatar
    ]);

    // Profil spécifique client
    if (finalRole === 'client') {
      const clientId = `cli-${Date.now().toString().slice(-6)}`;
      await pool.query(`
        INSERT INTO clients (id, name, phone, email, avatar, universe_preference, visits_count, total_spent, loyalty_points, id_user)
        VALUES ($1, $2, $3, $4, $5, $6, 0, 0.00, 100, $7)
      `, [
        clientId,
        cleanName,
        cleanPhone,
        cleanEmail,
        defaultAvatar,
        universePreference || 'femme',
        userId
      ]);
    }

    // Profil spécifique collaborateur / staff
    if (finalRole === 'employee' && req.body.salonId) {
      const staffId = `staff-${Date.now().toString().slice(-6)}`;
      await pool.query(`
        INSERT INTO staff (id, salon_id, name, role, avatar, universe, rating, reviews_count, id_user)
        VALUES ($1, $2, $3, $4, $5, '["femme", "homme", "enfant", "mixte"]'::jsonb, 5.00, 1, $6)
      `, [
        staffId,
        req.body.salonId,
        cleanName,
        req.body.jobTitle || 'Collaborateur & Praticien',
        defaultAvatar,
        userId
      ]);
    }

    console.log(`👤 [NOUVEL UTILISATEUR] Inscription réussie : ${cleanEmail} (${finalRole}) - ID: ${userId}`);

    res.status(201).json({
      id: userId,
      email: cleanEmail,
      name: cleanName,
      role: finalRole,
      phone: cleanPhone,
      city: cleanCity,
      address: cleanAddress,
      avatar: defaultAvatar,
      token: `jwt-session-${userId}`
    });
  } catch (err: any) {
    console.error('Error in /api/auth/register:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users', async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT id, email, name, role, phone, city, address, created_at as "createdAt" FROM users ORDER BY created_at DESC');
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, password, role } = req.body;
  try {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!cleanEmail) {
      return res.status(400).json({ error: 'Veuillez saisir votre adresse email.' });
    }
    if (!cleanPassword) {
      return res.status(400).json({ error: 'Veuillez saisir votre mot de passe.' });
    }

    const { rows } = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (rows.length === 0) {
      return res.status(404).json({ error: `Aucun compte trouvé avec l'adresse email "${cleanEmail}". Veuillez vous inscrire d'abord.` });
    }

    const user = rows[0];

    // 1. Vérification stricte du mot de passe
    if (user.password_hash !== cleanPassword) {
      return res.status(401).json({ error: 'Mot de passe incorrect. Veuillez vérifier votre saisie.' });
    }

    // 2. Vérification du type de compte (rôle sélectionné par l'utilisateur vs rôle enregistré en base)
    const ROLE_LABELS: Record<string, string> = {
      client: 'Client',
      owner: 'Propriétaire de Salon',
      employee: 'Collaborateur',
      admin: 'Administrateur Plateforme'
    };

    if (role && role !== user.role) {
      // Les administrateurs peuvent accéder à tous les espaces
      if (user.role !== 'admin') {
        const userRoleLabel = ROLE_LABELS[user.role] || user.role;
        const targetRoleLabel = ROLE_LABELS[role] || role;
        return res.status(403).json({
          error: `Ce compte est enregistré comme « ${userRoleLabel} ». Veuillez vous connecter dans l'onglet « ${userRoleLabel} ».`,
          userRole: user.role
        });
      }
    }

    // Récupérer le salon affilié si propriétaire ou employé
    let salonId = user.salon_id || null;
    let salonName = user.salon_name || null;
    if (user.role === 'owner') {
      const salonRes = await pool.query('SELECT id, name FROM salons WHERE owner_id = $1 OR id_user = $1 ORDER BY created_at DESC LIMIT 1', [user.id]);
      if (salonRes.rows.length > 0) {
        salonId = salonRes.rows[0].id;
        salonName = salonRes.rows[0].name;
      }
    }

    console.log(`🔐 [CONNEXION RÉUSSIE] Utilisateur : ${user.email} (${user.role}) - ID: ${user.id}`);

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      city: user.city,
      address: user.address,
      avatar: user.avatar,
      salonId,
      salonName,
      token: `jwt-session-${user.id}`
    });
  } catch (err: any) {
    console.error('Error in /api/auth/login:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/stats', async (_req: Request, res: Response) => {
  try {
    const [servicesRes, salonsRes, ownersRes, staffRes, clientsRes, aptsRes, revRes] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM services'),
      pool.query('SELECT COUNT(*) as count FROM salons'),
      pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'owner'"),
      pool.query('SELECT COUNT(*) as count FROM staff'),
      pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'client'"),
      pool.query('SELECT COUNT(*) as count FROM appointments'),
      pool.query("SELECT COALESCE(SUM(price), 0) as total FROM appointments WHERE status = 'completed' OR paid = true")
    ]);

    res.json({
      servicesCount: parseInt(servicesRes.rows[0].count, 10) || 0,
      salonsCount: parseInt(salonsRes.rows[0].count, 10) || 0,
      providersCount: parseInt(ownersRes.rows[0].count, 10) || 0,
      staffCount: parseInt(staffRes.rows[0].count, 10) || 0,
      clientsCount: parseInt(clientsRes.rows[0].count, 10) || 0,
      appointmentsCount: parseInt(aptsRes.rows[0].count, 10) || 0,
      totalRevenue: parseFloat(revRes.rows[0].total) || 0
    });
  } catch (err: any) {
    console.error('Error fetching admin stats:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/clear-providers', async (_req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM appointments');
    await pool.query('DELETE FROM staff');
    await pool.query("DELETE FROM users WHERE role IN ('owner', 'employee')");
    await pool.query('DELETE FROM services');
    await pool.query('DELETE FROM salons');
    res.json({ success: true, message: 'Tous les prestataires, salons, collaborateurs et données associées ont été supprimés de la base de données avec succès.' });
  } catch (err: any) {
    console.error('Error clearing providers:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur API PostgreSQL démarré sur http://localhost:${PORT}`);
});
