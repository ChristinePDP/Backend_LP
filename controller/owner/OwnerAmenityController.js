import OwnerAmenityModel from '../../models/owner/OwnerAmenityModel.js';

const OwnerAmenityController = {
    getAll: async (req, res) => {
        try {
            console.log('=== GET ALL OWNER AMENITIES ===');
            
            const amenities = await OwnerAmenityModel.getAll();
            console.log('Raw amenities from DB:', amenities);
            console.log('Total amenities count:', amenities.length);
            
            const formatted = amenities.map(a => {
                const totalQty = a.quantity ? parseInt(a.quantity) : 0;
                const booked = a.booked_today || 0;
                const formattedAmenity = {
                    ...a,
                    image: a.image || null, 
                    quantity: totalQty,
                    booked: booked,
                    available: (a.available === 'Yes' || a.available === 1) && (booked < totalQty)
                };
                console.log(`Formatted amenity ID ${a.id}:`, formattedAmenity);
                return formattedAmenity;
            });
            
            const response = { amenities: formatted };
            console.log('Final response:', response);
            console.log('=== END GET ALL OWNER AMENITIES ===');
            
            res.json(response);
        } catch (err) { 
            console.error('Error in getAll amenities:', err);
            console.error('Error stack:', err.stack);
            res.status(500).json({ message: 'Error getting amenities' }); 
        }
    },

    create: async (req, res) => {
        try {
            console.log('=== CREATE OWNER AMENITY ===');
            console.log('Request body:', req.body);
            console.log('Request file:', req.file);
            console.log('Request headers:', req.headers);
            
            const { name, type, description, capacity, price, status, quantity } = req.body;
            const image = req.file ? req.file.path : null; 
            const available = (status === 'available' || status === 'true') ? 'Yes' : 'No';
            
            const createData = {
                image, name, type: type || 'kubo', description, capacity, price, available, quantity: quantity || 0
            };
            console.log('Data to create:', createData);
            
            const result = await OwnerAmenityModel.create(createData);
            console.log('Create result:', result);
            
            const response = { message: 'Added', id: result.insertId, imageUrl: image };
            console.log('Final response:', response);
            console.log('=== END CREATE OWNER AMENITY ===');
            
            res.json(response);
        } catch (err) { 
            console.error('Error creating amenity:', err);
            console.error('Error stack:', err.stack);
            console.error('Request body that caused error:', req.body);
            console.error('Request file that caused error:', req.file);
            res.status(500).json({ message: 'Error adding amenity' }); 
        }
    },

    update: async (req, res) => {
        try {
            console.log('=== UPDATE OWNER AMENITY ===');
            console.log('Request params:', req.params);
            console.log('Request body:', req.body);
            console.log('Request file:', req.file);
            
            const { id } = req.params;
            const { name, type, description, capacity, price, status, quantity } = req.body;
            const available = (status === 'available' || status === 'true') ? 'Yes' : 'No';
            
            // Gumawa ng object na may lahat ng data para mas simple
            const updateData = {
                name, 
                type: type || 'kubo', // Re-use default type just in case
                description, 
                capacity, 
                price, 
                available, 
                quantity: quantity || 0
            };
            
            console.log('Update data before file:', updateData);
            
            if (req.file) {
                // Kung may bagong file, idagdag ang image path sa updateData
                updateData.image = req.file.path;
                console.log('Update data with file:', updateData);
            }
            
            console.log('Final update data:', updateData);
            
            // Tawagin ang model isang beses lang
            await OwnerAmenityModel.update(id, updateData);
            console.log('Update completed for ID:', id);
            
            const response = { message: 'Updated successfully', updatedData: updateData };
            console.log('Final response:', response);
            console.log('=== END UPDATE OWNER AMENITY ===');
            
            res.json(response);
        } catch (err) { 
            console.error("Update Amenity Error:", err);
            console.error("Error stack:", err.stack);
            console.error("Request params that caused error:", req.params);
            console.error("Request body that caused error:", req.body);
            console.error("Request file that caused error:", req.file);
            res.status(500).json({ message: 'Error updating amenity' }); 
        }
    },

    delete: async (req, res) => {
        try {
            console.log('=== DELETE OWNER AMENITY ===');
            console.log('Request params:', req.params);
            
            const { id } = req.params;
            console.log('Deleting amenity with ID:', id);
            
            await OwnerAmenityModel.delete(id);
            console.log('Successfully deleted amenity ID:', id);
            
            const response = { message: 'Deleted successfully', deletedId: id };
            console.log('Final response:', response);
            console.log('=== END DELETE OWNER AMENITY ===');
            
            res.json(response);
        } catch (err) { 
            console.error('Error deleting amenity:', err);
            console.error('Error stack:', err.stack);
            console.error('Request params that caused error:', req.params);
            res.status(500).json({ message: 'Error deleting amenity' }); 
        }
    }
};

export default OwnerAmenityController;