const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { buildSeedData } = require('./seedData');

const DATA_DIR = path.join(__dirname, '..', 'data');
const JSON_DB_PATH = path.join(DATA_DIR, 'db.json');
const SCHEMA_PATH = path.join(__dirname, '..', 'sql', 'schema.sql');

const usePostgres = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim());
let pool = null;

function readJsonDb() {
  if (!fs.existsSync(JSON_DB_PATH)) {
    return { users: [], billboards: [], bookings: [], favorites: [] };
  }
  return JSON.parse(fs.readFileSync(JSON_DB_PATH, 'utf8'));
}

function writeJsonDb(data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(JSON_DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function normalizeBillboard(row) {
  if (!row) return null;
  return {
    ...row,
    width_ft: Number(row.width_ft),
    height_ft: Number(row.height_ft),
    monthly_price: Number(row.monthly_price),
    daily_impressions: Number(row.daily_impressions || 0),
    min_months: Number(row.min_months || 1),
    printing_cost: Number(row.printing_cost || 0),
    available: Boolean(row.available),
    featured: Boolean(row.featured),
    verified: Boolean(row.verified)
  };
}

function normalizeBooking(row) {
  if (!row) return null;
  return {
    ...row,
    months: Number(row.months),
    include_printing: Boolean(row.include_printing),
    rent_subtotal: Number(row.rent_subtotal),
    printing_total: Number(row.printing_total),
    gst_amount: Number(row.gst_amount),
    grand_total: Number(row.grand_total)
  };
}

async function initDb() {
  if (usePostgres) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf8');
    await pool.query(schemaSql);

    const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM billboards');
    if (rows[0].count === 0) {
      const seed = await buildSeedData();
      for (const u of seed.users) {
        await pool.query(
          `INSERT INTO users (id, name, email, phone, company, password_hash, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (email) DO NOTHING`,
          [u.id, u.name, u.email, u.phone, u.company, u.password_hash, u.created_at]
        );
      }
      for (const b of seed.billboards) {
        await pool.query(
          `INSERT INTO billboards (
            id, seller_id, title, category, city, locality, landmark,
            width_ft, height_ft, monthly_price, lighting, traffic,
            daily_impressions, min_months, printing_cost, available,
            featured, verified, description, image_url, seller_name, seller_phone, created_at
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
          ON CONFLICT (id) DO NOTHING`,
          [
            b.id, b.seller_id, b.title, b.category, b.city, b.locality, b.landmark,
            b.width_ft, b.height_ft, b.monthly_price, b.lighting, b.traffic,
            b.daily_impressions, b.min_months, b.printing_cost, b.available,
            b.featured, b.verified, b.description, b.image_url, b.seller_name, b.seller_phone, b.created_at
          ]
        );
      }
      console.log('Seeded PostgreSQL database with initial Indian billboards.');
    }
    console.log('Connected to PostgreSQL database.');
  } else {
    if (!fs.existsSync(JSON_DB_PATH)) {
      const seed = await buildSeedData();
      writeJsonDb(seed);
      console.log('Initialized local JSON database with seed billboards at server/data/db.json');
    } else {
      console.log('Using existing local JSON database at server/data/db.json');
    }
  }
}

const db = {
  mode: () => (usePostgres ? 'postgresql' : 'local-json'),

  // ---------------- USERS ----------------
  async findUserByEmail(email) {
    const clean = email.trim().toLowerCase();
    if (usePostgres) {
      const { rows } = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [clean]);
      return rows[0] || null;
    }
    const data = readJsonDb();
    return data.users.find((u) => u.email.toLowerCase() === clean) || null;
  },

  async findUserById(id) {
    if (usePostgres) {
      const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      return rows[0] || null;
    }
    const data = readJsonDb();
    return data.users.find((u) => u.id === id) || null;
  },

  async createUser(user) {
    if (usePostgres) {
      const { rows } = await pool.query(
        `INSERT INTO users (id, name, email, phone, company, password_hash, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [user.id, user.name, user.email.toLowerCase(), user.phone, user.company || '', user.password_hash, user.created_at]
      );
      return rows[0];
    }
    const data = readJsonDb();
    const record = { ...user, email: user.email.toLowerCase() };
    data.users.push(record);
    writeJsonDb(data);
    return record;
  },

  // ---------------- BILLBOARDS ----------------
  async listBillboards() {
    if (usePostgres) {
      const { rows } = await pool.query('SELECT * FROM billboards ORDER BY created_at DESC');
      return rows.map(normalizeBillboard);
    }
    const data = readJsonDb();
    return [...data.billboards]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(normalizeBillboard);
  },

  async getBillboardById(id) {
    if (usePostgres) {
      const { rows } = await pool.query('SELECT * FROM billboards WHERE id = $1', [id]);
      return normalizeBillboard(rows[0]);
    }
    const data = readJsonDb();
    return normalizeBillboard(data.billboards.find((b) => b.id === id));
  },

  async createBillboard(b) {
    if (usePostgres) {
      const { rows } = await pool.query(
        `INSERT INTO billboards (
          id, seller_id, title, category, city, locality, landmark,
          width_ft, height_ft, monthly_price, lighting, traffic,
          daily_impressions, min_months, printing_cost, available,
          featured, verified, description, image_url, seller_name, seller_phone, created_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
        RETURNING *`,
        [
          b.id, b.seller_id, b.title, b.category, b.city, b.locality, b.landmark,
          b.width_ft, b.height_ft, b.monthly_price, b.lighting, b.traffic,
          b.daily_impressions, b.min_months, b.printing_cost, b.available,
          b.featured, b.verified, b.description, b.image_url, b.seller_name, b.seller_phone, b.created_at
        ]
      );
      return normalizeBillboard(rows[0]);
    }
    const data = readJsonDb();
    data.billboards.unshift(b);
    writeJsonDb(data);
    return normalizeBillboard(b);
  },

  async updateBillboard(id, updates) {
    if (usePostgres) {
      const allowed = [
        'title', 'category', 'city', 'locality', 'landmark', 'width_ft', 'height_ft',
        'monthly_price', 'lighting', 'traffic', 'daily_impressions', 'min_months',
        'printing_cost', 'available', 'description', 'image_url'
      ];
      const keys = Object.keys(updates).filter((k) => allowed.includes(k));
      if (!keys.length) return this.getBillboardById(id);
      const setClause = keys.map((k, idx) => `${k} = $${idx + 2}`).join(', ');
      const values = [id, ...keys.map((k) => updates[k])];
      const { rows } = await pool.query(
        `UPDATE billboards SET ${setClause} WHERE id = $1 RETURNING *`,
        values
      );
      return normalizeBillboard(rows[0]);
    }
    const data = readJsonDb();
    const idx = data.billboards.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    data.billboards[idx] = { ...data.billboards[idx], ...updates };
    writeJsonDb(data);
    return normalizeBillboard(data.billboards[idx]);
  },

  async deleteBillboard(id) {
    if (usePostgres) {
      await pool.query('DELETE FROM billboards WHERE id = $1', [id]);
      return true;
    }
    const data = readJsonDb();
    data.billboards = data.billboards.filter((b) => b.id !== id);
    data.favorites = data.favorites.filter((f) => f.billboard_id !== id);
    writeJsonDb(data);
    return true;
  },

  // ---------------- BOOKINGS ----------------
  async createBooking(bk) {
    if (usePostgres) {
      const { rows } = await pool.query(
        `INSERT INTO bookings (
          id, billboard_id, buyer_id, seller_id, buyer_name, buyer_phone,
          company_name, campaign_name, start_date, months, include_printing,
          rent_subtotal, printing_total, gst_amount, grand_total, status, notes, created_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
        RETURNING *`,
        [
          bk.id, bk.billboard_id, bk.buyer_id, bk.seller_id, bk.buyer_name, bk.buyer_phone,
          bk.company_name, bk.campaign_name, bk.start_date, bk.months, bk.include_printing,
          bk.rent_subtotal, bk.printing_total, bk.gst_amount, bk.grand_total, bk.status, bk.notes, bk.created_at
        ]
      );
      return normalizeBooking(rows[0]);
    }
    const data = readJsonDb();
    data.bookings.unshift(bk);
    writeJsonDb(data);
    return normalizeBooking(bk);
  },

  async getBookingById(id) {
    if (usePostgres) {
      const { rows } = await pool.query('SELECT * FROM bookings WHERE id = $1', [id]);
      return normalizeBooking(rows[0]);
    }
    const data = readJsonDb();
    return normalizeBooking(data.bookings.find((b) => b.id === id));
  },

  async listBookingsByBuyer(buyerId) {
    const allBoards = await this.listBillboards();
    const boardMap = new Map(allBoards.map((b) => [b.id, b]));
    let list;
    if (usePostgres) {
      const { rows } = await pool.query(
        'SELECT * FROM bookings WHERE buyer_id = $1 ORDER BY created_at DESC',
        [buyerId]
      );
      list = rows.map(normalizeBooking);
    } else {
      const data = readJsonDb();
      list = data.bookings
        .filter((b) => b.buyer_id === buyerId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map(normalizeBooking);
    }
    return list.map((bk) => ({ ...bk, billboard: boardMap.get(bk.billboard_id) || null }));
  },

  async listBookingsBySeller(sellerId) {
    const allBoards = await this.listBillboards();
    const boardMap = new Map(allBoards.map((b) => [b.id, b]));
    let list;
    if (usePostgres) {
      const { rows } = await pool.query(
        'SELECT * FROM bookings WHERE seller_id = $1 ORDER BY created_at DESC',
        [sellerId]
      );
      list = rows.map(normalizeBooking);
    } else {
      const data = readJsonDb();
      list = data.bookings
        .filter((b) => b.seller_id === sellerId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map(normalizeBooking);
    }
    return list.map((bk) => ({ ...bk, billboard: boardMap.get(bk.billboard_id) || null }));
  },

  async updateBookingStatus(id, status) {
    if (usePostgres) {
      const { rows } = await pool.query(
        'UPDATE bookings SET status = $2 WHERE id = $1 RETURNING *',
        [id, status]
      );
      return normalizeBooking(rows[0]);
    }
    const data = readJsonDb();
    const idx = data.bookings.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    data.bookings[idx].status = status;
    writeJsonDb(data);
    return normalizeBooking(data.bookings[idx]);
  },

  // ---------------- FAVORITES ----------------
  async getFavoriteIds(userId) {
    if (usePostgres) {
      const { rows } = await pool.query(
        'SELECT billboard_id FROM favorites WHERE user_id = $1',
        [userId]
      );
      return rows.map((r) => r.billboard_id);
    }
    const data = readJsonDb();
    return data.favorites.filter((f) => f.user_id === userId).map((f) => f.billboard_id);
  },

  async toggleFavorite(userId, billboardId) {
    if (usePostgres) {
      const { rows } = await pool.query(
        'SELECT 1 FROM favorites WHERE user_id = $1 AND billboard_id = $2',
        [userId, billboardId]
      );
      if (rows.length) {
        await pool.query('DELETE FROM favorites WHERE user_id = $1 AND billboard_id = $2', [userId, billboardId]);
        return { saved: false };
      }
      await pool.query('INSERT INTO favorites (user_id, billboard_id) VALUES ($1, $2)', [userId, billboardId]);
      return { saved: true };
    }
    const data = readJsonDb();
    const exists = data.favorites.findIndex((f) => f.user_id === userId && f.billboard_id === billboardId);
    if (exists !== -1) {
      data.favorites.splice(exists, 1);
      writeJsonDb(data);
      return { saved: false };
    }
    data.favorites.push({ user_id: userId, billboard_id: billboardId, created_at: new Date().toISOString() });
    writeJsonDb(data);
    return { saved: true };
  }
};

module.exports = { initDb, db };
