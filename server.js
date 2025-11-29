import express from "express";
import 'dotenv/config.js'
import cors from "cors";
import path from "path";
// ----------------------------------------------------
// routes para sa user
// ----------------------------------------------------
import UserRoutes from "./routers/UserRoutes.js"; 
// ----------------------------------------------------

// ----------------------------------------------------
// routes para sa customer
// ----------------------------------------------------
import CustomerAmRoutes from "./routers/customer/CustomerAmRoutes.js";
// ----------------------------------------------------

// ----------------------------------------------------
// routes para sa owner
// ----------------------------------------------------
import OwnerAmenityRoutes from "./routers/owner/ownerAmenityRoutes.js"; 
import ownerDashboardRoutes from './routers/owner/ownerDashboardRoutes.js';
// ----------------------------------------------------

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

// ----------------------------------------------------
// routes para sa user
// ----------------------------------------------------
app.use('/api/auth', UserRoutes);
// ----------------------------------------------------

// ----------------------------------------------------
// routes para sa customer
// ----------------------------------------------------
app.use('/api/amenities', CustomerAmRoutes);  
// ----------------------------------------------------

// ----------------------------------------------------
// routes para sa owner
// ----------------------------------------------------
app.use('/api/owner/amenities', OwnerAmenityRoutes);
app.use('/api/owner', ownerDashboardRoutes); 
// ----------------------------------------------------


app.get('/', (req, res) => {
    res.json({ message: 'Server is running' });
});

try {
    app.listen(process.env.PORT || 5000, () => {
        console.log(`Listening to port ${process.env.PORT || 5000}...`);
    });
} catch (e) {
    console.log(e);
}