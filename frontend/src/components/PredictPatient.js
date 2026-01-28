import React, { useState } from "react";
import "../css/Predict.css";

function PredictPatient() {
  const [patientId, setPatientId] = useState("");
  const [result, setResult] = useState(null);

  const handlePredict = () => {
    if (!patientId) {
      alert("Please enter a Patient ID");
      return;
    }

    fetch(`http://127.0.0.1:8000/api/predict/${patientId}/`)
      .then((response) => response.json())
      .then((data) => setResult(data))
      .catch((error) => {
        console.error("Error:", error);
        setResult({ error: "Failed to fetch prediction" });
      });
  };

  return (
    <div className="predict-container">
      <input
        type="number"
        placeholder="Enter Patient ID"
        value={patientId}
        onChange={(e) => setPatientId(e.target.value)}
        className="predict-input"
      />
      <button onClick={handlePredict} className="predict-button">
        Predict
      </button>

      {result && (
        <div className="predict-result">
          {result.error ? (
            <p className="error">{result.error}</p>
          ) : (
            <p>
              <strong>Patient:</strong> {result.patient} <br />
              <strong>Predicted Risk:</strong> {result.risk}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default PredictPatient;
