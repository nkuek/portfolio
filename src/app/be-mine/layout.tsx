export default function BeMineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <style>{`nav, footer { display: none !important; }`}</style>
      <div className="flex min-h-svh items-center justify-center">
        {children}
      </div>
    </>
  );
}
