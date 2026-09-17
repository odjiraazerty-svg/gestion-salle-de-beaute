-- =======================================================
-- SCHEMA SQL : BASE DE DONNÉES SAAS GESTION SALLE DE BEAUTÉ
-- Base de données : salon_beaute_db
-- =======================================================

-- 1. Table des Salons partenaires
CREATE TABLE IF NOT EXISTS salons (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    tagline TEXT,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20),
    phone VARCHAR(50),
    email VARCHAR(150),
    currency VARCHAR(10) DEFAULT '€',
    logo TEXT,
    cover_image TEXT,
    opening_days VARCHAR(100) DEFAULT 'Mardi au Samedi',
    opening_hours VARCHAR(100) DEFAULT '09:00 - 20:00',
    univers VARCHAR(50) DEFAULT 'mixte',
    universe VARCHAR(50) DEFAULT 'mixte',
    rating NUMERIC(3,2) DEFAULT 4.90,
    reviews_count INT DEFAULT 0,
    owner_id VARCHAR(50),
    id_user VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table des Utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    city VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('client', 'owner', 'employee', 'admin')),
    avatar TEXT,
    salon_id VARCHAR(50),
    salon_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Table des Prestations / Services
CREATE TABLE IF NOT EXISTS services (
    id VARCHAR(50) PRIMARY KEY,
    id_service VARCHAR(50),
    salon_id VARCHAR(50) REFERENCES salons(id) ON DELETE CASCADE,
    nom VARCHAR(255),
    name VARCHAR(255),
    univers VARCHAR(50),
    universe VARCHAR(20),
    sub_category VARCHAR(100) DEFAULT 'Prestation',
    description TEXT,
    price NUMERIC(10,2) DEFAULT 0.00,
    duration INT DEFAULT 30, -- Durée en minutes
    image_ulistration TEXT,
    image TEXT,
    popular BOOLEAN DEFAULT FALSE,
    featured BOOLEAN DEFAULT FALSE,
    recommended_for TEXT,
    included_steps JSONB DEFAULT '[]'::jsonb,
    id_user VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Table des Praticiens / Collaborateurs
CREATE TABLE IF NOT EXISTS staff (
    id VARCHAR(50) PRIMARY KEY,
    salon_id VARCHAR(50) REFERENCES salons(id) ON DELETE SET NULL,
    owner_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    id_user VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    role VARCHAR(100) NOT NULL DEFAULT 'Collaborateur & Praticien',
    avatar TEXT,
    universe JSONB NOT NULL DEFAULT '["femme", "homme", "enfant", "mixte"]'::jsonb,
    rating NUMERIC(3,2) DEFAULT 5.00,
    reviews_count INT DEFAULT 0,
    bio TEXT,
    working_days JSONB DEFAULT '[1, 2, 3, 4, 5, 6]'::jsonb,
    working_hours JSONB DEFAULT '{"start": "09:00", "end": "19:00"}'::jsonb,
    color VARCHAR(20) DEFAULT '#3b82f6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Table des Profils Clients
CREATE TABLE IF NOT EXISTS clients (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(150),
    avatar TEXT,
    universe_preference VARCHAR(20) DEFAULT 'femme' CHECK (universe_preference IN ('homme', 'femme', 'enfant', 'mixte')),
    visits_count INT DEFAULT 0,
    total_spent NUMERIC(10,2) DEFAULT 0.00,
    loyalty_points INT DEFAULT 100,
    last_visit VARCHAR(50),
    favorite_service VARCHAR(255),
    technical_notes TEXT,
    id_user VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Table des Rendez-vous
CREATE TABLE IF NOT EXISTS appointments (
    id VARCHAR(50) PRIMARY KEY,
    salon_id VARCHAR(50) NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    salon_name VARCHAR(255),
    client_name VARCHAR(150) NOT NULL,
    client_phone VARCHAR(50) NOT NULL,
    client_email VARCHAR(150),
    service_id VARCHAR(50) NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
    service_name VARCHAR(255) NOT NULL,
    staff_id VARCHAR(50) NOT NULL REFERENCES staff(id) ON DELETE RESTRICT,
    staff_name VARCHAR(150) NOT NULL,
    date VARCHAR(20) NOT NULL, -- Format YYYY-MM-DD
    time VARCHAR(10) NOT NULL, -- Format HH:mm
    duration INT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    universe VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'in_progress', 'completed', 'cancelled')),
    notes TEXT,
    qr_code VARCHAR(100) NOT NULL,
    paid BOOLEAN DEFAULT FALSE,
    payment_method VARCHAR(30) CHECK (payment_method IN ('cash', 'card', 'mobile_money', 'apple_pay')),
    id_user VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Table des Prestations spécifiques par Salon (Liaison & Tarifs personnalisés)
CREATE TABLE IF NOT EXISTS prestation_salons (
    id VARCHAR(50) PRIMARY KEY,
    id_salon VARCHAR(50) NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    id_service VARCHAR(50) NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    cout NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    duree INT NOT NULL DEFAULT 30, -- Durée en minutes chez ce salon
    id_user VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_salon_service UNIQUE(id_salon, id_service)
);

-- Index pour optimiser les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_salons_id_user ON salons(id_user);
CREATE INDEX IF NOT EXISTS idx_services_salon ON services(salon_id);
CREATE INDEX IF NOT EXISTS idx_services_id_user ON services(id_user);
CREATE INDEX IF NOT EXISTS idx_staff_salon ON staff(salon_id);
CREATE INDEX IF NOT EXISTS idx_staff_id_user ON staff(id_user);
CREATE INDEX IF NOT EXISTS idx_clients_id_user ON clients(id_user);
CREATE INDEX IF NOT EXISTS idx_appointments_salon_date ON appointments(salon_id, date);
CREATE INDEX IF NOT EXISTS idx_appointments_client_phone ON appointments(client_phone);
CREATE INDEX IF NOT EXISTS idx_appointments_id_user ON appointments(id_user);
CREATE INDEX IF NOT EXISTS idx_prestation_salons_salon ON prestation_salons(id_salon);
CREATE INDEX IF NOT EXISTS idx_prestation_salons_service ON prestation_salons(id_service);
CREATE INDEX IF NOT EXISTS idx_prestation_salons_id_user ON prestation_salons(id_user);
