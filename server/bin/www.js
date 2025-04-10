const app = require("../app");

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    // try {
    //     await sequelize.authenticate();
    //     console.log('Database connection established successfully.');
    // } catch (error) {
    //     console.error('Unable to connect to the database:', error);
    // }
});