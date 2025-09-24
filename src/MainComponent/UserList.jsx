"use client";
import { useEffect, useState } from "react";

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1); // ✅ page state
  const usersPerPage = 10; // ✅ customers per page

  useEffect(() => {
    fetch("/api/customer-signup-api")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setUsers(data.customers);
      })
      .catch((err) => console.error("Error fetching users:", err))
      .finally(() => setLoading(false));
  }, []);

  // ✅ Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(users.length / usersPerPage);

  return (
    <div className="container mt-5">
      <h3 className="mb-4 text-center">Customer List</h3>

      {/* ✅ Spinner */}
      {loading && (
        <div className="d-flex justify-content-center align-items-center mb-3">
          <div className="spinner-border text-primary me-2" role="status"></div>
          <span className="fw-bold text-muted">Loading customers...</span>
        </div>
      )}

      <div className="table-responsive">
        <table className="table table-bordered table-striped">
          <thead className="table-dark">
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Certifi Name</th>
              <th>Certifi No</th>
              <th>Property Name</th>
              <th>Property Unit</th>
            </tr>
          </thead>
          <tbody>
            {/* ✅ Skeleton */}
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  {Array(9)
                    .fill("")
                    .map((_, j) => (
                      <td key={j}>
                        <div className="placeholder-glow">
                          <span className="placeholder col-8"></span>
                        </div>
                      </td>
                    ))}
                </tr>
              ))
            ) : currentUsers.length > 0 ? (
              currentUsers.map((u, i) => (
                <tr key={u._id}>
                  <td>{indexOfFirstUser + i + 1}</td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.phone}</td>
                  <td>{u.address}</td>
                  <td>{u.certifiName}</td>
                  <td>{u.certifiNo}</td>
                  <td>{u.propertyName?.property_name || "N/A"}</td>
                  <td>
                    {u.propertyUnit
                      ? `${u.propertyUnit.unit_description} - ${u.propertyUnit.blockno}`
                      : "N/A"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="text-center">
                  No customers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <button
            className="btn btn-sm btn-outline-primary"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
          >
            ← Prev
          </button>

          <span className="fw-bold">
            Page {currentPage} of {totalPages}
          </span>

          <button
            className="btn btn-sm btn-outline-primary"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => prev + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
