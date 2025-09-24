"use client";

import React, { useState, useEffect } from "react";

export default function CustomerPage() {
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
    capturedBy: ""
  });
  const [formMessage, setFormMessage] = useState("");
  const [formMessageType, setFormMessageType] = useState("");

  // Property search state
  const [propertySearch, setPropertySearch] = useState("");
  const [propertyResults, setPropertyResults] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [propertyLoading, setPropertyLoading] = useState(false);

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

  // Auto-refresh ID state
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [lastGeneratedId, setLastGeneratedId] = useState("");

  // Options for dropdowns
  const customerTypes = [
    { value: 0, label: "Residential" },
    { value: 1, label: "Commercial" },
    { value: 2, label: "Industrial" }
  ];

  // Initialize token from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  // Fetch customers when token or filters change
  useEffect(() => {
    if (token) {
      fetchCustomers();
    }
  }, [token, pagination.pageNumber, pagination.pageSize, searchTerm, sortField, sortOrder]);

  // Auto-generate customer ID when token is available and not editing
  useEffect(() => {
    if (token && !isEditing && autoRefreshEnabled) {
      generateCustomerId();
    }
  }, [token, isEditing, autoRefreshEnabled]);

  // Auto-refresh ID after successful form submission
  useEffect(() => {
    if (formMessageType === "success" && !isEditing && autoRefreshEnabled) {
      const timer = setTimeout(() => {
        generateCustomerId();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [formMessageType, isEditing, autoRefreshEnabled]);

  // Search properties based on property unit
  const searchProperties = async (searchText) => {
    if (!searchText || searchText.length < 2) {
      setPropertyResults([]);
      return;
    }

    setPropertyLoading(true);
    try {
      const res = await fetch("/api/customer-signup-api");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const filteredProperties = data.customers.filter(customer => {
            const unitDescription = customer.propertyUnit?.unit_description || "";
            const blockNo = customer.propertyUnit?.blockno || "";
            const customerName = customer.name || "";
            const phone = customer.phone || "";
            
            const searchLower = searchText.toLowerCase();
            return (
              unitDescription.toLowerCase().includes(searchLower) ||
              blockNo.toLowerCase().includes(searchLower) ||
              customerName.toLowerCase().includes(searchLower) ||
              phone.includes(searchText)
            );
          });
          setPropertyResults(filteredProperties);
        }
      }
    } catch (error) {
      console.error("Error searching properties:", error);
    } finally {
      setPropertyLoading(false);
    }
  };

  // Handle property selection
  const handlePropertySelect = (property) => {
    setSelectedProperty(property);
    
    const unitInfo = property.propertyUnit 
      ? `${property.propertyUnit.unit_description} - ${property.propertyUnit.blockno}`
      : "No unit assigned";
    setPropertySearch(unitInfo);
    setPropertyResults([]);
    
    setFormData(prev => ({
      ...prev,
      customerName: property.name || "",
      phone: property.phone || "",
      address: property.address || "",
      certifiName: property.certifiName || "",
      certifiNo: property.certifiNo || "",
    }));
  };

  // Improved customer ID generation with collision detection and 4-digit limit
  const generateCustomerId = async () => {
    if (!token || isEditing || !autoRefreshEnabled) return;

    try {
      const res = await fetch(`${API_BASE_URL}/API/Customer/Read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          createDateRange: [],
          updateDateRange: [],
          pageNumber: 1,
          pageSize: 1000,
          company: "Noretek Energy",
          searchTerm: "",
          sortField: "customerId",
          sortOrder: "desc",
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.message || `HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      const allCustomers = data?.result?.data || [];
      
      const existingIds = allCustomers.map(customer => customer.customerId).filter(id => id);
      
      let highestNumber = 0;
      existingIds.forEach(id => {
        const idMatch = id.match(/([A-Za-z]*)(\d+)/);
        if (idMatch && idMatch.length >= 3) {
          const numericPart = parseInt(idMatch[2], 10);
          if (numericPart > highestNumber && numericPart < 10000) {
            highestNumber = numericPart;
          }
        }
      });

      const newNumber = highestNumber + 1;
      
      if (newNumber > 9999) {
        let availableNumber = 1;
        for (let i = 1; i <= 9999; i++) {
          const testId = `CUST${i.toString().padStart(4, "0")}`;
          if (!existingIds.includes(testId)) {
            availableNumber = i;
            break;
          }
        }
        const newId = `CUST${availableNumber.toString().padStart(4, "0")}`;
        setFormData(prev => ({ ...prev, customerId: newId }));
        setLastGeneratedId(newId);
      } else {
        const newId = `CUST${newNumber.toString().padStart(4, "0")}`;
        
        if (existingIds.includes(newId)) {
          let safeNumber = newNumber + 1;
          while (safeNumber <= 9999) {
            const safeId = `CUST${safeNumber.toString().padStart(4, "0")}`;
            if (!existingIds.includes(safeId)) {
              setFormData(prev => ({ ...prev, customerId: safeId }));
              setLastGeneratedId(safeId);
              return;
            }
            safeNumber++;
          }
          let availableNumber = 1;
          for (let i = 1; i <= 9999; i++) {
            const testId = `CUST${i.toString().padStart(4, "0")}`;
            if (!existingIds.includes(testId)) {
              availableNumber = i;
              break;
            }
          }
          const finalId = `CUST${availableNumber.toString().padStart(4, "0")}`;
          setFormData(prev => ({ ...prev, customerId: finalId }));
          setLastGeneratedId(finalId);
        } else {
          setFormData(prev => ({ ...prev, customerId: newId }));
          setLastGeneratedId(newId);
        }
      }
    } catch (error) {
      console.error("Error generating customer ID:", error);
      const fallbackId = "CUST0001";
      setFormData(prev => ({ ...prev, customerId: fallbackId }));
      setLastGeneratedId(fallbackId);
    }
  };

  // Reset form
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
      capturedBy: ""
    });
    setSelectedProperty(null);
    setPropertySearch("");
    setIsEditing(false);
    setFormMessage("");
    setFormMessageType("");
    
    setAutoRefreshEnabled(true);
    if (token) {
      setTimeout(() => generateCustomerId(), 500);
    }
  };

  // Toggle auto-refresh functionality
  const toggleAutoRefresh = () => {
    setAutoRefreshEnabled(!autoRefreshEnabled);
    if (!autoRefreshEnabled && token && !isEditing) {
      generateCustomerId();
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
        setAutoRefreshEnabled(true);
      } else {
        setLoginError(data?.message || "Login failed. Check credentials.");
      }
    } catch (err) {
      setLoginError("❌ An error occurred: " + err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  // Customer form handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (["type"].includes(name)) {
      const numericValue = value === "" ? 0 : parseInt(value, 10);
      setFormData(prev => ({ ...prev, [name]: isNaN(numericValue) ? 0 : numericValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle property search input change
  const handlePropertySearchChange = (e) => {
    const value = e.target.value;
    setPropertySearch(value);
    searchProperties(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormMessage("");
    setFormMessageType("");
    setLoading(true);

    try {
      // Check for existing customer ID
      const checkRes = await fetch(`${API_BASE_URL}/API/Customer/Read`, {
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
          searchTerm: formData.customerId,
          sortField: "customerId",
          sortOrder: "asc",
        }),
      });

      if (!checkRes.ok) {
        const errorData = await checkRes.json();
        throw new Error(errorData?.message || `HTTP error! status: ${checkRes.status}`);
      }

      const checkData = await checkRes.json();
      const existingCustomer = checkData?.result?.data?.[0];
      
      if (existingCustomer && existingCustomer.customerId === formData.customerId && !isEditing) {
        setFormMessage("⚠️ Customer ID was already taken. Generating new ID...");
        setFormMessageType("warning");
        await generateCustomerId();
        setLoading(false);
        return;
      }

      const submitData = {
        customerId: formData.customerId,
        customerName: formData.customerName,
        type: Number(formData.type),
        phone: formData.phone || "",
        address: formData.address || "",
        certifiName: formData.certifiName || "",
        certifiNo: formData.certifiNo || "",
        company: formData.company,
        capturedBy: formData.capturedBy
      };

      const endpoint = isEditing
        ? `${API_BASE_URL}/API/Customer/Update`
        : `${API_BASE_URL}/API/Customer/Create`;

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
        
        if (errorData?.message?.includes("duplicate") || errorData?.message?.includes("already exists")) {
          setFormMessage("❌ Customer ID already exists. Generating new ID...");
          setFormMessageType("error");
          await generateCustomerId();
          setLoading(false);
          return;
        }
        
        throw new Error(errorData?.message || `HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      if (data?.result !== undefined) {
        setFormMessage(`✅ Customer ${isEditing ? "updated" : "created"} successfully.`);
        setFormMessageType("success");
        
        if (!isEditing) {
          setLastGeneratedId(formData.customerId);
          setAutoRefreshEnabled(true);
        }
        
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

  // Manual ID generation button handler
  const handleGenerateNewId = async () => {
    if (!isEditing) {
      setFormMessage("🔄 Generating new customer ID...");
      setFormMessageType("info");
      await generateCustomerId();
      setFormMessage("✅ New customer ID generated!");
      setFormMessageType("success");
      setTimeout(() => setFormMessage(""), 2000);
    }
  };

  // Table functions
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/API/Customer/Read`, {
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
      company: customer.company ?? "Noretek Energy",
      capturedBy: customer.capturedBy ?? ""
    });
    setIsEditing(true);
    setAutoRefreshEnabled(false);
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
        .id-field-container {
          display: flex;
          gap: 10px;
          align-items: flex-end;
        }
        .id-field {
          flex: 1;
        }
        .generate-btn {
          height: 38px;
          white-space: nowrap;
        }
        .property-search-container {
          position: relative;
        }
        .property-results {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #ddd;
          border-top: none;
          max-height: 200px;
          overflow-y: auto;
          z-index: 1000;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .property-result-item {
          padding: 10px;
          cursor: pointer;
          border-bottom: 1px solid #eee;
        }
        .property-result-item:hover {
          background-color: #f8f9fa;
        }
        .property-result-item:last-child {
          border-bottom: none;
        }
        .auto-fill-badge {
          background-color: #d4edda;
          color: #155724;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 0.8em;
          margin-left: 5px;
        }
        .property-unit-info {
          font-size: 0.9em;
          color: #6c757d;
        }
        .auto-refresh-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 5px;
        }
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 50px;
          height: 24px;
        }
        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: .4s;
          border-radius: 24px;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 16px;
          width: 16px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }
        input:checked + .slider {
          background-color: #0d6efd;
        }
        input:checked + .slider:before {
          transform: translateX(26px);
        }
        .id-status {
          font-size: 0.8em;
          color: #6c757d;
          margin-top: 2px;
        }
        .auto-refresh-status {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.8em;
          padding: 2px 8px;
          border-radius: 12px;
          background-color: #e9ecef;
        }
        .status-on {
          background-color: #d4edda;
          color: #155724;
        }
        .status-off {
          background-color: #f8d7da;
          color: #721c24;
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

      {/* CUSTOMER FORM */}
      {token && (
        <div className="card mb-5 shadow-sm">
          <div className="card-header primaryColor text-center">
            <h4>{isEditing ? "Edit Customer" : "Create New Customer"}</h4>
          </div>
          <div className="card-body">
            {formMessage && (
              <div className={`alert alert-${formMessageType === "success" ? "success" : formMessageType === "warning" ? "warning" : formMessageType === "info" ? "info" : "danger"} mb-4`}>
                {formMessage}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="row g-3">
              {/* Property Search Field */}
              <div className="col-12">
                <label className="form-label">Search Property Unit</label>
                <div className="property-search-container">
                  <input
                    type="text"
                    className="form-control shadow-none"
                    value={propertySearch}
                    onChange={handlePropertySearchChange}
                    placeholder="Type to search property units (Unit Description - Block No) or customers..."
                    disabled={isEditing}
                  />
                  {propertyLoading && (
                    <div className="position-absolute top-50 end-0 translate-middle-y me-3">
                      <div className="spinner-border spinner-border-sm" role="status"></div>
                    </div>
                  )}
                  {propertyResults.length > 0 && (
                    <div className="property-results">
                      {propertyResults.map((property, index) => (
                        <div
                          key={index}
                          className="property-result-item"
                          onClick={() => handlePropertySelect(property)}
                        >
                          <div className="fw-bold">
                            {property.propertyUnit 
                              ? `${property.propertyUnit.unit_description} - ${property.propertyUnit.blockno}`
                              : "No unit assigned"
                            }
                          </div>
                          <div className="property-unit-info">
                            Customer: {property.name} | Phone: {property.phone} | 
                            Property: {property.propertyName?.property_name || "N/A"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <small className="form-text text-muted">
                  Search for property units
                </small>
              </div>

              <div className="col-md-6">
                <label className="form-label">Customer ID *</label>
                <div className="id-field-container">
                  <div className="id-field">
                    <input
                      type="text"
                      className="form-control shadow-none"
                      name="customerId"
                      value={formData.customerId}
                      onChange={handleChange}
                      required
                      placeholder="Auto-generated customer ID (4 digits)"
                      readOnly={!isEditing}
                      maxLength={8}
                    />
                  </div>
                  {!isEditing && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary generate-btn"
                      onClick={handleGenerateNewId}
                      disabled={loading}
                      title="Generate new ID"
                    >
                      🔄
                    </button>
                  )}
                </div>
                <div className="auto-refresh-toggle">
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={autoRefreshEnabled} 
                      onChange={toggleAutoRefresh}
                      disabled={isEditing}
                    />
                    <span className="slider"></span>
                  </label>
                  <span className={`auto-refresh-status ${autoRefreshEnabled ? 'status-on' : 'status-off'}`}>
                    {autoRefreshEnabled ? '🔄 Auto-refresh ON' : '⏸️ Auto-refresh OFF'}
                  </span>
                </div>
                <small className="form-text text-muted">
                  {isEditing ? "Editing existing customer ID" : "Customer ID is auto-generated (4-digit number) and checked for duplicates"}
                </small>
                {lastGeneratedId && !isEditing && (
                  <div className="id-status">
                    Last generated: {lastGeneratedId}
                  </div>
                )}
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
                {selectedProperty && <span className="auto-fill-badge">Auto-filled</span>}
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
                {selectedProperty && <span className="auto-fill-badge">Auto-filled</span>}
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
                {selectedProperty && <span className="auto-fill-badge">Auto-filled</span>}
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
                {selectedProperty && <span className="auto-fill-badge">Auto-filled</span>}
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
                {selectedProperty && <span className="auto-fill-badge">Auto-filled</span>}
              </div>

              <div className="col-md-6">
                <label className="form-label">Captured By</label>
                <input
                  type="text"
                  className="form-control shadow-none"
                  name="capturedBy"
                  value={formData.capturedBy}
                  onChange={handleChange}
                  placeholder="Enter captured by name"
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
                <button type="submit" className="btn primaryColor w-100" disabled={loading}>
                  {loading ? "Processing..." : (isEditing ? "Update Customer" : "Create Customer")}
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

      {/* CUSTOMER TABLE - Updated to include Captured By column */}
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
                          <td colSpan="11" className="text-center text-muted display-5 py-4">
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