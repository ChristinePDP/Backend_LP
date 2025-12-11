import db from '../config/db.js';

const ReservationModel = {
  // 1. STANDARD CRUD
  async create(reservationData) {
    const {
      transaction_id,
      amenity_name,
      quantity,
      price,
      check_in_date,
      check_out_date
    } = reservationData;

    const [result] = await db.query(
      `INSERT INTO ReservationDb (
        transaction_id, amenity_name, quantity, price,
        check_in_date, check_out_date, status
      ) VALUES (?, ?, ?, ?, ?, ?, 'Pending')`,
      [transaction_id, amenity_name, quantity, price, check_in_date, check_out_date]
    );
    return result.insertId;
  },

  async findByTransactionId(transaction_id) {
    const [rows] = await db.query(
      'SELECT * FROM ReservationDb WHERE transaction_id = ?',
      [transaction_id]
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await db.query(
      'SELECT * FROM ReservationDb WHERE id = ?',
      [id]
    );
    return rows[0];
  },

  async updateStatusByTransaction(transaction_id, status) {
    await db.query(
      'UPDATE ReservationDb SET status = ? WHERE transaction_id = ?',
      [status, transaction_id]
    );
  },

  async cancelByTransaction(transaction_id) {
    await db.query(
      'UPDATE ReservationDb SET status = "Cancelled" WHERE transaction_id = ?',
      [transaction_id]
    );
  },

  async createMultiple(reservationsData) {
    const promises = reservationsData.map(reservation => this.create(reservation));
    return Promise.all(promises);
  },

  // =========================================================
  // 2. DASHBOARD / TASK LIST FEATURES
  // =========================================================

  async getTodaysCheckIns() {
    const [rows] = await db.query(
      `SELECT r.*, t.customer_name, t.contact_number 
       FROM ReservationDb r
       JOIN TransactionDb t ON r.transaction_id = t.id
       WHERE DATE(r.check_in_date) = DATE(DATE_ADD(NOW(), INTERVAL 8 HOUR))
       AND r.status != 'Cancelled'
       ORDER BY r.check_in_date ASC`
    );
    return rows;
  },

  async getTodaysCheckOuts() {
    const [rows] = await db.query(
      `SELECT r.*, t.customer_name, t.contact_number 
       FROM ReservationDb r
       JOIN TransactionDb t ON r.transaction_id = t.id
       WHERE DATE(r.check_out_date) = DATE(DATE_ADD(NOW(), INTERVAL 8 HOUR))
       AND r.status != 'Cancelled'
       ORDER BY r.check_out_date ASC`
    );
    return rows;
  },

  async extendCheckOutDate(reservation_id, new_check_out_date) {
    const [result] = await db.query(
      'UPDATE ReservationDb SET check_out_date = ? WHERE id = ?',
      [new_check_out_date, reservation_id]
    );
    return result.affectedRows;
  },

  async updatePaymentToFullyPaid(transaction_id) {
    const [result] = await db.query(
      `UPDATE TransactionDb 
       SET payment_status = 'Fully Paid' 
       WHERE id = ? AND balance <= 0`,
      [transaction_id]
    );
    return result.affectedRows;
  },

  // ============================================================
  // 👇 BAGONG FUNCTION: CHECK AVAILABILITY (INVENTORY LOCKING)
  // ============================================================
  async checkAvailability(amenity_name, check_in, check_out) {
    // 1. Kunin ang Total Limit ng Amenity (e.g., 2 units)
    const [amenity] = await db.query('SELECT quantity FROM AmenitiesDb WHERE name = ?', [amenity_name]);
    
    if (amenity.length === 0) {
        return { error: `Amenity '${amenity_name}' not found in database` };
    }
    
    const maxLimit = amenity[0].quantity;

    // 2. Bilangin ang existing reservations na tumatama sa dates na ito
    // Logic: Active Status + Date Overlap
    const [usage] = await db.query(`
      SELECT COALESCE(SUM(quantity), 0) as booked_count 
      FROM ReservationDb 
      WHERE amenity_name = ? 
      AND status IN ('Confirmed', 'Pending', 'Checked-In')
      AND NOT (
        check_out_date <= ? OR  -- Tapos na bago dumating
        check_in_date >= ?      -- Darating pa lang pagkaalis nila
      )
    `, [amenity_name, check_in, check_out]);

    const bookedCount = parseInt(usage[0].booked_count || 0);
    const remaining = maxLimit - bookedCount;

    return { 
        total: maxLimit,
        used: bookedCount,
        remaining: remaining, // Ito ang iche-check natin
        isFull: remaining <= 0
    };
  }

};

export default ReservationModel;