"use client";
import PaymentForm from "@/MainComponent/PaymentForm";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function CustomerPaymentDashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedToken, setGeneratedToken] = useState(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [viewingToken, setViewingToken] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [tokenHistory, setTokenHistory] = useState([]);
  const [meterInfo, setMeterInfo] = useState(null);
  const [tariffInfo, setTariffInfo] = useState(null);
  const [meterId, setMeterId] = useState(null);
  const [pricePerKg, setPricePerKg] = useState(1500); // Default price

  useEffect(() => {
    // Load price from localStorage
    const savedPrice = localStorage.getItem("pricePerKg");
    if (savedPrice) {
      setPricePerKg(parseFloat(savedPrice));
    }

    // Listen for price updates
    const handlePriceUpdate = () => {
      const updatedPrice = localStorage.getItem("pricePerKg");
      if (updatedPrice) {
        setPricePerKg(parseFloat(updatedPrice));
      }
    };

    window.addEventListener('priceUpdated', handlePriceUpdate);
    return () => {
      window.removeEventListener('priceUpdated', handlePriceUpdate);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (typeof window === "undefined") {
          setLoading(false);
          return;
        }

        const urlEmail = searchParams?.get("email");
        const storedEmail = localStorage.getItem("userEmail");
        const storedId = localStorage.getItem("userId");
        const userEmail = urlEmail || storedEmail;

        if (!userEmail) {
          window.location.href = "/customer-signin";
          return;
        }

        setUser({ email: userEmail, id: storedId });

        const profileRes = await fetch(
          `/api/user/profile?email=${encodeURIComponent(userEmail)}`
        );
        const profileData = await profileRes.json();
        if (profileData.success && profileData.user) {
          if (!storedId) {
            localStorage.setItem("userId", profileData.user.id);
            setUser({ email: profileData.user.email, id: profileData.user.id });
          }
          if (profileData.user.meterId) {
            setMeterId(profileData.user.meterId);
            setMeterInfo({
              customerName: profileData.user.name,
              meterNumber: profileData.user.meterId,
              status: "active",
            });
          }
        }

        await refreshPayments(userEmail);
        await fetchTokenHistory(userEmail);

        const reference =
          searchParams?.get("reference") || searchParams?.get("trxref");
        const paymentSuccess = searchParams?.get("payment_success");

        if (reference && !paymentSuccess) {
          verifyPayment(reference, userEmail);
        } else if (paymentSuccess === "true") {
          const token = localStorage.getItem("lastToken");
          const meter = localStorage.getItem("lastMeter");
          const units = localStorage.getItem("lastUnits");
          const nairaAmount = localStorage.getItem("lastNairaAmount") || localStorage.getItem("lastAmount") || "0";

          if (token && meter) {
            setGeneratedToken({
              token,
              meterNumber: meter,
              units: units || "0",
              reference: searchParams?.get("ref") || "",
              amount: nairaAmount, // Show NAIRA amount
            });
            setShowSuccessModal(true);
          }
        }
      } catch (error) {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    const verifyPayment = async (reference, userEmail) => {
      setVerifyingPayment(true);
      try {
        const response = await fetch(`/api/payments/verify?reference=${reference}`);
        const data = await response.json();

        if (data.status && data.data.status === "success") {
          const meterNumber =
            data.data.metadata?.meterNumber || localStorage.getItem("meterNumber");
          // The amount sent to your API is in dollars, but here we want to show NAIRA
          // Assume you store the naira amount in metadata or localStorage
          const nairaAmount = data.data.metadata?.nairaAmount
            || localStorage.getItem("lastNairaAmount")
            || (data.data.amount / 100); // fallback

          if (!meterNumber) throw new Error("Meter number not found for token generation");

          try {
            const tokenData = await generateVendToken(meterNumber, nairaAmount, reference);

            const tokenInfo = {
              reference,
              token: tokenData.token,
              meterNumber,
              units: tokenData.units || "0",
              amount: nairaAmount, // Show NAIRA amount
              customerEmail: userEmail,
              customerName: data.data.customer?.email || userEmail,
              timestamp: new Date().toISOString(),
            };

            setGeneratedToken(tokenInfo);

            // Store locally for later viewing
            localStorage.setItem("lastToken", tokenData.token);
            localStorage.setItem("lastMeter", meterNumber);
            localStorage.setItem("lastUnits", tokenData.units || "0");
            localStorage.setItem("lastNairaAmount", nairaAmount.toString());

            // Save to DB + push to tokenHistory immediately
            await saveTokenToDatabase(tokenInfo);

            setShowSuccessModal(true);

            // Clean URL
            const newUrl = new URL(window.location);
            newUrl.searchParams.delete("reference");
            newUrl.searchParams.delete("trxref");
            newUrl.searchParams.set("payment_success", "true");
            window.history.replaceState({}, "", newUrl);
          } catch (vendError) {
            console.error("Vend error:", vendError);

            // fallback numeric token
            const fallbackToken = {
              reference,
              token: generateNumericToken(),
              meterNumber,
              units: calculateUnits(nairaAmount, pricePerKg),
              amount: nairaAmount,
              customerEmail: userEmail,
              customerName: data.data.customer?.email || userEmail,
              status: "pending",
            };

            setGeneratedToken(fallbackToken);
            setShowSuccessModal(true);
            setError("Payment successful! Token generation is in progress.");
          }

          // Only refresh payments, not token history (already updated)
          await refreshPayments(userEmail);
        } else {
          setError(data.message || `Payment failed. Status: ${data.data?.status || "unknown"}`);
        }
      } catch (error) {
        console.error("Verification error:", error);
        setError("Payment verification failed. Please try again.");
      } finally {
        setVerifyingPayment(false);
      }
    };

    const generateVendToken = async (meterNumber, nairaAmount, reference) => {
      try {
        const vendResponse = await fetch(
          "http://47.107.69.132:9400/API/Token/CreditToken/Generate",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              meterId: meterNumber,
              amount: nairaAmount,
              authorizationPassword: "Ntk0001@#",
              serialNumber: reference,
              company: "Noretek Energy",
              isVendByTotalPaid: true,
              isPreview: false,
            }),
          }
        );

        if (vendResponse.ok) {
          const vendData = await vendResponse.json();
          if (vendData.result && vendData.result.token) {
            return {
              token: vendData.result.token,
              units: vendData.result.totalUnit,
            };
          }
        }

        const vendResponse2 = await fetch(
          "http://47.107.69.132:9400/API/Token/CreditToken/GenerateS2",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              meterId: meterNumber,
              amount: nairaAmount,
              authorizationPassword: "Ntk0001@#",
              serialNumber: reference,
              company: "Noretek Energy",
              isVendByTotalPaid: true,
              isPreview: false,
            }),
          }
        );

        if (vendResponse2.ok) {
          const vendData2 = await vendResponse2.json();
          if (vendData2.result && vendData2.result.token) {
            return {
              token: vendData2.result.token,
              units: vendData2.result.totalUnit,
            };
          }
        }

        throw new Error("Both vend API endpoints failed");
      } catch (error) {
        throw error;
      }
    };

    const generateNumericToken = () => {
      let token = "";
      for (let i = 0; i < 20; i++) token += Math.floor(Math.random() * 10);
      return token;
    };

    const calculateUnits = (amount, pricePerKg) => (amount / pricePerKg).toFixed(2);

    const saveTokenToDatabase = async (tokenInfo) => {
      try {
        const response = await fetch("/api/tokens/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tokenInfo),
        });

        if (!response.ok) {
          console.error("Failed to save token");
          return;
        }

        const result = await response.json();

        if (result.success && result.token) {
          setTokenHistory((prev) => [result.token, ...prev]);
          console.log("Token saved & added to history:", result.token);
        }
      } catch (error) {
        console.error("Error saving token:", error);
      }
    };

    const refreshPayments = async (email) => {
      try {
        const response = await fetch(
          `/api/payments/history?email=${encodeURIComponent(email)}`
        );
        if (response.ok) {
          const data = await response.json();
          setPayments(data.payments || []);
        }
      } catch (error) {
        console.error("Error refreshing payments:", error);
      }
    };

    const fetchTokenHistory = async (email) => {
      try {
        const response = await fetch(
          `/api/tokens/history?email=${encodeURIComponent(email)}`
        );
        if (response.ok) {
          const data = await response.json();
          setTokenHistory(data.tokens || []);
        }
      } catch (error) {
        console.error("Error fetching token history:", error);
      }
    };

    fetchData();
  }, [searchParams, pricePerKg]);

  const formatToken = (token) => {
    if (!token) return "N/A";
    const numericToken = token.replace(/\D/g, "").substring(0, 20);
    const paddedToken = numericToken.padEnd(20, "0");
    return paddedToken.replace(
      /(\d{4})(\d{4})(\d{4})(\d{4})(\d{4})/,
      "$1 $2 $3 $4 $5"
    );
  };

  if (loading || verifyingPayment) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">
          {verifyingPayment
            ? "Processing your payment and generating token..."
            : "Loading your dashboard..."}
        </p>
      </div>
    );
  }

  return (
    <div className="container py-5">
      {showSuccessModal && generatedToken && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title">
                  <i className="fas fa-check-circle me-2"></i>
                  Payment Successful!
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowSuccessModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="receipt p-4 border rounded">
                  <div className="text-center mb-4">
                    <h3 className="text-primary fw-bold">Noretek Energy</h3>
                    <h5 className="text-dark">GAS TOKEN RECEIPT</h5>
                  </div>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <p>
                        <strong>Customer:</strong>{" "}
                        {meterInfo?.customerName ||
                          generatedToken.customerName ||
                          user?.email}
                      </p>
                    </div>
                    <div className="col-md-6">
                      <p>
                        <strong>Meter Number:</strong>{" "}
                        {generatedToken.meterNumber}
                      </p>
                    </div>
                  </div>
                  <div className="bg-dark text-light p-4 rounded text-center mb-4">
                    <h6 className="mb-2 text-warning">YOUR GAS TOKEN</h6>
                    <h2 className="display-5 font-monospace text-white mb-0">
                      {formatToken(generatedToken.token)}
                    </h2>
                  </div>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <p>
                        <strong>Amount Paid:</strong> ₦{generatedToken.amount}
                      </p>
                    </div>
                    <div className="col-md-6">
                      <p>
                        <strong>Units Purchased:</strong> {generatedToken.units} KG
                      </p>
                    </div>
                  </div>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <p>
                        <strong>Price per KG:</strong> ₦{pricePerKg}
                      </p>
                    </div>
                    <div className="col-md-6">
                      <p>
                        <strong>Reference:</strong> {generatedToken.reference}
                      </p>
                    </div>
                  </div>
                  <div className="alert alert-info mt-4">
                    <h6 className="mb-2">How to use your token:</h6>
                    <ol className="mb-0 small">
                      <li>Press the 'Enter' button on your meter</li>
                      <li>Enter the 20-digit token when prompted</li>
                      <li>Press 'Enter' again to confirm</li>
                      <li>Wait for the meter to validate and load the units</li>
                    </ol>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-outline-primary"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      generatedToken.token.replace(/\s/g, "")
                    );
                    alert("Token copied to clipboard!");
                  }}
                >
                  <i className="fas fa-copy me-2"></i>Copy Token
                </button>
                <button className="btn btn-primary" onClick={() => window.print()}>
                  <i className="fas fa-print me-2"></i>Print Receipt
                </button>
                <button
                  className="btn btn-success"
                  onClick={() => setShowSuccessModal(false)}
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewingToken && generatedToken && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-info text-white">
                <h5 className="modal-title">
                  <i className="fas fa-key me-2"></i>
                  Purchased Token
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setViewingToken(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="receipt p-4 border rounded">
                  <div className="text-center mb-4">
                    <h3 className="text-primary fw-bold">Noretek Energy</h3>
                    <h5 className="text-dark">GAS TOKEN RECEIPT</h5>
                  </div>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <p>
                        <strong>Customer:</strong>{" "}
                        {meterInfo?.customerName ||
                          generatedToken.customerName ||
                          user?.email}
                      </p>
                      <p>
                        <strong>Reference:</strong> {generatedToken.reference}
                      </p>
                    </div>
                    <div className="col-md-6">
                      <p>
                        <strong>Meter Number:</strong>{" "}
                        {generatedToken.meterNumber}
                      </p>
                      <p>
                        <strong>Purchase Date:</strong>{" "}
                        {selectedPayment?.created_at
                          ? new Date(
                              selectedPayment.created_at
                            ).toLocaleDateString()
                          : new Date().toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="bg-dark text-light p-4 rounded text-center mb-4">
                    <h6 className="mb-2 text-warning">YOUR GAS TOKEN</h6>
                    <h2 className="display-5 font-monospace text-white mb-0">
                      {formatToken(generatedToken.token)}
                    </h2>
                  </div>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <p>
                        <strong>Amount Paid:</strong> ₦{generatedToken.amount}
                      </p>
                    </div>
                    <div className="col-md-6">
                      <p>
                        <strong>Units Purchased:</strong> {generatedToken.units} KG
                      </p>
                    </div>
                  </div>
                  <div className="alert alert-info mt-4">
                    <h6 className="mb-2">How to use your token:</h6>
                    <ol className="mb-0 small">
                      <li>Press the 'Enter' button on your meter</li>
                      <li>Enter the 20-digit token when prompted</li>
                      <li>Press 'Enter' again to confirm</li>
                      <li>Wait for the meter to validate and load the units</li>
                    </ol>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-outline-primary"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      generatedToken.token.replace(/\s/g, "")
                    );
                    alert("Token copied to clipboard!");
                  }}
                >
                  <i className="fas fa-copy me-2"></i>Copy Token
                </button>
                <button className="btn btn-primary" onClick={() => window.print()}>
                  <i className="fas fa-print me-2"></i>Print Receipt
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setViewingToken(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="row mb-4">
        <div className="col">
          <button
            className="btn btn-outline-primary mb-3"
            onClick={() => router.push("/customer_dashboard")}
          >
            <i className="fas fa-arrow-left me-2"></i>Back to Dashboard
          </button>
          <h2 className="h4 text-primary">GAS Token Purchase</h2>
          <p className="text-muted h5">Welcome back, {user?.email}</p>
          <div className="alert alert-info d-flex align-items-center">
            <i className="fas fa-info-circle me-2"></i>
            <div>
              <strong>Current Price:</strong> ₦{pricePerKg} per KG
              <br />
              <small>Example: ₦{pricePerKg} = 1.0 KG, ₦{(pricePerKg * 1.5).toFixed(2)} = 1.5 KG</small>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div
          className="alert alert-danger alert-dismissible fade show mb-4"
          role="alert"
        >
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError("")}
          ></button>
        </div>
      )}

      {meterInfo && (
        <div className="card mb-4">
          <div className="card-header bg-info text-white">
            <h5 className="mb-0">
              <i className="fas fa-info-circle me-2"></i>
              Meter Information
            </h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <p>
                  <strong>Customer Name:</strong> {meterInfo.customerName}
                </p>
                <p>
                  <strong>Meter Number:</strong> {meterInfo.meterNumber}
                </p>
              </div>
              <div className="col-md-6">
                <p>
                  <strong>Email:</strong> {meterInfo.userEmail || user?.email}
                </p>
                <p>
                  <strong>Status:</strong>
                  <span
                    className={`badge ${
                      meterInfo.status === "active"
                        ? "bg-success"
                        : "bg-warning"
                    } ms-2`}
                  >
                    {meterInfo.status}
                  </span>
                </p>
              </div>
            </div>
            <div className="mt-3 p-3 bg-light rounded">
              <h6>Pricing Information</h6>
              <p className="mb-1">
                <strong>Price per KG:</strong> ₦{pricePerKg}
              </p>
              <p className="mb-0">
                <strong>Calculation:</strong> Amount (₦) / {pricePerKg} = Units (KG)
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="row mb-5">
        <div className="col-md-6">
          <PaymentForm
            userEmail={user?.email}
            userId={user?.id}
            presetMeter={meterId}
            pricePerKg={pricePerKg}
            // You should update PaymentForm to accept/display nairaAmount for user
          />
        </div>
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <i className="fas fa-history me-2"></i> Payment History
              </h5>
            </div>
            <div className="card-body">
              {payments.length === 0 ? (
                <div className="alert alert-info">No payments yet.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped table-hover">
                    <thead className="table-primary">
                      <tr>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p.id}>
                          <td>
                            {new Date(p.created_at).toLocaleDateString()}
                          </td>
                          <td>₦{p.nairaAmount || p.amount}</td>
                          <td>{p.status}</td>
                          <td>{p.reference}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-5">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-info text-white">
              <h5 className="mb-0">
                <i className="fas fa-key me-2"></i>
                Token History
              </h5>
            </div>
            <div className="card-body">
              {tokenHistory.length === 0 ? (
                <div className="alert alert-info">
                  No token history yet. Purchase tokens to see them here!
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped table-hover">
                    <thead className="table-info">
                      <tr>
                        <th>Date</th>
                        <th>Meter Number</th>
                        <th>Token</th>
                        <th>Units (KG)</th>
                        <th>Amount</th>
                        <th>Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tokenHistory.map((token) => (
                        <tr key={token._id || token.reference}>
                          <td>
                            {new Date(
                              token.timestamp || token.createdAt
                            ).toLocaleDateString()}
                          </td>
                          <td>{token.meterNumber}</td>
                          <td className="font-monospace small">
                            {formatToken(token.token)}
                          </td>
                          <td>{token.units} KG</td>
                          <td>₦{token.amount}</td>
                          <td className="small text-muted">
                            {token.reference}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      />
    </div>
  );
}

export default function CustomerPaymentDashboard() {
  return (
    <Suspense
      fallback={
        <div className="container py-5 text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading payment dashboard...</p>
        </div>
      }
    >
      <CustomerPaymentDashboardContent />
    </Suspense>
  );
}