import "./globals.css";


export const metadata = {
  title: "Sistema SRORN",
  description: "Sistema de registro hospitalario",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" crossOrigin="anonymous" referrerPolicy="no-referrer" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
