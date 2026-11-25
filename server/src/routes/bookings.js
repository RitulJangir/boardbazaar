const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/bookings — Buyer books a billboard (server-side GST 18% calculation)
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const {
      billboard_id,
      campaign_name,
      company_name,
      start_date,
      months,
      include_printing,
      notes
    } = req.body;

    if (!billboard_id || !campaign_name || !start_date || !months) {
      return res.status(400).json({ error: 'Billboard, campaign name, start date, and duration are required.' });
    }

    const board = await db.getBillboardById(billboard_id);
    if (!board) return res.status(404).json({ error: 'Billboard not found.' });
    if (!board.available) {
      return res.status(400).json({ error: 'This billboard is currently marked as booked/unavailable.' });
    }

    const duration = Math.max(board.min_months || 1, Math.min(24, Number(months)));
    const buyer = await db.findUserById(req.user.id);
    const rent_subtotal = board.monthly_price * duration;
    const printing_total = include_printing && board.category !== 'Digital LED' ? (board.printing_cost || 0) : 0;
    const taxable = rent_subtotal + printing_total;
    const gst_amount = Math.round(taxable * 0.18);
    const grand_total = taxable + gst_amount;

    const booking = await db.createBooking({
      id: `INV-${Date.now().toString().slice(-6)}-${uuidv4().slice(0, 4).toUpperCase()}`,
      billboard_id: board.id,
      buyer_id: req.user.id,
      seller_id: board.seller_id,
      buyer_name: buyer ? buyer.name : req.user.name,
      buyer_phone: buyer ? buyer.phone : req.user.phone,
      company_name: (company_name || (buyer && buyer.company) || '').trim(),
      campaign_name: campaign_name.trim(),
      start_date,
      months: duration,
      include_printing: Boolean(include_printing),
      rent_subtotal,
      printing_total,
      gst_amount,
      grand_total,
      status: 'Confirmed',
      notes: (notes || '').trim(),
      created_at: new Date().toISOString()
    });

    res.status(201).json({ booking: { ...booking, billboard: board } });
  } catch (err) {
    next(err);
  }
});

// GET /api/bookings/buyer — Buyer's rentals
router.get('/buyer', requireAuth, async (req, res, next) => {
  try {
    const bookings = await db.listBookingsByBuyer(req.user.id);
    res.json({ bookings });
  } catch (err) {
    next(err);
  }
});

// GET /api/bookings/seller — Incoming bookings for seller's boards
router.get('/seller', requireAuth, async (req, res, next) => {
  try {
    const bookings = await db.listBookingsBySeller(req.user.id);
    res.json({ bookings });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/bookings/:id/status — Update booking status
router.patch('/:id/status', requireAuth, async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value.' });
    }
    const existing = await db.getBookingById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Booking not found.' });

    const isBuyer = existing.buyer_id === req.user.id;
    const isSeller = existing.seller_id === req.user.id;

    if (!isBuyer && !isSeller) {
      return res.status(403).json({ error: 'Not authorised to modify this booking.' });
    }
    if (isBuyer && !isSeller && status !== 'Cancelled') {
      return res.status(403).json({ error: 'Buyers can only cancel bookings.' });
    }

    const updated = await db.updateBookingStatus(req.params.id, status);
    res.json({ booking: updated });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
