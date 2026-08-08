
// Import the Express web framework
const express = require("express");
// Import CORS middleware to allow cross-origin requests
const cors = require("cors");
// Import MySQL2 database driver for MySQL connections
const mysql = require("mysql2");
// Import Node.js HTTP module to create an HTTP server
const http = require("http");
// Import the Server class from Socket.IO for real-time communication
const { Server } = require("socket.io");

// Helper: validate email format
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Helper: validate phone number (at least 10 digits)
const isValidPhone = (phone) => /^\d{10,}$/.test(phone);

// Helper: check if value is a valid positive integer
const isValidId = (val) => /^\d+$/.test(String(val));

// Create an Express application instance
const app = express();
// Create an HTTP server using the Express app (needed for Socket.IO)
const server = http.createServer(app);
// Initialize a new Socket.IO server attached to the HTTP server
const io = new Server(server, {
  // Allow all origins and common HTTP methods for CORS
  cors: { origin: "*", methods: ["GET","POST","PUT","DELETE"] }
});

// Register middleware to parse incoming JSON request bodies
app.use(express.json());
// Enable CORS for all routes
app.use(cors());
// Define a simple health-check GET route at the root
app.get("/", (req, res) => {
  // Send a plain-text response confirming the API is working
  res.send("API Working");
});

// MySQL Connection
// Create a MySQL connection with localhost credentials and database name
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "queue system",
});

// Attempt to connect to the MySQL database
db.connect((err) => {
  // If connection fails, log the error and stop
  if (err) {
    console.error("MySQL Connection Error:", err);
    return;
  }
  // Log a success message once connected
  console.log("Connected to MySQL Database");
});

// Login
// Define POST route for login (admin/staff hardcoded credentials)
app.post("/login", (req, res) => {
  // Destructure email and password from the request body
  const { email, password } = req.body;

  // Validate inputs
  if (!email || !email.trim()) {
    return res.json({ success: false, message: "Email is required" });
  }
  if (!password || !password.trim()) {
    return res.json({ success: false, message: "Password is required" });
  }

  // Check if credentials match the admin account
  if (email === "admin@gmail.com" && password === "123") {
    // Return success response with admin role
    return res.json({
      success: true,
      role: "admin",
    });
  }

  // Check if credentials match the staff account
  if (email === "staff@gmail.com" && password === "666") {
    // Return success response with staff role
    return res.json({
      success: true,
      role: "staff",
    });
  }

  // If no credentials matched, return failure response
  return res.json({
    success: false,
    message: "Invalid Login",
  });
});

// Get Staff
// Define GET route to fetch all staff members from the database
app.get("/staff", (req, res) => {
  // SQL query to select all rows from the staff table
  const sql = "SELECT * FROM staff";

  // Execute the SQL query
  db.query(sql, (err, result) => {
    // If query fails, log error and return failure response
    if (err) {
      console.log(err);
      return res.json({
        success: false,
        message: "Failed to load staff",
      });
    }

    // Return the list of staff members on success
    res.json({
      success: true,
      data: result,
    });
  });
});

// Add Staff
// Define POST route to add a new staff member
app.post("/staff/add", (req, res) => {
  // Destructure all staff fields from the request body
  const {
    name,
    email,
    phone,
    role,
    password,
    counter_id,
    status,
  } = req.body;

  // Validate inputs
  if (!name || !name.trim()) {
    return res.json({ success: false, message: "Name is required" });
  }
  if (!email || !email.trim()) {
    return res.json({ success: false, message: "Email is required" });
  }
  if (!isValidEmail(email)) {
    return res.json({ success: false, message: "Invalid email format" });
  }
  if (!phone || !phone.trim()) {
    return res.json({ success: false, message: "Phone is required" });
  }
  if (!password || !password.trim()) {
    return res.json({ success: false, message: "Password is required" });
  }

  // SQL query to insert a new staff record
  const sql = `
    INSERT INTO staff
    (name,email,phone,role,password,counter_id,status)
    VALUES (?,?,?,?,?,?,?)
  `;

  // Execute the insert query with parameterized values
  db.query(
    sql,
    [
      name,
      email,
      phone,
      role,
      password,
      counter_id,
      status,
    ],
    (err, result) => {
      // If insert fails, log error and return failure with error message
      if (err) {
        console.log("Insert Error:", err);

        return res.json({
          success: false,
          message: err.message,
        });
      }

      // Return success response on successful insert
      res.json({
        success: true,
        message: "Staff Added Successfully",
      });
    }
  );
});

