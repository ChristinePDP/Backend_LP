import CustomerFeedbackModel from '../../models/customer/CustomerFeedbackModel.js';

// GET REQUEST
export const getAllFeedbacks = async (req, res) => {
  try {
    // 1. Kunin ang dates sa URL
    const { startDate, endDate } = req.query; 

    // 2. Ipasa sa Model
    const feedbacks = await CustomerFeedbackModel.getAll(startDate, endDate);
    
    // 3. ✅ FIX: Ibalik ang 'feedbacks' nang direkta (Array), huwag ilagay sa loob ng object.
    // Dahil ang frontend mo ay gumagamit ng 'response.data.map', kailangan array agad ito.
    res.json(feedbacks); 

  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    res.status(500).json({ error: "Failed to fetch feedbacks" });
  }
};

// ... (retain createFeedback code)
export const createFeedback = async (req, res) => {
    // ... code mo dati ...
    try {
        const createdFeedback = await CustomerFeedbackModel.create(req.body);
        res.status(201).json({ success: true, message: "Submitted", feedback: createdFeedback });
    } catch (error) {
        console.error("Error creating feedback:", error);
        res.status(500).json({ success: false, error: "Failed to submit" });
    }
};