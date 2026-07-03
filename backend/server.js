const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();

app.use(express.json());
app.use(cors());

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

// Start Server
app.listen(3000, () => {
  console.log("Server Running On Port 3000");
});