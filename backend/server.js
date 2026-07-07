
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET","POST","PUT","DELETE"] }
});

app.use(express.json());
app.use(cors());
app.get("/", (req, res) => {
  res.send("API Working");
});

// MySQL Connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "queue system",
});

db.connect((err) => {
  if (err) {
    console.error("MySQL Connection Error:", err);
    return;
  }
  console.log("Connected to MySQL Database");
});

// Login
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (email === "admin@gmail.com" && password === "123") {
    return res.json({
      success: true,
      role: "admin",
    });
  }

  if (email === "staff@gmail.com" && password === "666") {
    return res.json({
      success: true,
      role: "staff",
    });
  }

  return res.json({
    success: false,
    message: "Invalid Login",
  });
});

// Get Staff
app.get("/staff", (req, res) => {
  const sql = "SELECT * FROM staff";

  db.query(sql, (err, result) => {
    if (err) {
      console.log(err);
      return res.json({
        success: false,
        message: "Failed to load staff",
      });
    }

    res.json({
      success: true,
      data: result,
    });
  });
});

// Add Staff
app.post("/staff/add", (req, res) => {
  const {
    name,
    email,
    phone,
    role,
    password,
    counter_id,
    status,
  } = req.body;

  const sql = `
    INSERT INTO staff
    (name,email,phone,role,password,counter_id,status)
    VALUES (?,?,?,?,?,?,?)
  `;

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
      if (err) {
        console.log("Insert Error:", err);

        return res.json({
          success: false,
          message: err.message,
        });
      }

      res.json({
        success: true,
        message: "Staff Added Successfully",
      });
    }
  );
});

// Delete Staff
app.delete("/staff/delete/:id", (req, res) => {
  const id = req.params.id;

  const sql = "DELETE FROM staff WHERE staff_id=?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.log(err);

      return res.json({
        success: false,
        message: "Delete Failed",
      });
    }

    res.json({
      success: true,
      message: "Staff Deleted Successfully",
    });
  });
});

app.post("/counter/assign", (req, res) => {
  const { counter_id, staff_id } = req.body;

  const sql =
    "UPDATE counters SET staff_id=? WHERE counter_id=?";

  db.query(sql, [staff_id, counter_id], (err, result) => {
    if (err) {
      console.log(err);
      return res.json({
        success: false,
        message: err.message,
      });
    }

    res.json({
      success: true,
      message: "Counter Assigned Successfully",
    });
  });
});

app.get("/counters", (req, res) => {
  const sql = "SELECT * FROM counters";

  db.query(sql, (err, result) => {
    if (err) {
      return res.json({
        success: false,
        message: err.message,
      });
    }

    res.json({
      success: true,
      data: result,
    });
  });
});

// Customer Register
app.post("/customer/register", (req, res) => {
  const { name, email, phone, password } = req.body;

  const sql = `
    INSERT INTO customers
    (name,email,phone,password)
    VALUES (?,?,?,?)
  `;

  db.query(
    sql,
    [name, email, phone, password],
    (err, result) => {
      if (err) {
        console.log(err);

        return res.json({
          success: false,
          message: "Registration Failed",
        });
      }

      // Notify staff that a new customer registered
      io.emit("NEW_CUSTOMER_REGISTERED", {
        customerName: name,
        customerEmail: email,
        time: new Date().toLocaleTimeString(),
      });

      res.json({
        success: true,
        message: "Customer Registered Successfully",
      });
    }
  );
});

// Customer Login
app.post("/customer/login", (req, res) => {
  const { email, password } = req.body;

  const sql = `
    SELECT * FROM customers
    WHERE email=? AND password=?
  `;

  db.query(sql, [email, password], (err, result) => {
    if (err) {
      console.log(err);

      return res.json({
        success: false,
        message: "Login Error",
      });
    }

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

    res.json({
      success: false,
      message: "Invalid Email or Password",
    });
  });
});

// Request Token
app.post("/request-token", (req, res) => {
  const {
    customer_id,
    counter_id,
    token_type_id,
  } = req.body;

  const tokenNumber =
    "T" + Math.floor(1000 + Math.random() * 9000);

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

  db.query(
    sql,
    [
      tokenNumber,
      customer_id,
      counter_id,
      token_type_id,
      "waiting",
    ],
    (err, result) => {
      if (err) {
        console.log(err);

        return res.json({
          success: false,
          message: "Token Request Failed: " + err.message,
        });
      }

      // Fetch customer details for notification
      db.query("SELECT name, email FROM customers WHERE customer_id=?", [customer_id], (err2, customers) => {
        let customerName = "Customer";
        let customerEmail = "";
        if (!err2 && customers.length > 0) {
          customerName = customers[0].name;
          customerEmail = customers[0].email;
        }

        // Notify staff dashboard — only staff at this counter receive the notification
        io.emit(`NEW_STAFF_NOTIFICATION_${counter_id}`, {
          ticketNumber: tokenNumber,
          tokenId: result.insertId,
          counterId: counter_id,
          customerName: customerName,
          customerEmail: customerEmail,
          serviceName: "Requested",
          timeRequested: new Date().toLocaleTimeString(),
        });
      });

      res.json({
        success: true,
        token_number: tokenNumber,
        token_id: result.insertId,
        message: "Token Created Successfully",
      });
    }
  );
});

