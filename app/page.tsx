export default function HomePage() {
  return (
    <div style={{ padding: 20 }}>
      <h1>Welcome</h1>
      <p>This is the ERM application.</p>

      <ul>
        <li>
          <a href="/erm">Go to ERM</a>
        </li>
        <li>
          <a href="/erm/items">Item Master</a>
        </li>
        <li>
          <a href="/erm/categories">Categories</a>
        </li>
      </ul>
    </div>
  );
}
