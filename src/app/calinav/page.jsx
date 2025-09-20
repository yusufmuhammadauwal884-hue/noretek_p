'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import 'bootstrap/dist/css/bootstrap.min.css';
import Meter from '../meter/page';
import Tariff from '../tariff/page';
import Customer from '../customer/page';
import Account from '../account/page';
import Vend from '../vend/page';


export default function CalinavLayout() {
  const router = useRouter();
  const [active, setActive] = useState('customer');
  const [showLogin, setShowLogin] = useState(true);
  const [token, setToken] = useState('');
  const [loginData, setLoginData] = useState({
    userId: "",
    password: "",
    company: "Noretek Energy",
  });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formMessageType, setFormMessageType] = useState("");

  // Sync token from localStorage after hydration
  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("token") || "");
    }
  }, []);

  // Login handlers
  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    setFormMessage("");
    setFormMessageType("");
    try {
      const res = await fetch("http://47.107.69.132:9400/API/User/Login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });
      const data = await res.json();

      if (data?.result?.token) {
        localStorage.setItem("token", data.result.token);
        setToken(data.result.token);
        setShowLogin(false);
        setActive('customer');
        setFormMessage("✅ Login successful. Redirecting...");
        setFormMessageType("success");
        setTimeout(() => {
          setShowLogin(false);
          setActive('customer');
        }, 800);
      } else {
        setLoginError(data?.message || "Login failed. Check credentials.");
      }
    } catch (err) {
      setLoginError("An error occurred: " + err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
    setToken("");
    setShowLogin(true);
    setActive('customer');
    setFormMessage("");
    setFormMessageType("");
  };

  // If login page, hide sidebar/navbar
  if (showLogin || !token) {
    return (
      <div className="container min-vh-100 d-flex align-items-center justify-content-center" style={{ background: "#f8f9fa" }}>
        <div className="row justify-content-center w-100">
          <div className="col-md-8 col-lg-6">
            <div className="card shadow-lg mt-5">
              <div className="card-header bg-primary text-white text-center py-3">
                <h3 className="mb-0">
                  <i className="bi bi-shield-lock me-2"></i>
                  Calin Admin Portal
                </h3>
              </div>
              <div className="card-body p-4">
                <div className="text-center mb-4">
                  <img 
                    src="/logo.png" 
                    alt="Company Logo" 
                    className="mb-3"
                    style={{ maxWidth: "150px" }}
                  />
                  <h4 className="text-dark">Sign In</h4>
                  <p className="text-muted">Enter your credentials to access the dashboard</p>
                </div>

                <form onSubmit={handleLoginSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-bold">User ID</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="bi bi-person-fill"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        name="userId"
                        value={loginData.userId}
                        onChange={handleLoginChange}
                        required
                        placeholder="Enter your user ID"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Password</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="bi bi-lock-fill"></i>
                      </span>
                      <input
                        type="password"
                        className="form-control"
                        name="password"
                        value={loginData.password}
                        onChange={handleLoginChange}
                        required
                        placeholder="Enter your password"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Company</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="bi bi-building"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        name="company"
                        value={loginData.company}
                        onChange={handleLoginChange}
                        required
                        placeholder="Enter company name"
                      />
                    </div>
                  </div>

                  <div className="d-grid gap-2 mb-3">
                    <button
                      type="submit"
                      className="btn btn-primary btn-lg"
                      disabled={loginLoading}
                    >
                      {loginLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Authenticating...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-box-arrow-in-right me-2"></i>
                          Login
                        </>
                      )}
                    </button>
                  </div>

                  {loginError && (
                    <div className="alert alert-danger alert-dismissible fade show">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      {loginError}
                      <button 
                        type="button" 
                        className="btn-close" 
                        onClick={() => setLoginError("")}
                      ></button>
                    </div>
                  )}

                  {formMessage && (
                    <div className={`alert alert-${formMessageType === "success" ? "success" : "danger"} alert-dismissible fade show`}>
                      {formMessageType === "success" ? (
                        <i className="bi bi-check-circle-fill me-2"></i>
                      ) : (
                        <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      )}
                      {formMessage}
                      <button 
                        type="button" 
                        className="btn-close" 
                        onClick={() => setFormMessage("")}
                      ></button>
                    </div>
                  )}
                </form>

                <div className="text-center mt-3">
                  <a href="#" className="text-decoration-none">
                    Forgot password?
                  </a>
                </div>
              </div>
              <div className="card-footer text-center py-3 bg-light">
                <small className="text-muted">
                  © {new Date().getFullYear()} Noretek Energy. All rights reserved.
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard layout with sidebar/navbar
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar/Navbar */}
      <aside style={{
        width: '250px',
        background: '#023e8a',
        color: '#fff',
        padding: '2rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Calin Admin</h2>

        <button onClick={() => setActive('meter')} style={buttonStyle(active === 'meter')}>
          Meter
        </button>
        <button onClick={() => setActive('tariff')} style={buttonStyle(active === 'tariff')}>
          Tariff
        </button>
        <button onClick={() => setActive('customer')} style={buttonStyle(active === 'customer')}>
          Customer
        </button>
        <button onClick={() => setActive('account')} style={buttonStyle(active === 'account')}>
          Account
        </button>
        <button onClick={() => setActive('vend')} style={buttonStyle(active === 'vend')}>
          Vend
        </button>
        

        {/* Login/Logout */}
        <div style={{ marginTop: '2rem' }}>
          <button
            className="btn btn-outline-light w-100"
            style={{ marginBottom: '1rem' }}
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>

        <Link href="/" style={{ color: '#ccc', marginTop: 'auto', textDecoration: "none" }}>
          ← Back to Home
        </Link>
      </aside>

      {/* Main Content */}
      <main style={{ flexGrow: 1, padding: '2rem' }}>
        {active === 'meter' && <Meter />}
        {active === 'tariff' && <Tariff />}
        {active === 'customer' && <Customer />}
        {active === 'account' && <Account />}
        {active === 'vend' && <Vend />}
      </main>
    </div>
  );
}

// Inline button styling for active/inactive states
function buttonStyle(isActive) {
  return {
    background: isActive ? '#444' : 'transparent',
    border: 'none',
    color: '#fff',
    textAlign: 'left',
    padding: '0.5rem 0.75rem',
    cursor: 'pointer',
    fontWeight: isActive ? 'bold' : 'normal',
    borderLeft: isActive ? '4px solid #00f0ff' : '4px solid transparent',
  };
}