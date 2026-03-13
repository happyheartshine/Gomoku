import React from 'react';
import '../src/index.css';

export const metadata = {
  title: 'Gomoku Multiplayer',
  description: 'Real-time multiplayer Gomoku (Five in a Row)',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}

