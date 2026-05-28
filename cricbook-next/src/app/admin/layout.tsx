import type { Metadata } from 'next';
import '../globals.css';
import './admin.css';

export const metadata: Metadata = {
  title: 'CricBook Admin',
  description: 'Admin dashboard for managing CricBook platform.',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}
