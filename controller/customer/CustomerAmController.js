import CustomerAmModel from '../../models/customer/CustomerAmModel.js';

const CustomerAmController = {
  
  // 1. Get All Amenities
  getAll: async (req, res) => {
    try {
      const amenities = await CustomerAmModel.getAll();
      const formatted = amenities.map(amenity => CustomerAmModel.formatAmenity(amenity));
      res.json(formatted);
    } catch (error) {
      console.error('Error fetching amenities:', error);
      res.status(500).json({ error: 'Failed to fetch amenities' });
    }
  },

  // 2. Get Single Amenity by ID
  getById: async (req, res) => {
    try {
      const id = req.params.id;
      const amenity = await CustomerAmModel.getById(id);
      
      if (!amenity) {
        return res.status(404).json({ error: 'Amenity not found' });
      }

      const formatted = CustomerAmModel.formatAmenity(amenity);
      res.json(formatted);
    } catch (error) {
      console.error('Error fetching amenity:', error);
      res.status(500).json({ error: 'Failed to fetch amenity details' });
    }
  },
};

export default CustomerAmController;