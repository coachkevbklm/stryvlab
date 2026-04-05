export default function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top nav will be injected by page components */}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
