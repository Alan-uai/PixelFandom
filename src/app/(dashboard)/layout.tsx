import DashboardLayoutClient from './dashboard-layout-client';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isZadminBypass = !!process.env.zadmin;

  return (
    <DashboardLayoutClient isZadminBypass={isZadminBypass}>
      {children}
    </DashboardLayoutClient>
  );
}
