import type { Metadata } from 'next';
import '../globals.css';
import './admin.css';

export const metadata: Metadata = {
  title: 'CricBook Admin',
  description: 'Admin dashboard for managing CricBook platform.',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
