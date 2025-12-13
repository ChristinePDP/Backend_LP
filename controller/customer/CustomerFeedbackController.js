import CustomerFeedbackModel from '../../models/customer/CustomerFeedbackModel.js';

// GET REQUEST
export const getAllFeedbacks = async (req, res) => {
  try {
    const { startDate, endDate } = req.query; 
    const feedbacks = await CustomerFeedbackModel.getAll(startDate, endDate);
    res.json(feedbacks); 
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    res.status(500).json({ error: "Failed to fetch feedbacks" });
  }
};

// CREATE FEEDBACK
export const createFeedback = async (req, res) => {
    try {
        const { transaction_ref } = req.body;

        // Check muna kung may feedback na
        if (transaction_ref) {
            const existing = await CustomerFeedbackModel.getByTransactionRef(transaction_ref);
            if (existing) {
                return res.status(400).json({ success: false, message: "Feedback already submitted for this booking." });
            }
        }

        const createdFeedback = await CustomerFeedbackModel.create(req.body);
        res.status(201).json({ success: true, message: "Submitted", feedback: createdFeedback });

    } catch (error) {
        console.error("Error creating feedback:", error);
        res.status(500).json({ success: false, error: "Failed to submit" });
    }
};

// STATUS CHECKER (ITO ANG HINAHANAP NG FRONTEND MO)
export const checkFeedbackStatus = async (req, res) => {
    try {
        const { ref } = req.params;
        const existing = await CustomerFeedbackModel.getByTransactionRef(ref);
        
        // Ibabalik: true kung meron na, false kung wala pa
        res.json({ hasFeedback: !!existing }); 

    } catch (error) {
        console.error("Error checking status:", error);
        res.status(500).json({ error: "Check failed" });
    }
};