// Delete Staff
// Define DELETE route to remove a staff member by ID
app.delete("/staff/delete/:id", (req, res) => {
  // Extract the staff ID from request parameters
  const id = req.params.id;

  // SQL query to delete a staff record by staff_id
  const sql = "DELETE FROM staff WHERE staff_id=?";

  // Execute the delete query with the staff ID
  db.query(sql, [id], (err, result) => {
    // If delete fails, log error and return failure response
    if (err) {
      console.log(err);

      return res.json({
        success: false,
        message: "Delete Failed",
      });
    }

    // Return success response on successful deletion
    res.json({
      success: true,
      message: "Staff Deleted Successfully",
    });
  });
});

// Define POST route to assign a staff member to a counter
app.post("/counter/assign", (req, res) => {
  // Destructure counter_id and staff_id from the request body
  const { counter_id, staff_id } = req.body;

  // Validate inputs
  if (!isValidId(counter_id)) {
    return res.json({ success: false, message: "Valid counter_id is required" });
  }
  if (!isValidId(staff_id)) {
    return res.json({ success: false, message: "Valid staff_id is required" });
  }

  // SQL query to update the staff_id for a given counter
  const sql =
    "UPDATE counters SET staff_id=? WHERE counter_id=?";

  // Execute the update query with staff_id and counter_id
  db.query(sql, [staff_id, counter_id], (err, result) => {
    // If update fails, log error and return failure with error message
    if (err) {
      console.log(err);
      return res.json({
        success: false,
        message: err.message,
      });
    }

    // Return success response on successful assignment
    res.json({
      success: true,
      message: "Counter Assigned Successfully",
    });
  });
});

// Define GET route to fetch all counters
app.get("/counters", (req, res) => {
  // SQL query to select all rows from the counters table
  const sql = "SELECT * FROM counters";

  // Execute the query
  db.query(sql, (err, result) => {
    // If query fails, return failure with error message
    if (err) {
      return res.json({
        success: false,
        message: err.message,
      });
    }

    // Return the list of counters on success
    res.json({
      success: true,
      data: result,
    });
  });
});

// Customer Register
// Define POST route for customer registration
app.post("/customer/register", (req, res) => {
  // Destructure customer fields from the request body
  const { name, email, phone, password } = req.body;

  // Validate inputs
  if (!name || !name.trim()) {
    return res.json({ success: false, message: "Name is required" });
  }
  if (!email || !email.trim()) {
    return res.json({ success: false, message: "Email is required" });
  }
  if (!isValidEmail(email)) {
    return res.json({ success: false, message: "Invalid email format" });
  }
  if (!phone || !phone.trim()) {
    return res.json({ success: false, message: "Phone is required" });
  }
  if (!isValidPhone(phone)) {
    return res.json({ success: false, message: "Phone must be at least 10 digits" });
  }
  if (!password || password.length < 4) {
    return res.json({ success: false, message: "Password must be at least 4 characters" });
  }

  // SQL query to insert a new customer record
  const sql = `
    INSERT INTO customers
    (name,email,phone,password)
    VALUES (?,?,?,?)
  `;

  // Execute the insert query with parameterized values
  db.query(
    sql,
    [name, email, phone, password],
    (err, result) => {
      // If insert fails, log error and return failure response
      if (err) {
        console.log(err);

        return res.json({
          success: false,
          message: "Registration Failed",
        });
      }

      // Notify staff that a new customer registered
      // Emit a Socket.IO event to all connected clients about the new customer
      io.emit("NEW_CUSTOMER_REGISTERED", {
        customerName: name,
        customerEmail: email,
        time: new Date().toLocaleTimeString(),
      });

      // Return success response on successful registration
      res.json({
        success: true,
        message: "Customer Registered Successfully",
      });
    }
  );
});

