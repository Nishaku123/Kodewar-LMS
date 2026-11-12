import { Routes, Route } from "react-router-dom";
import Foundation from "./pages/Foundation.jsx";
import DesignSystem from "./pages/DesignSystem.jsx";
import AuthLayoutPreview from "./pages/AuthLayoutPreview.jsx";
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";
import ForgotPassword from "./pages/auth/ForgotPassword.jsx";
import ResetPassword from "./pages/auth/ResetPassword.jsx";
import StudentDashboard from "./pages/student/StudentDashboard.jsx";
import StudentCourses from "./pages/student/StudentCourses.jsx";
import StudentCourseDetail from "./pages/student/StudentCourseDetail.jsx";
import StudentAssessments from "./pages/student/StudentAssessments.jsx";
import StudentAssessmentDetail from "./pages/student/StudentAssessmentDetail.jsx";
import StudentAssignments from "./pages/student/StudentAssignments.jsx";
import StudentAssignmentDetail from "./pages/student/StudentAssignmentDetail.jsx";
import StudentCertificates from "./pages/student/StudentCertificates.jsx";
import StaffHome from "./pages/staff/StaffHome.jsx";
import StaffCourses from "./pages/staff/StaffCourses.jsx";
import StaffCourseDetail from "./pages/staff/StaffCourseDetail.jsx";
import StaffAssessment from "./pages/staff/StaffAssessment.jsx";
import StaffAssignment from "./pages/staff/StaffAssignment.jsx";
import StaffStudents from "./pages/staff/StaffStudents.jsx";
import StaffUsers from "./pages/staff/StaffUsers.jsx";
import Account from "./pages/Account.jsx";
import CertificateVerify from "./pages/CertificateVerify.jsx";
import NotFound from "./pages/NotFound.jsx";
import ProtectedRoute from "./components/auth/ProtectedRoute.jsx";
import PublicOnlyRoute from "./components/auth/PublicOnlyRoute.jsx";

/**
 * Every page is registered here.
 * Public pages sit at the top; signed-in pages are wrapped in ProtectedRoute.
 */
export default function App() {
  return (
    <Routes>
      {/* Public pages */}
      <Route path="/" element={<Foundation />} />
      <Route path="/design" element={<DesignSystem />} />
      <Route path="/design/auth" element={<AuthLayoutPreview />} />
      <Route path="/verify" element={<CertificateVerify />} />
      <Route path="/verify/:code" element={<CertificateVerify />} />

      {/* Authentication */}
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <Register />
          </PublicOnlyRoute>
        }
      />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Student panel */}
      <Route
        path="/student"
        element={
          <ProtectedRoute roles={["student"]}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/courses"
        element={
          <ProtectedRoute roles={["student"]}>
            <StudentCourses />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/courses/:courseId"
        element={
          <ProtectedRoute roles={["student"]}>
            <StudentCourseDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/assessments"
        element={
          <ProtectedRoute roles={["student"]}>
            <StudentAssessments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/assessments/:assessmentId"
        element={
          <ProtectedRoute roles={["student"]}>
            <StudentAssessmentDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/assignments"
        element={
          <ProtectedRoute roles={["student"]}>
            <StudentAssignments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/assignments/:assignmentId"
        element={
          <ProtectedRoute roles={["student"]}>
            <StudentAssignmentDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/certificates"
        element={
          <ProtectedRoute roles={["student"]}>
            <StudentCertificates />
          </ProtectedRoute>
        }
      />

      {/* Staff panel for trainer and admin */}
      <Route
        path="/staff"
        element={
          <ProtectedRoute roles={["trainer", "admin"]}>
            <StaffHome />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/courses"
        element={
          <ProtectedRoute roles={["trainer", "admin"]}>
            <StaffCourses />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/courses/:courseId"
        element={
          <ProtectedRoute roles={["trainer", "admin"]}>
            <StaffCourseDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/assessments/:assessmentId"
        element={
          <ProtectedRoute roles={["trainer", "admin"]}>
            <StaffAssessment />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/assignments/:assignmentId"
        element={
          <ProtectedRoute roles={["trainer", "admin"]}>
            <StaffAssignment />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/students"
        element={
          <ProtectedRoute roles={["trainer", "admin"]}>
            <StaffStudents />
          </ProtectedRoute>
        }
      />

      {/* Administrator-only user access management */}
      <Route
        path="/staff/users"
        element={
          <ProtectedRoute roles={["admin"]}>
            <StaffUsers />
          </ProtectedRoute>
        }
      />

      {/* Shared signed-in account page */}
      <Route
        path="/account"
        element={
          <ProtectedRoute>
            <Account />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
