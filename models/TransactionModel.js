import db from '../config/db.js';

const generateTransactionRef = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TXN-${year}${month}${day}-${random}`;
};


const TransactionModel = {
  // Create new transaction - FIXED
  // 1. CREATE TRANSACTION (Combined Fields)
  async create(transactionData) {
    const {
      transaction_ref,
      customer_name,
      contact_number,
      customer_address,
      total_amount,
      downpayment,
      balance,
      proof_of_payment = null,
      user_id,                  // ✅ Included for Registered Users
      booking_type = 'Online',
      payment_status = 'Partial',
      booking_status = 'Pending'
    } = transactionData; 

    // Debugging
    console.log('📝 Creating Transaction for User ID:', user_id);

    const [result] = await db.query(
      `INSERT INTO TransactionDb (
        transaction_ref, customer_name, contact_number, customer_address,
        total_amount, downpayment, balance, payment_status, booking_type, 
        booking_status, proof_of_payment, user_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 8 HOUR))`, 
      [
        transaction_ref,
        customer_name,
        contact_number,
        customer_address,
        total_amount,
        downpayment,
        balance,
        payment_status,
        booking_type, 
        booking_status, 
        proof_of_payment,
        user_id // ✅ Passed successfully
      ]
    );
    return result.insertId;
  },

  // Find by transaction reference
  async findByRef(transaction_ref) {
    const [rows] = await db.query(
      'SELECT * FROM TransactionDb WHERE transaction_ref = ?',
      [transaction_ref]
    );
    return rows[0];
  },

  // Find by ID
  async findById(id) {
    const [rows] = await db.query(
      'SELECT * FROM TransactionDb WHERE id = ?',
      [id]
    );
    return rows[0];
  },

  // Update booking status
  async updateStatus(id, booking_status) {
    await db.query(
      'UPDATE TransactionDb SET booking_status = ? WHERE id = ?',
      [booking_status, id]
    );
  },

  // Cancel transaction
  async cancel(id) {
    await db.query(
      'UPDATE TransactionDb SET booking_status = "Cancelled" WHERE id = ?',
      [id]
    );
  },

  // Get all transactions with reservations
  async getAllWithReservations() {
    const [rows] = await db.query(`
      SELECT t.*, 
        GROUP_CONCAT(
          JSON_OBJECT(
            'id', r.id,
            'amenity_name', r.amenity_name,
            'quantity', r.quantity,
            'price', r.price,
            'check_in_date', r.check_in_date,
            'check_out_date', r.check_out_date,
            'status', r.status
          )
        ) as reservations_json
      FROM TransactionDb t
      LEFT JOIN ReservationDb r ON t.id = r.transaction_id
      GROUP BY t.id 
      ORDER BY t.created_at DESC
    `);
    return rows;
  }
};

export default TransactionModel;