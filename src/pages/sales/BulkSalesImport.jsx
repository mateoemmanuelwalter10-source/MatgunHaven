import { useState } from "react";
import {
  bulkCreateSales,
  fetchExistingReceiptNumbers,
} from "../../services/salesService";
import { fetchCustomers } from "../../services/customerService";
import { logSystemError } from "../../services/systemLogService";
import { parseSalesFile } from "../../utils/salesWorkbook";
import Loader from "../../components/common/Loader";

const resultPageSize = 15;

function ResultRowsTable({ rows, page, onPageChange }) {
  const pageCount = Math.max(1, Math.ceil(rows.length / resultPageSize));
  const pageRows = rows.slice(
    (page - 1) * resultPageSize,
    page * resultPageSize,
  );

  return (
    <>
      <div className="bulk-result-table-scroll">
        <table>
          <thead>
            <tr>
              <th>Worksheet / row</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Receipt</th>
              <th>Quantity</th>
              <th>Amount</th>
              <th>Status / reason</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr key={`${row.worksheet}-${row.rowNumber}`}>
                <td>{row.worksheet} / {row.rowNumber}</td>
                <td>{row.customerName || "—"}</td>
                <td>{row.saleDate || "—"}</td>
                <td>{row.receiptNumber ?? "—"}</td>
                <td>{row.quantity ?? "—"}</td>
                <td>{row.amount ?? "—"}</td>
                <td>
                  <strong>{row.status === "invalid" ? "Invalid" : "Skipped"}:</strong>{" "}
                  {row.reasons.join(" ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bulk-result-pagination">
        <button
          type="button"
          className="ghost-button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Previous
        </button>
        <span>
          Page {page} of {pageCount} · {rows.length} rows
        </span>
        <button
          type="button"
          className="ghost-button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
        >
          Next
        </button>
      </div>
    </>
  );
}

export default function BulkSalesImport() {
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [skippedSheets, setSkippedSheets] = useState([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState("progress");
  const [uploadProgress, setUploadProgress] = useState({ inserted: 0, total: 0 });
  const [uploadError, setUploadError] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [resultPage, setResultPage] = useState(1);
  const [detailsPage, setDetailsPage] = useState(1);
  const [error, setError] = useState("");

  const validRows = rows.filter((row) => row.status === "ready");
  const invalidRows = rows.filter((row) => row.status === "invalid");
  const skippedRows = rows.filter((row) => row.status === "skipped");
  const resultRows = rows.filter(
    (row) => row.status === "invalid" || row.status === "skipped",
  );

  async function handlePreview() {
    if (!file) {
      setError("Choose an .xlsx or .csv file first.");
      return;
    }

    setLoadingPreview(true);
    setRows([]);
    setSkippedSheets([]);
    setError("");

    try {
      const [customersResult, receiptsResult] = await Promise.all([
        fetchCustomers(),
        fetchExistingReceiptNumbers(),
      ]);

      if (customersResult.error) throw customersResult.error;
      if (receiptsResult.error) throw receiptsResult.error;

      const preview = await parseSalesFile(
        file,
        customersResult.data || [],
        receiptsResult.data,
      );
      setRows(preview.rows);
      setSkippedSheets(preview.skippedSheets);

      if (preview.rows.length === 0) {
        setError("No delivery rows were found. Check the column headings and file contents.");
      }
    } catch (previewError) {
      await logSystemError("preview_sales_import", previewError, {
        entityType: "sales_import",
      });
      setError(`Could not read the file: ${previewError.message}`);
    } finally {
      setLoadingPreview(false);
    }
  }

  async function handleImport() {
    if (validRows.length === 0) return;
    if (
      !window.confirm(
        `Upload ${validRows.length} valid deliveries? Invalid rows and duplicate receipts will not be uploaded.`,
      )
    ) {
      return;
    }

    const salesToUpload = validRows;
    setUploading(true);
    setUploadStage("progress");
    setUploadProgress({ inserted: 0, total: salesToUpload.length });
    setUploadError("");
    setShowDetails(false);
    setUploadStage("progress");

    try {
      const result = await bulkCreateSales(
        salesToUpload.map((row) => row.sale),
        (inserted, total) => setUploadProgress({ inserted, total }),
      );

      setRows((currentRows) => {
        let insertedIndex = 0;
        return currentRows.map((row) => {
          if (row.status !== "ready") return row;
          if (insertedIndex < result.inserted) {
            insertedIndex += 1;
            return { ...row, valid: false, status: "inserted", reasons: [] };
          }

          const uploadReason =
            result.error && insertedIndex === result.inserted
              ? `Upload failed: ${result.error.message}`
              : result.error
                ? "Not uploaded because an earlier batch failed."
                : "Not uploaded.";
          insertedIndex += 1;
          return {
            ...row,
            valid: false,
            status: "skipped",
            reasons: [uploadReason],
          };
        });
      });

      if (result.error) {
        setUploadError(
          `Upload stopped after ${result.inserted} successful deliveries: ${result.error.message}`,
        );
      }
      setUploadProgress({
        inserted: result.inserted,
        total: salesToUpload.length,
      });
    } catch (uploadError) {
      setUploadError(`Could not complete the upload: ${uploadError.message}`);
      setRows((currentRows) =>
        currentRows.map((row) =>
          row.status === "ready"
            ? {
                ...row,
                valid: false,
                status: "skipped",
                reasons: [`Upload failed: ${uploadError.message}`],
              }
            : row,
        ),
      );
    } finally {
      setUploading(false);
      setUploadStage("results");
      setResultPage(1);
      setDetailsPage(1);
    }
  }

  function renderResultTable(page, onPageChange) {
    return (
      <ResultRowsTable
        rows={resultRows}
        page={page}
        onPageChange={onPageChange}
      />
    );
  }

  return (
    <section className="page-section">
      <div className="section-header">
        <div>
          <p className="eyebrow">Admin tools</p>
          <h1>Bulk sales import</h1>
          <p>Preview and upload delivery records from an Excel workbook or CSV file.</p>
        </div>
      </div>

      <div className="form-card">
        <p>
          Use one row per delivery with Customer, Delivery Date, Receipt Number,
          Quantity, and Amount columns. Customer names must match the names in
          the customer list. CSV is recommended for a single flat data sheet.
        </p>
        <div className="form-field">
          <label htmlFor="sales-workbook">Excel workbook or CSV (.xlsx, .csv)</label>
          <input
            id="sales-workbook"
            type="file"
            accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            onChange={(event) => {
              setFile(event.target.files?.[0] || null);
              setRows([]);
              setSkippedSheets([]);
              setError("");
            }}
          />
        </div>
        <div className="form-actions">
          <button
            type="button"
            className="primary-button"
            onClick={handlePreview}
            disabled={!file || loadingPreview || uploading}
          >
            {loadingPreview ? <Loader label="Reading file..." /> : "Preview file"}
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={handleImport}
            disabled={validRows.length === 0 || uploading || loadingPreview}
          >
            Upload {validRows.length} valid rows
          </button>
        </div>
        {error && <div className="error-message">{error}</div>}
      </div>

      {rows.length > 0 && (
        <div className="table-card bulk-import-preview">
          <div className="bulk-import-summary">
            <strong>{validRows.length} ready to upload</strong>
            <span>{invalidRows.length} invalid</span>
            <span>{skippedRows.length} skipped</span>
          </div>
          {skippedSheets.length > 0 && (
            <p className="error-message">
              No delivery table was recognized in: {skippedSheets.join(", ")}.
            </p>
          )}
          <div className="bulk-result-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Worksheet / row</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Receipt</th>
                  <th>Quantity</th>
                  <th>Amount</th>
                  <th>Import status</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 200).map((row) => (
                  <tr key={`${row.worksheet}-${row.rowNumber}`}>
                    <td>{row.worksheet} / {row.rowNumber}</td>
                    <td>{row.customerName || "—"}</td>
                    <td>{row.saleDate || "—"}</td>
                    <td>{row.receiptNumber ?? "—"}</td>
                    <td>{row.quantity ?? "—"}</td>
                    <td>{row.amount ?? "—"}</td>
                    <td>{row.status === "ready" ? "Ready" : row.reasons.join(" ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > 200 && <p>Showing first 200 of {rows.length} rows.</p>}
        </div>
      )}

      {(uploading || uploadStage === "results") && (
        <div className="bulk-modal-backdrop">
          <section
            className={`bulk-modal${uploadStage === "results" ? " bulk-results-modal" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="bulk-modal-title"
          >
            {uploadStage === "progress" ? (
              <>
                <h2 id="bulk-modal-title">Uploading deliveries</h2>
                <Loader label="Saving delivery batches..." />
                <p>
                  {uploadProgress.inserted} of {uploadProgress.total} deliveries uploaded
                </p>
                <div
                  className="bulk-progress-track"
                  role="progressbar"
                  aria-valuemin="0"
                  aria-valuemax={uploadProgress.total}
                  aria-valuenow={uploadProgress.inserted}
                  aria-label="Upload progress"
                >
                  <div
                    className="bulk-progress-value"
                    style={{
                      width: `${
                        uploadProgress.total
                          ? (uploadProgress.inserted / uploadProgress.total) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </>
            ) : (
              <>
                <button
                  className="bulk-modal-close"
                  type="button"
                  onClick={() => setUploadStage("closed")}
                  aria-label="Close upload results"
                >
                  ×
                </button>
                <h2 id="bulk-modal-title">Upload results</h2>
                <div className="bulk-result-counts">
                  <div><span>Inserted</span><strong>{rows.filter((row) => row.status === "inserted").length}</strong></div>
                  <div><span>Invalid</span><strong>{invalidRows.length}</strong></div>
                  <div><span>Skipped</span><strong>{skippedRows.length}</strong></div>
                </div>
                {uploadError && <p className="error-message">{uploadError}</p>}
                {resultRows.length > 0 ? (
                  <>
                    <button
                      className="primary-button bulk-details-open"
                      type="button"
                      onClick={() => setShowDetails(true)}
                    >
                      View invalid and skipped rows ({resultRows.length})
                    </button>
                    <div className="bulk-results-inline">
                      <h3>Invalid and skipped rows</h3>
                      {renderResultTable(resultPage, setResultPage)}
                    </div>
                  </>
                ) : (
                  <p>All delivery rows were uploaded successfully.</p>
                )}
              </>
            )}
          </section>
        </div>
      )}

      {showDetails && (
        <div className="bulk-modal-backdrop bulk-details-backdrop">
          <section
            className="bulk-modal bulk-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bulk-details-title"
          >
            <button
              className="bulk-modal-close"
              type="button"
              onClick={() => setShowDetails(false)}
              aria-label="Close row details"
            >
              ×
            </button>
            <h2 id="bulk-details-title">Invalid and skipped rows</h2>
            {renderResultTable(detailsPage, setDetailsPage)}
          </section>
        </div>
      )}
    </section>
  );
}
