"use client";

import React, { useState, useEffect } from "react";

export default function CustomerPage() {
  // Login state
  const [loginData, setLoginData] = useState({
    userId: "",
    password: "",
    company: "Noretek Energy",
  });
  const [token, setToken] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Customer form state
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    customerId: "",
    customerName: "",
    type: 0,
    phone: "",
    address: "",
    certifiName: "",
    certifiNo: "",
    remark: "",
    company: "Noretek Energy",
  });
  const [formMessage, setFormMessage] = useState("");
  const [formMessageType, setFormMessageType] = useState("");

  // Table state
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: 10,
    totalPages: 1,
    totalRecords: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("customerId");
  const [sortOrder, setSortOrder] = useState("asc");

  // Options for dropdowns
  const customerTypes = [
    { value: 0, label: "Residential" },
    { value: 1, label: "Commercial" },
    { value: 2, label: "Industrial" }
  ];

  // Initialize token from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) setToken(savedToken);
  }, []);

  // Fetch customers when token or filters change
  useEffect(() => {
    if (token) {
      fetchCustomers();
      generateCustomerId();
    }
    // eslint-disable-next-line
  }, [token, pagination.pageNumber, pagination.pageSize, searchTerm, sortField, sortOrder]);

  // Generate customer ID
  const generateCustomerId = async () => {
    if (!token || isEditing) return;
    
    try {
      const res = await fetch("http://47.107.69.132:9400/API/Customer/Read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          createDateRange: [],
          updateDateRange: [],
          pageNumber: 1,
          pageSize: 1,
          company: "Noretek Energy",
          searchTerm: "",
          sortField: "createDate",
          sortOrder: "desc",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const latestCustomer = data?.result?.data?.[0];
        
        if (latestCustomer && latestCustomer.customerId) {
          // Extract the numeric part and increment
          const idParts = latestCustomer.customerId.match(/([A-Za-z]*)(\d+)/);
          if (idParts && idParts.length >= 3) {
            const prefix = idParts[1] || "CUST";
            const numericPart = parseInt(idParts[2], 10) + 1;
            const newId = `${prefix}${numericPart.toString().padStart(4, '0')}`;
            setFormData(prev => ({ ...prev, customerId: newId }));
            return;
          }
        }
      }
      
      // Fallback to default pattern if anything fails
      setFormData(prev => ({ ...prev, customerId: "CUST0001" }));
    } catch (error) {
      console.error("Error generating customer ID:", error);
      setFormData(prev => ({ ...prev, customerId: "CUST0001" }));
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
      const res = await fetch("http://47.107.69.132:9400/API/User/Login", {
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

  // Customer form handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Handle numeric fields
    if (["type"].includes(name)) {
      const numericValue = value === "" ? 0 : parseInt(value, 10);
      setFormData(prev => ({ ...prev, [name]: isNaN(numericValue) ? 0 : numericValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormMessage("");
    setFormMessageType("");
    setLoading(true);

    try {
      const submitData = {
        customerId: formData.customerId,
        customerName: formData.customerName,
        type: Number(formData.type),
        phone: formData.phone || "",
        address: formData.address || "",
        certifiName: formData.certifiName || "",
        certifiNo: formData.certifiNo || "",
        remark: formData.remark || "",
        company: formData.company
      };

      const endpoint = isEditing
        ? "http://47.107.69.132:9400/API/Customer/Update"
        : "http://47.107.69.132:9400/API/Customer/Create";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify([submitData]),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.message || `HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      if (data?.result !== undefined) {
        setFormMessage(`✅ Customer ${isEditing ? "updated" : "created"} successfully.`);
        setFormMessageType("success");
        resetForm();
        fetchCustomers();
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
      customerId: "",
      customerName: "",
      type: 0,
      phone: "",
      address: "",
      certifiName: "",
      certifiNo: "",
      remark: "",
      company: "Noretek Energy",
    });
    setIsEditing(false);
    if (token) {
      setTimeout(() => generateCustomerId(), 100);
    }
  };

  // Table functions
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://47.107.69.132:9400/API/Customer/Read", {
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
      setCustomers(data?.result?.data || []);

      if (data?.result?.pagination) {
        setPagination(prev => ({
          ...prev,
          totalPages: data.result.pagination.totalPages || 1,
          totalRecords: data.result.pagination.totalRecords || 0,
        }));
      }
    } catch (err) {
      setCustomers([]);
      setFormMessage("❌ Error fetching customers: " + err.message);
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

  // Edit handler
  const handleEdit = (customer) => {
    setFormData({
      customerId: customer.customerId ?? "",
      customerName: customer.customerName ?? "",
      type: customer.type ?? 0,
      phone: customer.phone ?? "",
      address: customer.address ?? "",
      certifiName: customer.certifiName ?? "",
      certifiNo: customer.certifiNo ?? "",
      remark: customer.remark ?? "",
      company: customer.company ?? "Noretek Energy",
    });
    setIsEditing(true);
    setFormMessage("");
    setFormMessageType("");
  };

  // Helper function to get label from value
  const getLabelFromValue = (value, options) => {
    const option = options.find(opt => opt.value === value);
    return option ? option.label : value;
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
      `}</style>

      {/* LOGIN FORM */}
      {!token && (
        <div className="card mb-5 shadow">
          <div className="card-header bg-dark text-white text-center">
            <h4>Login to Get Token</h4>
          </div>
          <div className="card-body">
            <form onSubmit={handleLoginSubmit}>
              <div className="mb-3">
                <label className="form-label">User ID</label>
                <input
                  type="text"
                  className="form-control"
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
                  className="form-control"
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
                  className="form-control"
                  name="company"
                  value={loginData.company}
                  onChange={handleLoginChange}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary w-100"
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

      {/* CUSTOMER FORM */}
      {token && (
        <div className="card mb-5 shadow-sm">
          <div className="card-header primaryColor fw-bold text-center">
            <h4>{isEditing ? "Edit Customer" : "Create New Customer"}</h4>
          </div>
          <div className="card-body">
            {/* Success/Error message at the TOP */}
            {formMessage && (
              <div className={`alert alert-${formMessageType === "success" ? "success" : "danger"} mb-4`}>
                {formMessage}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Customer ID *</label>
                <input
                  type="text"
                  className="form-control shadow-none"
                  name="customerId"
                  value={formData.customerId}
                  onChange={handleChange}
                  required
                  placeholder="Auto-generated customer ID"
                  readOnly={true}
                />
                <small className="form-text text-muted">
                  Customer ID is auto-generated
                </small>
              </div>

              <div className="col-md-6">
                <label className="form-label">Customer Name *</label>
                <input
                  type="text"
                  className="form-control shadow-none"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  required
                  placeholder="Enter customer name"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Type *</label>
                <select
                  className="form-control shadow-none"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                >
                  {customerTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label">Phone</label>
                <input
                  type="text"
                  className="form-control shadow-none"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  className="form-control shadow-none"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter address"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Certificate Name</label>
                <input
                  type="text"
                  className="form-control shadow-none"
                  name="certifiName"
                  value={formData.certifiName}
                  onChange={handleChange}
                  placeholder="Enter certificate name"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Certificate Number</label>
                <input
                  type="text"
                  className="form-control shadow-none"
                  name="certifiNo"
                  value={formData.certifiNo}
                  onChange={handleChange}
                  placeholder="Enter certificate number"
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

              <div className="col-12">
                <label className="form-label">Remark</label>
                <textarea
                  className="form-control shadow-none"
                  name="remark"
                  value={formData.remark}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Optional remarks"
                ></textarea>
              </div>

              <div className="col-12">
                <button type="submit" className="btn primaryColor fw-bold w-100" disabled={loading}>
                  {loading ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update Customer" : "Create Customer")}
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
            </form>
          </div>
        </div>
      )}

      {/* CUSTOMER TABLE */}
      {token && (
        <div className="card shadow mb-5">
          <div className="card-header primaryColor text-white">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <h5 className="mb-0">Customer Management</h5>
              <div className="d-flex flex-wrap gap-2">
                <form onSubmit={handleSearch} className="d-flex">
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control shadow-none"
                      placeholder="Search customers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button className="btn titleColor bg-light border-opacity-50 border" type="submit" disabled={loading}>
                      Search
                    </button>
                  </div>
                </form>
                <select
                  className="form-select"
                  value={`${sortField}:${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split(':');
                    setSortField(field);
                    setSortOrder(order);
                  }}
                  disabled={loading}
                >
                  <option value="customerId:asc">Sort by Customer ID (A-Z)</option>
                  <option value="customerId:desc">Sort by Customer ID (Z-A)</option>
                  <option value="customerName:asc">Sort by Name (A-Z)</option>
                  <option value="customerName:desc">Sort by Name (Z-A)</option>
                  <option value="createDate:desc">Newest First</option>
                  <option value="createDate:asc">Oldest First</option>
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
                        <th onClick={() => handleSort("customerId")} className="cursor-pointer titleColor">
                          Customer ID {sortField === "customerId" && (
                            <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                          )}
                        </th>
                        <th onClick={() => handleSort("customerName")} className="cursor-pointer titleColor">
                          Name {sortField === "customerName" && (
                            <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                          )}
                        </th>
                        <th onClick={() => handleSort("type")} className="cursor-pointer titleColor">
                          Type {sortField === "type" && (
                            <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                          )}
                        </th>
                        <th className="titleColor">Phone</th>
                        <th className="titleColor">Address</th>
                        <th className="titleColor">Certificate Name</th>
                        <th className="titleColor">Certificate Number</th>
                        <th className="titleColor">Company</th>
                        <th className="titleColor">Remark</th>
                        <th className="titleColor">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.length > 0 ? (
                        customers.map((customer, index) => (
                          <tr key={index}>
                            <td>{customer.customerId}</td>
                            <td>{customer.customerName}</td>
                            <td>{getLabelFromValue(customer.type, customerTypes)}</td>
                            <td>{customer.phone || "-"}</td>
                            <td>{customer.address || "-"}</td>
                            <td>{customer.certifiName || "-"}</td>
                            <td>{customer.certifiNo || "-"}</td>
                            <td>{customer.company}</td>
                            <td>{customer.remark || "-"}</td>
                            <td>
                              <button
                                className="btn btn-sm btn-warning"
                                onClick={() => handleEdit(customer)}
                                disabled={loading}
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="10" className="text-center text-muted display-5 py-4">
                            No customers found
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
                    {pagination.totalRecords} customers
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