// Customer Login
// Define POST route for customer login
app.post("/customer/login", (req, res) => {
  // Destructure email and password from the request body
  const { email, password } = req.body;

  // Validate inputs
  if (!email || !email.trim()) {
    return res.json({ success: false, message: "Email is required" });
  }
  if (!isValidEmail(email)) {
    return res.json({ success: false, message: "Invalid email format" });
  }
  if (!password || !password.trim()) {
    return res.json({ success: false, message: "Password is required" });
  }

  // SQL query to find a customer matching the provided credentials
  const sql = `
    SELECT * FROM customers
    WHERE email=? AND password=?
  `;

  // Execute the query with email and password
  db.query(sql, [email, password], (err, result) => {
    // If query fails, log error and return failure response
    if (err) {
      console.log(err);

      return res.json({
        success: false,
        message: "Login Error",
      });
    }

    // If a matching customer was found, return success with customer data
    if (result.length > 0) {
      const customer = result[0];
      return res.json({
        success: true,
        customer: customer,
        customerId: customer.customer_id,
        name: customer.name,
        token: "token_" + customer.customer_id + "_" + Date.now(),
      });
    }

    // If no match, return failure response
    res.json({
      success: false,
      message: "Invalid Email or Password",
    });
  });
});

// Request Token (pending — no token number yet, staff must generate it)
// Define POST route for a customer to request a token
app.post("/request-token", (req, res) => {
  // Destructure customer_id, counter_id, and token_type_id from request body
  const {
    customer_id,
    counter_id,
    token_type_id,
  } = req.body;

  // Validate inputs
  if (!isValidId(customer_id)) {
    return res.json({ success: false, message: "Valid customer_id is required" });
  }
  if (!isValidId(counter_id)) {
    return res.json({ success: false, message: "Valid counter_id is required" });
  }
  if (!isValidId(token_type_id)) {
    return res.json({ success: false, message: "Valid token_type_id is required" });
  }

  // Generate a placeholder token number using current timestamp
  const placeholder = "REQ-" + Date.now();

  // SQL query to insert a new token record with status 'pending'
  const sql = `
    INSERT INTO tokens
    (
      token_number,
      customer_id,
      counter_id,
      token_type_id,
      status,
      created_at
    )
    VALUES (?,?,?,?,?, NOW())
  `;

  // Execute the insert query with token data
  db.query(
    sql,
    [
      placeholder,
      customer_id,
      counter_id,
      token_type_id,
      "pending",
    ],
    (err, result) => {
      // If insert fails, log error and return failure response
      if (err) {
        console.log(err);
        return res.json({
          success: false,
          message: "Token Request Failed: " + err.message,
        });
      }

      // Fetch customer details for notification
      // Query the customer's name and email for the real-time notification
      db.query("SELECT name, email FROM customers WHERE customer_id=?", [customer_id], (err2, customers) => {
        let customerName = "Customer";
        let customerEmail = "";
        if (!err2 && customers.length > 0) {
          customerName = customers[0].name;
          customerEmail = customers[0].email;
        }

        // Notify ONLY staff at this counter about the pending request
        // Emit a Socket.IO event scoped to the specific counter ID
        io.emit(`NEW_STAFF_NOTIFICATION_${counter_id}`, {
          ticketNumber: placeholder,
          tokenId: result.insertId,
          counterId: counter_id,
          customerName: customerName,
          customerEmail: customerEmail,
          serviceName: "Pending",
          timeRequested: new Date().toLocaleTimeString(),
          status: "pending",
        });
      });

      // Return success response with the pending token info
      res.json({
        success: true,
        token_id: result.insertId,
        token_number: placeholder,
        message: "Request submitted. Waiting for staff to generate token.",
      });
    }
  );
});

