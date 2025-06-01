import React, { useState, useEffect } from 'react';
import {
  UserOutlined,
  DashboardOutlined,
  UnorderedListOutlined,
  FileTextOutlined,
  AppstoreOutlined,
  HistoryOutlined,
  LogoutOutlined,
  FileDoneOutlined,
  SnippetsOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  DollarCircleOutlined,
  RollbackOutlined,
  ShoppingOutlined,
  DatabaseOutlined,
  HomeOutlined,
  UserSwitchOutlined,
  IdcardOutlined,
} from '@ant-design/icons';


import { Button, Layout, Menu, theme } from 'antd';
import { useNavigate, useLocation, Routes, Route } from "react-router-dom";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../backend/firebase/FirebaseConfig"; 
import Dashboard from './Dashboard';
import Inventory from './admin/Inventory';
import PendingRequest from './admin/PendingRequest';
import BorrowCatalog from './admin/BorrowCatalog';
import History from './admin/History';
import Profile from './Profile';
import AccountManagement from './superAdmin/AccountManagement';
import PendingAccounts from './superAdmin/PendingAccounts';
import Requisition from './users/Requisition';
import RequestList from './users/RequestList';
import ActivityLog from './users/ActivityLog';
import SearchItems from './users/SearchItems';
import CapexRequest from './users/CapexRequest';
import ReturnItems from './users/ReturnItems';
import CustomModal from "./customs/CustomModal";
import AppHeader from './Header';
import ProtectedRoute from './ProtectedRoute';
import HistoryLog from './users/HistoryLog';
import RequestLog from './admin/RequestLog';
import AdminActivityLog from './admin/AdminActivityLog';
import NotAuthorized from './NotAuthorized';
import CapexList from './admin/CapexList';
import LabRoomQR from './admin/LabRoomQR';
import PrivacyPolicy from './PrivacyPolicy';
import './styles/LayoutMain.css'
const { Header, Sider, Content } = Layout;

