import Amenity from '../../models/customer/CustomerAmModel.js';

export const getAllAmenities = async (req, res) => {
  try {
    const amenities = await Amenity.getAll();
    
    const formattedAmenities = amenities.map(amenity => 
      Amenity.formatAmenity(amenity)
    );
    
    res.json(formattedAmenities);
  } catch (error) {
    console.error('Error fetching amenities:', error);
    res.status(500).json({ error: 'Failed to fetch amenities' });
  }
};

export const getAmenityById = async (req, res) => {
  try {
    const { id } = req.params;
    const amenity = await Amenity.getById(id);
    
    if (!amenity) {
      return res.status(404).json({ error: 'Amenity not found' });
    }
    
    const formattedAmenity = Amenity.formatAmenity(amenity);
    res.json(formattedAmenity);
  } catch (error) {
    console.error('Error fetching amenity:', error);
    res.status(500).json({ error: 'Failed to fetch amenity' });
  }
};