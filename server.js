import express from "express";
import 'dotenv/config.js'
import cors from "cors";
import path from "path";
import UserRoutes from "./routers/UserRoutes.js"; 
import CustomerAmRoutes from "./routers/customer/CustomerAmRoutes.js";
import OwnerAmenityRoutes from "./routers/owner/ownerAmenityRoutes.js"; 
import ownerDashboardRoutes from './routers/owner/ownerDashboardRoutes.js';
import transactionRoutes from './routers/TransactionRoutes.js';


const app = express();

let corsOptions = {
    origin: process.env.ORIGIN || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}

app.use(express.json());
app.use(cors(corsOptions));

app.use('/uploads/am_images', express.static(path.join(process.cwd(), 'uploads', 'am_images')));

app.use((req, res, next) => {
    console.log(req.path, req.method);
    next();
});


app.use('/api/auth', UserRoutes);

app.use('/api/amenities', CustomerAmRoutes);  

// routes para sa owner
app.use('/api/owner/amenities', OwnerAmenityRoutes);
app.use('/uploads/payments', express.static(path.join(process.cwd(), 'uploads', 'payments')));
app.use('/api/owner', ownerDashboardRoutes); 

// NEW: routes para sa transactions at reservations
app.use('/api/transactions', transactionRoutes);


app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'IRMS API is running!',
        timestamp: new Date().toISOString()
    });
});

app.get('/', (req, res) => {
    res.json({ message: 'Server is running' });
});

try {
    app.listen(process.env.PORT || 5000, () => {
        console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
        console.log(`📍 Health check: http://localhost:${process.env.PORT || 5000}/api/health`);
    });
} catch (e) {
    console.log(e);
}