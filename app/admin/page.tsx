// app/admin/page.tsx
import { redirect } from 'next/navigation';

export default function AdminPage() {
  // Redirect /admin directly to the equipment management sub-page
  redirect('/admin/equipment');
}