import CustomerFeedbackModel from '../../models/customer/CustomerFeedbackModel.js';

// GET REQUEST
export const getAllFeedbacks = async (req, res) => {
  try {
    // Model now returns data with aliases (average, service, cleanliness, amenities)
    const feedbacks = await CustomerFeedbackModel.getAll();
    res.json(feedbacks);
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    res.status(500).json({ error: "Failed to fetch feedbacks" });
  }
};

// POST REQUEST
export const createFeedback = async (req, res) => {
  try {
    // FIX: Siguraduhin na ang Model ay tumatanggap ng data.ratings breakdown object
    await CustomerFeedbackModel.create(req.body); 
    
    res.status(201).json({ success: true, message: "Feedback submitted successfully" });
  } catch (error) {
    console.error("Error creating feedback:", error);
    res.status(500).json({ success: false, error: "Failed to submit feedback" });
  }
};