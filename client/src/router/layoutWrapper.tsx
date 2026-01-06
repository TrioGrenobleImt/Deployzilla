import { Outlet } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";

interface LayoutWrapperProps {
  withLayout?: boolean;
}

export const LayoutWrapper = ({ withLayout = true }: LayoutWrapperProps) => {
  return (
    <div className="flex min-h-screen flex-col">
      {withLayout && <Navbar />}
      <main className="flex-1">
        <Outlet />
      </main>
      {withLayout && <Footer />}
    </div>
  );
};
