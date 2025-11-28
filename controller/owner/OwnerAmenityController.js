
import OwnerAmenityModel from '../../models/owner/OwnerAmenityModel.js';

const OwnerAmenityController = {
    getAll: async (req, res) => {
        try {
            const amenities = await OwnerAmenityModel.getAll();
            const formatted = amenities.map(a => {
                const totalQty = a.quantity ? parseInt(a.quantity) : 0;
                const booked = a.booked_today || 0;
                return {
                    ...a,
                    image: a.image || null, 
                    quantity: totalQty,
                    booked: booked,
                    available: (a.available === 'Yes' || a.available === 1) && (booked < totalQty)
                };
            });
            res.json({ amenities: formatted });
        } catch (err) { 
            console.error(err);
            res.status(500).json({ message: 'Error getting amenities' }); 
        }
    },

    create: async (req, res) => {
        try {
            const { name, type, description, capacity, price, status, quantity } = req.body;
            const image = req.file ? req.file.path : null; 
            const available = (status === 'available' || status === 'true') ? 'Yes' : 'No';
            
            const result = await OwnerAmenityModel.create({
                image, name, type: type || 'kubo', description, capacity, price, available, quantity: quantity || 0
            });
            res.json({ message: 'Added', id: result.insertId, imageUrl: image });
        } catch (err) { 
            console.error(err);
            res.status(500).json({ message: 'Error adding amenity' }); 
        }
    },

    update: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, type, description, capacity, price, status, quantity } = req.body;
            const available = (status === 'available' || status === 'true') ? 'Yes' : 'No';
            
            if (req.file) {
                await OwnerAmenityModel.update(id, { 
                    name, type, description, capacity, price, available, quantity: quantity || 0, image: req.file.path 
                });
            } else {
                await OwnerAmenityModel.update(id, { 
                    name, type, description, capacity, price, available, quantity: quantity || 0 
                });
            }
            res.json({ message: 'Updated successfully' });
        } catch (err) { 
            console.error(err);
            res.status(500).json({ message: 'Error updating amenity' }); 
        }
    },

    delete: async (req, res) => {
        try {
            const { id } = req.params;
            await OwnerAmenityModel.delete(id);
            res.json({ message: 'Deleted successfully' });
        } catch (err) { 
            console.error(err);
            res.status(500).json({ message: 'Error deleting amenity' }); 
        }
    }

};

export default OwnerAmenityController;