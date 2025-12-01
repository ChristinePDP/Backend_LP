import db from '../config/db.js';
import Reservation from '../models/ReservationModel.js';


const ReservationController = {
  // Get all reservations (admin)
  async getAll(req, res) {
    try {
      const { status, amenity_name } = req.query;
      
      let query = 'SELECT * FROM ReservationDb WHERE 1=1';
      const params = [];

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }

      if (amenity_name) {
        query += ' AND amenity_name LIKE ?';
        params.push(`%${amenity_name}%`);
      }

      query += ' ORDER BY check_in_date DESC';

      const [reservations] = await db.query(query, params);

      res.json({
        success: true,
        data: reservations
      });

    } catch (error) {
      console.error('Get all reservations error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch reservations',
        error: error.message
      });
    }
  },

  // Get reservation by ID
  async getById(req, res) {
    try {
      const { id } = req.params;

      const [reservations] = await db.query(
        'SELECT r.*, t.* FROM ReservationDb r JOIN TransactionDb t ON r.transaction_id = t.id WHERE r.id = ?',
        [id]
      );

      if (reservations.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Reservation not found'
        });
      }

      res.json({
        success: true,
        data: reservations[0]
      });

    } catch (error) {
      console.error('Get reservation by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch reservation',
        error: error.message
      });
    }
  },

  // Update reservation details
  async update(req, res) {
    try {
      const { id } = req.params;
      const { quantity, price, check_in_date, check_out_date, status } = req.body;

      // Check if reservation exists
      const reservation = await Reservation.findById(id);
      if (!reservation) {
        return res.status(404).json({
          success: false,
          message: 'Reservation not found'
        });
      }

      // Update reservation
      await db.query(
        'UPDATE ReservationDb SET quantity = ?, price = ?, check_in_date = ?, check_out_date = ?, status = ? WHERE id = ?',
        [quantity, price, check_in_date, check_out_date, status, id]
      );

      res.json({
        success: true,
        message: 'Reservation updated successfully'
      });

    } catch (error) {
      console.error('Update reservation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update reservation',
        error: error.message
      });
    }
  },

  // Delete reservation
  async delete(req, res) {
    try {
      const { id } = req.params;

      // Check if reservation exists
      const reservation = await Reservation.findById(id);
      if (!reservation) {
        return res.status(404).json({
          success: false,
          message: 'Reservation not found'
        });
      }

      // Delete reservation
      await db.query('DELETE FROM ReservationDb WHERE id = ?', [id]);

      res.json({
        success: true,
        message: 'Reservation deleted successfully'
      });

    } catch (error) {
      console.error('Delete reservation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete reservation',
        error: error.message
      });
    }
  }
};

export default ReservationController;