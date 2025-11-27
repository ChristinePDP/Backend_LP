import express from "express";
import 'dotenv/config.js'
import cors from "cors";
import path from "path";
import UserRoutes from "./routers/UserRoutes.js"; 
import CustomerAmRoutes from "./routers/customer/CustomerAmRoutes.js";

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