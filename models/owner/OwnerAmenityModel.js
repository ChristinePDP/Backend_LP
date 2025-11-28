import db from '../../config/db.js';

const OwnerAmenityModel = {
    getAll: async () => {
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

    update: async (id, data) => {
        const { name, description, price, type, available, capacity, quantity, image } = data;
        if (image) {
            return await db.query(
                'UPDATE AmenitiesDb SET name=?, description=?, price=?, type=?, available=?, capacity=?, quantity=?, image=? WHERE id=?',
                [name, description, price, type, available, capacity, quantity, image, id]
            );
        } else {
            return await db.query(
                'UPDATE AmenitiesDb SET name=?, description=?, price=?, type=?, available=?, capacity=?, quantity=? WHERE id=?',
                [name, description, price, type, available, capacity, quantity, id]
            );
        }
    },

    delete: async (id) => {
        return await db.query('DELETE FROM AmenitiesDb WHERE id = ?', [id]);
    }

};

export default OwnerAmenityModel;