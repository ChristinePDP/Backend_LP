const db = require('../../config/db');

const OwnerAmenityModel = {
    getAll: async () => {
        // Updated: AmenitiesDb, ReservationDb
        const query = `
            SELECT a.*, 
            (SELECT COUNT(*) FROM ReservationDb b 
             WHERE b.amenity_id = a.id 
             AND b.date = DATE(CONVERT_TZ(NOW(), '+00:00', '+08:00')) 
             AND b.status IN ('Confirmed', 'Checked-In')) as booked_today
            FROM AmenitiesDb a 
            ORDER BY a.id DESC
        `;
        const [rows] = await db.query(query);
        return rows;
    },

    getById: async (id) => {
        const [rows] = await db.query('SELECT * FROM AmenitiesDb WHERE id = ?', [id]);
        return rows[0];
    },

    create: async (data) => {
        const { image, name, type, description, capacity, price, available, quantity } = data;
        return await db.query(
            'INSERT INTO AmenitiesDb (image, name, type, description, capacity, price, available, quantity) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [image, name, type, description, capacity, price, available, quantity]
        );
    },

    };

module.exports = OwnerAmenityModel;