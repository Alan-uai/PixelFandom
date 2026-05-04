import Link from "next/link";

export default function MainNav() {
  return (
    <nav className="flex h-14 items-center justify-between w-full">
      <div className="flex-shrink-0">
        <Link href="/">
          <span className="text-xl font-bold">PixelFandom</span>
        </Link>
      </div>
      <div className="hidden md:flex md:items-center md:space-x-6">
        <Link href="/" className="text-muted-foreground hover:text-foreground">
          Home
        </Link>
        <Link href="/about" className="text-muted-foreground hover:text-foreground">
          About
        </Link>
        <Link href="/admin/manage-content" className="text-muted-foreground hover:text-foreground">
          Admin
        </Link>
      </div>
    </nav>
  );
}