// Token Status
app.get("/token-status/:id", (req, res) => {
  const id = req.params.id;

  const sql = `
    SELECT t.*, c.counter_name
    FROM tokens t
    LEFT JOIN counters c ON t.counter_id = c.counter_id
    WHERE t.customer_id=?
    ORDER BY t.token_id DESC
    LIMIT 1
  `;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.log(err);

      return res.json({
        success: false,
      });
    }

    res.json({
      success: true,
      data: result,
    });
  });
});

// Get all tokens for a customer
app.get("/customer/tokens", (req, res) => {
  const customerId = req.query.customer_id;

  if (!customerId) {
    return res.json({ success: false, message: "customer_id required" });
  }

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

  db.query(sql, [customerId], (err, result) => {
    if (err) {
      console.log(err);
      return res.json({ success: false, message: "Failed to load tokens" });
    }

    res.json({
      success: true,
      tokens: result,
    });
  });
});

// Cancel a token
app.post("/customer/tokens/:id/cancel", (req, res) => {
  const id = req.params.id;

  const sql = "UPDATE tokens SET status='cancelled' WHERE token_id=? AND status='waiting'";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.log(err);
      return res.json({ success: false, message: "Failed to cancel token" });
    }

    if (result.affectedRows === 0) {
      return res.json({ success: false, message: "Token not found or already processed" });
    }

    // Fetch updated token for notification
    db.query("SELECT * FROM tokens WHERE token_id=?", [id], (err2, rows) => {
      if (!err2 && rows.length > 0) {
        const t = rows[0];
        io.emit("TOKEN_STATUS_CHANGE", {
          token_id: id,
          token_number: t.token_number,
          customer_id: t.customer_id,
          counter_id: t.counter_id,
          status: "cancelled",
        });
      }
      res.json({
        success: true,
        message: "Token cancelled",
        token: rows[0],
      });
    });
  });
});

// Staff: Get tokens for a specific counter
app.get("/staff/tokens/:counterId", (req, res) => {
  const counterId = req.params.counterId;

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
    ORDER BY FIELD(t.status, 'waiting', 'serving', 'completed', 'cancelled'), t.token_id ASC
  `;

  db.query(sql, [counterId], (err, result) => {
    if (err) {
      console.log(err);
      return res.json({ success: false, data: [] });
    }
    res.json({ success: true, data: result });
  });
});

// Staff: Update token status (serve/complete/skip/cancel)
app.put("/staff/tokens/:id/:action", (req, res) => {
  const { id, action } = req.params;

  const validActions = ["serving", "completed", "skipped", "cancelled"];
  if (!validActions.includes(action)) {
    return res.json({ success: false, message: "Invalid action" });
  }

  const sql = "UPDATE tokens SET status=? WHERE token_id=?";
  db.query(sql, [action, id], (err, result) => {
    if (err) {
      console.log(err);
      return res.json({ success: false, message: "Update failed" });
    }

    // Fetch customer_id for real-time notification
    db.query("SELECT token_number, customer_id, counter_id FROM tokens WHERE token_id=?", [id], (err2, rows) => {
      if (!err2 && rows.length > 0) {
        const t = rows[0];
        io.emit("TOKEN_STATUS_CHANGE", {
          token_id: id,
          token_number: t.token_number,
          customer_id: t.customer_id,
          counter_id: t.counter_id,
          status: action,
        });
      }
    });

    res.json({ success: true, message: `Token ${action}` });
  });
});

// Register customer with full details (for mobile signup)
app.post("/customer/register", (req, res) => {
  const { name, email, phone, password } = req.body;

  const sql = `
    INSERT INTO customers
    (name,email,phone,password)
    VALUES (?,?,?,?)
  `;

  db.query(sql, [name, email, phone, password], (err, result) => {
    if (err) {
      console.log(err);
      return res.json({ success: false, message: "Registration Failed" });
    }
    res.json({ success: true, message: "Customer Registered Successfully" });
  });
});

// Debug: Show tokens table schema
app.get("/debug/schema", (req, res) => {
  db.query("DESCRIBE tokens", (err, rows) => {
    if (err) return res.json({ error: err.message });
    res.json({ table: "tokens", columns: rows });
  });
});

// Check token_types table
app.get("/debug/token-types", (req, res) => {
  db.query("DESCRIBE token_types", (err, cols) => {
    if (err) return res.json({ error: err.message });
    db.query("SELECT * FROM token_types", (err2, rows) => {
      res.json({ columns: cols, data: rows });
    });
  });
});

// Insert default token type if empty
app.get("/debug/seed-token-types", (req, res) => {
  db.query("DESCRIBE token_types", (err, cols) => {
    if (err) return res.json({ error: err.message });
    const colNames = cols.map(c => c.Field).filter(f => f !== "token_type_id");
    if (colNames.length === 0) return res.json({ error: "No columns besides token_type_id" });
    const col = colNames[0];
    db.query(`SELECT COUNT(*) as cnt FROM token_types`, (err2, result) => {
      if (err2) return res.json({ error: err2.message });
      if (result[0].cnt === 0) {
        db.query(`INSERT INTO token_types (${col}) VALUES ('General Service')`, (err3) => {
          if (err3) return res.json({ error: err3.message });
          res.json({ success: true, message: `Token type seeded with column: ${col}` });
        });
      } else {
        res.json({ message: "Token types exist", count: result[0].cnt });
      }
    });
  });
});

// Socket.IO connection handler
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Start Server
server.listen(3000, () => {
  console.log("Server Running On Port 3000");
});

