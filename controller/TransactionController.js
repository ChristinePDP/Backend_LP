import Transaction from '../models/TransactionModel.js';
import Reservation from '../models/ReservationModel.js';
// 👇 IMPORTANTE: Idagdag ito para gumana ang date checking
import OwnerAmenityModel from '../models/owner/OwnerAmenityModel.js'; 
import db from '../config/db.js';

const generateTransactionRef = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `TXN-${year}${month}${day}-${random}`;
};

const formatForMySQL = (datetimeString) => {
    if (!datetimeString) return null;
    return datetimeString.replace('T', ' ') + ':00';
};

const TransactionController = {
    
    // ============================================================
    // 👇 BAGONG FUNCTION: REAL-TIME DATE CHECKING
    // ============================================================
    async checkDateAvailability(req, res) {
        try {
            const { checkIn, checkOut } = req.query;

            // Tawagin ang Model para kunin ang availability base sa dates
            const amenities = await OwnerAmenityModel.getAll(checkIn, checkOut);
            
            res.json({ success: true, data: amenities });

        } catch (error) {
            console.error('Check Date Availability Error:', error);
            res.status(500).json({ success: false, message: 'Error checking availability' });
        }
    },

    // ============================================================
    // 1. CREATE TRANSACTION (WITH FINAL INVENTORY CHECK)
    // ============================================================
    async create(req, res) {
        let connection;
        try {
            // Parse Inputs
            const cart = typeof req.body.cart === 'string' ? JSON.parse(req.body.cart) : req.body.cart;
            const { fullName, contactNumber, address, numGuest, checkInDate, checkOutDate, booking_type, paymentStatus, bookingStatus } = req.body;

            // Basic Validation
            if (!fullName || !contactNumber || !address || !numGuest || !checkInDate || !checkOutDate) {
                return res.status(400).json({ success: false, message: 'All fields are required' });
            }
            if (!cart || cart.length === 0) {
                return res.status(400).json({ success: false, message: 'Cart cannot be empty' });
            }

            const mysqlCheckInDate = formatForMySQL(checkInDate);
            const mysqlCheckOutDate = formatForMySQL(checkOutDate);

            // 🛑 FINAL CHECK: BAGO MAG-SAVE SA DB
            for (const item of cart) {
                const check = await Reservation.checkAvailability(
                    item.amenity_name, 
                    mysqlCheckInDate, 
                    mysqlCheckOutDate
                );

                if (check.error) {
                    return res.status(400).json({ success: false, message: check.error });
                }

                if (item.quantity > check.remaining) {
                    return res.status(400).json({ 
                        success: false, 
                        message: `SOLD OUT: Ang ${item.amenity_name} ay may ${check.remaining} unit(s) na lang na available sa petsang ito.` 
                    });
                }
            }

            // ✅ PROCEED TO SAVE
            connection = await db.getConnection();
            await connection.beginTransaction();

            const isWalkIn = booking_type === 'Walk-in';
            const user_id = req.user ? req.user.id : (req.body.user_id || null);
            
            // 1. Calculate Duration
            let days = 1;
            const start = new Date(checkInDate);
            const end = new Date(checkOutDate);
            if (end > start) {
                const diffTime = Math.abs(end - start);
                days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            }
            if (days < 1) days = 1;

            // 2. Calculate Totals
            const guestCount = parseInt(numGuest) || 0;
            const totalEntranceFee = guestCount * 50;
            const cartTotal = cart.reduce((total, item) => total + (parseFloat(item.amenity_price) * parseInt(item.quantity)), 0);
            
            const calculatedTotal = (cartTotal + totalEntranceFee) * days;
            
            let finalTotalAmount = calculatedTotal;
            let finalDownpayment = 0;
            let finalBalance = 0;

            if (isWalkIn) {
                finalDownpayment = calculatedTotal; 
                finalBalance = 0;
            } else {
                finalDownpayment = finalTotalAmount * 0.2; // 20% DP
                finalBalance = finalTotalAmount - finalDownpayment;
            }

            const transaction_ref = generateTransactionRef();
            const proof_of_payment = req.file ? req.file.path : null;
            const finalPaymentStatus = paymentStatus || (isWalkIn ? 'Fully Paid' : 'Partial'); 
            const finalBookingStatus = bookingStatus || (isWalkIn ? 'Confirmed' : 'Pending'); 

            // Insert to TransactionDb
            const transactionId = await Transaction.create({
                transaction_ref,
                customer_name: fullName,
                contact_number: contactNumber,
                customer_address: address,
                num_guest: numGuest, 
                total_amount: finalTotalAmount,
                downpayment: finalDownpayment,
                balance: finalBalance,
                proof_of_payment,
                user_id: user_id,
                payment_status: finalPaymentStatus, 
                booking_status: finalBookingStatus,
                booking_type: booking_type || 'Online'
            });

            // Insert to ReservationDb
            const reservationsData = cart.map(item => ({
                transaction_id: transactionId,
                amenity_name: item.amenity_name,
                amenity_id: item.amenity_id || null, 
                quantity: item.quantity,
                price: item.amenity_price,
                check_in_date: mysqlCheckInDate,
                check_out_date: mysqlCheckOutDate
            }));

            await Reservation.createMultiple(reservationsData);
            await connection.commit();
            
            res.status(201).json({
                success: true,
                message: isWalkIn ? 'Walk-in booking created successfully' : 'Transaction created successfully',
                transaction_ref, 
                transaction_id: transactionId, 
                total_amount: finalTotalAmount
            });

        } catch (error) {
            if (connection) await connection.rollback();
            console.error('Transaction creation error:', error);
            res.status(500).json({ success: false, message: 'Failed to create transaction', error: error.message });
        } finally {
            if (connection) connection.release();
        }
    },

    // 2. GET ALL TRANSACTIONS
    async getAll(req, res) {
        try {
            const results = await Transaction.getAllWithReservations();
            const formattedResults = results.map(row => {
                let extensions = [];
                if (row.extension_history) {
                    try { extensions = typeof row.extension_history === 'string' ? JSON.parse(row.extension_history) : row.extension_history; } catch (e) { extensions = []; }
                }
                return {
                    ...row,
                    reservations: row.reservations_json ? JSON.parse(`[${row.reservations_json}]`) : [],
                    extensions: extensions
                };
            });
            res.json({ success: true, data: formattedResults });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to fetch transactions', error: error.message });
        }
    },

    // 3. GET TODAY'S BOOKINGS
    async getTodaysBookings(req, res) {
        try {
            const results = await Transaction.getTodaysTransactions();
            const formattedResults = results.map(row => {
                let extensions = [];
                if (row.extension_history) {
                    try { extensions = typeof row.extension_history === 'string' ? JSON.parse(row.extension_history) : row.extension_history; } catch (e) { extensions = []; }
                }
                return {
                    ...row,
                    reservations: row.reservations_json ? JSON.parse(`[${row.reservations_json}]`) : [],
                    extensions: extensions
                };
            });
            res.json({ success: true, count: formattedResults.length, data: formattedResults });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to fetch today\'s transactions', error: error.message });
        }
    },

    // 4. GET BY REFERENCE
    async getByRef(req, res) {
        try {
            const { transaction_ref } = req.params;
            const transaction = await Transaction.findByRef(transaction_ref);
            if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });

            const reservations = await Reservation.findByTransactionId(transaction.id);
            let extensions = [];
            if (transaction.extension_history) {
                try { extensions = typeof transaction.extension_history === 'string' ? JSON.parse(transaction.extension_history) : transaction.extension_history; } catch(e) { extensions = []; }
            }
            res.json({ success: true, data: { ...transaction, reservations, extensions } });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to fetch transaction', error: error.message });
        }
    },

    // 5. GET MY TRANSACTIONS
    async getMyTransactions(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) return res.status(401).json({ success: false, message: 'User not authenticated' });

            const transactions = await Transaction.findByUserId(userId);
            const transactionsWithReservations = await Promise.all(
                transactions.map(async (transaction) => {
                    const reservations = await Reservation.findByTransactionId(transaction.id);
                    return { ...transaction, reservations: reservations || [] };
                })
            );
            res.json({ success: true, data: transactionsWithReservations });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to fetch your transactions', error: error.message });
        }
    },

    // GET BY CUSTOMER NAME
    async getByCustomer(req, res) {
        try {
            const { customer_name, contact_number } = req.query;
            if (!customer_name || !contact_number) return res.status(400).json({ success: false, message: 'Customer name and contact number required' });
            
            const transactions = await Transaction.findByCustomer(customer_name.trim(), contact_number.trim());
            const transactionsWithReservations = await Promise.all(
                transactions.map(async (transaction) => {
                    const reservations = await Reservation.findByTransactionId(transaction.id);
                    return { ...transaction, reservations: reservations || [] };
                })
            );
            res.json({ success: true, data: transactionsWithReservations });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to fetch transactions', error: error.message });
        }
    },

    // GET BY USER ID
    async getByUserId(req, res) {
        try {
            const { userId } = req.params;
            if (!userId) return res.status(400).json({ success: false, message: "User ID is required" });

            const transactions = await Transaction.findByUserId(userId);
            const transactionsWithReservations = await Promise.all(
                transactions.map(async (transaction) => {
                    const reservations = await Reservation.findByTransactionId(transaction.id);
                    return { ...transaction, reservations: reservations || [] };
                })
            );
            res.json({ success: true, data: transactionsWithReservations });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // 6. UPDATE STATUS
    async updateStatus(req, res) {
        let connection;
        try {
            connection = await db.getConnection();
            await connection.beginTransaction();
            
            const { transaction_id } = req.params;
            const { booking_status } = req.body;
            const validStatuses = ['Pending', 'Confirmed', 'Cancelled', 'Completed', 'Checked-In', 'Checked-Out'];
            
            if (!validStatuses.includes(booking_status)) {
                await connection.rollback();
                return res.status(400).json({ success: false, message: 'Invalid status' });
            }

            const transaction = await Transaction.findById(transaction_id);
            if (!transaction) {
                await connection.rollback();
                return res.status(404).json({ success: false, message: 'Transaction not found' });
            }

            if (booking_status === 'Checked-In') {
                await Transaction.checkIn(transaction_id);
            } else {
                await Transaction.updateStatus(transaction_id, booking_status);
            }

            await Reservation.updateStatusByTransaction(transaction_id, booking_status);
            await connection.commit();

            res.json({ success: true, message: `Transaction updated to ${booking_status} successfully` });

        } catch (error) {
            if (connection) await connection.rollback();
            res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
        } finally {
            if (connection) connection.release();
        }
    },

    // 7. CANCEL TRANSACTION
    async cancel(req, res) {
        let connection;
        try {
            connection = await db.getConnection();
            await connection.beginTransaction();
            const { transaction_id } = req.params;
            
            const transaction = await Transaction.findById(transaction_id);
            if (!transaction) {
                await connection.rollback();
                return res.status(404).json({ success: false, message: 'Transaction not found' });
            }
            
            await Transaction.cancel(transaction_id);
            await Reservation.cancelByTransaction(transaction_id);
            await connection.commit();
            
            res.json({ success: true, message: 'Transaction cancelled successfully' });
        } catch (error) {
            if (connection) await connection.rollback();
            res.status(500).json({ success: false, message: 'Failed to cancel transaction', error: error.message });
        } finally {
            if (connection) connection.release();
        }
    },

    // 8. UPDATE PAYMENT STATUS
    async updatePaymentStatus(req, res) {
        try {
            const { transaction_id } = req.params;
            const { payment_status } = req.body;
            const validStatuses = ['Partial', 'Fully Paid'];
            if (!validStatuses.includes(payment_status)) return res.status(400).json({ success: false, message: 'Invalid payment status' });

            const transaction = await Transaction.findById(transaction_id);
            if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });

            await db.query('UPDATE TransactionDb SET payment_status = ? WHERE id = ?', [payment_status, transaction_id]);
            res.json({ success: true, message: `Payment status updated to ${payment_status}` });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to update payment status', error: error.message });
        }
    },

    // 9. UPDATE TOTAL
    async updateTransactionTotal(req, res) {
        let connection;
        try {
            connection = await db.getConnection();
            await connection.beginTransaction();
            const { transaction_id } = req.params;
            const { total_amount, balance } = req.body;
            
            if (typeof total_amount === 'undefined' || typeof balance === 'undefined') {
                await connection.rollback();
                return res.status(400).json({ success: false, message: 'total_amount and balance are required' });
            }
            
            await db.query('UPDATE TransactionDb SET total_amount = ?, balance = ? WHERE id = ?', [total_amount, balance, transaction_id]);
            await connection.commit();
            res.json({ success: true, message: 'Transaction updated successfully' });
        } catch (error) {
            if (connection) await connection.rollback();
            res.status(500).json({ success: false, message: 'Failed to update transaction', error: error.message });
        } finally {
            if (connection) connection.release();
        }
    }
};

export default TransactionController;