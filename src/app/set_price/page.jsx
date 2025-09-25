//src/app/set_price/page.jsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SetPricePage() {
  // Price state
  const [pricePerKg, setPricePerKg] = useState(1500);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  // Load price from localStorage on component mount
  useEffect(() => {
    const savedPrice = localStorage.getItem("pricePerKg");
    if (savedPrice) {
      setPricePerKg(parseFloat(savedPrice));
    }
  }, []);

  // Handle price change
  const handlePriceChange = (e) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      setPricePerKg(value === "" ? "" : parseFloat(value));
    }
  };

  // Save price to localStorage
  const savePrice = () => {
    if (!pricePerKg || pricePerKg <= 0) {
      setMessage("Please enter a valid price greater than 0");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      localStorage.setItem("pricePerKg", pricePerKg.toString());
      setMessage("Price updated successfully!");
      window.dispatchEvent(new Event('priceUpdated'));
    } catch (error) {
      setMessage("Error saving price: " + error.message);
      console.error("Save error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Reset to default price
  const resetToDefault = () => {
    setPricePerKg(1500);
    setMessage("Price reset to default (₦1500 per KG). Click Save to confirm.");
  };

  // Back button handler
  const handleBack = () => {
    router.push("/calinav");
  };

  return (
    <div className="container-fluid" style={{ background: '#f8f9fa', minHeight: '100vh' }}>
      {/* Navigation Bar */}
      <nav className="navbar navbar-expand-lg navbar-dark primaryColor mb-4">
        <div className="container d-flex justify-content-between align-items-center">
          <span className="navbar-brand fw-bold">
            <i className="fas fa-money-bill-wave me-2"></i>Noretek Energy - Set Price
          </span>
          <button
            className="btn btn-outline-light"
            onClick={handleBack}
            style={{ minWidth: 120 }}
          >
            <i className="fas fa-arrow-left me-2"></i>Back
          </button>
        </div>
      </nav>

      <div className="container">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <h1 className="display-5 fw-bold text-dark">Set Price Per KG</h1>
            <p className="lead">Configure the price per kilogram for token generation</p>
          </div>
        </div>

        {/* Price Form */}
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card shadow">
              <div className="card-header primaryColor text-center">
                <h4><i className="fas fa-cog me-2"></i>Price Configuration</h4>
              </div>
              <div className="card-body">
                {/* Message Display */}
                {message && (
                  <div className={`alert ${message.includes("success") ? "alert-success" : "alert-danger"} mb-4`}>
                    {message}
                  </div>
                )}

                <div className="mb-4">
                  <label className="form-label fw-bold">Current Price per KG:</label>
                  <div className="input-group">
                    <span className="input-group-text">₦</span>
                    <input
                      type="number"
                      className="form-control"
                      value={pricePerKg}
                      onChange={handlePriceChange}
                      step="0.01"
                      min="0"
                      placeholder="Enter price per KG"
                    />
                  </div>
                  <div className="form-text">
                    This price determines how many kilograms customers get for their payment.
                    Current formula: Amount (₦) / Price per KG = Units (KG)
                  </div>
                </div>

                <div className="d-grid gap-2">
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={savePrice}
                    disabled={loading || !pricePerKg || pricePerKg <= 0}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>Save Price
                      </>
                    )}
                  </button>

                  <button
                    className="btn btn-outline-secondary"
                    onClick={resetToDefault}
                    disabled={loading}
                  >
                    <i className="fas fa-undo me-2"></i>Reset to Default (₦1500)
                  </button>
                </div>

                {/* Price Information */}
                <div className="mt-4 p-3 bg-light rounded">
                  <h5><i className="fas fa-info-circle me-2"></i>Price Information</h5>
                  <p className="mb-1">Current price: <strong>₦{pricePerKg}</strong> per KG</p>
                  <p className="mb-1">Example calculations:</p>
                  <ul className="small">
                    <li>₦{pricePerKg} = 1.0 KG</li>
                    <li>₦{(pricePerKg * 1.5).toFixed(2)} = 1.5 KG</li>
                    <li>₦{(pricePerKg * 2).toFixed(2)} = 2.0 KG</li>
                    <li>₦{(pricePerKg * 0.5).toFixed(2)} = 0.5 KG</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-dark text-white py-4 mt-5">
          <div className="container">
            <div className="row">
              <div className="col-md-6">
                <h5>Noretek Energy</h5>
                <p>Price Management System</p>
              </div>
              <div className="col-md-6 text-md-end">
                <p>Contact: support@noretekenergy.com</p>
              </div>
            </div>
            <hr />
            <div className="text-center">
              <p className="mb-0">© 2025 Noretek Energy. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>

      {/* Add Font Awesome for icons */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      <style jsx>{`
        .primaryColor {
          background-color: #0d6efd;
          color: white;
        }
      `}</style>
    </div>
  );
}