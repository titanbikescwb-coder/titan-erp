export default function Layout({ children }: any) {
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {children}
    </div>
  );
}