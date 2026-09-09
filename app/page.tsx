import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/login');
}

// app/page.tsx
import { redirect } from 'next/navigation';

export default function RootPage() {
  // Redirect root access to /admin by default
  redirect('/admin');
}