import fs from "node:fs";
import PDFDocument from "pdfkit";
import { env } from "../config/env.js";

/**
 * Builds a one-page landscape A4 certificate PDF.
 *
 * Fonts are discovered at run time so Unicode names render correctly when a
 * normal system font is available. If none is found, the standard PDF fonts
 * are used and unsupported characters are replaced instead of failing the
 * download.
 */

const FONT_PATHS = {
  regular: [
    "C:\\Windows\\Fonts\\segoeui.ttf",
    "C:\\Windows\\Fonts\\arial.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
  ],
  bold: [
    "C:\\Windows\\Fonts\\segoeuib.ttf",
    "C:\\Windows\\Fonts\\arialbd.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
  ],
};

function findFont(candidates) {
  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

const REGULAR_FONT = findFont(FONT_PATHS.regular);
const BOLD_FONT = findFont(FONT_PATHS.bold);

function safeText(value) {
  const text = String(value ?? "");

  if (REGULAR_FONT && BOLD_FONT) return text;

  // Standard PDF fonts only cover the WinAnsi character set.
  return text.replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");
}

function formatIssuedAt(value) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function buildCertificatePdf({
  recipientName,
  course,
  code,
  issuedAt,
  verifyUrl,
}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 0,
      info: {
        Title: `Kodewar certificate ${code}`,
        Author: "Kodewar LMS",
        Subject: course?.title || "Certificate of completion",
      },
    });

    if (REGULAR_FONT) doc.registerFont("CertificateRegular", REGULAR_FONT);
    if (BOLD_FONT) doc.registerFont("CertificateBold", BOLD_FONT);

    const regular = REGULAR_FONT ? "CertificateRegular" : "Helvetica";
    const bold = BOLD_FONT ? "CertificateBold" : "Helvetica-Bold";

    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    function centered(text, y, options = {}) {
      const {
        font = regular,
        size = 12,
        color = "#475569",
        width = pageWidth - 120,
        characterSpacing = 0,
      } = options;

      doc
        .font(font)
        .fontSize(size)
        .fillColor(color)
        .text(safeText(text), 60, y, {
          width,
          align: "center",
          characterSpacing,
          lineBreak: false,
        });
    }

    // Page background and decorative bands.
    doc.rect(0, 0, pageWidth, pageHeight).fill("#ffffff");
    doc.rect(0, 0, pageWidth, 8).fill("#4f46e5");
    doc.rect(0, 8, pageWidth / 2, 4).fill("#06b6d4");
    doc.rect(pageWidth / 2, 8, pageWidth / 2, 4).fill("#10b981");

    // Double border.
    doc
      .rect(28, 28, pageWidth - 56, pageHeight - 56)
      .lineWidth(1.5)
      .strokeColor("#c7d2fe")
      .stroke();
    doc
      .rect(36, 36, pageWidth - 72, pageHeight - 72)
      .lineWidth(0.7)
      .strokeColor("#e0e7ff")
      .stroke();

    centered("KODEWAR LMS", 58, {
      font: bold,
      size: 11,
      color: "#4338ca",
      characterSpacing: 4,
    });

    centered("CERTIFICATE OF COMPLETION", 82, {
      font: bold,
      size: 27,
      color: "#111827",
      characterSpacing: 1.2,
    });

    doc
      .moveTo(pageWidth / 2 - 60, 126)
      .lineTo(pageWidth / 2 + 60, 126)
      .lineWidth(2)
      .strokeColor("#06b6d4")
      .stroke();

    centered("This certifies that", 140, { size: 11.5, color: "#64748b" });

    centered(recipientName, 162, {
      font: bold,
      size: 28,
      color: "#0f172a",
      width: pageWidth - 160,
    });

    doc
      .moveTo(pageWidth / 2 - 130, 208)
      .lineTo(pageWidth / 2 + 130, 208)
      .lineWidth(0.8)
      .strokeColor("#cbd5e1")
      .stroke();

    centered("has successfully completed", 222, {
      size: 11.5,
      color: "#64748b",
    });

    centered(course?.title || "Course", 244, {
      font: bold,
      size: 20,
      color: "#3730a3",
      width: pageWidth - 160,
    });

    const columns = [
      ["CATEGORY", course?.category || "General"],
      ["LEVEL", course?.level || "Beginner"],
      ["ISSUED", formatIssuedAt(issuedAt)],
    ];

    const columnWidth = (pageWidth - 200) / columns.length;
    const startX = 100;

    columns.forEach(([label, value], index) => {
      const x = startX + columnWidth * index;

      doc
        .font(bold)
        .fontSize(8.5)
        .fillColor("#94a3b8")
        .text(label, x, 300, {
          width: columnWidth,
          align: "center",
          characterSpacing: 1.4,
        });

      doc
        .font(regular)
        .fontSize(12)
        .fillColor("#334155")
        .text(safeText(value), x, 316, {
          width: columnWidth,
          align: "center",
          lineBreak: false,
        });
    });

    centered(`Certificate code  ${code}`, 392, {
      font: bold,
      size: 10.5,
      color: "#0e7490",
      characterSpacing: 1.1,
    });

    if (verifyUrl) {
      centered(`Verify this certificate at ${verifyUrl}`, 412, {
        size: 9,
        color: "#64748b",
      });
    }

    centered(
      "Issued by Kodewar LMS after every required lesson, assessment and assignment in the course was completed.",
      500,
      {
        size: 8.5,
        color: "#94a3b8",
        width: pageWidth - 180,
      }
    );

    doc.end();
  });
}

export function certificateVerifyUrl(code) {
  return `${env.clientUrl.replace(/\/$/, "")}/verify/${encodeURIComponent(code)}`;
}
