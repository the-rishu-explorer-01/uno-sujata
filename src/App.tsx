import { MotionConfig } from "framer-motion";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HomePage from "@/pages/HomePage";
import ProductsPage from "@/pages/ProductsPage";
import ProductDetailPage from "@/pages/ProductDetailPage";
import RequestQuotePage from "@/pages/RequestQuotePage";
import RfqSuccessPage from "@/pages/RfqSuccessPage";
import NotFoundPage from "@/pages/NotFoundPage";
import IndustriesPage from "@/pages/IndustriesPage";
import IndustryDetailPage from "@/pages/IndustryDetailPage";
import CapabilitiesPage from "@/pages/CapabilitiesPage";
import QualityPage from "@/pages/QualityPage";
import AboutPage from "@/pages/AboutPage";
import ContactPage from "@/pages/ContactPage";
import AdminRoot from "@/admin/AdminLayout";
import LoginPage from "@/admin/LoginPage";
import DashboardPage from "@/admin/pages/DashboardPage";
import RfqListPage from "@/admin/pages/RfqListPage";
import RfqDetailPage from "@/admin/pages/RfqDetailPage";
import ContactsPage from "@/admin/pages/ContactsPage";
import ProductListPage from "@/admin/pages/ProductListPage";
import ProductFormPage from "@/admin/pages/ProductFormPage";
import CategoriesPage from "@/admin/pages/CategoriesPage";
import AdminIndustriesPage from "@/admin/pages/IndustriesPage";
import AdminCapabilitiesPage from "@/admin/pages/CapabilitiesPage";
import ContentPage from "@/admin/pages/ContentPage";
import SettingsPage from "@/admin/pages/SettingsPage";

/** Public website chrome. Not rendered on /admin. */
function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-ink focus:px-4 focus:py-2 focus:text-bone">
        Skip to content
      </a>
      <Header />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    // reducedMotion="user" disables transform animations for people who ask for less motion.
    <MotionConfig reducedMotion="user">
    <Routes>
      {/* Staff administration: separate shell, guarded in the UI and enforced on the server */}
      <Route path="/admin" element={<AdminRoot />}>
        <Route path="login" element={<LoginPage />} />
        <Route index element={<DashboardPage />} />
        <Route path="rfqs" element={<RfqListPage />} />
        <Route path="rfqs/:id" element={<RfqDetailPage />} />
        <Route path="contacts" element={<ContactsPage />} />
        <Route path="products" element={<ProductListPage />} />
        <Route path="products/new" element={<ProductFormPage />} />
        <Route path="products/:id" element={<ProductFormPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="industries" element={<AdminIndustriesPage />} />
        <Route path="capabilities" element={<AdminCapabilitiesPage />} />
        <Route path="content" element={<ContentPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>

      {/* Public website */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/category/:slug" element={<ProductsPage />} />
        <Route path="/products/:slug" element={<ProductDetailPage />} />
        <Route path="/request-quote" element={<RequestQuotePage />} />
        <Route path="/request-quote/success" element={<RfqSuccessPage />} />
        <Route path="/industries" element={<IndustriesPage />} />
        <Route path="/industries/:slug" element={<IndustryDetailPage />} />
        <Route path="/capabilities" element={<CapabilitiesPage />} />
        <Route path="/quality" element={<QualityPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
    </MotionConfig>
  );
}
