import CashRegister from './pages/CashRegister';
import Clients from './pages/Clients';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Products from './pages/Products';
import Reports from './pages/Reports';
import Sales from './pages/Sales';
import Sellers from './pages/Sellers';
import Users from './pages/Users'; // Importação da nova página
import __Layout from './Layout.jsx';


export const PAGES = {
    "CashRegister": CashRegister,
    "Clients": Clients,
    "Dashboard": Dashboard,
    "Home": Home,
    "Products": Products,
    "Reports": Reports,
    "Sales": Sales,
    "Sellers": Sellers,
    "Users": Users, // Adição da nova página
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};
