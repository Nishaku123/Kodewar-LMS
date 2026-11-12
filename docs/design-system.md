# Design System

The Kodewar LMS design system lives in `frontend/src/components` and
`frontend/src/layouts`. The interactive gallery is available at:

```
http://localhost:5173/design
```

The authentication layout preview is at:

```
http://localhost:5173/design/auth
```

## How to import a component

All paths start from the file that is importing. For a page in
`src/pages/`, a component in `src/components/ui/` is imported like this:

```jsx
import Button from "../components/ui/Button.jsx";
import Input from "../components/ui/Input.jsx";
import Badge from "../components/ui/Badge.jsx";
```

## Common examples

### Button

```jsx
<Button onClick={handleSave}>Save changes</Button>

<Button variant="secondary" icon={Plus} size="sm">
  Add lesson
</Button>

<Button variant="danger" loading={deleting}>
  Delete
</Button>
```

Variants: `primary`, `secondary`, `ghost`, `danger`.
Sizes: `sm`, `md`, `lg`.

A link can look like a button:

```jsx
import { Link } from "react-router-dom";
import { buttonClasses } from "../components/ui/Button.jsx";

<Link to="/design" className={buttonClasses({ variant: "secondary", size: "sm" })}>
  Back
</Link>;
```

### Input

```jsx
<Input
  label="Email address"
  type="email"
  icon={Mail}
  value={email}
  onChange={(event) => setEmail(event.target.value)}
  hint="Used for assessment reminders."
  error={emailError}
  required
/>
```

Passwords automatically receive a working show/hide button.

### Badge

```jsx
<Badge tone="success" dot>Passed</Badge>
```

Tones: `neutral`, `brand`, `success`, `warning`, `danger`, `info`.

### Progress

Progress must always come from real data, never a random value.

```jsx
<ProgressBar value={courseProgress} label="Course progress" />
<ProgressRing value={courseProgress} label="Course" />
```

### Toast notifications

Wrap the app once (already done in `src/main.jsx`):

```jsx
<ToastProvider>
  <App />
</ToastProvider>
```

Then call it from any page:

```jsx
import { useToast } from "../context/ToastContext.jsx";

const { toast } = useToast();

toast({
  tone: "success",
  title: "Lesson completed",
  description: "Your progress was saved.",
});
```

Tones: `info`, `success`, `warning`, `danger`. Toasts dismiss automatically
after 4 seconds and also have a close button.

### Modal

```jsx
<Modal
  open={open}
  onClose={closeModal}
  title="Mark lesson as complete?"
  description="This cannot be undone from the browser."
  footer={
    <>
      <Button variant="secondary" size="sm" onClick={closeModal}>Cancel</Button>
      <Button size="sm" onClick={confirm}>Confirm</Button>
    </>
  }
>
  Modal content goes here.
</Modal>
```

The modal closes on Escape or backdrop click, traps Tab focus and returns
focus to the trigger.

### Dashboard layout

```jsx
<DashboardLayout
  title="My courses"
  subtitle="All enrolled courses"
  navItems={studentNavigation}
>
  Page content
</DashboardLayout>
```

Each navigation item has this shape:

```js
{
  label: "My courses",
  to: "/student/courses",
  icon: BookOpen,
  end: false,
}
```

Only add navigation items whose routes actually exist.

### Auth layout

```jsx
<AuthLayout
  eyebrow="Welcome back"
  title="Sign in to continue"
  description="Use your Kodewar account."
>
  The login form goes here.
</AuthLayout>
```

## Auth context

Wrap the app once (already done in `src/main.jsx`):

```jsx
<AuthProvider>
  <App />
</AuthProvider>
```

Then use the signed-in user anywhere:

```jsx
import { useAuth } from "../context/AuthContext.jsx";

const { user, login, logout, updateProfile } = useAuth();
```

Protect a route:

```jsx
<ProtectedRoute roles={["student"]}>
  <StudentDashboard />
</ProtectedRoute>
```

`ProtectedRoute` shows a loader while the session is checked, redirects
signed-out visitors to `/login`, and redirects a signed-in user without the
required role to their own home page.

## Design rules

1. Use the tokens in `src/styles/index.css`. Do not invent one-off colours.
2. Use `Button`, `Input`, `Card` and `Badge` instead of repeating classes.
3. Keep headings consistent: page title, section title, body, caption.
4. Use `rounded-lg` for controls and `rounded-xl` for surfaces.
5. Never ship a button or link that does nothing.
6. Keep progress values dynamic and API-driven.
7. Respect reduced motion: the global stylesheet disables animations when
   the visitor asks for it.

## Folder map

```
src/components/ui/       Small reusable building blocks
src/components/layout/   Sidebar, topbar, mobile navigation, page header
src/components/auth/     Route guards and development demo accounts
src/components/student/  Shared honest empty-state page
src/components/course/   Course-specific presentation
src/layouts/             Full page shells (dashboard, auth)
src/config/              Role-based navigation
src/context/             Auth session and toast notifications
src/services/            Every API call
src/utils/               Small helpers such as cn(), role labels and date formatting
```
