import {
  Award,
  BookOpen,
  BookOpenCheck,
  ClipboardCheck,
  ClipboardList,
  LayoutDashboard,
  UserCog,
  UserRound,
  Users,
} from "lucide-react";

/**
 * Navigation items for each role. Only routes that really exist are listed.
 * Paths must match frontend/src/App.jsx.
 */
const studentNavigation = [
  {
    label: "Overview",
    to: "/student",
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: "My courses",
    to: "/student/courses",
    icon: BookOpen,
  },
  {
    label: "Assignments",
    to: "/student/assignments",
    icon: ClipboardList,
  },
  {
    label: "Assessments",
    to: "/student/assessments",
    icon: ClipboardCheck,
  },
  {
    label: "Certificates",
    to: "/student/certificates",
    icon: Award,
  },
  {
    label: "Profile",
    to: "/account",
    icon: UserRound,
  },
];

const staffNavigation = [
  {
    label: "Workspace",
    to: "/staff",
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: "Courses",
    to: "/staff/courses",
    icon: BookOpenCheck,
  },
  {
    label: "Students",
    to: "/staff/students",
    icon: Users,
  },
  {
    label: "Profile",
    to: "/account",
    icon: UserRound,
  },
];

export function getNavigation(role) {
  if (role === "student") return studentNavigation;

  if (role === "admin") {
    return [
      ...staffNavigation.slice(0, 3),
      {
        label: "Users & roles",
        to: "/staff/users",
        icon: UserCog,
      },
      staffNavigation[3],
    ];
  }

  return staffNavigation;
}
