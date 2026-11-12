import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { parsePositiveId } from "../utils/parseId.js";
import {
  getStudentCertificates,
  normalizeCertificateCode,
  verifyCertificateCode,
} from "../services/certificate.service.js";
import {
  buildCertificatePdf,
  certificateVerifyUrl,
} from "../services/certificatePdf.service.js";
import { findCertificateByIdForStudent } from "../models/certificate.model.js";

export const getMyCertificates = asyncHandler(async (req, res) => {
  const certificates = await getStudentCertificates(req.user.id);

  res.status(200).json({
    success: true,
    message: "Your certificates",
    data: {
      certificates,
      summary: {
        total: certificates.length,
        latestIssuedAt: certificates[0]?.issuedAt ?? null,
      },
    },
  });
});

export const verifyCertificate = asyncHandler(async (req, res) => {
  if (!normalizeCertificateCode(req.params.code)) {
    throw ApiError.badRequest(
      "Enter a valid certificate code, for example KDW-1A2B3C4D5E6F7A8B."
    );
  }

  const certificate = await verifyCertificateCode(req.params.code);

  if (!certificate) {
    throw ApiError.notFound(
      "No certificate matches this code. Check the code and try again."
    );
  }

  res.status(200).json({
    success: true,
    message: "Certificate verified.",
    data: { certificate },
  });
});

function sendCertificatePdf(res, pdf, code) {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="kodewar-certificate-${code}.pdf"`
  );
  res.setHeader("Content-Length", pdf.length);
  res.status(200).end(pdf);
}

export const downloadMyCertificate = asyncHandler(async (req, res) => {
  const certificateId = parsePositiveId(
    req.params.certificateId,
    "Certificate ID"
  );

  const certificate = await findCertificateByIdForStudent(
    req.user.id,
    certificateId
  );

  if (!certificate) {
    throw ApiError.notFound("This certificate could not be found.");
  }

  const pdf = await buildCertificatePdf({
    recipientName: req.user.fullName,
    course: certificate.course,
    code: certificate.code,
    issuedAt: certificate.issuedAt,
    verifyUrl: certificateVerifyUrl(certificate.code),
  });

  sendCertificatePdf(res, pdf, certificate.code);
});

export const downloadVerifiedCertificate = asyncHandler(async (req, res) => {
  if (!normalizeCertificateCode(req.params.code)) {
    throw ApiError.badRequest(
      "Enter a valid certificate code, for example KDW-1A2B3C4D5E6F7A8B."
    );
  }

  const certificate = await verifyCertificateCode(req.params.code);

  if (!certificate) {
    throw ApiError.notFound(
      "No certificate matches this code. Check the code and try again."
    );
  }

  const pdf = await buildCertificatePdf({
    recipientName: certificate.recipientName,
    course: certificate.course,
    code: certificate.code,
    issuedAt: certificate.issuedAt,
    verifyUrl: certificateVerifyUrl(certificate.code),
  });

  sendCertificatePdf(res, pdf, certificate.code);
});
