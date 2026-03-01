import Link from "next/link";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/upload", label: "Upload" },
  { href: "/closet", label: "Closet" },
  { href: "/styling", label: "Styling" },
];

export function AppNav(): React.JSX.Element {
  return (
    <header className="app-header">
      <div className="container row between">
        <h1 className="brand">Cloakroom Web MVP</h1>
        <nav className="row gap-sm wrap">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
