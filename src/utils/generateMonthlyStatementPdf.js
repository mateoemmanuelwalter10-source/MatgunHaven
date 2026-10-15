import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

function loadImageAsPng(imageUrl) {
  return fetch(imageUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error("The business logo could not be loaded for the PDF.");
      }
      return response.blob();
    })
    .then(
      (blob) =>
        new Promise((resolve, reject) => {
          const objectUrl = URL.createObjectURL(blob);
          const image = new Image();
          image.onload = () => {
            try {
              const canvas = document.createElement("canvas");
              canvas.width = image.naturalWidth;
              canvas.height = image.naturalHeight;
              canvas.getContext("2d").drawImage(image, 0, 0);
              URL.revokeObjectURL(objectUrl);
              resolve(canvas.toDataURL("image/png"));
            } catch (error) {
              URL.revokeObjectURL(objectUrl);
              reject(new Error(`The business logo could not be prepared: ${error.message}`));
            }
          };
          image.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error("The business logo could not be decoded for the PDF."));
          };
          image.src = objectUrl;
        }),
    );
}

function formatPdfDate(dateValue) {
  const date = new Date(`${dateValue.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPdfAmount(value) {
  return `PHP ${(Number(value) || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function safeFilename(value) {
  return value
    .normalize("NFKD")
    .replace(/[^\w-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "customer";
}

export async function generateMonthlyStatementPdf({
  businessName,
  businessTagline,
  logoUrl,
  customerName,
  statementMonth,
  printedDate,
  sales,
  total,
}) {
  if (!customerName) throw new Error("Select a customer before downloading the statement.");
  if (!statementMonth || !printedDate) {
    throw new Error("Choose a valid statement month and printed date.");
  }

  const logoData = await loadImageAsPng(logoUrl);
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "letter",
    compress: true,
  });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 36;
  const contentWidth = pageWidth - margin * 2;
  const [year, month] = statementMonth.split("-").map(Number);
  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("en-PH", {
    month: "long",
    year: "numeric",
  });
  const brandName = businessName || "Matgun Haven";
  const brandFontSize = 20;
  const logoSize = 62;
  const brandGap = 14;
  const maxBrandTextWidth = contentWidth - logoSize - brandGap;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(brandFontSize);
  const brandNameWidth = doc.getTextWidth(brandName);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const taglineWidth = businessTagline ? doc.getTextWidth(businessTagline) : 0;
  const brandTextWidth = Math.min(
    Math.max(brandNameWidth, taglineWidth),
    maxBrandTextWidth,
  );
  const brandGroupWidth = logoSize + brandGap + brandTextWidth;
  const brandLeft = (pageWidth - brandGroupWidth) / 2;

  doc.addImage(logoData, "PNG", brandLeft, 24, logoSize, logoSize, undefined, "FAST");
  doc.setTextColor(23, 43, 77);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(brandFontSize);
  doc.text(brandName, brandLeft + logoSize + brandGap, 52, {
    maxWidth: brandTextWidth,
  });
  if (businessTagline) {
    doc.setTextColor(82, 96, 109);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(businessTagline, brandLeft + logoSize + brandGap, 69, {
      maxWidth: brandTextWidth,
    });
  }
  doc.setDrawColor(36, 59, 83);
  doc.setLineWidth(1.25);
  doc.line(margin, 101, pageWidth - margin, 101);

  doc.setTextColor(23, 43, 77);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("STATEMENT OF ACCOUNTS", pageWidth / 2, 126, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(82, 96, 109);
  doc.text(monthLabel, pageWidth / 2, 142, { align: "center" });

  doc.setDrawColor(203, 210, 217);
  doc.setLineWidth(0.7);
  doc.roundedRect(margin, 157, contentWidth, 34, 3, 3);
  doc.setTextColor(24, 33, 43);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Date:", margin + 10, 178);
  doc.setFont("helvetica", "normal");
  doc.text(printedDate, margin + 40, 178);
  doc.setFont("helvetica", "bold");
  doc.text("Customer:", margin + 220, 178);
  doc.setFont("helvetica", "normal");
  doc.text(customerName, margin + 270, 178, {
    maxWidth: contentWidth - 280,
  });

  const body = sales.length
    ? sales.map((sale) => [
        formatPdfDate(sale.sale_date),
        String(sale.receipt_no ?? "—"),
        String(sale.gallons ?? 0),
        formatPdfAmount(sale.total_amount),
      ])
    : [["—", "—", "—", "No deliveries recorded"]];

  autoTable(doc, {
    startY: 205,
    margin: { left: margin, right: margin, top: 94, bottom: 42 },
    head: [["Date", "Delivery Receipt No.", "Quantity", "Amount"]],
    body,
    foot: [["", "", "TOTAL", formatPdfAmount(total)]],
    showFoot: "lastPage",
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 4,
      textColor: [24, 33, 43],
      lineColor: [174, 184, 194],
      lineWidth: 0.5,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [237, 242, 247],
      textColor: [23, 43, 77],
      fontStyle: "bold",
    },
    footStyles: {
      fillColor: [244, 246, 248],
      textColor: [24, 33, 43],
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 190 },
      2: { cellWidth: 90, halign: "right" },
      3: { cellWidth: "auto", halign: "right" },
    },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) {
        const continuationLogoSize = 42;
        const continuationTextWidth = Math.min(
          doc.getTextWidth(brandName),
          contentWidth - continuationLogoSize - 10,
        );
        const continuationWidth = continuationLogoSize + 10 + continuationTextWidth;
        const continuationLeft = (pageWidth - continuationWidth) / 2;
        doc.addImage(
          logoData,
          "PNG",
          continuationLeft,
          16,
          continuationLogoSize,
          continuationLogoSize,
          undefined,
          "FAST",
        );
        doc.setTextColor(23, 43, 77);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text(brandName, continuationLeft + continuationLogoSize + 10, 42, {
          maxWidth: continuationTextWidth,
        });
        doc.setFont("helvetica", "normal");
        doc.setTextColor(82, 96, 109);
        doc.setFontSize(8);
        doc.text(`Statement of accounts - ${customerName}`, margin, 70);
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(82, 96, 109);
      doc.text(
        `Page ${data.pageNumber}`,
        pageWidth - margin,
        pageHeight - margin,
        { align: "right" },
      );
    },
  });

  doc.save(`Statement-${safeFilename(customerName)}-${statementMonth}.pdf`);
}