const LayoutMain = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 408);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedKey, setSelectedKey] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [role, setRole] = useState("");
  const [pageTitle, setPageTitle] = useState("");

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 408);
      if (window.innerWidth > 408) {
        setMobileOpen(false); 
      }
    };
  
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const state = location.state || {};
    const storedRole = localStorage.getItem("role");
    const storedName = localStorage.getItem("userName");
    const normalizedRole = state.role ? state.role.toLowerCase() : storedRole ? storedRole.toLowerCase() : "user";

    setRole(normalizedRole);
    localStorage.setItem("role", normalizedRole);

    if (state.name) {
      localStorage.setItem("userName", state.name);
      
    } else if (storedName) {
      localStorage.setItem("userName", storedName);
    }

    const path = location.pathname.replace(/\/$/, "");
    
    if (path.toLowerCase() === "/main/profile") {
      setSelectedKey("");
      setPageTitle("Profile");
      return;
    }

    switch (path.toLowerCase()) {
      case "/main/dashboard":
        setSelectedKey("1");
        setPageTitle("Dashboard");
        break;

      case "/main/inventory":
        setSelectedKey("2");
        setPageTitle("Inventory");
        break;

      case "/main/pending-request":
        setSelectedKey("3");
        setPageTitle("Pending Requests");
        break;

      case "/main/borrow-catalog":
        setSelectedKey("4");
        setPageTitle("Borrow Catalog");
        break;

      case "/main/history":
        setSelectedKey("5");
        setPageTitle("History");
        break;

      case "/main/accounts":
        setSelectedKey("7");
        setPageTitle("Accounts");
        break;

      case "/main/requisition":
        setSelectedKey("8");
        setPageTitle("Requisition");
        break;

      case "/main/request-list":
        setSelectedKey("9");
        setPageTitle("Request List");
        break;

      case "/main/activity-log":
        setSelectedKey("10");
        setPageTitle("Activity Log");
        break;

      case "/main/search-items":
        setSelectedKey("11");
        setPageTitle("Search Items");
        break;

      case "/main/capex-request":
        setSelectedKey("12");
        setPageTitle("Capex Request");
        break;

      case "/main/return-items":
        setSelectedKey("13");
        setPageTitle("Return Items");
        break;

      case "/main/orders":
        setSelectedKey("14");
        setPageTitle("Orders");
        break;

      case "/main/request-log":
        setSelectedKey("15");
        setPageTitle("Request Log");
        break;

      case "/main/admin-activity-log":
        setSelectedKey("16");
        setPageTitle("Activivty Log");
        break;

      case "/main/pending-accounts":
        setSelectedKey("17");
        setPageTitle("Pending Accounts");
        break;

      case "/main/capex-request-list":
        setSelectedKey("18");
        setPageTitle("Capex Request List");
        break;

    case "/main/lab-room":
        setSelectedKey("19");
        setPageTitle("Lab Room Details");
        break;

      default:
        setSelectedKey("1");
        setPageTitle("Dashboard");
        break;
    }
  }, [location.pathname, setPageTitle]);

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);

    } else {
      setCollapsed(!collapsed);
    }
  };

  const handleMenuClick = (e) => {
    if (e.key === "logout") {
      setShowModal(true);

    } else {
      navigate(e.key); 
    }
  
    if (isMobile) setMobileOpen(false);
  };  

  const handleSignOut = async () => {
    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName") || "Unknown User";

    if (userId) {
      try {
        await addDoc(collection(db, `accounts/${userId}/activitylog`), {
          action: "User Logged Out (Website)",
          userName,
          timestamp: serverTimestamp(),
        });
      } catch (error) {
        console.error("Error logging logout:", error);
      }
    }

    // Clear local storage and redirect
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("userDepartment");
    localStorage.removeItem("userPosition");
    localStorage.removeItem("userJobTitle");

    navigate("/", { replace: true });
  };

  const superAdminMenuItems = [
    {
      key: "/main/accounts",
      icon: <UserOutlined />,
      label: "Accounts",
    },
    {
      key: "/main/pending-accounts",
      icon: <UserOutlined />,
      label: "Pending Accounts",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Sign Out",
      danger: true,
    },
  ];

// const adminMenuItems = [

//     {
//     type: "group",
//       label: (
//     <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
//       <UserOutlined />
//       Faculty panel
//     </span>
//   ),
//     children: [
//       {
//         key: "/main/requisition",
//         icon: <FileDoneOutlined />,
//         label: "Requisition",
//       },
//       {
//         key: "/main/return-items",
//         icon: <RollbackOutlined />,
//         label: "Return Items",
//       },
//       {
//         key: "/main/orders",
//         icon: <ShoppingCartOutlined />,
//         label: "Orders",
//       },
//     ],
//   },
//     {
//       type: "group",
//       icon: <UserSwitchOutlined/>,
//        label: (
//     <span style={{ display: 'flex', alignItems: 'center', gap: 8}}>
//       <UserSwitchOutlined />
//       Admin Panel
//     </span>
//   ),
//       children: [
//       {
//         key: "/main/dashboard",
//         icon: <DashboardOutlined />,
//         label: "Dashboard",
//       },
//       {
//         key: "/main/inventory",
//         icon: <UnorderedListOutlined />,
//         label: "Inventory",
//       },
//       {
//         key: "/main/pending-request",
//         icon: <FileTextOutlined />,
//         label: "Pending Requests",
//       },
//       {
//         key: "/main/borrow-catalog",
//         icon: <ShoppingOutlined />,
//         label: "Borrow Catalog",
//       },
//       {
//         key: "/main/request-log",
//         icon: <DatabaseOutlined />,
//         label: "Request Log",
//       },
//       {
//         key: "/main/capex-request-list",
//         icon: <DollarCircleOutlined />,
//         label: "Capex Request List",
//       },
//       {
//         key: "/main/lab-room",
//         icon: <HomeOutlined />,
//         label: "Stock Room Details",
//       },
//     ],
//   },
//   {
//     key: "/main/admin-activity-log",
//     icon: <HistoryOutlined />,
//     label: "Activity Log",
//   },
//   {
//     key: "logout",
//     icon: <LogoutOutlined />,
//     label: "Sign Out",
//     danger: true,
    
