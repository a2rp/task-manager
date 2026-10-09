import { useEffect, useState } from "react";
import TaskManager from "./components/taskManager/index.jsx";
import BackToTop from "./components/backToTop/index.jsx";
import SiteFooter from "./components/siteFooter/index.jsx";
import SiteHeader from "./components/siteHeader/index.jsx";
import styles from "./App.module.css";
const App = () => {
 const [showBackToTop, setShowBackToTop] = useState(false);
 useEffect(() => { const update = () => setShowBackToTop(window.scrollY > 50); window.addEventListener("scroll", update, { passive: true }); update(); return () => window.removeEventListener("scroll", update); }, []);
 return <div className={styles.appShell} id="top"><SiteHeader title="Task Manager" mark="T" repoUrl="https://github.com/a2rp/task-manager" navItems={[["Inbox","#inbox"],["Completed","#completed"]]} /><main className={styles.pageContent}><TaskManager /></main><SiteFooter repoUrl="https://github.com/a2rp/task-manager" /><BackToTop visible={showBackToTop} /></div>;
};
export default App;