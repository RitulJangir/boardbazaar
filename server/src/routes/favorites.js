const express = require('express');
const { db } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const ids = await db.getFavoriteIds(req.user.id);
    const all = await db.listBillboards();
    const idSet = new Set(ids);
    res.json({
      favoriteIds: ids,
      billboards: all.filter((b) => idSet.has(b.id))
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:billboardId', requireAuth, async (req, res, next) => {
  try {
    const board = await db.getBillboardById(req.params.billboardId);
    if (!board) return res.status(404).json({ error: 'Billboard not found.' });
    const result = await db.toggleFavorite(req.user.id, req.params.billboardId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
