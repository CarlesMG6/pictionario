import { Baloo_2, Nunito } from 'next/font/google';
import './globals.css';

// Las dos familias del canvas de diseño: Nunito lleva el texto y Baloo 2 las
// cifras grandes, que son lo que se lee desde el otro lado de la habitación.
const nunito = Nunito({
  subsets: ['latin'],
  weight: ['600', '700', '800', '900'],
  style: ['normal', 'italic'],
  variable: '--font-body',
  display: 'swap',
});

const baloo = Baloo_2({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${nunito.variable} ${baloo.variable}`}>
      <body>{children}</body>
    </html>
  );
}