// Staff generates token number for a pending request
// Define POST route for staff to generate a token number for a pending request
app.post("/staff/generate-token/:id", (req, res) => {
  // Extract the token ID from request parameters
  const id = req.params.id;

  // Validate id parameter
  if (!isValidId(id)) {
    return res.json({ success: false, message: "Valid token id is required" });
  }

  // Generate a random 4-digit token number prefixed with 'T'
  const tokenNumber = "T" + Math.floor(1000 + Math.random() * 9000);

  // SQL query to update the pending token with a real number and change status to 'waiting'
  const sql = "UPDATE tokens SET token_number=?, status='waiting' WHERE token_id=? AND status='pending'";

  // Execute the update query
  db.query(sql, [tokenNumber, id], (err, result) => {
    // If update fails, log error and return failure response
    if (err) {
      console.log(err);
      return res.json({ success: false, message: "Generate failed: " + err.message });
    }

    // If no rows were affected, the request was not found or already processed
    if (result.affectedRows === 0) {
      return res.json({ success: false, message: "Request not found or already processed" });
    }

    // Fetch full token details for notifications
    // Query the token with counter name for real-time updates
    db.query("SELECT t.*, c.counter_name FROM tokens t LEFT JOIN counters c ON t.counter_id = c.counter_id WHERE t.token_id=?", [id], (err2, rows) => {
      if (!err2 && rows.length > 0) {
        const t = rows[0];

        // Notify customer (real-time)
        // Emit a Socket.IO event to update the customer on token status change
        io.emit("TOKEN_STATUS_CHANGE", {
          token_id: id,
          token_number: tokenNumber,
          customer_id: t.customer_id,
          counter_id: t.counter_id,
          status: "waiting",
          counter_name: t.counter_name,
        });

        // Update staff notification with the generated token
        // Emit a Socket.IO event to staff at this counter confirming the generated token
        io.emit(`NEW_STAFF_NOTIFICATION_${t.counter_id}`, {
          ticketNumber: tokenNumber,
          tokenId: id,
          counterId: t.counter_id,
          status: "waiting",
          generated: true,
        });
      }
    });

    // Return success response with the generated token number
    res.json({
      success: true,
      token_number: tokenNumber,
      message: "Token generated successfully",
    });
  });
});

// Token Status
// Define GET route to check the status of a customer's latest token
app.get("/token-status/:id", (req, res) => {
  // Extract customer ID from request parameters
  const id = req.params.id;

  // SQL query to get the latest token for a customer with counter name
  const sql = `
    SELECT t.*, c.counter_name
    FROM tokens t
    LEFT JOIN counters c ON t.counter_id = c.counter_id
    WHERE t.customer_id=?
    ORDER BY t.token_id DESC
    LIMIT 1
  `;

  // Execute the query with the customer ID
  db.query(sql, [id], (err, result) => {
    // If query fails, log error and return failure response
    if (err) {
      console.log(err);

      return res.json({
        success: false,
      });
    }

    // Return the token data on success
    res.json({
      success: true,
      data: result,
    });
  });
});

// Get all tokens for a customer
// Define GET route to fetch all tokens belonging to a customer
app.get("/customer/tokens", (req, res) => {
  // Extract customer_id from query parameters
  const customerId = req.query.customer_id;

  // Validate that customer_id was provided
  if (!customerId) {
    return res.json({ success: false, message: "customer_id required" });
  }

  // SQL query to get all customer tokens with queue position calculation
  const sql = `
    SELECT t.*, c.counter_name,
      (SELECT COUNT(*) FROM tokens t2
       WHERE t2.counter_id = t.counter_id
       AND t2.status = 'waiting'
       AND t2.token_id < t.token_id
      ) as queue_position
    FROM tokens t
    LEFT JOIN counters c ON t.counter_id = c.counter_id
    WHERE t.customer_id=?
    ORDER BY t.token_id DESC
  `;

  // Execute the query with the customer ID
  db.query(sql, [customerId], (err, result) => {
    // If query fails, log error and return failure response
    if (err) {
      console.log(err);
      return res.json({ success: false, message: "Failed to load tokens" });
    }

    // Return the list of tokens on success
    res.json({
      success: true,
      tokens: result,
    });
  });
});

