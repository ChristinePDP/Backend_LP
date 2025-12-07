import db from '../../config/db.js'; // ES Module import

const CustomerAmModel = {
  // GET all amenities
  async getAll() {
    const query = `
      SELECT a.*, 
      (SELECT COUNT(*) FROM ReservationDb b 
        WHERE b.amenity_id = a.id           -- Corrected: amenity_id
        AND b.check_in_date = CURDATE()     -- Corrected: check_in_date
        AND b.status IN ('Confirmed', 'Checked-In')
      ) as booked_today
      FROM AmenitiesDb a 
      ORDER BY a.id DESC
    `;
    
    try {
      const [rows] = await db.query(query);
      return rows;
    } catch (error) {
      console.error("Error in CustomerAmModel.getAll:", error);
      throw error;
    }
  },

  
  async getById(id) {
    const query = `
      SELECT a.*, 
      (SELECT COUNT(*) FROM ReservationDb b 
        WHERE b.amenity_id = a.id 
        AND b.check_in_date = CURDATE() 
        AND b.status IN ('Confirmed', 'Checked-In')
      ) as booked_today
      FROM AmenitiesDb a 
      WHERE a.id = ?
    `;

    try {
      const [rows] = await db.query(query, [id]);
      return rows[0];
    } catch (error) {
      console.error("Error in CustomerAmModel.getById:", error);
      throw error;
    }
  },

  formatAmenity(amenity) {
    
    if (!amenity) return null;

    const totalQuantity = amenity.quantity ? parseInt(amenity.quantity) : 0;
    const currentBooked = amenity.booked_today || 0;
    
    
    const isFullyBooked = currentBooked >= totalQuantity;
    
    
    const isManuallyAvailable = (amenity.available === 'Yes' || amenity.available === 1);
    
    
    const finalAvailable = isManuallyAvailable && !isFullyBooked;

    return {
      id: amenity.id,
      name: amenity.name,
      type: amenity.type || 'General',
      description: amenity.description,
      capacity: amenity.capacity,
      price: parseFloat(amenity.price),
      available: finalAvailable ? 'Yes' : 'No', 
      quantity: totalQuantity,
      remaining: Math.max(0, totalQuantity - currentBooked), 
      image: amenity.image
    };
  },

  async getFeatured() {
    try {
      const [rows] = await db.query("SELECT * FROM AmenitiesDb LIMIT 3");
      return rows;
    } catch (error) {
      console.error("Error in CustomerAmModel.getFeatured:", error);
      throw error;
    }
  }
};

export default CustomerAmModel;