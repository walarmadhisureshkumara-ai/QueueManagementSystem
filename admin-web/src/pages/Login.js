import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Login() {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await axios.post("http://localhost:3000/login", {
        email,
        password
      });

      if (res.data.success) {
        if (res.data.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/staff");
        }
      } else {
        alert("Invalid login");
      }

    } catch (err) {
      alert("Server error");
    }
  };

  return (
    <div style={styles.container}>

      <div style={styles.card}>

        <h2 style={styles.title}>Queue Management System</h2>
        <p style={styles.subtitle}>Login to continue</p>

        <input
          style={styles.input}
          type="email"
          placeholder="Email Address"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          style={styles.input}
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button style={styles.button} onClick={handleLogin}>
          LOGIN
        </button>

        <p style={styles.footer}>
          Admin & Staff Access Only
        </p>

      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundImage: "url(/image.png)",
    backgroundSize: "cover",
    backgroundPosition: "center"
  },

  card: {
    width: "350px",
    padding: "30px",
    borderRadius: "15px",
    backgroundColor: "white",
    boxShadow: "0px 10px 30px rgba(0,0,0,0.3)",
    textAlign: "center"
  },

  title: {
    marginBottom: "5px",
    fontWeight: "bold",
    color: "#1e3c72"
  },

  subtitle: {
    fontSize: "14px",
    color: "gray",
    marginBottom: "20px"
  },

  input: {
    width: "100%",
    padding: "10px",
    margin: "10px 0",
    borderRadius: "8px",
    border: "1px solid #ccc",
    outline: "none"
  },

  button: {
    width: "100%",
    padding: "10px",
    marginTop: "10px",
    backgroundColor: "#1e3c72",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold"
  },

  footer: {
    marginTop: "15px",
    fontSize: "12px",
    color: "gray"
  }
};

export default Login;