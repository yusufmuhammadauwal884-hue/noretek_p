"use client";

import React, { useState, useEffect } from "react";

export default function TariffPage() {
  // Define API_BASE_URL using environment variable
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://47.107.69.132:9400';

  // Login state
  const [loginData, setLoginData] = useState({
    userId: "",
    password: "",
    company: "Noretek Energy",
  });
  const [token, setToken] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Tariff form state
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    tariffId: "",
    tariffName: "",
    price: "",
    tax: "",
    repaymentRatio: "",
    monthlyCost: "",
    company: "Noretek Energy",
    remark: "",
  });
  const [formMessage, setFormMessage] = useState("");
  const [formMessageType, setFormMessageType] = useState("");

  // Table state
  const [tariffs, setTariffs] = useState([]);
  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: 10,
    totalPages: 1,
    totalRecords: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("tariffId");
  const [sortOrder, setSortOrder] = useState("asc");

  // Initialize token from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) setToken(savedToken);
  }, []);

  // Fetch tariffs when token or filters change
  useEffect(() => {
    if (token) {
      fetchTariffs();
      if (!isEditing) {
        generateTariffId();
      }
    }
  }, [token, pagination.pageNumber, pagination.pageSize, searchTerm, sortField, sortOrder]);

  // Improved tariff ID generation with collision detection
  const generateTariffId = async () => {
    if (!token || isEditing) return;
    
    try {
      // Fetch all tariffs to check existing IDs
      const res = await fetch(`${API_BASE_URL}/API/Tariff/Read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          createDateRange: [],
          updateDateRange: [],
          pageNumber: 1,
          pageSize: 1000, // Get all tariffs to check IDs
          company: "Noretek Energy",
          searchTerm: "",
          sortField: "tariffId",
          sortOrder: "desc",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const allTariffs = data?.result?.data || [];
        
        // Extract all existing tariff IDs
        const existingIds = allTariffs.map(tariff => tariff.tariffId).filter(Boolean);
        
        // Find the highest numeric part
        let maxNumber = 0;
        existingIds.forEach(id => {
          const match = id.match(/(?:TARIFF|TAR|TF)(\d+)/i);
          if (match && match[1]) {
            const num = parseInt(match[1], 10);
            if (num > maxNumber) maxNumber = num;
          }
        });

        // Generate new ID with prefix "TARIFF" and increment
        const newNumber = maxNumber + 1;
        const newId = `TARIFF${newNumber.toString().padStart(4, '0')}`;
        
        // Check if the generated ID already exists (safety check)
        if (!existingIds.includes(newId)) {
          setFormData(prev => ({ ...prev, tariffId: newId }));
        } else {
          // If by chance it exists, try next number
          setFormData(prev => ({ ...prev, tariffId: `TARIFF${(newNumber + 1).toString().padStart(4, '0')}` }));
        }
      } else {
        // Fallback to default pattern if fetch fails
        setFormData(prev => ({ ...prev, tariffId: "TARIFF0001" }));
      }
    } catch (error) {
      console.error("Error generating tariff ID:", error);
      // Fallback with timestamp-based ID to avoid collisions
      const timestamp = Date.now().toString().slice(-4);
      setFormData(prev => ({ ...prev, tariffId: `TARIFF${timestamp}` }));
    }
  };

  // Login handlers
  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await fetch(`${API_BASE_URL}/API/User/Login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.message || `HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      if (data?.result?.token) {
        localStorage.setItem("token", data.result.token);
        setToken(data.result.token);
      } else {
        setLoginError(data?.message || "Login failed. Check credentials.");
      }
    } catch (err) {
      setLoginError("An error occurred: " + err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  // Tariff form handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === "price" || name === "tax" || name === "repaymentRatio" || name === "monthlyCost" 
        ? value === "" ? "" : Number(value) 
        : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormMessage("");
    setFormMessageType("");
    setLoading(true);
    
    try {
      // First, verify the tariff ID doesn't already exist (for create operations)
      if (!isEditing) {
        const checkRes = await fetch(`${API_BASE_URL}/API/Tariff/Read`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            pageNumber: 1,
            pageSize: 1,
            company: "Noretek Energy",
            searchTerm: formData.tariffId,
          }),
        });

        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (checkData?.result?.data?.length > 0) {
            // ID already exists, generate a new one
            await generateTariffId();
            throw new Error("Tariff ID already exists. A new ID has been generated. Please try again.");
          }
        }
      }

      const endpoint = isEditing 
        ? `${API_BASE_URL}/API/Tariff/Update` 
        : `${API_BASE_URL}/API/Tariff/Create`;
      
      // Format the data according to API requirements
      const requestData = {
        ...formData,
        price: formData.price ? Number(formData.price) : 0,
        tax: formData.tax ? Number(formData.tax) : 0,
        repaymentRatio: formData.repaymentRatio ? Number(formData.repaymentRatio) : 0,
        monthlyCost: formData.monthlyCost ? Number(formData.monthlyCost) : 0
      };
      
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(isEditing ? [requestData] : [requestData]),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.message || `HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data?.result !== undefined) {
        setFormMessage(`✅ Tariff ${isEditing ? 'updated' : 'created'} successfully.`);
        setFormMessageType("success");
        resetForm();
        fetchTariffs();
      } else {
        const errorMsg = data?.message || "Operation failed";
        setFormMessage(`❌ ${errorMsg}`);
        setFormMessageType("error");
      }
    } catch (err) {
      setFormMessage("❌ Error: " + err.message);
      setFormMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      tariffId: "",
      tariffName: "",
      price: "",
      tax: "",
      repaymentRatio: "",
      monthlyCost: "",
      company: "Noretek Energy",
      remark: "",
    });
    setIsEditing(false);
    if (token) {
      setTimeout(() => generateTariffId(), 100);
    }
  };

  // Manual ID regeneration function
  const regenerateTariffId = async () => {
    if (!isEditing) {
      await generateTariffId();
      setFormMessage("🔄 Tariff ID regenerated");
      setFormMessageType("info");
      setTimeout(() => setFormMessage(""), 3000);
    }
  };

  // Table functions
  const fetchTariffs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/API/Tariff/Read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          createDateRange: [],
          updateDateRange: [],
          pageNumber: pagination.pageNumber,
          pageSize: pagination.pageSize,
          company: "Noretek Energy",
          searchTerm: searchTerm,
          sortField: sortField,
          sortOrder: sortOrder,
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.message || `HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      setTariffs(data?.result?.data || []);
      
      if (data?.result?.pagination) {
        setPagination(prev => ({
          ...prev,
          totalPages: data.result.pagination.totalPages || 1,
          totalRecords: data.result.pagination.totalRecords || 0,
        }));
      }
    } catch (err) {
      setTariffs([]);
      setFormMessage("❌ Error fetching tariffs: " + err.message);
      setFormMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, pageNumber: newPage }));
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, pageNumber: 1 }));
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handlePageSizeChange = (e) => {
    const newSize = Number(e.target.value);
    setPagination(prev => ({
      ...prev,
      pageSize: newSize,
      pageNumber: 1
    }));
  };

  const handleEdit = (tariff) => {
    setFormData({
      tariffId: tariff.tariffId ?? "",
      tariffName: tariff.tariffName ?? "",
      price: tariff.price ?? "",
      tax: tariff.tax ?? "",
      repaymentRatio: tariff.repaymentRatio ?? "",
      monthlyCost: tariff.monthlyCost ?? "",
      company: tariff.company ?? "Noretek Energy",
      remark: tariff.remark ?? "",
    });
    setIsEditing(true);
    setFormMessage("");
    setFormMessageType("");
  };

  return (
    <div className="container mt-5">
      <style jsx>{`
        .cursor-pointer {
          cursor: pointer;
        }
        .card {
          border: none;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .card-header {
          border-bottom: 1px solid rgba(0,0,0,0.1);
          padding: 1rem 1.5rem;
        }
        .form-control:focus {
          box-shadow: 0 0 0 0.2rem rgba(0,123,255,0.25);
          border-color: #80bdff;
        }
        .btn {
          border-radius: 5px;
          font-weight: 500;
          transition: all 0.2s;
        }
        .btn:disabled {
          opacity: 0.65;
        }
        .table th {
          border-top: none;
          font-weight: 600;
          color: #495057;
          background-color: #f8f9fa;
        }
        .alert {
          border: none;
          border-radius: 5px;
          padding: 0.75rem 1.25rem;
        }
        .spinner-border {
          width: 3rem;
          height: 3rem;
        }
        .input-group {
          width: auto;
        }
        .primaryColor {
          background-color: #0d6efd;
          color: white;
        }
        .titleColor {
          color: #0d6efd;
        }
        .table-container {
          overflow-x: auto;
          width: 100%;
        }
        .table {
          min-width: 1000px;
        }
        .id-regenerate-btn {
          margin-top: 0.5rem;
          font-size: 0.8rem;
          padding: 0.2rem 0.5rem;
        }
      `}</style>

      {/* LOGIN FORM */}
      {!token && (
        <div className="card mb-5 shadow-sm">
          <div className="card-header primaryColor text-center">
            <h4>Login to Get Token</h4>
          </div>
          <div className="card-body">
            <form onSubmit={handleLoginSubmit}>
              <div className="mb-3">
                <label className="form-label">User ID</label>
                <input
                  type="text"
                  className="form-control shadow-none"
                  name="userId"
                  value={loginData.userId}
                  onChange={handleLoginChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control shadow-none"
                  name="password"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Company</label>
                <input
                  type="text"
                  className="form-control shadow-none"
                  name="company"
                  value={loginData.company}
                  onChange={handleLoginChange}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn primaryColor w-100"
                disabled={loginLoading}
              >
                {loginLoading ? "Logging in..." : "Login"}
              </button>
              {loginError && (
                <div className="alert alert-danger mt-3">{loginError}</div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* TARIFF FORM */}
      {token && (
        <div className="card mb-5 shadow-sm">
          <div className="card-header primaryColor text-center">
            <h4>{isEditing ? "Edit Tariff" : "Create New Tariff"}</h4>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit} className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Tariff ID *</label>
                <input
                  type="text"
                  className="form-control shadow-none"
                  name="tariffId"
                  value={formData.tariffId}
                  onChange={handleChange}
                  required
                  placeholder="Auto-generated tariff ID"
                  readOnly={!isEditing}
                />
                <small className="form-text text-muted">
                  {isEditing ? "Editing existing tariff ID" : "Tariff ID is auto-generated"}
                </small>
                {!isEditing && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm id-regenerate-btn"
                    onClick={regenerateTariffId}
                    disabled={loading}
                  >
                    🔄 Regenerate ID
                  </button>
                )}
              </div>

              <div className="col-md-6">
                <label className="form-label">Tariff Name *</label>
                <input
                  type="text"
                  className="form-control shadow-none"
                  name="tariffName"
                  value={formData.tariffName}
                  onChange={handleChange}
                  required
                  placeholder="Enter tariff name"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Price *</label>
                <input
                  type="number"
                  className="form-control shadow-none"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  step="0.01"
                  placeholder="Enter price"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Tax *</label>
                <input
                  type="number"
                  className="form-control shadow-none"
                  name="tax"
                  value={formData.tax}
                  onChange={handleChange}
                  required
                  step="0.01"
                  placeholder="Enter tax"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Repayment Ratio *</label>
                <input
                  type="number"
                  className="form-control shadow-none"
                  name="repaymentRatio"
                  value={formData.repaymentRatio}
                  onChange={handleChange}
                  required
                  step="0.01"
                  placeholder="Enter repayment ratio"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Monthly Cost *</label>
                <input
                  type="number"
                  className="form-control shadow-none"
                  name="monthlyCost"
                  value={formData.monthlyCost}
                  onChange={handleChange}
                  required
                  step="0.01"
                  placeholder="Enter monthly cost"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Company</label>
                <input
                  type="text"
                  className="form-control shadow-none"
                  name="company"
                  value={formData.company}
                  readOnly
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Remark</label>
                <input
                  type="text"
                  className="form-control shadow-none"
                  name="remark"
                  value={formData.remark}
                  onChange={handleChange}
                  placeholder="Optional remarks"
                />
              </div>

              <div className="col-12">
                <button 
                  type="submit" 
                  className="btn primaryColor w-100"
                  disabled={loading}
                >
                  {loading ? "Processing..." : (isEditing ? "Update Tariff" : "Create Tariff")}
                </button>
                {isEditing && (
                  <button 
                    type="button" 
                    className="btn btn-secondary w-100 mt-2"
                    onClick={resetForm}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                )}
              </div>
              {formMessage && (
                <div className={`alert mt-3 alert-${formMessageType === "success" ? "success" : formMessageType === "info" ? "info" : "danger"}`}>
                  {formMessage}
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* TARIFF TABLE */}
      {token && (
        <div className="card shadow">
          <div className="card-header primaryColor text-white">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <h5 className="mb-0">Tariff Management</h5>
              <div className="d-flex flex-wrap gap-2">
                <form onSubmit={handleSearch} className="d-flex">
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control shadow-none"
                      placeholder="Search tariffs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button className="btn titleColor bg-light border-opacity-50 border" type="submit" disabled={loading}>
                      Search
                    </button>
                  </div>
                </form>
                <select
                  className="form-select shadow-none"
                  value={`${sortField}:${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split(':');
                    setSortField(field);
                    setSortOrder(order);
                  }}
                  disabled={loading}
                >
                  <option value="tariffId:asc">Sort by Tariff ID (A-Z)</option>
                  <option value="tariffId:desc">Sort by Tariff ID (Z-A)</option>
                  <option value="tariffName:asc">Sort by Name (A-Z)</option>
                  <option value="tariffName:desc">Sort by Name (Z-A)</option>
                  <option value="price:desc">Sort by Highest Price</option>
                  <option value="price:asc">Sort by Lowest Price</option>
                </select>
              </div>
            </div>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="text-center my-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <>
                <div className="table-container">
                  <table className="table table-bordered table-hover">
                    <thead>
                      <tr>
                        <th onClick={() => handleSort("tariffId")} className="cursor-pointer titleColor">
                          Tariff ID {sortField === "tariffId" && (
                            <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                          )}
                        </th>
                        <th onClick={() => handleSort("tariffName")} className="cursor-pointer titleColor">
                          Name {sortField === "tariffName" && (
                            <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                          )}
                        </th>
                        <th onClick={() => handleSort("price")} className="cursor-pointer titleColor">
                          Price {sortField === "price" && (
                            <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                          )}
                        </th>
                        <th className="titleColor">Tax</th>
                        <th className="titleColor">Repayment Ratio</th>
                        <th className="titleColor">Monthly Cost</th>
                        <th className="titleColor">Company</th>
                        <th className="titleColor">Remark</th>
                        <th className="titleColor">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tariffs.length > 0 ? (
                        tariffs.map((tariff, index) => (
                          <tr key={index}>
                            <td><strong>{tariff.tariffId}</strong></td>
                            <td>{tariff.tariffName}</td>
                            <td>₦{tariff.price?.toLocaleString()}</td>
                            <td>₦{tariff.tax?.toLocaleString()}</td>
                            <td>{tariff.repaymentRatio}%</td>
                            <td>₦{tariff.monthlyCost?.toLocaleString()}</td>
                            <td>{tariff.company}</td>
                            <td>{tariff.remark || "-"}</td>
                            <td>
                              <button
                                className="btn btn-sm btn-warning"
                                onClick={() => handleEdit(tariff)}
                                disabled={loading}
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="9" className="text-center text-muted py-4">
                            No tariffs found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination controls */}
                <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-3">
                  <div className="text-nowrap">
                    Showing {(pagination.pageNumber - 1) * pagination.pageSize + 1} to{' '}
                    {Math.min(pagination.pageNumber * pagination.pageSize, pagination.totalRecords)} of{' '}
                    {pagination.totalRecords} tariffs
                  </div>
                  <div className="btn-group">
                    <button
                      className="btn primaryColor"
                      onClick={() => handlePageChange(pagination.pageNumber - 1)}
                      disabled={pagination.pageNumber === 1 || loading}
                    >
                      Previous
                    </button>
                    <span className="btn btn-light disabled">
                      Page {pagination.pageNumber} of {pagination.totalPages}
                    </span>
                    <button
                      className="btn primaryColor"
                      onClick={() => handlePageChange(pagination.pageNumber + 1)}
                      disabled={pagination.pageNumber === pagination.totalPages || loading}
                    >
                      Next
                    </button>
                  </div>
                  <div className="form-group">
                    <select
                      className="form-select"
                      value={pagination.pageSize}
                      onChange={handlePageSizeChange}
                      disabled={loading}
                    >
                      <option value="5">5 per page</option>
                      <option value="10">10 per page</option>
                      <option value="20">20 per page</option>
                      <option value="50">50 per page</option>
                    </select>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}