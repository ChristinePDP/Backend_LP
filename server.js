import express from "express";
import 'dotenv/config.js'
import cors from "cors";
import path from "path";
import UserRoutes from "./routers/UserRoutes.js"; 
import CustomerAmRoutes from "./routers/customer/CustomerAmRoutes.js";
import OwnerAmenityRoutes from "./routers/owner/ownerAmenityRoutes.js"; 
import ownerDashboardRoutes from './routers/owner/ownerDashboardRoutes.js';
import transactionRoutes from './routers/TransactionRoutes.js';
import reservationRoutes from './routers/ReservationRoutes.js';
import CustomerFeedbackRoutes from "./routers/customer/CustomerFeedbackRoutes.js";

const app = express();

function validateRouteFile(routeName, router) {
    const routerStack = router.stack || router._router?.stack || [];
    
    routerStack.forEach((layer) => {
        if (layer.route) {
            const path = layer.route.path;
            if (path.includes(':*') || path.includes('::')) {
                console.error(`❌ INVALID ROUTE FOUND: ${path}`);
                console.error(`   File: ${routeName}`);
                throw new Error(`Invalid route syntax in ${routeName}: ${path}`);
            }
        }
    });
}



let corsOptions = {
    origin: process.env.ORIGIN || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}

try {
    validateRouteFile('UserRoutes (Auth)', UserRoutes);
    validateRouteFile('CustomerAmRoutes', CustomerAmRoutes);
    validateRouteFile('CustomerFeedbackRoutes', CustomerFeedbackRoutes);
    validateRouteFile('OwnerAmenityRoutes', OwnerAmenityRoutes);
    validateRouteFile('ownerDashboardRoutes', ownerDashboardRoutes);
    
    // ❌ REMOVED THIS LINE CAUSING THE CRASH:
    // validateRouteFile('userRoutes (Owner Manage)', userRoutes); 
    
    validateRouteFile('transactionRoutes', transactionRoutes);
    validateRouteFile('reservationRoutes', reservationRoutes);
} catch (error) {
    console.error('\n❌ ROUTE VALIDATION ERROR:');
    console.error(error.message);
    process.exit(1); 
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
app.use('/api/reservations', reservationRoutes);
app.use('/api/feedbacks', CustomerFeedbackRoutes)

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