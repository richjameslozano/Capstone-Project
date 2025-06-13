import React, { useState, useEffect } from "react";
import {
  Layout,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Popconfirm,
  message,
  List,
} from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { db, auth } from "../../backend/firebase/FirebaseConfig";
import { createUserWithEmailAndPassword, updateEmail, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  setDoc,
} from "firebase/firestore";
import { debounce } from 'lodash';
import Sidebar from "../Sidebar";
import AppHeader from "../Header";
import "../styles/superAdminStyle/AccountManagement.css";
import SuccessModal from "../customs/SuccessModal"; 
import NotificationModal from "../customs/NotificationModal";

const { Content } = Layout;
const { Option } = Select;

const AccountManagement = () => {
  const [accounts, setAccounts] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [form] = Form.useForm();
  const [pageTitle, setPageTitle] = useState("");
  const [showModal, setShowModal] = useState(false); 
  const [adminCredentials, setAdminCredentials] = useState(null);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [password, setPassword] = useState("");
  const [actionType, setActionType] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [modalMessage, setModalMessage] = useState("");
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [jobTitle, setJobTitle] = useState("");
  const [newCollege, setNewCollege] = useState("");
  const departmentOptionsByJobTitle = {
    Dean: ["SAH", "SAS", "SOO", "SOD"],
    "Program Chair": ["Nursing", "Medical Technology", "Psychology", "Optometry", "Dentistry", "Physical Therapy"],
    Faculty: ["SHS", "Nursing", "Medical Technology", "Psychology", "Dentistry", "Optometry", "Physical Therapy"],
    "Laboratory Custodian": [], 
  };
  const [isDeptModalVisible, setIsDeptModalVisible] = useState(false);
  const [newDepartment, setNewDepartment] = useState("");
  const [departmentsAll, setDepartmentsAll] = useState([]);
  const [departments, setDepartments] = useState([]);  
  const sanitizeInput = (input) =>
  input.replace(/\s+/g, " ")          
   .replace(/[^a-zA-Z0-9\s\-.,()]/g, "");

  useEffect(() => {
    const loginSuccessFlag = sessionStorage.getItem("loginSuccess");

    if (location.state?.loginSuccess === true && !loginSuccessFlag) {
      setShowModal(true);
      sessionStorage.setItem("loginSuccess", "true");

      const newState = { ...location.state };
      delete newState.loginSuccess;
      navigate(".", { replace: true, state: newState });
    }
  }, [location.state, navigate]);

  useEffect(() => {
    const accountsCollection = collection(db, "accounts");
  
    const unsubscribe = onSnapshot(
      accountsCollection,
      (querySnapshot) => {
        const accountList = querySnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          
          .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  
        setAccounts(accountList);
      },

      (error) => {
        message.error("Failed to load accounts.");
      }
    );
  
    return () => unsubscribe();
  }, []);  

  useEffect(() => {
    const departmentsCollection = collection(db, "departments");

    const unsubscribe = onSnapshot(
      departmentsCollection,
      (querySnapshot) => {
        const deptList = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        setDepartmentsAll(deptList); // full objects
      },
      (error) => {

        message.error("Failed to load departments.");
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    fetchAdminCredentials();
  }, []);

  useEffect(() => {
    handleSearch();
  }, [searchTerm, roleFilter, statusFilter, departmentFilter]);
  
  useEffect(() => {
    setFilteredAccounts(accounts); 
  }, [accounts]);

  useEffect(() => {
    const handleBackButton = (event) => {
      event.preventDefault();
      window.history.pushState(null, "", window.location.href);
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handleBackButton);

    return () => {
      window.removeEventListener("popstate", handleBackButton);
    };
  }, []); 

  const closeModal = () => {
    setShowModal(false);
    sessionStorage.removeItem("loginSuccess");
  };  

 const showDeptModal = () => {
    setNewDepartment("");
    setIsDeptModalVisible(true);
  };

  const handleDeptCancel = () => {
    setIsDeptModalVisible(false);
  };

  // const onJobTitleChange = (value) => {
  //   setJobTitle(value);

  //   form.setFieldsValue({
  //     role:
  //       value === "Dean"
  //         ? "admin"

  //         : value === "Laboratory Custodian"
  //         ? "super-user"

  //         : value === "Program Chair"
  //         ? "admin"

  //         : value === "Faculty"
  //         ? "User"

  //         : "",
  //     department: undefined, 
  //   });

  //   if (value === "Faculty") {
  //     const facultyDepts = departmentsAll.map((dept) => dept.name);
  //     setDepartments(facultyDepts);

  //   } else if (value === "Program Chair") {
  //     const programChairDepts = departmentsAll
  //       .map((dept) => dept.name)
  //       .filter((name) => name !== "SHS");
  //     setDepartments(programChairDepts);

  //   } else {
  //     setDepartments(departmentOptionsByJobTitle[value] || []);
  //   }
  // };

  const onJobTitleChange = (value) => {
    setJobTitle(value);

    // Set the role and department based on job title
    const role =
      value === "Dean"
        ? "admin"

        : value === "Laboratory Custodian"
        ? "super-user"

        : value === "Program Chair"
        ? "admin"

        : value === "Faculty"
        ? "User"
        : "";

    // Auto-set department to SAH for Laboratory Custodian
    const department = value === "Laboratory Custodian" ? "SAH" : undefined;

    form.setFieldsValue({
      role,
      department,
    });

    if (value === "Laboratory Custodian") {
      setDepartments(["SAH"]);

    } else if (value === "Faculty") {
      const facultyDepts = departmentsAll.map((dept) => dept.name);
      setDepartments(facultyDepts);

    } else if (value === "Program Chair") {
      const programChairDepts = departmentsAll
        .map((dept) => dept.name)
        .filter((name) => name !== "SHS");
      setDepartments(programChairDepts);

    } else {
      setDepartments(departmentOptionsByJobTitle[value] || []);
    }
  };

  const handleSearch = () => {
    let filteredData = [...accounts]; // Start with all accounts
    
    if (searchTerm) {
      filteredData = filteredData.filter(
        (account) =>
          account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          account.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  
    if (roleFilter) {
      filteredData = filteredData.filter((account) => account.role === roleFilter);
    }
  
    if (statusFilter) {
      filteredData = filteredData.filter(
        (account) => (statusFilter === "Active" ? !account.disabled : account.disabled)
      );
    }
  
    if (departmentFilter) {
      filteredData = filteredData.filter((account) => account.department === departmentFilter);
    }
  
    setFilteredAccounts(filteredData); 
  };

  const fetchAdminCredentials = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "super-admin"));
      if (!querySnapshot.empty) {
        const adminData = querySnapshot.docs[0].data(); 
        setAdminCredentials(adminData);

      } else {

        message.error("Super admin credentials not found!");
      }

    } catch (error) {

      message.error("Failed to load admin credentials.");
    }
  };
  
  const showModalHandler = (account) => {
    if (account) {
      setEditingAccount(account);
      form.setFieldsValue(account);

    } else {
      setEditingAccount(null);
      form.resetFields();
    }

    setIsModalVisible(true);
  };
  
  // FRONTEND
  // const handleSave = async (values) => {
  //   const capitalizeWords = (str) =>
  //     str
  //       .trim()
  //       .toLowerCase()
  //       .replace(/\b\w/g, (char) => char.toUpperCase());

  //   // Sanitize input by trimming extra spaces and lowering the case
  //   const sanitizedValues = {
  //     ...values,
  //     // name: values.name.trim().toLowerCase(),
  //     name: capitalizeWords(values.name),
  //     email: values.email.trim().toLowerCase(),
  //   };

  //   // Validate email domain
  //   const email = sanitizedValues.email;
  //   const validDomains = ["@students.nu-moa.edu.ph", "@nu-moa.edu.ph"];
  //   const isValidEmail = validDomains.some(domain => email.endsWith(domain));

  //   if (!isValidEmail) {
  //     setModalMessage("Only @students.nu-moa.edu.ph or @nu-moa.edu.ph emails are allowed!");
  //     setIsNotificationVisible(true);
  //     return;
  //   }

  //   // Check if the employeeId already exists in the 'accounts' collection
  //   const employeeQuery = query(
  //     collection(db, "accounts"),
  //     where("employeeId", "==", sanitizedValues.employeeId.trim())
  //   );
    
  //   const employeeSnapshot = await getDocs(employeeQuery);
    
  //   if (!employeeSnapshot.empty && employeeSnapshot.docs[0].id !== (editingAccount?.id || null)) {
  //     setModalMessage("This employee ID is already in use!");
  //     setIsNotificationVisible(true);
  //     return;
  //   }
  
  //   // Check for duplicates, ensuring all names and emails are unique
  //   const isDuplicate = accounts.some(
  //     (acc) =>
  //       acc.id !== (editingAccount?.id || null) &&
  //       (acc.name.toLowerCase() === sanitizedValues.name ||
  //         acc.email.toLowerCase() === sanitizedValues.email)
  //   );
  
  //   if (isDuplicate) {
  //     setModalMessage("An account with the same name or email already exists!");
  //     setIsNotificationVisible(true);
  //     return;
  //   }
  
  //   try {
  //     if (editingAccount) {
  //       // If editing an existing account
  //       const accountRef = doc(db, "accounts", editingAccount.id);
  //       await updateDoc(accountRef, sanitizedValues);
  
  //       const updatedAccounts = accounts.map((acc) =>
  //         acc.id === editingAccount.id ? { ...acc, ...sanitizedValues } : acc
  //       );
  
  //       setAccounts(updatedAccounts);
  //       setModalMessage("Account updated successfully!");
        
  //     } else {
  //       // If adding a new account
  //       const docRef = await addDoc(collection(db, "accounts"), sanitizedValues);
  //       const newAccount = { ...sanitizedValues, id: docRef.id };

  //       await fetch('https://sendemail-guopzbbmca-uc.a.run.app', {  // Use your deployed URL here
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json',
  //         },
  //         body: JSON.stringify({
  //           to: email.trim().toLowerCase(),
  //           subject: "Account Registration - Pending Approval",
  //           text: `Hi ${sanitizedValues.name},\n\nYour account has been added by the ITSO. You may now login your account. \n\nRegards,\nNU MOA ITSO Team`,
  //           html: `<p>Hi ${sanitizedValues.name},</p><p>Your account has been added by the ITSO. You may now login your account.</p><p>Regards,<br>NU MOA ITSO Team</p>`,
  //         }),
  //       });
  
  //       setAccounts([...accounts, newAccount]);
  //       setModalMessage("Account added successfully!");
  //       setIsNotificationVisible(true);
  //     }
  
  //     setIsNotificationVisible(true);

  //   } catch (error) {

  //     setModalMessage("Failed to update account.");
  //     setIsNotificationVisible(true);
  //   }
  
  //   setIsModalVisible(false);
  // };  

    // BACKEND
  // const handleSave = async (values) => {
  //   // Sanitize input locally
  //   // const sanitizedValues = {
  //   //   ...values,
  //   //   name: values.name.trim().toLowerCase(),
  //   //   email: values.email.trim().toLowerCase(),
  //   //   employeeId: values.employeeId.trim(),
  //   // };

  //   const capitalizeWords = (str) =>
  //     str
  //       .trim()
  //       .toLowerCase()
  //       .replace(/\b\w/g, (char) => char.toUpperCase());

  //   // Sanitize and format input
  //   const sanitizedValues = {
  //     ...values,
  //     // name: values.name.trim().toLowerCase(),
  //     name: capitalizeWords(values.name),
  //     email: values.email.trim().toLowerCase(),
  //     employeeId: values.employeeId.trim(),
  //   };

  //   // Validate email domain client-side early for quick feedback
  //   const validDomains = ["@students.nu-moa.edu.ph", "@nu-moa.edu.ph"];
  //   if (!validDomains.some(domain => sanitizedValues.email.endsWith(domain))) {
  //     setModalMessage("Only @students.nu-moa.edu.ph or @nu-moa.edu.ph emails are allowed!");
  //     setIsNotificationVisible(true);
  //     return;
  //   }

  //   try {
  //     const response = await fetch("https://webnuls.onrender.com/account/save", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         id: editingAccount?.id || undefined,  // send if editing, else undefined
  //         ...sanitizedValues,
  //       }),
  //     });

  //     const data = await response.json();

  //     if (!response.ok) {
  //       // Show error message from backend
  //       setModalMessage(data.error || "Failed to save account.");
  //       setIsNotificationVisible(true);
  //       return;
  //     }

  //     if (editingAccount) {
  //       // Update account in local state
  //       const updatedAccounts = accounts.map(acc =>
  //         acc.id === editingAccount.id ? { ...acc, ...sanitizedValues } : acc
  //       );
  //       setAccounts(updatedAccounts);
  //       setModalMessage(data.message || "Account updated successfully!");

  //     } else {
  //       // Add new account to local state with id from backend
  //       const newAccount = { ...sanitizedValues, id: data.id };
  //       setAccounts([...accounts, newAccount]);
  //       setModalMessage(data.message || "Account added successfully!");
  //     }

  //     setIsNotificationVisible(true);
  //     setIsModalVisible(false);

  //   } catch (error) {
  //     console.error("Error saving account:", error);
  //     setModalMessage("Failed to save account due to a network or server error.");
  //     setIsNotificationVisible(true);
  //   }
  // };  

   const handleSave = async (values) => {
    const capitalizeWords = (str) =>
      str
        .trim()
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());

    const sanitizedValues = {
      ...values,
      name: capitalizeWords(values.name),
      email: values.email.trim().toLowerCase(),
      employeeId: values.employeeId.trim(),
    };

    const validDomains = ["@students.nu-moa.edu.ph", "@nu-moa.edu.ph"];
    if (!validDomains.some(domain => sanitizedValues.email.endsWith(domain))) {
      setModalMessage("Only @students.nu-moa.edu.ph or @nu-moa.edu.ph emails are allowed!");
      setIsNotificationVisible(true);
      return;
    }

    // ✨ Fetch from localStorage for logging
    const userId = localStorage.getItem("userId") || "unknown";
    const userName = localStorage.getItem("userName") || "User";

    try {
      const response = await fetch("https://webnuls.onrender.com/account/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingAccount?.id || undefined,
          ...sanitizedValues,
          userId,
          userName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setModalMessage(data.error || "Failed to save account.");
        setIsNotificationVisible(true);
        return;
      }

      if (editingAccount) {
        const updatedAccounts = accounts.map(acc =>
          acc.id === editingAccount.id ? { ...acc, ...sanitizedValues } : acc
        );
        setAccounts(updatedAccounts);
        setModalMessage(data.message || "Account updated successfully!");
      } else {
        const newAccount = { ...sanitizedValues, id: data.id };
        setAccounts([...accounts, newAccount]);
        setModalMessage(data.message || "Account added successfully!");
      }

      setIsNotificationVisible(true);
      setIsModalVisible(false);

    } catch (error) {
      console.error("Error saving account:", error);
      setModalMessage("Failed to save account due to a network or server error.");
      setIsNotificationVisible(true);
    }
  };
  
  const handleDisable = async (id) => {
    try {
      // 1. Mark the account as disabled in Firestore
      await updateDoc(doc(db, "accounts", id), {
        disabled: true,
      });
  
      // 2. Update local state
      const updatedAccounts = accounts.map((acc) =>
        acc.id === id ? { ...acc, disabled: true } : acc
      );
      setAccounts(updatedAccounts);
  
      setModalMessage("Account disabled successfully!");
      setIsNotificationVisible(true);

    } catch (error) {

      message.error("Failed to disable account.");
    }
  };

  const handleEnable = async (id) => {
    try {
      await updateDoc(doc(db, "accounts", id), {
        disabled: false,
      });
  
      const updatedAccounts = accounts.map((acc) =>
        acc.id === id ? { ...acc, disabled: false } : acc
      );
      setAccounts(updatedAccounts);
  
      setModalMessage("Account enabled successfully!");
      setIsNotificationVisible(true);

    } catch (error) {
      message.error("Failed to enable account.");
    }
  };  

  // const handlePasswordConfirm = () => {
  //   if (adminCredentials && password === adminCredentials.password) {
  //     if (actionType === "edit") {
  //       const accountToEdit = accounts.find((acc) => acc.id === selectedAccountId);
  //       showModalHandler(accountToEdit);

  //     } else if (actionType === "delete") {
  //       handleDisable(selectedAccountId); 
  //     }

  //     message.success("Password confirmed!");
  //     setIsPasswordModalVisible(false);
  //     setPassword("");
  //     setPasswordError("");

  //   } else {
  //     setPasswordError("❗ Incorrect password. Please try again.");
  //   }
  // };

  const handlePasswordConfirm = async () => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setPasswordError("User not logged in.");
      return;
    }

    const credential = EmailAuthProvider.credential(currentUser.email, password);

    try {
      await reauthenticateWithCredential(currentUser, credential);

      if (actionType === "edit") {
        const accountToEdit = accounts.find((acc) => acc.id === selectedAccountId);
        showModalHandler(accountToEdit);
      } else if (actionType === "delete") {
        handleDisable(selectedAccountId);
      }

      message.success("Password confirmed!");
      setIsPasswordModalVisible(false);
      setPassword("");
      setPasswordError("");
      
    } catch (error) {
      console.error("Reauthentication error:", error);
      setPasswordError("❗ Incorrect password. Please try again.");
    }
  };

  const capitalizeWords = (str) =>
    str
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());

  // const handleAddDepartment = async () => {
  //   const trimmedName = newDepartment.trim();

  //   if (!trimmedName) {
  //     setModalMessage("Department name cannot be empty.");
  //     setIsNotificationVisible(true);
  //     return;
  //   }

  //   try {
  //     const formattedName = capitalizeWords(trimmedName);

  //     // Check if department already exists
  //     const deptQuery = query(collection(db, "departments"), where("name", "==", formattedName));
  //     const existingDepts = await getDocs(deptQuery);

  //     if (!existingDepts.empty) {
  //       setModalMessage("Department already exists!");
  //       setIsNotificationVisible(true);
  //       return;
  //     }

  //     // Generate custom doc ref so we can include the ID
  //     const deptRef = doc(collection(db, "departments"));
  //     const id = deptRef.id;

  //     await setDoc(deptRef, {
  //       id,
  //       name: formattedName,
  //       createdAt: new Date(),
  //     });

  //     setModalMessage("Department added successfully!");
  //     setIsNotificationVisible(true);
  //     setIsDeptModalVisible(false);
  //     setNewDepartment("");

  //   } catch (error) {
  //     message.error("Failed to add department.");
  //   }
  // };

  const handleAddDepartment = async () => {
    const trimmedName = newDepartment.trim();
    const trimmedCollege = newCollege.trim();

    if (!trimmedName || !trimmedCollege) {
      setModalMessage("Both department and college are required.");
      setIsNotificationVisible(true);
      return;
    }

    try {
      const formattedName = capitalizeWords(trimmedName);
      const formattedCollege = trimmedCollege.toUpperCase();

      const deptQuery = query(
        collection(db, "departments"),
        where("name", "==", formattedName)
      );
      const existingDepts = await getDocs(deptQuery);

      if (!existingDepts.empty) {
        setModalMessage("Department already exists!");
        setIsNotificationVisible(true);
        return;
      }

      const deptRef = doc(collection(db, "departments"));
      const id = deptRef.id;

      await setDoc(deptRef, {
        id,
        name: formattedName,
        college: formattedCollege, // <- 🔑 add this
        createdAt: new Date(),
      });

      setModalMessage("Department added successfully!");
      setIsNotificationVisible(true);
      setIsDeptModalVisible(false);
      setNewDepartment("");
      setNewCollege("");

    } catch (error) {
      console.error("Failed to add department: ", error);
      message.error("Failed to add department.");
    }
  };


  const confirmDelete = (id) => {
    setActionType("delete");
    setSelectedAccountId(id);
    setIsPasswordModalVisible(true);
  };

  const confirmEdit = (account) => {
    setActionType("edit");
    setSelectedAccountId(account.id);
    setIsPasswordModalVisible(true);
  };

  const getTagColor = (title) => {
    switch (title) {
      case "Dean":
        return "#ffd6e8"; 

      case "Program Chair":
        return "#e6f0ff"; 

      case "Laboratory Custodian":
        return "#f0e6ff";

      case "Faculty":
        return "#ffe6cc";
        
      default:
        return "#f0f0f0"; 
    }
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Department",
      dataIndex: "department",
      key: "department",
    },
    {
      title: "Job Title",
      dataIndex: "jobTitle",
      render: (jobTitle) => (
      <Tag
        style={{
          backgroundColor: getTagColor(jobTitle),
          color:
            jobTitle === "Dean"
              ? "#d6336c"

              : jobTitle === "Program Chair"
              ? "#096dd9" 

              : jobTitle === "Laboratory Custodian"
              ? "#722ed1" 

              : jobTitle === "Faculty"
              ? "#b34700" 

              : "#595959", 
          borderRadius: "8px",
          fontWeight: "500",
        }}
      >
        {jobTitle}
      </Tag>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => (
        <Tag color={record.disabled ? "red" : "green"}>
          {record.disabled ? "Disabled" : "Active"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (text, record) => (
        <>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => confirmEdit(record)}
            disabled={record.disabled} 
          />
          
          {record.disabled ? (
            <Popconfirm
              title="Enable this account?"
              onConfirm={() => handleEnable(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button type="link" style={{ color: "green" }}>Enable</Button>
            </Popconfirm>
          ) : (
            <Popconfirm
              title="Are you sure you want to disable this account?"
              onConfirm={() => confirmDelete(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button type="link" danger>Disable</Button>
            </Popconfirm>
          )}
        </>
      ),
    }    
  ];

  const handleEmployeeIdChange = (e) => {
    let rawValue = e.target.value.replace(/\D/g, ""); // Only digits
    if (rawValue.length > 6) rawValue = rawValue.slice(0, 6); // Limit to 6 digits

    // Auto-insert dash after 2 digits
    let formattedValue = rawValue;
    if (rawValue.length > 2) {
      formattedValue = rawValue.slice(0, 2) + "-" + rawValue.slice(2);
    }

    form.setFieldsValue({ employeeId: formattedValue });
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>

      <Layout className="site-layout">
        <Content className="account-content">
            <div className="header-container">

    <div className="header-center">
      <h2>Account Management</h2>
    </div>

    <div className="controls-row">

      <div className="filters">
        <Input
          placeholder="Search by name or email"
          value={searchTerm}
          onInput={(e) => {
            const sanitized = sanitizeInput(e.target.value);
            e.target.value = sanitized;
            setSearchTerm(sanitized);
          }}
        />

        <Select
          className="select-role"
          placeholder="Select Role"
          onChange={(value) => setRoleFilter(value)}
          allowClear
        >
          <Option value="admin">Admin</Option>
          <Option value="super-user">super-user</Option>
          <Option value="User">User</Option>
        </Select>

        <Select
          className="select-status"
          placeholder="Select Status"
          onChange={(value) => setStatusFilter(value)}
          allowClear
        >
          <Option value="Active">Active</Option>
          <Option value="Disabled">Disabled</Option>
        </Select>

        <Select
          className="select-department"
          placeholder="Select Department"
          onChange={(value) => setDepartmentFilter(value)}
          allowClear
        >
          <Option value="Nursing">Nursing</Option>
          <Option value="Medical Technology">Medical Technology</Option>
          <Option value="Dentistry">Dentistry</Option>
          <Option value="Pharmacy">Pharmacy</Option>
        </Select>
      </div>

      <div className="buttons-container">
        <Button
          className="add-buttons"
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => showModalHandler(null)}
        >
          Add Account
        </Button>
        <Button
          type="primary"
          className="add-buttons"
          icon={<PlusOutlined />}
          style={{ marginLeft: 8 }}
          onClick={showDeptModal}
        >
          Add Department
        </Button>
      </div>
    </div>
     </div>

          <Table
            // dataSource={accounts}
            dataSource={filteredAccounts}
            columns={columns}
            rowKey="id"
            className="account-table"
          />

          <Modal
            title={editingAccount ? "Edit Account" : "Add Account"}
            open={isModalVisible}
            onCancel={() => setIsModalVisible(false)}
            zIndex={1016}
            onOk={() => form.submit()}
            okText="Save"
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
              initialValues={{ role: "User", department: "Nursing" }}
            >

              <Form.Item
                name="name"
                label="Name"
                rules={[{ required: true, message: "Please enter the name" }]}
              >
                <Input
                  placeholder="Enter Name"
                  onChange={(e) => {
                    // Clean input: allow only letters and spaces
                    let value = e.target.value.replace(/[^a-zA-Z\s]/g, "");

                    // Auto-capitalize first letter of each word
                    value = value.replace(/\b\w/g, (char) => char.toUpperCase());

                    // Manually update the form field value using the form instance
                    form.setFieldsValue({ name: value });
                  }}
                  onKeyDown={(e) => {
                    const allowedKeys = [
                      "Backspace", "Tab", "ArrowLeft", "ArrowRight", "Delete", " ", // space
                    ];
                    const isLetter = /^[a-zA-Z]$/.test(e.key);
                    if (!isLetter && !allowedKeys.includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                />
              </Form.Item>

              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: "Please enter the email" },
                  {
                    type: "email",
                    message: "Enter a valid email address",
                  },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();

                      const domainPattern = /^[a-zA-Z0-9._%+-]+@(students\.nu-moa\.edu\.ph|nu-moa\.edu\.ph)$/i;
                      return domainPattern.test(value)
                        ? Promise.resolve()
                        : Promise.reject(
                            "Email must be a NU MOA email (e.g., name@students.nu-moa.edu.ph or name@nu-moa.edu.ph)"
                          );
                    },
                  },
                ]}
              >
                <Input
                  placeholder="Enter Email"
                  onChange={(e) => {
                    const value = e.target.value.replace(/\s/g, ""); // Remove all spaces
                    e.target.value = value;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === " ") {
                      e.preventDefault(); // Block spacebar
                    }
                  }}
                />
              </Form.Item>

              <Form.Item
                name="employeeId"
                label="Employee ID"
                rules={[
                  { required: true, message: "Please input Employee ID!" },
                  {
                    pattern: /^\d{2}-\d{4}$/,
                    message: "Format must be like 12-0430",
                  },
                ]}
              >
                <Input
                  placeholder="e.g., 12-0430"
                  maxLength={7}
                  onChange={handleEmployeeIdChange}
                />
              </Form.Item>

              <Form.Item
                name="jobTitle"
                label="Job Title"
                rules={[{ required: true, message: "Please select a role" }]}
              >
                <Select
                  placeholder="Select Role"
                  onChange={onJobTitleChange} 
                  allowClear
                >
                  <Option value="Dean">Dean</Option>
                  <Option value="Program Chair">Program Chair</Option>
                  <Option value="Laboratory Custodian">Laboratory Custodian</Option>
                  <Option value="Faculty">Faculty</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="department"
                label="Department"
                rules={[
                  {
                    required: true,
                    message: "Please select a department!",
                  },
                ]}
              >
                <Select placeholder="Select Department"
                disabled={!jobTitle || jobTitle === "Laboratory Custodian"}
                allowClear
                >
                {departments.map((dept) => (
                    <Option key={dept} value={dept}>
                      {dept}
                    </Option>
                ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="role"
                label="Role"
                rules={[{ required: true, message: "Job title is required" }]}
              >
                <Input disabled />
              </Form.Item>

            </Form>
          </Modal>
        </Content>

       <Modal
          title="Confirm Password"
          open={isPasswordModalVisible}
          onCancel={() => {
            setIsPasswordModalVisible(false);
            setPasswordError(""); 
            setPassword(""); 
          }}
          onOk={handlePasswordConfirm}
          okText="Confirm"
          zIndex={1017}
        >
          <Form layout="vertical">
            <Form.Item label="Enter your password to proceed:">
              <Input.Password
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError(""); 
                }}
                placeholder="Enter Password"
              />
            </Form.Item>

            {passwordError && (
              <p style={{ color: "red", marginTop: "-8px", marginBottom: "15px" }}>
                {passwordError}
              </p>
            )}
          </Form>
        </Modal>

        <Modal
          title="Add Department"
          visible={isDeptModalVisible}
          onOk={handleAddDepartment}
          onCancel={handleDeptCancel}
          okText="Add"
          zIndex={1022}
        >
          <Input
            placeholder="Enter department name"
            value={newDepartment}
             onInput={(e) => {
            const sanitized = sanitizeInput(e.target.value);
            e.target.value = sanitized;
            setNewDepartment(sanitized);
          }}
            onPressEnter={handleAddDepartment}
          />

          <Input
            placeholder="Enter college (e.g., SAH, SAS)"
            value={newCollege}
            onChange={(e) => setNewCollege(e.target.value)}
            onPressEnter={handleAddDepartment}
          />

          <List
            size="small"
            header={<div>Departments List</div>}
            bordered
            dataSource={departmentsAll}
            renderItem={item => (
              <List.Item key={item.id}>
                {item.name} <span style={{ color: 'gray' }}>({item.college})</span>
              </List.Item>
            )}
            style={{ marginTop: 16, maxHeight: 200, overflowY: "auto" }}
          />

          {/* <List
            size="small"
            header={<div>Departments List</div>}
            bordered
            dataSource={departmentsAll}
            renderItem={item => <List.Item key={item.id}>{item.name}</List.Item>}
            style={{ marginTop: 16, maxHeight: 200, overflowY: "auto" }}
          /> */}
        </Modal>

        <NotificationModal  
          isVisible={isNotificationVisible}
          onClose={() => setIsNotificationVisible(false)}
          message={modalMessage}/>

        <SuccessModal isVisible={showModal} onClose={closeModal} />
      </Layout>
    </Layout>
  );
};

export default AccountManagement; 