//   },
// ];

  const adminMenuItems = [
    {
      key: 'faculty-panel',
      icon: <UserOutlined />,
      label: 'Faculty Panel',
      children: [
        {
          key: "/main/requisition",
          icon: <FileDoneOutlined />,
          label: "Requisition",
        },
        {
          key: "/main/return-items",
          icon: <RollbackOutlined />,
          label: "Return Items",
        },
        {
          key: "/main/orders",
          icon: <ShoppingCartOutlined />,
          label: "Orders",
        },
      ],
    },
    {
      key: 'admin-panel',
      icon: <UserSwitchOutlined />,
      label: 'Admin Panel',
      children: [
        {
          key: "/main/dashboard",
          icon: <DashboardOutlined />,
          label: "Dashboard",
        },
        {
          key: "/main/inventory",
          icon: <UnorderedListOutlined />,
          label: "Inventory",
        },
        {
          key: "/main/pending-request",
          icon: <FileTextOutlined />,
          label: "Pending Requests",
        },
        {
          key: "/main/borrow-catalog",
          icon: <ShoppingOutlined />,
          label: "Borrow Catalog",
        },
        {
          key: "/main/request-log",
          icon: <DatabaseOutlined />,
          label: "Request Log",
        },
        {
          key: "/main/capex-request-list",
          icon: <DollarCircleOutlined />,
          label: "Capex Request List",
        },
        {
          key: "/main/lab-room",
          icon: <HomeOutlined />,
          label: "Stock Room Details",
        },
      ],
    },
    {
      key: "/main/admin-activity-log",
      icon: <HistoryOutlined />,
      label: "Activity Log",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Sign Out",
      danger: true,
    },
  ];

  const superUserMenuItems = [
    {
      key: "/main/dashboard",
      icon: <DashboardOutlined />,
      label: "Dashboard",
    },
    {
      key: "/main/inventory",
      icon: <UnorderedListOutlined />,
      label: "Inventory",
    },
    {
      key: "/main/pending-request",
      icon: <FileTextOutlined />,
      label: "Pending Requests",
    },
    {
      key: "/main/borrow-catalog",
      icon: <AppstoreOutlined />,
      label: "Borrow Catalog",
    },
    {
      key: "/main/admin-activity-log",
      icon: <HistoryOutlined />,
      label: "Activity Log",
    },
    {
      key: "/main/request-log",
      icon: <HistoryOutlined />,
      label: "Request Log",
    },
  {
      key: "/main/lab-room",
      icon: <HistoryOutlined />,
      label: "Stock Room Details",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Sign Out",
      danger: true,
    },
  ];

  const userMenuItems = [
    {
      key: "/main/requisition",
      icon: <FileDoneOutlined />,
      label: "Requisition",
    },
    {
      key: "/main/search-items",
      icon: <SearchOutlined/>,
      label: "Search Items",
    },
    {
      key: "/main/orders",
      icon: <ShoppingCartOutlined />,
      label: "Orders",      
    },
    {
      key: "/main/capex-request",
      icon: <DollarCircleOutlined />,
      label: "Capex Request",
    },
    {
      key: "/main/return-items",
      icon: <RollbackOutlined />,
      label: "Return Items",
    },
        {
      key: "/main/activity-log",
      icon: <ClockCircleOutlined />,
      label: "Activity Log",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Sign Out",
      danger: true,
    },
  ];

  const menuItems =
    role === "super-admin"
      ? superAdminMenuItems
      : role === "admin"
      ? adminMenuItems
      : role === "super-user"
      ? superUserMenuItems
      : userMenuItems;

