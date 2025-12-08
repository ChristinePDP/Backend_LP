import db from '../config/db.js';

const TransactionModel = {
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

  async findByCustomer(customer_name, contact_number) {
    const [rows] = await db.query(
      'SELECT * FROM TransactionDb WHERE customer_name = ? AND contact_number = ? ORDER BY created_at DESC',
      [customer_name, contact_number]
    );
    return rows;
  },

  async findByRef(transaction_ref) {
    const [rows] = await db.query(
      'SELECT * FROM TransactionDb WHERE transaction_ref = ?',
      [transaction_ref]
    );
    return rows[0];
  },

  async findById(id) {
    const [rows] = await db.query(
      'SELECT * FROM TransactionDb WHERE id = ?',
      [id]
    );
    return rows[0];
  },

  // ✅ RETAINED FROM OLD CODE (Para sa Customer Booking History)
  async findByUserId(userId) {
    const [rows] = await db.query(
      'SELECT * FROM TransactionDb WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    return rows;
  },

  // Normal Status Update (Confirmed, Cancelled, Completed)
  async updateStatus(id, booking_status) {
    await db.query(
      'UPDATE TransactionDb SET booking_status = ? WHERE id = ?',
      [booking_status, id]
    );
  },

  // =========================================================
  // 2. OWNER DASHBOARD FEATURES (From New Code)
  // =========================================================

  // 👇 CORRECTED CHECK-IN (Zero Balance, Fully Paid, BUT PRESERVE DOWNPAYMENT)
  async checkIn(id) {
    // We set Balance to 0 because customer pays the remaining amount at the counter.
    const [result] = await db.query(
      `UPDATE TransactionDb 
       SET booking_status = 'Checked-In', 
           balance = 0, 
           payment_status = 'Fully Paid' 
       WHERE id = ?`,
      [id]
    );
    return result;
  },

  async cancel(id) {
    await db.query(
      'UPDATE TransactionDb SET booking_status = "Cancelled" WHERE id = ?',
      [id]
    );
  },

  // Get All with Reservations (Detailed for Dashboard)
  async getAllWithReservations() {
    const [rows] = await db.query(`
      SELECT t.*, 
        t.created_at as created_at_ph,
        t.extension_history, 
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
  },

  // Get Today's Transactions (For Task List)
  async getTodaysTransactions() {
    const [rows] = await db.query(`
      SELECT t.*, 
        t.created_at as created_at_ph,
        t.extension_history, 
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
      WHERE DATE(t.created_at) = DATE(DATE_ADD(NOW(), INTERVAL 8 HOUR))
      GROUP BY t.id 
      ORDER BY t.created_at DESC
    `);
    return rows;
  },

  // 👇 CORRECTED EXTENSION LOGIC
  async addExtension(id, extensionData, cost) {
    // 1. Get history
    const [rows] = await db.query('SELECT extension_history FROM TransactionDb WHERE id = ?', [id]);
    
    let currentHistory = rows[0]?.extension_history || [];
    
    // Safety check for JSON parsing
    if (typeof currentHistory === 'string') {
        try { currentHistory = JSON.parse(currentHistory); } catch(e) { currentHistory = []; }
    }
    if (!Array.isArray(currentHistory)) currentHistory = [];

    // 2. Add new extension record
    currentHistory.push(extensionData);

    // 3. Update DB
    await db.query(
      `UPDATE TransactionDb 
       SET extension_history = ?, 
           total_amount = total_amount + ?
       WHERE id = ?`,
      [JSON.stringify(currentHistory), cost, id]
    );
  }
};

export default TransactionModel;