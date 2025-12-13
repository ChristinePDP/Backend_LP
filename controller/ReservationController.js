import db from '../config/db.js';
import Reservation from '../models/ReservationModel.js';
import Transaction from '../models/TransactionModel.js'; 

const ReservationController = {
  // 1. Get all reservations (admin)
  async getAll(req, res) {
    try {
      const { status, amenity_name } = req.query;
      let query = 'SELECT * FROM ReservationDb WHERE 1=1';
      const params = [];

      if (status) { query += ' AND status = ?'; params.push(status); }
      if (amenity_name) { query += ' AND amenity_name LIKE ?'; params.push(`%${amenity_name}%`); }

      query += ' ORDER BY check_in_date DESC';
      const [reservations] = await db.query(query, params);
      
      const statusCounts = reservations.reduce((acc, res) => {
        acc[res.status] = (acc[res.status] || 0) + 1;
        return acc;
      }, {});
      
      res.json({ success: true, data: reservations, count: reservations.length, statusDistribution: statusCounts });

    } catch (error) {
      console.error('Get all reservations error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch reservations', error: error.message });
    }
  },

  // 2. Get reservation by ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      const [reservations] = await db.query(
        'SELECT r.*, t.* FROM ReservationDb r JOIN TransactionDb t ON r.transaction_id = t.id WHERE r.id = ?',
        [id]
      );

      if (reservations.length === 0) {
        return res.status(404).json({ success: false, message: 'Reservation not found' });
      }
      res.json({ success: true, data: reservations[0] });

    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch reservation', error: error.message });
    }
  },

  // 3. Update reservation
  async update(req, res) {
    try {
      const { id } = req.params;
      const { quantity, price, check_in_date, check_out_date, status } = req.body;

      const reservation = await Reservation.findById(id);
      if (!reservation) return res.status(404).json({ success: false, message: 'Reservation not found' });
      
      await db.query(
        'UPDATE ReservationDb SET quantity = ?, price = ?, check_in_date = ?, check_out_date = ?, status = ? WHERE id = ?',
        [quantity, price, check_in_date, check_out_date, status, id]
      );
      
      const [updatedReservation] = await db.query('SELECT * FROM ReservationDb WHERE id = ?', [id]);
      res.json({ success: true, message: 'Reservation updated successfully', data: updatedReservation[0] });

    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update reservation', error: error.message });
    }
  },

  // 4. EXTEND RESERVATION (Owner Dashboard)
  async extend(req, res) {
    try {
      const { id } = req.params; 
      const { new_check_out_date, additional_cost, additional_hours, extension_type, extended_items } = req.body;

      if (!new_check_out_date) {
        return res.status(400).json({ success: false, message: 'New check-out date is required' });
      }

      const [reservations] = await db.query('SELECT transaction_id, check_out_date FROM ReservationDb WHERE id = ?', [id]);
      if (reservations.length === 0) return res.status(404).json({ success: false, message: 'Reservation not found' });

      const reservation = reservations[0];
      const transactionId = reservation.transaction_id;
      const cost = parseFloat(additional_cost || 0);

      const extensionData = {
        date_added: new Date().toISOString(),
        original_check_out: reservation.check_out_date,
        new_check_out: new_check_out_date,
        extension_type: extension_type || 'Manual',
        duration: additional_hours, 
        additional_cost: cost,
        items: extended_items || [], 
        description: `Extended by ${additional_hours} ${extension_type === 'overnight' ? 'Day(s)' : 'Hour(s)'}`
      };

      await Transaction.addExtension(transactionId, extensionData, cost);

      await db.query('UPDATE ReservationDb SET check_out_date = ? WHERE id = ?', [new_check_out_date, id]);

      res.json({ success: true, message: 'Extended successfully', data: { new_check_out: new_check_out_date, added_cost: cost } });

    } catch (error) {
      console.error('Extend reservation error:', error);
      res.status(500).json({ success: false, message: 'Failed to extend reservation', error: error.message });
    }
  },

  // 5. Delete reservation
  async delete(req, res) {
    try {
      const { id } = req.params;
      const reservation = await Reservation.findById(id);
      if (!reservation) return res.status(404).json({ success: false, message: 'Reservation not found' });

      await db.query('DELETE FROM ReservationDb WHERE id = ?', [id]);
      res.json({ success: true, message: 'Reservation deleted successfully', deletedReservation: reservation });

    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to delete reservation', error: error.message });
    }
  },

  // 6. ✅✅✅ GET BY USER ID (FIXED: NOW INCLUDES transaction_ref)
  async getByUserId(req, res) {
    try {
      const { userId } = req.params;
      
      // FIX: Added 't.transaction_ref' to the SELECT statement
      const [reservations] = await db.query(
        `SELECT r.*, t.transaction_ref, t.user_id 
         FROM ReservationDb r 
         JOIN TransactionDb t ON r.transaction_id = t.id 
         WHERE t.user_id = ? 
         ORDER BY r.check_in_date DESC`,
        [userId]
      );

      res.json({ success: true, data: reservations, count: reservations.length });

    } catch (error) {
      console.error('Get reservations by user ID error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch user reservations', error: error.message });
    }
  }
};

export default ReservationController;