// Cancel a token
// Define POST route for a customer to cancel their token
app.post("/customer/tokens/:id/cancel", (req, res) => {
  // Extract token ID from request parameters
  const id = req.params.id;

  // Validate id parameter
  if (!isValidId(id)) {
    return res.json({ success: false, message: "Valid token id is required" });
  }

  // SQL query to update token status to 'cancelled' if it is still waiting or pending
  const sql = "UPDATE tokens SET status='cancelled' WHERE token_id=? AND (status='waiting' OR status='pending')";

  // Execute the update query
  db.query(sql, [id], (err, result) => {
    // If update fails, log error and return failure response
    if (err) {
      console.log(err);
      return res.json({ success: false, message: "Failed to cancel token" });
    }

    // If no rows affected, the token was not found or already processed
    if (result.affectedRows === 0) {
      return res.json({ success: false, message: "Token not found or already processed" });
    }

    // Fetch updated token for notification
    // Query the cancelled token details including customer name for real-time updates
    db.query("SELECT t.*, cu.name as customer_name FROM tokens t LEFT JOIN customers cu ON t.customer_id = cu.customer_id WHERE t.token_id=?", [id], (err2, rows) => {
      if (!err2 && rows && rows.length > 0) {
        const t = rows[0];

        // Notify customer app
        // Emit a Socket.IO event to update the customer that their token was cancelled
        io.emit("TOKEN_STATUS_CHANGE", {
          token_id: id,
          token_number: t.token_number,
          customer_id: t.customer_id,
          counter_id: t.counter_id,
          status: "cancelled",
        });

        // Notify staff at this counter
        // Emit a Socket.IO event to staff at this counter about the cancellation
        io.emit(`NEW_STAFF_NOTIFICATION_${t.counter_id}`, {
          ticketNumber: t.token_number,
          tokenId: id,
          counterId: t.counter_id,
          customerName: t.customer_name || "Customer",
          status: "cancelled",
          cancelled: true,
          timeRequested: new Date().toLocaleTimeString(),
        });
      }
      // Return success response after notification
      res.json({
        success: true,
        message: "Token cancelled",
      });
    });
  });
});

// Staff: Get tokens for a specific counter
// Define GET route for staff to fetch all tokens at a given counter
app.get("/staff/tokens/:counterId", (req, res) => {
  // Extract counter ID from request parameters
  const counterId = req.params.counterId;

  // SQL query to get all tokens for a counter with customer info and queue position
  const sql = `
    SELECT t.*, cu.name as customer_name, cu.email as customer_email,
      (SELECT COUNT(*) FROM tokens t2
       WHERE t2.counter_id = t.counter_id
       AND t2.status = 'waiting'
       AND t2.token_id < t.token_id
      ) as queue_position
    FROM tokens t
    LEFT JOIN customers cu ON t.customer_id = cu.customer_id
    WHERE t.counter_id=?
    ORDER BY FIELD(t.status, 'pending', 'waiting', 'serving', 'completed', 'cancelled'), t.token_id ASC
  `;

  // Execute the query with the counter ID
  db.query(sql, [counterId], (err, result) => {
    // If query fails, log error and return empty data array
    if (err) {
      console.log(err);
      return res.json({ success: false, data: [] });
    }
    // Return the list of tokens on success
    res.json({ success: true, data: result });
  });
});

// Staff: Update token status (serve/complete/skip/cancel)
// Define PUT route for staff to update a token's status
app.put("/staff/tokens/:id/:action", (req, res) => {
  // Destructure token ID and action from request parameters
  const { id, action } = req.params;

  // Validate id parameter
  if (!isValidId(id)) {
    return res.json({ success: false, message: "Valid token id is required" });
  }

  // Define the list of valid status actions
  const validActions = ["serving", "completed", "skipped", "cancelled"];
  // If the action is not valid, return an error response
  if (!validActions.includes(action)) {
    return res.json({ success: false, message: "Invalid action" });
  }

  // SQL query to update the token status
  const sql = "UPDATE tokens SET status=? WHERE token_id=?";
  // Execute the update query with the action and token ID
  db.query(sql, [action, id], (err, result) => {
    // If update fails, log error and return failure response
    if (err) {
      console.log(err);
      return res.json({ success: false, message: "Update failed" });
    }

    // Fetch customer_id for real-time notification
    // Query the token details to emit a status change event
    db.query("SELECT token_number, customer_id, counter_id FROM tokens WHERE token_id=?", [id], (err2, rows) => {
      if (!err2 && rows.length > 0) {
        const t = rows[0];
        // Emit a Socket.IO event to notify the customer of the status change
        io.emit("TOKEN_STATUS_CHANGE", {
          token_id: id,
          token_number: t.token_number,
          customer_id: t.customer_id,
          counter_id: t.counter_id,
          status: action,
        });
      }
    });

    // Return success response confirming the action
    res.json({ success: true, message: `Token ${action}` });
  });
});

