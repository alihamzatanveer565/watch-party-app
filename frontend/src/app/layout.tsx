import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'Onion Farms — Watch Together, Live',
  description: 'Host synchronized YouTube watch parties with friends. Real-time chat, sync controls, and easy invite links.',
  keywords: 'onion farms, watch party, youtube sync, watch together, live chat',
  openGraph: {
    title: 'Onion Farms',
    description: 'Watch YouTube videos together in perfect sync',
    type: 'website',
    images: '/brand/logo.gif',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a2340',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#4ade80', secondary: '#0d1224' } },
            error: { iconTheme: { primary: '#f87171', secondary: '#0d1224' } },
          }}
        />
      </body>
    </html>
  );
}
