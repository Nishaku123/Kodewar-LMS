import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import PageHeader from "../layout/PageHeader.jsx";
import { Card, CardContent } from "../ui/Card.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import Badge from "../ui/Badge.jsx";
import { buttonClasses } from "../ui/Button.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { getNavigation } from "../../config/navigation.js";

/**
 * Honest empty page for a student area whose feature has not been built yet.
 * It contains no sample numbers or fake records, only a clear next step.
 */
export default function StudentEmptyPage({
  pageTitle,
  eyebrow,
  description,
  phase,
  icon,
  emptyTitle,
  emptyDescription,
}) {
  const { user } = useAuth();

  return (
    <DashboardLayout
      title={pageTitle}
      subtitle="Student workspace"
      navItems={getNavigation(user.role)}
    >
      <PageHeader
        eyebrow={eyebrow}
        title={pageTitle}
        description={description}
        actions={<Badge tone="warning">{phase}</Badge>}
      />

      <Card>
        <CardContent className="py-8">
          <EmptyState
            icon={icon}
            title={emptyTitle}
            description={emptyDescription}
            action={
              <Link
                to="/student"
                className={buttonClasses({ variant: "secondary", size: "sm" })}
              >
                <ArrowLeft size={13} aria-hidden="true" />
                Back to overview
              </Link>
            }
          />
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
