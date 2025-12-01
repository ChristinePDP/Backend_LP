import db from '../../config/db.js';

const CustomerFeedbackModel = {
  // 1. GET ALL REVIEWS (Fixed Syntax & using breakdown columns)
  async getAll() {
    const query = `SELECT id, customer_name, rating AS average, comment, date, rating_service AS service, rating_cleanliness AS cleanliness, rating_amenities AS amenities FROM FeedbackDb ORDER BY date DESC`;
    const [rows] = await db.query(query);
    return rows;
  },

  // 2. CREATE NEW REVIEW (Fixed Syntax & using breakdown columns)
  async create(data) {
    const query = `INSERT INTO FeedbackDb (customer_name, rating, comment, date, rating_service, rating_cleanliness, rating_amenities) VALUES (?, ?, ?, NOW(), ?, ?, ?)`;
    
    const finalRating = Math.round(data.rating); 

    const [result] = await db.query(query, [
      data.name, 
      finalRating, 
      data.comment,
      data.ratings.service,       // Breakdown
      data.ratings.cleanliness,   // Breakdown
      data.ratings.amenities      // Breakdown
    ]);
    return result;
  }
};

export default CustomerFeedbackModel;