// Register customer with full details (for mobile signup)
// Define POST route for customer registration (duplicate for mobile signup)
app.post("/customer/register", (req, res) => {
  // Destructure customer fields from the request body
  const { name, email, phone, password } = req.body;

  // Validate inputs
  if (!name || !name.trim()) {
    return res.json({ success: false, message: "Name is required" });
  }
  if (!email || !email.trim()) {
    return res.json({ success: false, message: "Email is required" });
  }
  if (!isValidEmail(email)) {
    return res.json({ success: false, message: "Invalid email format" });
  }
  if (!phone || !phone.trim()) {
    return res.json({ success: false, message: "Phone is required" });
  }
  if (!isValidPhone(phone)) {
    return res.json({ success: false, message: "Phone must be at least 10 digits" });
  }
  if (!password || password.length < 4) {
    return res.json({ success: false, message: "Password must be at least 4 characters" });
  }

  // SQL query to insert a new customer record
  const sql = `
    INSERT INTO customers
    (name,email,phone,password)
    VALUES (?,?,?,?)
  `;

  // Execute the insert query with parameterized values
  db.query(sql, [name, email, phone, password], (err, result) => {
    // If insert fails, log error and return failure response
    if (err) {
      console.log(err);
      return res.json({ success: false, message: "Registration Failed" });
    }
    // Return success response on successful registration
    res.json({ success: true, message: "Customer Registered Successfully" });
  });
});

// Debug: Show tokens table schema
// Define GET route to display the tokens table structure
app.get("/debug/schema", (req, res) => {
  // Execute a DESCRIBE query to get the table schema
  db.query("DESCRIBE tokens", (err, rows) => {
    // If query fails, return error message
    if (err) return res.json({ error: err.message });
    // Return the table name and its columns
    res.json({ table: "tokens", columns: rows });
  });
});

// Check token_types table
// Define GET route to inspect the token_types table structure and data
app.get("/debug/token-types", (req, res) => {
  // Execute a DESCRIBE query to get the token_types table columns
  db.query("DESCRIBE token_types", (err, cols) => {
    // If query fails, return error message
    if (err) return res.json({ error: err.message });
    // Execute a SELECT query to get all rows from token_types
    db.query("SELECT * FROM token_types", (err2, rows) => {
      // Return both the column definitions and the data
      res.json({ columns: cols, data: rows });
    });
  });
});

// Insert default token type if empty
// Define GET route to seed a default token type if the table is empty
app.get("/debug/seed-token-types", (req, res) => {
  // Describe the token_types table to discover column names dynamically
  db.query("DESCRIBE token_types", (err, cols) => {
    // If describe fails, return error message
    if (err) return res.json({ error: err.message });
    // Extract column names, excluding the primary key token_type_id
    const colNames = cols.map(c => c.Field).filter(f => f !== "token_type_id");
    // If there are no other columns besides token_type_id, return error
    if (colNames.length === 0) return res.json({ error: "No columns besides token_type_id" });
    // Get the first non-primary-key column name
    const col = colNames[0];
    // Count existing rows in token_types
    db.query(`SELECT COUNT(*) as cnt FROM token_types`, (err2, result) => {
      // If count fails, return error message
      if (err2) return res.json({ error: err2.message });
      // If no rows exist, insert a default 'General Service' entry
      if (result[0].cnt === 0) {
        db.query(`INSERT INTO token_types (${col}) VALUES ('General Service')`, (err3) => {
          // If insert fails, return error message
          if (err3) return res.json({ error: err3.message });
          // Return success with the column name used
          res.json({ success: true, message: `Token type seeded with column: ${col}` });
        });
      } else {
        // If rows already exist, return the count
        res.json({ message: "Token types exist", count: result[0].cnt });
      }
    });
  });
});

// Socket.IO connection handler
// Listen for new WebSocket connections
io.on("connection", (socket) => {
  // Log the new client's socket ID
  console.log("Client connected:", socket.id);
  // Listen for disconnect events from this socket
  socket.on("disconnect", () => {
    // Log when a client disconnects
    console.log("Client disconnected:", socket.id);
  });
});

// Start Server
// Start the HTTP server on port 3000
server.listen(3000, () => {
  // Log a message confirming the server is running
  console.log("Server Running On Port 3000");
});
