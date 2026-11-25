const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const uploadDir = path.join(__dirname, '..', '..', 'uploads');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPG, PNG, WEBP, or GIF images up to 5MB are allowed.'));
  }
});

async function saveUploadedImage(file) {
  const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
  const fileName = `bb-${Date.now()}-${uuidv4().slice(0, 6)}${ext}`;
  const privateKey = (process.env.IMAGEKIT_PRIVATE_KEY || '').trim();

  if (privateKey) {
    const form = new FormData();
    form.append('file', `data:${file.mimetype};base64,${file.buffer.toString('base64')}`);
    form.append('fileName', fileName);
    form.append('folder', '/billboards');

    const authHeader = `Basic ${Buffer.from(`${privateKey}:`).toString('base64')}`;
    const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST',
      headers: { Authorization: authHeader },
      body: form
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.url) {
      throw new Error(data.message || 'ImageKit upload failed. Check IMAGEKIT_PRIVATE_KEY.');
    }
    return data.url;
  }

  // Local development fallback when IMAGEKIT_PRIVATE_KEY is not set
  fs.mkdirSync(uploadDir, { recursive: true });
  fs.writeFileSync(path.join(uploadDir, fileName), file.buffer);
  return `/uploads/${fileName}`;
}

// GET /api/billboards — OLX-style filtering, sorting, and dynamic facet counts
router.get('/', async (req, res, next) => {
  try {
    const {
      q = '',
      city = '',
      locality = '',
      category = '',
      lighting = '',
      traffic = '',
      minPrice = '',
      maxPrice = '',
      availableOnly = '',
      sort = 'newest'
    } = req.query;

    const all = await db.listBillboards();

    const categoryCounts = {};
    const cityCounts = {};
    const localitySet = new Set();

    for (const item of all) {
      categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
      cityCounts[item.city] = (cityCounts[item.city] || 0) + 1;
      if (!city || city === 'All India' || item.city.toLowerCase() === city.toLowerCase()) {
        localitySet.add(item.locality);
      }
    }

    const filtered = all.filter((b) => {
      if (q.trim()) {
        const needle = q.trim().toLowerCase();
        const hay = `${b.title} ${b.city} ${b.locality} ${b.landmark} ${b.category} ${b.description}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      if (city && city !== 'All India' && b.city.toLowerCase() !== city.toLowerCase()) return false;
      if (locality && locality !== 'All' && b.locality.toLowerCase() !== locality.toLowerCase()) return false;
      if (category && category !== 'All' && b.category.toLowerCase() !== category.toLowerCase()) return false;
      if (lighting && lighting !== 'All' && b.lighting.toLowerCase() !== lighting.toLowerCase()) return false;
      if (traffic && traffic !== 'All' && b.traffic.toLowerCase() !== traffic.toLowerCase()) return false;
      if (minPrice !== '' && b.monthly_price < Number(minPrice)) return false;
      if (maxPrice !== '' && b.monthly_price > Number(maxPrice)) return false;
      if (availableOnly === 'true' && !b.available) return false;
      return true;
    });

    if (sort === 'price_asc') filtered.sort((a, b) => a.monthly_price - b.monthly_price);
    else if (sort === 'price_desc') filtered.sort((a, b) => b.monthly_price - a.monthly_price);
    else if (sort === 'size_desc') filtered.sort((a, b) => (b.width_ft * b.height_ft) - (a.width_ft * a.height_ft));
    else filtered.sort((a, b) => Number(b.featured) - Number(a.featured) || new Date(b.created_at) - new Date(a.created_at));

    res.json({
      total: filtered.length,
      billboards: filtered,
      facets: {
        categories: categoryCounts,
        cities: cityCounts,
        localities: Array.from(localitySet).sort()
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/billboards/mine/list — Seller's own billboards
router.get('/mine/list', requireAuth, async (req, res, next) => {
  try {
    const all = await db.listBillboards();
    const mine = all.filter((b) => b.seller_id === req.user.id);
    res.json({ billboards: mine });
  } catch (err) {
    next(err);
  }
});

// GET /api/billboards/:id
router.get('/:id', async (req, res, next) => {
  try {
    const board = await db.getBillboardById(req.params.id);
    if (!board) return res.status(404).json({ error: 'Billboard not found.' });
    res.json({ billboard: board });
  } catch (err) {
    next(err);
  }
});

// POST /api/billboards — Create a new billboard listing
router.post('/', requireAuth, upload.single('image'), async (req, res, next) => {
  try {
    const {
      title, category, city, locality, landmark,
      width_ft, height_ft, monthly_price, lighting,
      traffic, daily_impressions, min_months, printing_cost,
      description, image_url
    } = req.body;

    if (!title || !category || !city || !locality || !width_ft || !height_ft || !monthly_price) {
      return res.status(400).json({ error: 'Please fill in all required billboard details.' });
    }

    const seller = await db.findUserById(req.user.id);
    const uploadedPath = req.file
      ? await saveUploadedImage(req.file)
      : (image_url || '').trim();

    const created = await db.createBillboard({
      id: `bb-${uuidv4().slice(0, 8)}`,
      seller_id: req.user.id,
      title: title.trim(),
      category: category.trim(),
      city: city.trim(),
      locality: locality.trim(),
      landmark: (landmark || '').trim(),
      width_ft: Number(width_ft),
      height_ft: Number(height_ft),
      monthly_price: Number(monthly_price),
      lighting: (lighting || 'Frontlit').trim(),
      traffic: (traffic || 'High').trim(),
      daily_impressions: Number(daily_impressions) || 80000,
      min_months: Math.max(1, Number(min_months) || 1),
      printing_cost: Math.max(0, Number(printing_cost) || 0),
      available: true,
      featured: false,
      verified: true,
      description: (description || '').trim(),
      image_url: uploadedPath,
      seller_name: seller ? seller.name : req.user.name,
      seller_phone: seller ? seller.phone : req.user.phone,
      created_at: new Date().toISOString()
    });

    res.status(201).json({ billboard: created });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/billboards/:id — Owner updates details or availability
router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const board = await db.getBillboardById(req.params.id);
    if (!board) return res.status(404).json({ error: 'Billboard not found.' });
    if (board.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own billboard listings.' });
    }
    const updated = await db.updateBillboard(req.params.id, req.body);
    res.json({ billboard: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/billboards/:id — Owner deletes listing
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const board = await db.getBillboardById(req.params.id);
    if (!board) return res.status(404).json({ error: 'Billboard not found.' });
    if (board.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own billboard listings.' });
    }
    await db.deleteBillboard(req.params.id);
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
