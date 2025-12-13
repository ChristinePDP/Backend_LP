import db from '../../config/db.js';

const CustomerFeedbackModel = {
  // GET ALL REVIEWS (Admin/Public View)
  async getAll(startDate, endDate) {
    let query = `SELECT id, customer_name, rating AS average, comment, date, rating_service AS service, rating_cleanliness AS cleanliness, rating_amenities AS amenities FROM FeedbackDb`;
    
    const params = [];
    if (startDate && endDate && startDate !== 'undefined' && endDate !== 'undefined') {
      query += ` WHERE date BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }

    query += ` ORDER BY date DESC`;
    const [rows] = await db.query(query, params);
    return rows; 
  },

  // CREATE (UPDATED: May transaction_ref na)
  async create(data) {
    // Siguraduhing may 'transaction_ref' column ka na sa database (ginawa mo na ito kanina)
    const query = `INSERT INTO FeedbackDb (transaction_ref, customer_name, rating, comment, date, rating_service, rating_cleanliness, rating_amenities) VALUES (?, ?, ?, ?, NOW(), ?, ?, ?)`;
    
    const finalRating = Math.round(data.rating); 

    const [result] = await db.query(query, [
      data.transaction_ref, // <--- ITO ANG KULANG SA FILE NA SINEND MO
      data.name, 
      finalRating, 
      data.comment,
      data.ratings.service,      
      data.ratings.cleanliness,  
      data.ratings.amenities     
    ]);
    return result;
  },

  // CHECKING FUNCTION (ITO ANG KULANG KAYA NAKA-LOCK)
  async getByTransactionRef(transactionRef) {
    const query = `SELECT id FROM FeedbackDb WHERE transaction_ref = ?`;
    const [rows] = await db.query(query, [transactionRef]);
    return rows[0]; 
  }
};

export default CustomerFeedbackModel;