const SIDEBAR_WIDTH = 220;
const COLLAPSED_WIDTH = isMobile ? 0 : 80;
const currentSiderWidth = collapsed ? COLLAPSED_WIDTH : SIDEBAR_WIDTH;



  return (
    <Layout style={{ minHeight: "100vh",  marginLeft: 20, transition: 'margin-left 0.2s' }}>
            <Sider
              trigger={null}
              collapsible
              collapsed={collapsed}
              collapsedWidth={COLLAPSED_WIDTH}
              width={SIDEBAR_WIDTH}
              className={isMobile && !mobileOpen ? 'mobile-collapsed' : ''}
              style={{
                width: currentSiderWidth,
                position: "fixed",
                top: 0,
                left: 0,
                height: "100vh",
                zIndex: 1000,
                overflow: "auto",
                padding: 0
              }}
            >


          <div className="demo-logo-vertical" />

          <div className="logo">
              {!collapsed || isMobile ? (
                <>
                  <h3 className="logo-title">NU MOA</h3>
                  <p className="logo-subtitle">Laboratory System</p>
                </>
              ) : (
                <h3 className="logo-title">NU MOA</h3>
              )}
            </div>

          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname]}
            onClick={handleMenuClick}
            items={menuItems}
            className='custom-menu'
          />

      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'margin-left 0.2s' }}>

        <Header
          style={{
            position: "fixed",
            top: 0,
            left: currentSiderWidth,
            right: 0,
            zIndex: 1001,
            background: "#fff",
            padding: 0,
            transition: 'left 0.2s',
            
          }}
        >
          <AppHeader
            pageTitle={pageTitle}
            onToggleSidebar={toggleSidebar}
            isSidebarCollapsed={collapsed}
          />
        </Header>

        <Content
          style={{
            marginTop: 80,
            padding: 20,
            paddingTop: 20,
            marginLeft: 16,
            marginRight: 16,
            minHeight: "100vh",
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >

          <Routes>
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/not-authorized" element={<NotAuthorized />} />

            {/* Routes accessible to all logged-in users */}
            <Route element={<ProtectedRoute allowedRoles={["admin", "user", "super-admin", "super-user"]} />} >
              <Route path="/profile" element={<Profile />} />
              <Route path="/activity-log" element={<ActivityLog />} />
              <Route path="/orders" element={<HistoryLog />} />
            </Route>

            {/* Superadmin-only routes */}
            <Route element={<ProtectedRoute allowedRoles={["super-admin"]} />}>
              <Route path="/accounts" element={<AccountManagement />} />
              <Route path="/pending-accounts" element={<PendingAccounts />} />
            </Route>

            {/* Admin-only routes */}
            <Route element={<ProtectedRoute allowedRoles={["admin", "super-user"]} />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/pending-request" element={<PendingRequest />} />
              <Route path="/borrow-catalog" element={<BorrowCatalog />} />
              <Route path="/request-log" element={<RequestLog />} />
              <Route path="/admin-activity-log" element={<AdminActivityLog />} />
              <Route path="/lab-room" element={<LabRoomQR/>} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
              <Route path="/capex-request-list" element={<CapexList/>} />
            </Route>

            {/* User-only routes */}
            <Route element={<ProtectedRoute allowedRoles={["user", "admin"]} />}>
              <Route path="/requisition" element={<Requisition />} />
              <Route path="/request-list" element={<RequestList />} />
              <Route path="/search-items" element={<SearchItems />} />
              <Route path="/return-items" element={<ReturnItems />} />
              <Route path="/capex-request" element={<CapexRequest />} />
            </Route>

            <Route path="/not-authorized" element={<NotAuthorized />} />
          </Routes>
        </Content>
        
        <CustomModal
            visible={showModal}
            onConfirm={handleSignOut}
            onCancel={() => setShowModal(false)}
        />
      </Layout>
    </Layout>
  );
};

export default LayoutMain;