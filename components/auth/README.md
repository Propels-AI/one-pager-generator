# Authentication System Guide

A comprehensive authentication system for our application, providing declarative components and intuitive hooks for seamless auth integration. Inspired by Clerk.

## 🎯 Key Features

- **Declarative Components**: `<SignedIn>`, `<SignedOut>`, `<ProtectPage>`
- **Intuitive Hooks**: `useAuth()`, `useUser()`, `useAuthWall()`
- **Auth Wall Protection**: Automatic redirects with `useAuthWall()`
- **Flexible Guards**: `<AuthGuard>` for complex scenarios
- **TypeScript**: Full type safety throughout

## 📚 Hooks

### `useAuth()` - Basic Auth State

```tsx
import { useAuth } from '@/lib/hooks/useAuthWall';

function UserProfile() {
  const { isSignedIn, user, isLoaded, userId } = useAuth();

  if (!isLoaded) return <Loading />;
  if (!isSignedIn) return <SignInPrompt />;

  return <div>Welcome, {user.username}!</div>;
}
```

### `useUser()` - User-Focused Hook

```tsx
import { useUser } from '@/lib/hooks/useAuthWall';

function UserBadge() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) return <Skeleton />;

  return user ? <Avatar user={user} /> : null;
}
```

### `useAuthWall()` - Page Protection

```tsx
import { useAuthWall } from '@/lib/hooks/useAuthWall';

function ProtectedPage() {
  const { isSignedIn, protect } = useAuthWall({
    redirectMessage: 'Please sign in to access this page',
    autoRedirect: false, // Manual control
  });

  if (!isSignedIn) {
    return (
      <div>
        <p>You need to sign in</p>
        <Button onClick={protect}>Sign In</Button>
      </div>
    );
  }

  return <PageContent />;
}
```

## 🧩 Declarative Components

### `<SignedIn>` and `<SignedOut>`

```tsx
import { SignedIn, SignedOut } from '@/components/auth/AuthComponents';

function Navigation() {
  return (
    <nav>
      <SignedIn>
        <DashboardLink />
        <ProfileDropdown />
      </SignedIn>

      <SignedOut>
        <SignInButton />
        <SignUpButton />
      </SignedOut>
    </nav>
  );
}
```

### `<ProtectPage>` - Entire Page Protection

```tsx
import { ProtectPage } from '@/components/auth/AuthComponents';

export default function DashboardPage() {
  return (
    <ProtectPage>
      <DashboardContent />
    </ProtectPage>
  );
}
```

### `<AuthGuard>` - Advanced Conditional Rendering

```tsx
import { AuthGuard } from '@/components/auth/AuthComponents';

function AdminPanel() {
  return (
    <AuthGuard
      fallback={<AccessDenied />}
      loading={<AdminLoading />}
      redirectOnUnauthenticated={true}
      redirectOptions={{
        redirectMessage: 'Admin access required',
        authPath: '/admin/login',
      }}
    >
      <AdminDashboard />
    </AuthGuard>
  );
}
```

## 🛡️ Auth Wall Protection

### Automatic Page Protection

```tsx
import { useAuthWall } from '@/lib/hooks/useAuthWall';

function ProtectedPage() {
  // Automatically redirects if not authenticated
  const { isSignedIn, user } = useAuthWall({
    redirectMessage: 'Please sign in to access this page',
    returnTo: '/dashboard/settings',
  });

  return <PageContent />;
}
```

### Manual Protection Control

```tsx
import { useAuthWall } from '@/lib/hooks/useAuthWall';

function ConditionalContent() {
  const { isSignedIn, protect } = useAuthWall({ autoRedirect: false });

  if (!isSignedIn) {
    return <button onClick={protect}>Sign in to view content</button>;
  }

  return <ProtectedContent />;
}
```

## 📚 Common Use Cases & Solutions

### 1. Dashboard/Settings Pages (Full Protection)

```tsx
// ✅ RECOMMENDED: Simple and clean
export default function DashboardPage() {
  return (
    <ProtectPage>
      <DashboardContent />
    </ProtectPage>
  );
}
```

### 2. Navigation Menus (Conditional UI)

```tsx
// ✅ RECOMMENDED: Show different UI based on auth state
function Header() {
  return (
    <header>
      <Logo />
      <SignedIn>
        <nav>
          <Link href="/dashboard">Dashboard</Link>
          <UserMenu />
        </nav>
      </SignedIn>
      <SignedOut>
        <Button asChild>
          <Link href="/sign-in">Sign In</Link>
        </Button>
      </SignedOut>
    </header>
  );
}
```

### 3. API Calls & Logic (Auth State Checks)

```tsx
// ✅ RECOMMENDED: Use useAuth() for logic
function CreatePostButton() {
  const { isSignedIn, user } = useAuth();

  const handleCreate = async () => {
    if (!isSignedIn) {
      toast.error('Please sign in to create a post');
      return;
    }

    await createPost({ authorId: user.userId });
  };

  return (
    <Button onClick={handleCreate} disabled={!isSignedIn}>
      {isSignedIn ? 'Create Post' : 'Sign in to create'}
    </Button>
  );
}
```

