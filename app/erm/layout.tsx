export default function ErmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ padding: 20 }}>
      <h2>ERM System</h2>
      <nav>
        <a href="/erm/items">Items</a> |{" "}
        <a href="/erm/categories">Categories</a> | {" "}
        <a href="/erm/Supplier">Supplier</a> | {" "}
        <a href="/erm/Requirements">Purchase Order</a>
        <a href="/erm/view-purchase-orders"> View Orders </a>
      </nav>
      <hr />
      {children}
    </div>
  );
}
