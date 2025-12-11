import db from '../../config/db.js';

const OwnerAmenityModel = {
    // 1. GET ALL (Updated Logic: Default to Available if no date selected)
    getAll: async (checkIn = null, checkOut = null) => {
        let query;

        // SCENARIO A: KAPAG MAY DATE NA PINILI ANG USER
        // Dito lang tayo maghihigpit at magbibilang ng bookings.
        if (checkIn && checkOut) {
            query = `
                SELECT 
                    a.*, 
                    (SELECT COALESCE(SUM(b.quantity), 0)
                     FROM ReservationDb b 
                     WHERE b.amenity_name = a.name 
                     AND b.status IN ('Confirmed', 'Checked-In', 'Pending')
                     -- Check Overlap Logic
                     AND NOT (
                        b.check_out_date <= '${checkIn}' OR 
                        b.check_in_date >= '${checkOut}'
                     )
                    ) as booked_count
                FROM AmenitiesDb a 
                ORDER BY a.id DESC
            `;
        } 
        // SCENARIO B: KAPAG WALA PANG DATE (Initial Load / Catalog View)
        // I-set natin ang booked_count sa 0 para maging "Available" lahat sa simula.
        else {
            query = `
                SELECT 
                    a.*, 
                    0 as booked_count 
                FROM AmenitiesDb a 
                ORDER BY a.id DESC
            `;
        }

        const [rows] = await db.query(query);

        return rows.map(amenity => {
            const remaining = amenity.quantity - amenity.booked_count;
            
            return {
                ...amenity,
                // Ito ang logic: 
                // Kung wala pang date, 'booked_count' ay 0, so 'remaining' = 'quantity'. (Available)
                // Kung may date na, babawas na ang reservations.
                slots_left: remaining > 0 ? remaining : 0,
                real_time_status: remaining <= 0 ? 'FULL' : 'AVAILABLE'
            };
        });
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
        let updateQuery = 'UPDATE AmenitiesDb SET name=?, description=?, price=?, type=?, available=?, capacity=?, quantity=?';
        const params = [name, description, price, type, available, capacity, quantity];
        
        if (image) {
            updateQuery += ', image=?';
            params.push(image);
        }
        
        updateQuery += ' WHERE id=?';
        params.push(id);

        return await db.query(updateQuery, params);
    },

    delete: async (id) => {
        return await db.query('DELETE FROM AmenitiesDb WHERE id = ?', [id]);
    }
};

export default OwnerAmenityModel;