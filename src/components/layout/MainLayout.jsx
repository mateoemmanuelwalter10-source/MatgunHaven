import Navbar from "./Navbar";
import MobileNav from "./MobileNav";
import Footer from "./Footer";

export default function MainLayout({ children }) {
  return (
    <div className="app-shell">
      <Navbar />
      <div className="body-shell">
        <main className="page-content">{children}</main>
      </div>
      <MobileNav />
      <Footer />
    </div>
  );
}
