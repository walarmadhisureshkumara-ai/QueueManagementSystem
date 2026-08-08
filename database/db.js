// Import MySQL2 database driver for MySQL connections
const mysql = require("mysql2");

// Create a MySQL database connection with localhost credentials
const db = mysql.createConnection({
  host: "localhost", // Database server hostname
  user: "root", // Database username (default for XAMPP/WAMP)
  password: "", // Database password (empty for local development)
  database: "queue system", // Database name (note: contains a space)
});

// Attempt to connect to the MySQL database
db.connect((err) => {
  if (err) {
    // Log connection error if connection fails
    console.log("Database Error:", err);
  } else {
    // Log success message if connection is established
    console.log("MySQL Connected Successfully");
  }
});

// Export the database connection for use in other modules (like server.js)
module.exports = db;
