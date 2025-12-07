import db from '../config/db.js';

const ReservationModel = {
  
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

  async getTodaysCheckIns() {
    const [rows] = await db.query(
      `SELECT r.*, t.customer_name, t.contact_number 
       FROM ReservationDb r
       JOIN TransactionDb t ON r.transaction_id = t.id
       -- Compare Check-in Date vs PH Date Today
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

};

export default ReservationModel;