### 4. Premium Features (Custom Protection)

```tsx
// ✅ RECOMMENDED: Use useAuthWall() for custom flows
function PremiumFeature() {
  const { isSignedIn, protect } = useAuthWall({
    redirectMessage: 'Premium Feature',
    redirectDescription: 'Sign in to access premium features',
    autoRedirect: false,
  });

  if (!isSignedIn) {
    return (
      <div className="p-6 border-2 border-dashed rounded-lg text-center">
        <h3>Premium Feature</h3>
        <p>Sign in to unlock this feature</p>
        <Button onClick={protect}>Sign In</Button>
      </div>
    );
  }

  return <PremiumContent />;
}
```

## 🎨 Patterns

### 1. **Simple Page Protection**

```tsx
export default function SettingsPage() {
  return (
    <ProtectPage>
      <SettingsContent />
    </ProtectPage>
  );
}
```

### 2. **Conditional UI Based on Auth**

```tsx
function Header() {
  return (
    <header>
      <Logo />
      <SignedIn>
        <UserMenu />
      </SignedIn>
      <SignedOut>
        <AuthButtons />
      </SignedOut>
    </header>
  );
}
```

### 3. **Custom Fallback Handling**

```tsx
function PremiumFeature() {
  const { isSignedIn } = useAuth();

  return (
    <AuthGuard
      fallback={
        <div className="border-2 border-dashed p-8 text-center">
          <h3>Premium Feature</h3>
          <p>Sign in to access this feature</p>
          <SignInButton />
        </div>
      }
    >
      <PremiumContent />
    </AuthGuard>
  );
}
```

### 4. **Role-Based Access**

```tsx
function AdminSection() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <AuthGuard fallback={<div>Admin access required</div>}>{isAdmin ? <AdminPanel /> : <AccessDenied />}</AuthGuard>
  );
}
```

## 🔧 Configuration

### Auth Wall Configuration

```tsx
// Custom protection for different areas
const { protect } = useAuthWall({
  redirectMessage: 'Premium Feature',
  redirectDescription: 'Upgrade to access this feature',
  authPath: '/pricing',
  returnTo: '/dashboard/premium',
});
```

### Custom Auth Messages

```tsx
const { protect } = useAuthWall({
  redirectMessage: 'Subscription Required',
  redirectDescription: 'Upgrade to Pro to access this feature',
  authPath: '/pricing', // Custom redirect path
  showToast: true,
});

// Default behavior (redirects to /sign-in)
const { protect } = useAuthWall({
  redirectMessage: 'Please sign in to continue',
});
```

## ⚠️ Common Mistakes to Avoid

### ❌ DON'T: Mix different protection patterns on same page

```tsx
// ❌ BAD: Redundant protection
function BadExample() {
  const { isSignedIn } = useAuth(); // Unnecessary check

  return (
    <ProtectPage>
      {' '}
      {/* Already handles auth */}
      {isSignedIn && <DashboardContent />} {/* Redundant */}
    </ProtectPage>
  );
}
```

### ✅ DO: Use one protection pattern per component

```tsx
// ✅ GOOD: Single protection method
function GoodExample() {
  return (
    <ProtectPage>
      <DashboardContent />
    </ProtectPage>
  );
}
```

### ❌ DON'T: Manual auth state management

```tsx
// ❌ BAD: Manual redirects and state management
function BadProtection() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/sign-in');
    }
  }, [user, isLoading, router]);

  if (isLoading) return <Loading />;
  if (!user) return null;

  return <Content />;
}
```

### ✅ DO: Use declarative components

```tsx
// ✅ GOOD: Declarative and clean
function GoodProtection() {
  return (
    <ProtectPage>
      <Content />
    </ProtectPage>
  );
}
```

## 🚀 Best Practices

1. **Start simple**: Use `<ProtectPage>` for full page protection
2. **Be declarative**: Prefer components over manual auth checks
3. **Single responsibility**: One auth pattern per component
4. **User feedback**: Always provide loading and error states
5. **Consistent patterns**: Stick to the same auth pattern across similar components

## 🎓 Quick Start Guide

### For New Developers

1. **Start with `<ProtectPage>`** for entire pages that need authentication
2. **Use `<SignedIn>/<SignedOut>`** for conditional UI elements
3. **Use `useAuth()`** when you need to check auth state in logic
4. **Use `useAuthWall()`** for custom protection scenarios

### Common Patterns by Use Case

| Use Case               | Recommended Pattern      | Example                    |
| ---------------------- | ------------------------ | -------------------------- |
| Protect entire page    | `<ProtectPage>`          | Dashboard, Settings        |
| Conditional navigation | `<SignedIn>/<SignedOut>` | Header menus               |
| Auth state in logic    | `useAuth()`              | API calls, form validation |
| Custom protection      | `useAuthWall()`          | Premium features           |
| Complex fallbacks      | `<AuthGuard>`            | Role-based content         |
