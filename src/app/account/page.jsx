"use client";

import React, { useState, useEffect } from "react";

export default function AccountPage() {
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

  // Account form state
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    customerId: "",
    meterId: "",
    site: "",
    tariffId: "",
    remark: "",
    company: "Noretek Energy",
  });
  const [formMessage, setFormMessage] = useState("");
  const [formMessageType, setFormMessageType] = useState("");

  // Table state
  const [accounts, setAccounts] = useState([]);
  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: 10,
    totalPages: 1,
    totalRecords: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [searchField, setSearchField] = useState("customerId");
  const [sortField, setSortField] = useState("customerId");
  const [sortOrder, setSortOrder] = useState("asc");

  // Dropdown options
  const [customerOptions, setCustomerOptions] = useState([]);
  const [meterOptions, setMeterOptions] = useState([]);
  const [tariffOptions, setTariffOptions] = useState([]);

  // Initialize token from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) setToken(savedToken);
  }, []);

  // Fetch dropdown data when token is available
  useEffect(() => {
    if (token) {
      fetchCustomers();
      fetchMeters();
      fetchTariffs();
      fetchAccounts();
    }
  }, [token]);

  // Fetch accounts when token or filters change
  useEffect(() => {
    if (token) {
      fetchAccounts();
    }
  }, [token, pagination.pageNumber, pagination.pageSize, searchTerm, searchField, sortField, sortOrder]);

  // Fetch customers for dropdown
  const fetchCustomers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/API/Customer/Read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pageNumber: 1,
          pageSize: 1000,
          company: "Noretek Energy",
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.message || `HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      setCustomerOptions(data?.result?.data || []);
    } catch (err) {
      console.error("Error fetching customers:", err);
      setCustomerOptions([]);
    }
  };

  // Fetch meters for dropdown
  const fetchMeters = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/API/Meter/Read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pageNumber: 1,
          pageSize: 1000,
          company: "Noretek Energy",
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.message || `HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      setMeterOptions(data?.result?.data || []);
    } catch (err) {
      console.error("Error fetching meters:", err);
      setMeterOptions([]);
    }
  };

  // Fetch tariffs for dropdown
  const fetchTariffs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/API/Tariff/Read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pageNumber: 1,
          pageSize: 1000,
          company: "Noretek Energy",
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.message || `HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      setTariffOptions(data?.result?.data || []);
    } catch (err) {
      console.error("Error fetching tariffs:", err);
      setTariffOptions([]);
    }
  };

  // Fetch accounts with proper error handling
  const fetchAccounts = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const payload = {
        createDateRange: [],
        updateDateRange: [],
        pageNumber: pagination.pageNumber,
        pageSize: pagination.pageSize,
        company: "Noretek Energy",
        searchTerm: searchTerm,
        sortField: sortField,
        sortOrder: sortOrder,
      };

      // Add search field filter if search term exists
      if (searchTerm) {
        payload[searchField] = searchTerm;
      }

      const res = await fetch(`${API_BASE_URL}/API/Account/Read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.message || `HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setAccounts(data?.result?.data || []);

      if (data?.result?.pagination) {
        setPagination(prev => ({
          ...prev,
          totalPages: data.result.pagination.totalPages || 1,
          totalRecords: data.result.pagination.totalRecords || 0,
        }));
      }
    } catch (err) {
      setAccounts([]);
      setFormMessage("❌ Error fetching accounts: " + err.message);
      setFormMessageType("error");
    } finally {
      setLoading(false);
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

  // Account form handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormMessage("");
    setFormMessageType("");
    setLoading(true);

    try {
      // First, verify the account doesn't already exist (for create operations)
      if (!isEditing) {
        const checkRes = await fetch(`${API_BASE_URL}/API/Account/Read`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            pageNumber: 1,
            pageSize: 1,
            company: "Noretek Energy",
            customerId: formData.customerId,
            meterId: formData.meterId,
          }),
        });

        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (checkData?.result?.data?.length > 0) {
            throw new Error("Account with this Customer ID and Meter ID already exists.");
          }
        }
      }

      const endpoint = isEditing
        ? `${API_BASE_URL}/API/Account/Update`
        : `${API_BASE_URL}/API/Account/Create`;

      const requestData = { ...formData };

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
        setFormMessage(`✅ Account ${isEditing ? 'updated' : 'created'} successfully.`);
        setFormMessageType("success");
        resetForm();
        fetchAccounts();
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
      meterId: "",
      site: "",
      tariffId: "",
      remark: "",
      company: "Noretek Energy",
    });
    setIsEditing(false);
  };

  // Table functions
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

  const handleEdit = (account) => {
    setFormData({
      customerId: account.customerId ?? "",
      meterId: account.meterId ?? "",
      site: account.site ?? "",
      tariffId: account.tariffId ?? "",
      remark: account.remark ?? "",
      company: account.company ?? "Noretek Energy",
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

      {/* ACCOUNT FORM */}
      {token && (
        <div className="card mb-5 shadow-sm">
          <div className="card-header primaryColor text-center">
            <h4>{isEditing ? "Edit Account" : "Create New Account"}</h4>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit} className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Customer ID *</label>
                <select
                  className="form-control shadow-none"
                  name="customerId"
                  value={formData.customerId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Customer</option>
                  {customerOptions.map((customer) => (
                    <option key={customer.customerId} value={customer.customerId}>
                      {customer.customerId} - {customer.customerName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label">Meter ID *</label>
                <select
                  className="form-control shadow-none"
                  name="meterId"
                  value={formData.meterId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Meter</option>
                  {meterOptions.map((meter) => (
                    <option key={meter.meterId} value={meter.meterId}>
                      {meter.meterId} - {meter.meterName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label">Site</label>
                <input
                  type="text"
                  className="form-control shadow-none"
                  name="site"
                  value={formData.site}
                  onChange={handleChange}
                  placeholder="Enter site location"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Tariff ID *</label>
                <select
                  className="form-control shadow-none"
                  name="tariffId"
                  value={formData.tariffId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Tariff</option>
                  {tariffOptions.map((tariff) => (
                    <option key={tariff.tariffId} value={tariff.tariffId}>
                      {tariff.tariffId} - {tariff.tariffName}
                    </option>
                  ))}
                </select>
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
                  {loading ? "Processing..." : (isEditing ? "Update Account" : "Create Account")}
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
                <div className={`alert mt-3 alert-${formMessageType === "success" ? "success" : "danger"}`}>
                  {formMessage}
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ACCOUNT TABLE */}
      {token && (
        <div className="card shadow">
          <div className="card-header primaryColor text-white">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <h5 className="mb-0">Account Management</h5>
              <div className="d-flex flex-wrap gap-2">
                <form onSubmit={handleSearch} className="d-flex">
                  <div className="input-group">
                    <select
                      className="form-select shadow-none"
                      value={searchField}
                      onChange={(e) => setSearchField(e.target.value)}
                    >
                      <option value="customerId">Customer ID</option>
                      <option value="meterId">Meter ID</option>
                      <option value="tariffId">Tariff ID</option>
                      <option value="site">Site</option>
                    </select>
                    <input
                      type="text"
                      className="form-control shadow-none"
                      placeholder="Search accounts..."
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
                  <option value="customerId:asc">Sort by Customer ID (A-Z)</option>
                  <option value="customerId:desc">Sort by Customer ID (Z-A)</option>
                  <option value="meterId:asc">Sort by Meter ID (A-Z)</option>
                  <option value="meterId:desc">Sort by Meter ID (Z-A)</option>
                  <option value="site:asc">Sort by Site (A-Z)</option>
                  <option value="site:desc">Sort by Site (Z-A)</option>
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
                        <th onClick={() => handleSort("meterId")} className="cursor-pointer titleColor">
                          Meter ID {sortField === "meterId" && (
                            <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                          )}
                        </th>
                        <th onClick={() => handleSort("site")} className="cursor-pointer titleColor">
                          Site {sortField === "site" && (
                            <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                          )}
                        </th>
                        <th className="titleColor">Tariff ID</th>
                        <th className="titleColor">Company</th>
                        <th className="titleColor">Remark</th>
                        <th className="titleColor">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accounts.length > 0 ? (
                        accounts.map((account, index) => (
                          <tr key={index}>
                            <td><strong>{account.customerId}</strong></td>
                            <td>{account.meterId}</td>
                            <td>{account.site || "-"}</td>
                            <td>{account.tariffId}</td>
                            <td>{account.company}</td>
                            <td>{account.remark || "-"}</td>
                            <td>
                              <button
                                className="btn btn-sm btn-warning"
                                onClick={() => handleEdit(account)}
                                disabled={loading}
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="text-center text-muted py-4">
                            No accounts found
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
                    {pagination.totalRecords} accounts
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