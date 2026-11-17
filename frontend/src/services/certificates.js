import { apiRequest, downloadRequest } from "./api.js";

export function getMyCertificatesRequest() {
  return apiRequest("/certificates");
}

export function getCertificateVerificationRequest(code) {
  return apiRequest(`/certificates/verify/${encodeURIComponent(code)}`);
}

export function downloadMyCertificateRequest(certificateId) {
  return downloadRequest(
    `/certificates/${encodeURIComponent(certificateId)}/download`,
    `kodewar-certificate-${certificateId}.pdf`
  );
}

export function downloadVerifiedCertificateRequest(code) {
  return downloadRequest(
    `/certificates/verify/${encodeURIComponent(code)}/download`,
    `kodewar-certificate-${code}.pdf`
  );
}
