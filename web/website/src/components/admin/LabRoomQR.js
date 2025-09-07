// VERSION 1
// import React, { useEffect, useState, useRef } from "react";
// import { QRCodeCanvas } from "qrcode.react";
// import { Layout, Row, Col, Table, Input, Button, Typography, Modal, Tabs } from "antd";
// import { collection, getDocs, onSnapshot, doc, updateDoc, writeBatch, query, where } from "firebase/firestore";
// import { db } from "../../backend/firebase/FirebaseConfig";
// import "../styles/adminStyle/LabRoomQR.css";
// import { QRCodeSVG } from "qrcode.react";

// const { TabPane } = Tabs;

// const LabRoomQR = () => {
//   const [labRooms, setLabRooms] = useState([]);
//   const [originalRoomNumbers, setOriginalRoomNumbers] = useState({});
//   const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
//   const [confirmRoomId, setConfirmRoomId] = useState(null);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [expandedRooms, setExpandedRooms] = useState({});
//   const [itemSearchTerms, setItemSearchTerms] = useState({});
//   const [selectedRoom, setSelectedRoom] = useState(null);
//   const [activeTab, setActiveTab] = useState("1"); 
//   const [editingRooms, setEditingRooms] = useState({});
// const [tempRoomNumbers, setTempRoomNumbers] = useState({});
//   const qrRefs = useRef({});
//   const qrModalRef = useRef(null);

//   const [qrModal, setQrModal] = useState({
//     visible: false,
//     title: "",
//     value: "",
//   });

//   //  useEffect(() => {
//   //   const unsubscribeFunctions = [];

//   //   const fetchLabRoomsWithItems = async () => {
//   //     try {
//   //       const labRoomUnsub = onSnapshot(collection(db, "labRoom"), (labRoomSnapshot) => {
//   //       const rooms = labRoomSnapshot.docs.map(doc => {
//   //         const data = doc.data();
//   //         return {
//   //           id: doc.id,
//   //           name: data.name || "N/A",
//   //           roomNumber: data.roomNumber || "N/A",
//   //           qrCode: data.qrCode || "",
//   //           items: [],
//   //         };
//   //       });

//   //         // Set initial rooms (empty items for now)
//   //         setLabRooms(rooms);

//   //         const originalNumbers = {};
//   //         rooms.forEach(room => {
//   //           originalNumbers[room.id] = room.roomNumber;
//   //         });
//   //         setOriginalRoomNumbers(originalNumbers);

//   //         // Set up item listeners per room
//   //         labRoomSnapshot.docs.forEach((roomDoc) => {
//   //           const roomId = roomDoc.id;
//   //           const itemsCollectionRef = collection(db, `labRoom/${roomId}/items`);

//   //           const unsub = onSnapshot(itemsCollectionRef, (itemsSnapshot) => {
//   //             const updatedItems = itemsSnapshot.docs.map(itemDoc => {
//   //               const itemData = itemDoc.data();
//   //               return {
//   //                 id: itemDoc.id,
//   //                 category: itemData.category || "N/A",
//   //                 condition: itemData.condition
//   //                   ? `Good: ${itemData.condition.Good ?? 0}, Defect: ${itemData.condition.Defect ?? 0}, Damage: ${itemData.condition.Damage ?? 0}, Lost: ${itemData.condition.Lost ?? 0}`
//   //                   : "N/A",
//   //                 department: itemData.department || "N/A",
//   //                 entryCurrentDate: itemData.entryCurrentDate || "N/A",
//   //                 expiryDate: itemData.expiryDate || null,
//   //                 itemId: itemData.itemId || "N/A",
//   //                 itemName: itemData.itemName || "N/A",
//   //                 itemDetails: itemData.itemDetails || "N/A",
//   //                 labRoom: itemData.labRoom || "N/A",
//   //                 // quantity: itemData.quantity || 0,
//   //                 // quantity: itemData.quantity ?? (itemData.category === "Glasswares" ? [] : 0),
//   //                 quantity: itemData.quantity || 0,
//   //                 status: itemData.status || "N/A", 
//   //                 type: itemData.type || "N/A",
//   //                 rawTimestamp: itemData.rawTimestamp || "N/A",
//   //                 timestamp: itemData.timestamp || "N/A",
//   //                 // unit: itemData.unit || "N/A",
//   //                 // volume: itemData.volume || "N/A",
//   //                 unit: ["Chemical", "Reagent"].includes(itemData.category) ? itemData.unit || "N/A" : "N/A",
//   //               };
//   //             });

//   //             setLabRooms(prevRooms =>
//   //               prevRooms.map(room =>
//   //                 room.id === roomId ? { ...room, items: updatedItems } : room
//   //               )
//   //             );
//   //           });

//   //           unsubscribeFunctions.push(unsub);
//   //         });
//   //       });

//   //       unsubscribeFunctions.push(labRoomUnsub);

//   //     } catch (error) {
        
//   //     }
//   //   };

//   //   fetchLabRoomsWithItems();

//   //   return () => {
//   //     unsubscribeFunctions.forEach(unsub => unsub());
//   //   };
//   // }, []);

//   // useEffect(() => {
//   //   const unsubscribeFunctions = [];

//   //   const fetchLabRoomsWithItems = async () => {
//   //     try {
//   //       const labRoomUnsub = onSnapshot(collection(db, "labRoom"), (labRoomSnapshot) => {
//   //         const rooms = labRoomSnapshot.docs.map(doc => {
//   //           const data = doc.data();
//   //           return {
//   //             id: doc.id,
//   //             name: data.name || "N/A",
//   //             roomNumber: data.roomNumber || "N/A", // 🟢 get roomNumber here
//   //             qrCode: data.qrCode || "",
//   //             items: [],
//   //             shelves: {},
//   //           };
//   //         });

//   //         // Set initial rooms (empty items for now)
//   //         setLabRooms(rooms);

//   //         const originalNumbers = {};
//   //         rooms.forEach(room => {
//   //           originalNumbers[room.id] = room.roomNumber;
//   //         });

//   //         setOriginalRoomNumbers(originalNumbers);

//   //         // Set up item listeners per room
//   //         labRoomSnapshot.docs.forEach((roomDoc) => {
//   //           const roomId = roomDoc.id;
//   //           const itemsCollectionRef = collection(db, `labRoom/${roomId}/items`);

//   //           const unsub = onSnapshot(itemsCollectionRef, (itemsSnapshot) => {
//   //             const updatedItems = itemsSnapshot.docs.map(itemDoc => {
//   //               const itemData = itemDoc.data();
//   //               return {
//   //                 id: itemDoc.id,
//   //                 category: itemData.category || "N/A",
//   //                 condition: itemData.condition
//   //                   ? `Good: ${itemData.condition.Good ?? 0}, Defect: ${itemData.condition.Defect ?? 0}, Damage: ${itemData.condition.Damage ?? 0}, Lost: ${itemData.condition.Lost ?? 0}`
//   //                   : "N/A",
//   //                 department: itemData.department || "N/A",
//   //                 entryCurrentDate: itemData.entryCurrentDate || "N/A",
//   //                 expiryDate: itemData.expiryDate || null,
//   //                 itemId: itemData.itemId || "N/A",
//   //                 itemName: itemData.itemName || "N/A",
//   //                 itemDetails: itemData.itemDetails || "N/A",
//   //                 labRoom: itemData.labRoom || "N/A",
//   //                 quantity: itemData.quantity || 0,
//   //                 status: itemData.status || "N/A",
//   //                 type: itemData.type || "N/A",
//   //                 rawTimestamp: itemData.rawTimestamp || "N/A",
//   //                 timestamp: itemData.timestamp || "N/A",
//   //                 unit: ["Chemical", "Reagent"].includes(itemData.category) ? itemData.unit || "N/A" : "N/A",
//   //               };
//   //             });

//   //             setLabRooms(prevRooms =>
//   //               prevRooms.map(room =>
//   //                 room.id === roomId ? { ...room, items: updatedItems } : room
//   //               )
//   //             );
//   //           });

//   //           unsubscribeFunctions.push(unsub);

//   //           // Fetch shelves for each room
//   //           const shelvesCollectionRef = collection(db, `labRoom/${roomId}/shelves`);
//   //           const shelvesUnsub = onSnapshot(shelvesCollectionRef, async (shelvesSnapshot) => {
//   //             const updatedShelves = {};

//   //             // Loop through shelves and fetch rows for each shelf
//   //             for (const shelfDoc of shelvesSnapshot.docs) {
//   //               const shelfId = shelfDoc.id;
//   //               const shelfData = shelfDoc.data();

//   //               // Fetch rows for each shelf
//   //               const rowsCollectionRef = collection(db, `labRoom/${roomId}/shelves/${shelfId}/rows`);
//   //               const rowsSnapshot = await getDocs(rowsCollectionRef);
//   //               const rows = rowsSnapshot.docs.map(rowDoc => rowDoc.data());

//   //               // Add shelf and rows data
//   //               updatedShelves[shelfId] = {
//   //                 ...shelfData,
//   //                 rows: rows,
//   //               };
//   //             }

//   //             setLabRooms(prevRooms =>
//   //               prevRooms.map(room =>
//   //                 room.id === roomId ? { ...room, shelves: updatedShelves } : room
//   //               )
//   //             );
//   //           });

//   //           unsubscribeFunctions.push(shelvesUnsub);
//   //         });
//   //       });

//   //       unsubscribeFunctions.push(labRoomUnsub);

//   //     } catch (error) {
//   //       console.error("Error setting up real-time listeners:", error);
//   //     }
//   //   };

//   //   fetchLabRoomsWithItems();

//   //   return () => {
//   //     unsubscribeFunctions.forEach(unsub => unsub());
//   //   };
//   // }, []);


//   useEffect(() => {
//     const unsubscribeFunctions = [];

//     const fetchLabRoomsWithItems = async () => {
//       try {
//         /* ---------- STEP 1: listen to every lab room ---------- */
//         const labRoomUnsub = onSnapshot(
//           collection(db, "labRoom"),
//           (labRoomSnapshot) => {
//             /* ---------- skeleton rooms ---------- */
//             const rooms = labRoomSnapshot.docs.map((doc) => {
//               const data = doc.data();
//               return {
//                 id: doc.id,
//                 name: data.name || "N/A",
//                 roomNumber: data.roomNumber || "N/A",
//                 qrCode: data.qrCode || "",
//                 items: [],     // will fill later
//                 shelves: {},   // will fill later
//               };
//             });

//             setLabRooms(rooms);

//             /* store original room numbers */
//             const originalNumbers = {};
//             rooms.forEach((room) => (originalNumbers[room.id] = room.roomNumber));
//             setOriginalRoomNumbers(originalNumbers);

//             /* ---------- STEP 2: listeners inside each room ---------- */
//             labRoomSnapshot.docs.forEach((roomDoc) => {
//               const roomId = roomDoc.id;

//               /* 2‑A  items at /labRoom/{roomId}/items  (might be empty) */
//               const itemsCollectionRef = collection(db, `labRoom/${roomId}/items`);
//               const itemsUnsub = onSnapshot(itemsCollectionRef, (itemsSnap) => {
//                 const updatedItems = itemsSnap.docs.map((itemDoc) => {
//                   const d = itemDoc.data();
//                   return {
//                     id: itemDoc.id,
//                     category: d.category || "N/A",
//                     condition: d.condition
//                       ? `Good: ${d.condition.Good ?? 0}, Defect: ${
//                           d.condition.Defect ?? 0
//                         }, Damage: ${d.condition.Damage ?? 0}, Lost: ${
//                           d.condition.Lost ?? 0
//                         }`
//                       : "N/A",
//                     department: d.department || "N/A",
//                     entryCurrentDate: d.entryCurrentDate || "N/A",
//                     expiryDate: d.expiryDate || null,
//                     itemId: d.itemId || "N/A",
//                     itemName: d.itemName || "N/A",
//                     itemDetails: d.itemDetails || "N/A",
//                     labRoom: d.labRoom || "N/A",
//                     quantity: d.quantity || 0,
//                     status: d.status || "N/A",
//                     type: d.type || "N/A",
//                     rawTimestamp: d.rawTimestamp || "N/A",
//                     timestamp: d.timestamp || "N/A",
//                     unit: ["Chemical", "Reagent"].includes(d.category)
//                       ? d.unit || "N/A"
//                       : "N/A",
//                   };
//                 });

//                 setLabRooms((prev) =>
//                   prev.map((r) =>
//                     r.id === roomId ? { ...r, items: updatedItems } : r
//                   )
//                 );
//               });
//               unsubscribeFunctions.push(itemsUnsub);

//               /* 2‑B  shelves & rows listener */
//               const shelvesRef = collection(db, `labRoom/${roomId}/shelves`);
//               const shelvesUnsub = onSnapshot(shelvesRef, async (shelfSnap) => {
//                 const updatedShelves = {};

//                 /* ---------- STEP 3: for each shelf → rows → items ---------- */
//                 for (const shelfDoc of shelfSnap.docs) {
//                   const shelfId = shelfDoc.id;
//                   const shelfData = shelfDoc.data();

//                   /* rows under this shelf */
//                   const rowsRef = collection(
//                     db,
//                     `labRoom/${roomId}/shelves/${shelfId}/rows`
//                   );
//                   const rowsSnap = await getDocs(rowsRef);

//                   /* build rows with *items* sub‑collection */
//                   const rows = await Promise.all(
//                     rowsSnap.docs.map(async (rowDoc) => {
//                       const rowData = rowDoc.data(); // rowQR, createdAt, etc.
//                       const rowId = rowDoc.id;

//                       /* items under this row */
//                       const itemsRef = collection(
//                         db,
//                         `labRoom/${roomId}/shelves/${shelfId}/rows/${rowId}/items`
//                       );
//                       const itemsSnap = await getDocs(itemsRef);
//                       const items = itemsSnap.docs.map((it) => ({
//                         id: it.id,
//                         ...it.data(),
//                       }));

//                       return {
//                         rowId,
//                         ...rowData,
//                         items, // ← aggregated items for this row
//                       };
//                     })
//                   );

//                   updatedShelves[shelfId] = {
//                     ...shelfData,
//                     rows,
//                   };
//                 }

//                 /* ---------- STEP 4: write shelves back to room ---------- */
//                 setLabRooms((prev) =>
//                   prev.map((r) =>
//                     r.id === roomId ? { ...r, shelves: updatedShelves } : r
//                   )
//                 );
//               });

//               unsubscribeFunctions.push(shelvesUnsub);
//             });
//           }
//         );

//         unsubscribeFunctions.push(labRoomUnsub);
//       } catch (err) {
//         console.error("Error setting up real‑time listeners:", err);
//       }
//     };

//     fetchLabRoomsWithItems();

//     /* cleanup */
//     return () => {
//       unsubscribeFunctions.forEach((unsub) => unsub && unsub());
//     };
//   }, []);

//     const toggleRoomExpansion = (roomId) => {
//       setExpandedRooms(prev => ({
//         ...prev,
//         [roomId]: !prev[roomId],
//       }));
//     };

//     const closeQrModal = () =>
//       setQrModal((prev) => ({ ...prev, visible: false }));

//     const updateRoomNumber = async (roomId, oldRoomNumber, newRoomNumber) => {
//     try {
//       // 🔍 Step 1: Check if the new room number already exists (excluding the current roomId)
//       const labRoomRef = collection(db, "labRoom");
//       const existingRoomQuery = query(
//         labRoomRef,
//         where("roomNumber", "==", newRoomNumber)
//       );
//       const existingRoomSnapshot = await getDocs(existingRoomQuery);

//       const isRoomNumberTaken = existingRoomSnapshot.docs.some(doc => doc.id !== roomId);

//       if (isRoomNumberTaken) {
//         alert(`❌ Room number "${newRoomNumber}" already exists.`);
//         return;
//       }

//       // ✅ Step 2: Proceed with update
//       const roomRef = doc(db, "labRoom", roomId);
//       await updateDoc(roomRef, {
//         roomNumber: newRoomNumber,
//       });

//       const batch = writeBatch(db);

//       // 🔁 Update labRoom field in labRoom/{roomId}/items
//       const itemsRef = collection(db, "labRoom", roomId, "items");
//       const itemsSnapshot = await getDocs(itemsRef);

//       itemsSnapshot.forEach((itemDoc) => {
//         const itemRef = doc(db, "labRoom", roomId, "items", itemDoc.id);
//         batch.update(itemRef, {
//           labRoom: newRoomNumber,
//         });
//       });

//       // 🔁 Update labRoom field in inventory
//       const inventoryRef = collection(db, "inventory");
//       const inventoryQuery = query(
//         inventoryRef,
//         where("labRoom", "==", oldRoomNumber.trim())
//       );

//       const inventorySnapshot = await getDocs(inventoryQuery);

//       inventorySnapshot.forEach((invDoc) => {
//         const invRef = doc(db, "inventory", invDoc.id);
//         batch.update(invRef, {
//           labRoom: newRoomNumber,
//         });
//       });

//       await batch.commit();

//       // ✅ Update UI state
//       setOriginalRoomNumbers((prev) => ({
//         ...prev,
//         [roomId]: newRoomNumber,
//       }));

    
      
//     } catch (error) {
   
//     }
//   };

//   // const downloadQRCode = (id) => {
//   //   const canvas = qrRefs.current[id]?.querySelector("canvas");
//   //   if (!canvas) return;
//   //   const pngUrl = canvas
//   //     .toDataURL("image/png")
//   //     .replace("image/png", "image/octet-stream");

//   //   const downloadLink = document.createElement("a");
//   //   downloadLink.href = pngUrl;
//   //   downloadLink.download = `${id}-QR.png`;
//   //   document.body.appendChild(downloadLink);
//   //   downloadLink.click();
//   //   document.body.removeChild(downloadLink);
//   // };

//   const downloadQRCode = (id) => {
//     const svg = qrRefs.current[id]?.querySelector("svg");
//     if (!svg) return;

//     const svgData = new XMLSerializer().serializeToString(svg);
//     const canvas = document.createElement("canvas");
//     const ctx = canvas.getContext("2d");

//     const img = new Image();
//     const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
//     const url = URL.createObjectURL(svgBlob);

//     img.onload = () => {
//       canvas.width = img.width;
//       canvas.height = img.height;
//       ctx.drawImage(img, 0, 0);
//       URL.revokeObjectURL(url);

//       const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");

//       const downloadLink = document.createElement("a");
//       downloadLink.href = pngUrl;
//       downloadLink.download = `${id}-QR.png`;
//       document.body.appendChild(downloadLink);
//       downloadLink.click();
//       document.body.removeChild(downloadLink);
//     };

//     img.src = url;
//   };

//   const downloadQRCodeFromModal = () => {
//     const svg = qrModalRef.current?.querySelector("svg");
//     if (!svg) return;

//     const svgData = new XMLSerializer().serializeToString(svg);
//     const canvas = document.createElement("canvas");
//     const ctx = canvas.getContext("2d");

//     const img = new Image();
//     const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
//     const url = URL.createObjectURL(svgBlob);

//     img.onload = () => {
//       canvas.width = img.width;
//       canvas.height = img.height;
//       ctx.drawImage(img, 0, 0);
//       URL.revokeObjectURL(url);

//       const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");

//       const downloadLink = document.createElement("a");
//       downloadLink.href = pngUrl;
//       downloadLink.download = `${qrModal.title || "qr"}-QR.png`;
//       document.body.appendChild(downloadLink);
//       downloadLink.click();
//       document.body.removeChild(downloadLink);
//     };

//     img.src = url;
//   };

//   const filteredRooms = labRooms.filter((room) => {
//     const roomMatch =
//       room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase());

//     const itemMatch = room.items.some((item) =>
//       item.itemName.toLowerCase().includes(searchTerm.toLowerCase())
//     );

//     return roomMatch || itemMatch;
//   });

//   // const renderShelves = (roomId) => {
//   //   const room = labRooms.find((r) => r.id === roomId);
//   //   if (!room || !room.shelves || Object.keys(room.shelves).length === 0) {
//   //     return <div>No shelves available for this room.</div>;
//   //   }

//   //   const shelfColumns = [
//   //     {
//   //       title: 'Shelf',
//   //       dataIndex: 'shelf',
//   //       key: 'shelf',
//   //       render: (text, record) => <span>{record.shelfName || `Shelf ${record.shelfId}`}</span>,
//   //     },
//   //     {
//   //       title: 'Shelf QR Code',
//   //       dataIndex: 'shelfQR',
//   //       key: 'shelfQR',
//   //       render: (text) => <QRCodeSVG value={text || "No QR code available"} size={128} />,
//   //     },
//   //     {
//   //       title: 'Row Numbers',
//   //       dataIndex: 'rowNumbers',
//   //       key: 'rowNumbers',
//   //       render: (rows) => (
//   //         <div>
//   //           {rows && rows.length > 0 ? (
//   //             rows.map((row, index) => (
//   //               <div key={index}>
//   //                 <span>Row {row.row || "N/A"}</span>
//   //                 <QRCodeSVG value={row.rowQR || "No QR code available"} size={128} />
//   //               </div>
//   //             ))
//   //           ) : (
//   //             <div>No rows available</div>
//   //           )}
//   //         </div>
//   //       ),
//   //     },
//   //     {
//   //       title: 'Item Name',
//   //       dataIndex: 'itemName',
//   //       key: 'itemName',
//   //       render: (itemNames) => (
//   //         <div>
//   //           {itemNames && itemNames.length > 0 ? (
//   //             itemNames.map((itemName, index) => (
//   //               <div key={index}>{itemName || "No item name available"}</div>
//   //             ))
//   //           ) : (
//   //             <div>No item name available</div>
//   //           )}
//   //         </div>
//   //       ),
//   //     },
//   //   ];

//   //   const rowData = [];

//   //   // Iterate over each shelf and group all rows under the same shelf
//   //   Object.entries(room.shelves).forEach(([shelfId, shelfData]) => {
//   //     if (shelfData.rows) {
//   //       // Map through the rows and get the item details
//   //       const itemNames = shelfData.rows.map(row => {
//   //         // Assuming each row contains an itemId or details pointing to the item in the items collection
//   //         const item = room.items.find(item => item.itemId === row.itemId);
//   //         return item ? item.itemName : "No item name available"; // Fallback if no item found
//   //       });

//   //       rowData.push({
//   //         shelfId,
//   //         shelfName: shelfData.name,
//   //         shelfQR: shelfData.shelvesQR,
//   //         rowNumbers: shelfData.rows, // Group rows for the same shelf
//   //         itemName: itemNames, // Collect all item names for the rows
//   //       });
//   //     }
//   //   });

//   //   return <Table columns={shelfColumns} dataSource={rowData} rowKey="shelfId" />;
//   // };

//   const renderShelves = (roomId) => {
//     const room = labRooms.find((r) => r.id === roomId);

//     /* guard */
//     if (!room || !room.shelves || typeof room.shelves !== "object") {
//       return <div>No shelves available for this room.</div>;
//     }

//     /* ---------- table columns (one record per shelf) ---------- */
//     const cols = [
//       {
//         title: "Shelf",
//         dataIndex: "shelfLabel",
//         key: "shelfLabel",
//       },
//       {
//         title: "Shelf QR",
//         dataIndex: "shelfQR",
//         key: "shelfQR",
//         render: (qr, record, index) => (
//           <div ref={(el) => (qrRefs.current[record.key] = el)}>
//             <QRCodeSVG value={qr || "No QR"} size={96} />
//             <Button onClick={() => downloadQRCode(record.key)}>Download</Button>
//           </div>
//         ),
//       },
//       {
//         /* list of row numbers under this shelf */
//         title: "Rows",
//         dataIndex: "rows",
//         key: "rows",
//         render: (rows) =>
//           rows.length ? (
//             rows.map((r) => <div key={r.rowId}>Row {r.rowId}</div>)
//           ) : (
//             <i>No rows</i>
//           ),
//       },
//       // {
//       //   /* every row’s QR stacked */
//       //   title: "Row QR",
//       //   dataIndex: "rows",
//       //   key: "rowQR",
//       //   render: (rows) =>
//       //     rows.length ? (
//       //       rows.map((r) => (
//       //         <div key={r.rowId}>
//       //           <QRCodeSVG value={r.rowQR || "No QR"} size={96} />
//       //         </div>
//       //       ))
//       //     ) : (
//       //       <i>No rows</i>
//       //     ),
//       // },
//       {
//         title: "Row QR",
//         dataIndex: "rows",
//         key: "rowQR",
//         render: (rows, record) =>
//           rows.length ? (
//             rows.map((r) => (
//               <div key={r.rowId} style={{ marginBottom: 8 }}>
//                 <Button
//                   size="small"
//                   type="link"
//                   onClick={() =>
//                     setQrModal({
//                       visible: true,
//                       title: `${record.shelfLabel} – Row ${r.rowId}`,
//                       value: r.rowQR || "No QR",
//                     })
//                   }
//                 >
//                   View QR
//                 </Button>
//               </div>
//             ))
//           ) : (
//             <i>No rows</i>
//           ),
//       },
//       {
//         title: "Items on Row",
//         dataIndex: "rows",
//         key: "itemNames",
//         render: (rows) =>
//           rows.length ? (
//             rows.map((r) => (
//               <div key={r.rowId} style={{ marginBottom: 8 }}>
//                 <strong>Row {r.rowId}</strong>
//                 {Array.isArray(r.items) && r.items.length ? (
//                   <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
//                     {r.items.map((it) => (
//                       <li key={it.id || it.itemId}>{it.itemName || "(Unnamed)"}</li>
//                     ))}
//                   </ul>
//                 ) : (
//                   <i style={{ marginLeft: 6 }}>No items</i>
//                 )}
//               </div>
//             ))
//           ) : (
//             <i>No rows</i>
//           ),
//       },
//     ];

//     /* ---------- one table row per shelf ---------- */
//     const data = Object.entries(room.shelves).map(([shelfId, shelfData]) => ({
//       key: shelfId,
//       shelfLabel: shelfData.name || `Shelf ${shelfId}`,
//       shelfQR: shelfData.shelvesQR,
//       rows: shelfData.rows || [], // contains rowId, rowQR, items[]
//     }));

//     return <Table columns={cols} dataSource={data} pagination={false} />;
//   };

//   const renderRows = (roomId) => {
//     const room = labRooms.find((r) => r.id === roomId);
//     if (!room || !room.shelves || Object.keys(room.shelves).length === 0) {
//       return <div>No rows available for this room.</div>;
//     }

//     const rowColumns = [
//       {
//         title: 'Row Number',
//         dataIndex: 'row',
//         key: 'row',
//         render: (text) => <span>{text}</span>,
//       },
//       {
//         title: 'Item ID',
//         dataIndex: 'itemId',
//         key: 'itemId',
//         render: (text) => <span>{text}</span>,
//       },
//       {
//         title: 'Row QR Code',
//         dataIndex: 'rowQR',
//         key: 'rowQR',
//         render: (text) => <QRCodeSVG value={text} size={128} />,
//       },
//     ];

//     // Prepare row data
//     const rowData = [];
//     Object.entries(room.shelves).forEach(([shelfId, shelfData]) => {
//       if (shelfData.rows && shelfData.rows.length > 0) {
//         shelfData.rows.forEach((row) => {
//           rowData.push({
//             row: row.row,
//             itemId: row.itemId,
//             rowQR: row.rowQR,
//           });
//         });
//       }
//     });

//     return <Table columns={rowColumns} dataSource={rowData} rowKey="row" />;
//   };

//   return (
//     <div className="labroom-container">
//       <h2 className="labroom-header">Stock Room QR Codes</h2>

//       <Input.Search
//         placeholder="Search lab room by name or room number"
//         value={searchTerm}
//         onChange={(e) => {
//           const value = e.target.value;
//           const sanitized = value.trim().replace(/[^a-zA-Z0-9\s-]/g, "");
//           setSearchTerm(sanitized);
//         }}

//         style={{ width: 300, marginBottom: 20 }}
//         allowClear
//       />

//       {/* {filteredRooms.length === 0 ? (
//         <p>Loading Stock rooms and items...</p>
//       ) : (
//         filteredRooms
//           .filter(room => room.items && room.items.length > 0)
//           .map(room => (
//             <div key={room.id} className="labroom-table-wrapper">
//               <h3 className="labroom-title">
//                 Room:
//                 <input
//                   type="number"
//                   value={room.roomNumber}
//                   onChange={(e) => {
//                     const newRoomNumber = e.target.value;
//                     setLabRooms(prev =>
//                       prev.map(r => r.id === room.id ? { ...r, roomNumber: newRoomNumber } : r)
//                     );
//                   }}
//                   style={{ marginLeft: "10px", width: "120px" }}
//                 />

//                 <Button
//                   type="primary"
//                   onClick={() => {
//                     setConfirmRoomId(room.id);
//                     setIsConfirmModalVisible(true);
//                   }}
//                   style={{ marginLeft: "10px" }}
//                 >
//                   Save
//                 </Button>
//               </h3>

//               <table className="labroom-table">
//                 <thead>
//                   <tr>
//                     <th>QR Code</th>
//                     <th>Item Name</th>
//                     <th>Item Description</th>
//                     <th>Category</th>
//                     <th>Condition</th>
//                     <th>Department</th>
//                     <th>Quantity</th>
//                     <th>Status</th>
//                     <th>Type</th>
//                   </tr>
//                 </thead>

//                 <tbody>
//                   {room.items.map((item, index) => (
//                     <tr key={item.id}>
//                       {index === 0 ? (
//                         <td
//                           rowSpan={room.items.length}
//                           className="labroom-qr-cell"
//                         >
//                           <div
//                             ref={(el) => (qrRefs.current[room.id] = el)}
//                             className="labroom-qr"
//                           >

//                             <QRCodeSVG
//                               value={room.qrCode || "No QR code available"}
//                               size={128}
//                             />
                            
//                             <button
//                               onClick={() => downloadQRCode(room.id)}
//                               className="labroom-download-button"
//                             >
//                               Download QR
//                             </button>
//                           </div>
//                         </td>
//                       ) : null}
//                       <td>{item.itemName}</td>
//                       <td>{item.itemDetails}</td>
//                       <td>{item.category}</td>
//                       <td>{item.condition}</td>
//                       <td>{item.department}</td>
//                       <td>{item.quantity}</td>
//                       <td>{item.status}</td>
//                       <td>{item.type}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           ))
//       )} */}

//       {filteredRooms
//         .filter(room => room.items && room.items.length > 0)
//         .map(room => {
//     const isExpanded = expandedRooms[room.id];
//     const isEditing = editingRooms[room.id];

//           const filteredItems = room.items.filter(item =>
//             item.itemName.toLowerCase().includes((itemSearchTerms[room.id] || "").toLowerCase()) ||
//             item.itemDetails.toLowerCase().includes((itemSearchTerms[room.id] || "").toLowerCase()) ||
//             item.category.toLowerCase().includes((itemSearchTerms[room.id] || "").toLowerCase())
//           );
// return (
//       <div key={room.id} className="labroom-table-wrapper">
//         <div
//           className="labroom-title-wrapper"
//           onClick={() => setExpandedRooms(prev => ({
//             ...prev,
//             [room.id]: !prev[room.id],
//           }))}
//           style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
//         >
//           <h3 className="labroom-title" style={{ margin: 0, display: "flex", alignItems: "center" }}>
//   Room:

//   {isEditing ? (
//     <input
//       type="number"
//       value={tempRoomNumbers[room.id] ?? room.roomNumber}
//       onChange={(e) => {
//         const value = e.target.value;
//         setTempRoomNumbers(prev => ({
//           ...prev,
//           [room.id]: value,
//         }));
//       }}
//       onClick={(e) => e.stopPropagation()}
//       style={{
//         marginLeft: "10px",
//         width: "100px",
//         padding: "4px 8px",
//         border: "1px solid #ccc",
//         borderRadius: "4px",
//         fontSize: "16px",
//       }}
//     />
//   ) : (
//     <span
//       style={{
//         marginLeft: "10px",
//         fontWeight: "500",
//         fontSize: "16px",
//         color: "#333",
//       }}
//     >
//       {room.roomNumber}
//     </span>
//   )}

//   {isExpanded && isEditing && (
//     <>
//       <Button
//         type="primary"
//         onClick={(e) => {
//           e.stopPropagation();
//           setLabRooms(prev =>
//             prev.map(r =>
//               r.id === room.id
//                 ? { ...r, roomNumber: tempRoomNumbers[room.id] }
//                 : r
//             )
//           );
//           setEditingRooms(prev => ({ ...prev, [room.id]: false }));
//         }}
//         style={{ marginLeft: "10px" }}
//       >
//         Save
//       </Button>

//       <Button
//         onClick={(e) => {
//           e.stopPropagation();
//           setEditingRooms(prev => ({ ...prev, [room.id]: false }));
//           setTempRoomNumbers(prev => ({
//             ...prev,
//             [room.id]: room.roomNumber,
//           }));
//         }}
//         style={{ marginLeft: "6px" }}
//       >
//         Cancel
//       </Button>
//     </>
//   )}

//   {isExpanded && !isEditing && (
//     <Button
//       onClick={(e) => {
//         e.stopPropagation();
//         setEditingRooms(prev => ({ ...prev, [room.id]: true }));
//         setTempRoomNumbers(prev => ({
//           ...prev,
//           [room.id]: room.roomNumber,
//         }));
//       }}
//       style={{ marginLeft: "10px" }}
//     >
//       Edit
//     </Button>
//   )}
// </h3>
//                 <span className="dropdown-arrow">{isExpanded ? "▲" : "▼"}</span>
//               </div>

//               {isExpanded && (
//                 <>
//                 <Input
//                   type="text"
//                   placeholder="Search items in this room"
//                   value={itemSearchTerms[room.id] || ""}
//                  onChange={(e) => {
//                     const value = e.target.value;
//                     const sanitized = value.trim().replace(/[^a-zA-Z0-9\s-]/g, "");
//                     setItemSearchTerms(prev => ({ ...prev, [room.id]: sanitized }));
//                   }}

//                   style={{ marginBottom: 10, padding: 5, width: "100%" }}
//                 />

//                   <Tabs defaultActiveKey="1">
//                   <TabPane tab="Stock Room" key="1">
//                       <table className="labroom-table">
//                         <thead>
//                           <tr>
//                             <th>QR Code</th>
//                             <th>Item Name</th>
//                             <th>Item Description</th>
//                             <th>Category</th>
//                             <th>Condition</th>
//                             <th>Department</th>
//                             <th>Quantity</th>
//                             <th>Status</th>
//                             <th>Type</th>
//                             <th>Unit</th>
//                           </tr>
//                         </thead>

//                         <tbody>
//                           {/* {room.items.map((item, index) => (
//                             <tr key={item.id}>
//                               {index === 0 ? (
//                                 <td
//                                   rowSpan={room.items.length}
//                                   className="labroom-qr-cell"
//                                 >
//                                   <div
//                                     ref={(el) => (qrRefs.current[room.id] = el)}
//                                     className="labroom-qr"
//                                   >
//                                     <QRCodeSVG
//                                       value={room.qrCode || "No QR code available"}
//                                       size={128}
//                                     />
//                                     <button
//                                       onClick={() => downloadQRCode(room.id)}
//                                       className="labroom-download-button"
//                                     >
//                                       Download QR
//                                     </button>
//                                   </div>
//                                 </td>
//                               ) : null}
//                               <td>{item.itemName}</td>
//                               <td>{item.itemDetails}</td>
//                               <td>{item.category}</td>
//                               <td>{item.condition}</td>
//                               <td>{item.department}</td>
//                               <td>{item.quantity}</td>
//                               <td>{item.status}</td>
//                               <td>{item.type}</td>
//                               <td>{item.unit}</td>
//                             </tr>
//                           ))} */}

//                           {filteredItems.map((item, index) => (
//                             <tr key={item.id}>
//                               {index === 0 ? (
//                                 <td
//                                   rowSpan={filteredItems.length}
//                                   className="labroom-qr-cell"
//                                 >
//                                   <div
//                                     ref={(el) => (qrRefs.current[room.id] = el)}
//                                     className="labroom-qr"
//                                   >
//                                     <QRCodeSVG
//                                       value={room.qrCode || "No QR code available"}
//                                       size={128}
//                                     />
//                                     <button
//                                       onClick={() => downloadQRCode(room.id)}
//                                       className="labroom-download-button"
//                                     >
//                                       Download QR
//                                     </button>
//                                   </div>
//                                 </td>
//                               ) : null}
//                               <td>{item.itemName}</td>
//                               <td>{item.itemDetails}</td>
//                               <td>{item.category}</td>
//                               <td>{item.condition}</td>
//                               <td>{item.department}</td>
//                               <td>{item.quantity}</td>
//                               <td>{item.status}</td>
//                               <td>{item.type}</td>
//                               <td>{item.unit}</td>
//                             </tr>
//                           ))}
//                         </tbody>
//                       </table>
//                   </TabPane>

//                   <TabPane tab="Shelves" key="2">
//                       {selectedRoom ? (
//                         renderShelves(selectedRoom) // Automatically show shelves when room is expanded
//                       ) : (
//                         <div>Select a room to view shelves</div>
//                       )}
//                     </TabPane>

//                     {/* <TabPane tab="Rows" key="3">
//                       {selectedRoom ? (
//                         renderRows(selectedRoom) // Automatically show rows when room is expanded
//                       ) : (
//                         <div>Select a room to view rows</div>
//                       )}
//                     </TabPane> */}
//                 </Tabs>
//                 </>
//               )}
//             </div>
//           );
//         })}

//         <Modal
//           title="Confirm Room Number Update"
//           open={isConfirmModalVisible}
//           zIndex={1023}
//           onOk={() => {
//             if (confirmRoomId) {
//               updateRoomNumber(
//                 confirmRoomId,
//                 originalRoomNumbers[confirmRoomId],
//                 labRooms.find(r => r.id === confirmRoomId)?.roomNumber
//               );
//             }
//             setIsConfirmModalVisible(false);
//             setConfirmRoomId(null);
//           }}
//           onCancel={() => {
//             setIsConfirmModalVisible(false);
//             setConfirmRoomId(null);
//           }}
//           okText="Yes, Update"
//           cancelText="Cancel"
//         >
//           <p>
//             Are you sure you want to change the room number from "
//             <strong>{originalRoomNumbers[confirmRoomId]}</strong>" to "
//             <strong>{labRooms.find(r => r.id === confirmRoomId)?.roomNumber}</strong>"?
//           </p>
//         </Modal>

//         <Modal
//           open={qrModal.visible}
//           onCancel={closeQrModal}
//           footer={null}
//           title={qrModal.title}
//           destroyOnClose
//           centered
//           zIndex={1031}
//         >
//           <div style={{ textAlign: "center", marginTop: 16 }}>
//             <div ref={qrModalRef}>
//               <QRCodeSVG value={qrModal.value} size={200} />
//             </div>
//             <button
//               onClick={downloadQRCodeFromModal}
//               style={{
//                 marginTop: "1rem",
//                 padding: "6px 12px",
//                 background: "#1677ff",
//                 color: "white",
//                 border: "none",
//                 borderRadius: "4px",
//                 cursor: "pointer",
//               }}
//             >
//               Download QR
//             </button>
//           </div>
//         </Modal>
//     </div>
//   );
// };

// export default LabRoomQR;


// VERSION 2
import React, { useEffect, useState, useRef } from "react";
import { Table, Input, Button, Modal, Tabs } from "antd";
import { collection, getDocs, onSnapshot, doc, updateDoc, writeBatch, query, where } from "firebase/firestore";
import { db } from "../../backend/firebase/FirebaseConfig";
import "../styles/adminStyle/LabRoomQR.css";
import { QRCodeSVG } from "qrcode.react";

const { TabPane } = Tabs;

const LabRoomQR = () => {
  const [labRooms, setLabRooms] = useState([]);
  const [originalRoomNumbers, setOriginalRoomNumbers] = useState({});
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const [confirmRoomId, setConfirmRoomId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRooms, setExpandedRooms] = useState({});
  const [itemSearchTerms, setItemSearchTerms] = useState({});
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [activeTab, setActiveTab] = useState("1"); // Default to Stock Room tab (1)
  const qrRefs = useRef({});
  const qrModalRef = useRef(null);
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [downloadLoading, setDownloadLoading] = useState({});
  const [modalDownloadLoading, setModalDownloadLoading] = useState(false);

  const [qrModal, setQrModal] = useState({
    visible: false,
    title: "",
    value: "",
  });

  // useEffect(() => {
  //   const fetchLabRoomsWithItems = async () => {
  //     try {
  //       const labRoomSnapshot = await getDocs(collection(db, "labRoom"));
  //       const roomsWithItems = [];

  //       for (const roomDoc of labRoomSnapshot.docs) {
  //         const roomData = roomDoc.data();
  //         const roomId = roomDoc.id;

  //         // Fetch items subcollection for this room
  //         const itemsSnapshot = await getDocs(collection(db, `labRoom/${roomId}/items`));
  //         const items = itemsSnapshot.docs.map(itemDoc => {
  //           const itemData = itemDoc.data();
  //           return {
  //             id: itemDoc.id,
  //             category: itemData.category || "N/A",
  //             condition: itemData.condition || "N/A",
  //             department: itemData.department || "N/A",
  //             entryCurrentDate: itemData.entryCurrentDate || "N/A",
  //             expiryDate: itemData.expiryDate || null,
  //             itemId: itemData.itemId || "N/A",
  //             itemName: itemData.itemName || "N/A",
  //             labRoom: itemData.labRoom || "N/A",
  //             quantity: itemData.quantity || 0,
  //             status: itemData.status || "N/A",
  //             type: itemData.type || "N/A",
  //             rawTimestamp: itemData.rawTimestamp || "N/A",
  //             timestamp: itemData.timestamp || "N/A",
  //           };
  //         });

  //         roomsWithItems.push({
  //           id: roomId,
  //           name: roomData.name || "N/A",
  //           qrCode: roomData.qrCode || "",   // <-- Add lab room QR here
  //           items,
  //         });
  //       }

  //       setLabRooms(roomsWithItems);

  //     } catch (error) {
  //       console.error("Error fetching lab rooms and items:", error);
  //     }
  //   };

  //   fetchLabRoomsWithItems();
  // }, []);

  // useEffect(() => {
  //   const unsubscribeFunctions = [];

  //   const fetchLabRoomsWithItems = async () => {
  //     try {
  //       const labRoomUnsub = onSnapshot(collection(db, "labRoom"), (labRoomSnapshot) => {
  //         const initialRooms = labRoomSnapshot.docs.map(doc => ({
  //           id: doc.id,
  //           name: doc.data().name || "N/A",
  //           qrCode: doc.data().qrCode || "",
  //           items: [], // initially empty, will be filled via onSnapshot
  //         }));

  //         // Set rooms with no items yet
  //         setLabRooms(initialRooms);

  //         labRoomSnapshot.docs.forEach((roomDoc) => {
  //           const roomId = roomDoc.id;
  //           const itemsCollectionRef = collection(db, `labRoom/${roomId}/items`);

  //           const unsub = onSnapshot(itemsCollectionRef, (itemsSnapshot) => {
  //             const updatedItems = itemsSnapshot.docs.map(itemDoc => {
  //               const itemData = itemDoc.data();
  //               return {
  //                 id: itemDoc.id,
  //                 category: itemData.category || "N/A",
  //                 // condition: itemData.condition || "N/A",
  //                 condition: itemData.condition
  //                 ? `Good: ${itemData.condition.Good ?? 0}, Defect: ${itemData.condition.Defect ?? 0}, Damage: ${itemData.condition.Damage ?? 0}`
  //                 : "N/A",
  //                 department: itemData.department || "N/A",
  //                 entryCurrentDate: itemData.entryCurrentDate || "N/A",
  //                 expiryDate: itemData.expiryDate || null,
  //                 itemId: itemData.itemId || "N/A",
  //                 itemName: itemData.itemName || "N/A",
  //                 labRoom: itemData.labRoom || "N/A",
  //                 quantity: itemData.quantity || 0,
  //                 status: itemData.status || "N/A",
  //                 type: itemData.type || "N/A",
  //                 rawTimestamp: itemData.rawTimestamp || "N/A",
  //                 timestamp: itemData.timestamp || "N/A",
  //                 unit: itemData.unit || "N/A",
  //               };
  //             });

  //             // Update only that room's items in state
  //             setLabRooms(prevRooms => prevRooms.map(room =>
  //               room.id === roomId ? { ...room, items: updatedItems } : room
  //             ));
  //           });

  //           unsubscribeFunctions.push(unsub);
  //         });
  //       });

  //       unsubscribeFunctions.push(labRoomUnsub);

  //     } catch (error) {
  //       console.error("Error setting up real-time listeners:", error);
  //     }
  //   };

  //   fetchLabRoomsWithItems();

  //   return () => {
  //     unsubscribeFunctions.forEach(unsub => unsub());
  //   };
  // }, []);

  // useEffect(() => {
  //   const unsubscribeFunctions = [];

  //   const fetchLabRoomsWithItems = async () => {
  //     try {
  //       const labRoomUnsub = onSnapshot(collection(db, "labRoom"), (labRoomSnapshot) => {
  //         // const rooms = labRoomSnapshot.docs.map(doc => ({
  //         //   id: doc.id,
  //         //   name: doc.data().name || "N/A",
  //         //   qrCode: doc.data().qrCode || "",
  //         //   items: [],
  //         // }));

  //       const rooms = labRoomSnapshot.docs.map(doc => {
  //         const data = doc.data();
  //         return {
  //           id: doc.id,
  //           name: data.name || "N/A",
  //           roomNumber: data.roomNumber || "N/A", // 🟢 get roomNumber here
  //           qrCode: data.qrCode || "",
  //           items: [],
  //           shelves: {},
  //         };
  //       });


  //         // Set initial rooms (empty items for now)
  //         setLabRooms(rooms);

  //         const originalNumbers = {};
  //         rooms.forEach(room => {
  //           originalNumbers[room.id] = room.roomNumber;
  //         });

  //         setOriginalRoomNumbers(originalNumbers);

  //         // Set up item listeners per room
  //         labRoomSnapshot.docs.forEach((roomDoc) => {
  //           const roomId = roomDoc.id;
  //           const itemsCollectionRef = collection(db, `labRoom/${roomId}/items`);

  //           const unsub = onSnapshot(itemsCollectionRef, (itemsSnapshot) => {
  //             const updatedItems = itemsSnapshot.docs.map(itemDoc => {
  //               const itemData = itemDoc.data();
  //               return {
  //                 id: itemDoc.id,
  //                 category: itemData.category || "N/A",
  //                 condition: itemData.condition
  //                   ? `Good: ${itemData.condition.Good ?? 0}, Defect: ${itemData.condition.Defect ?? 0}, Damage: ${itemData.condition.Damage ?? 0}, Lost: ${itemData.condition.Lost ?? 0}`
  //                   : "N/A",
  //                 department: itemData.department || "N/A",
  //                 entryCurrentDate: itemData.entryCurrentDate || "N/A",
  //                 expiryDate: itemData.expiryDate || null,
  //                 itemId: itemData.itemId || "N/A",
  //                 itemName: itemData.itemName || "N/A",
  //                 itemDetails: itemData.itemDetails || "N/A",
  //                 labRoom: itemData.labRoom || "N/A",
  //                 quantity: itemData.quantity || 0,
  //                 status: itemData.status || "N/A",
  //                 type: itemData.type || "N/A",
  //                 rawTimestamp: itemData.rawTimestamp || "N/A",
  //                 timestamp: itemData.timestamp || "N/A",
  //                 // unit: itemData.unit || "N/A",
  //                 unit: ["Chemical", "Reagent"].includes(itemData.category) ? itemData.unit || "N/A" : "N/A",
  //                 // volume: itemData.volume || "N/A",
  //               };
  //             });

  //             setLabRooms(prevRooms =>
  //               prevRooms.map(room =>
  //                 room.id === roomId ? { ...room, items: updatedItems } : room
  //               )
  //             );
  //           });

  //           unsubscribeFunctions.push(unsub);

            
  //         });
  //       });

  //       unsubscribeFunctions.push(labRoomUnsub);

  //     } catch (error) {
  //       console.error("Error setting up real-time listeners:", error);
  //     }
  //   };

  //   fetchLabRoomsWithItems();

  //   return () => {
  //     unsubscribeFunctions.forEach(unsub => unsub());
  //   };
  // }, []);

  // useEffect(() => {
  //   const unsubscribeFunctions = [];

  //   const fetchLabRoomsWithItems = async () => {
  //     try {
  //       const labRoomUnsub = onSnapshot(collection(db, "labRoom"), (labRoomSnapshot) => {
  //         const rooms = labRoomSnapshot.docs.map(doc => {
  //           const data = doc.data();
  //           return {
  //             id: doc.id,
  //             name: data.name || "N/A",
  //             roomNumber: data.roomNumber || "N/A", // 🟢 get roomNumber here
  //             qrCode: data.qrCode || "",
  //             items: [],
  //             shelves: {},
  //           };
  //         });

  //         // Set initial rooms (empty items for now)
  //         setLabRooms(rooms);

  //         const originalNumbers = {};
  //         rooms.forEach(room => {
  //           originalNumbers[room.id] = room.roomNumber;
  //         });

  //         setOriginalRoomNumbers(originalNumbers);

  //         // Set up item listeners per room
  //         labRoomSnapshot.docs.forEach((roomDoc) => {
  //           const roomId = roomDoc.id;
  //           const itemsCollectionRef = collection(db, `labRoom/${roomId}/items`);

  //           const unsub = onSnapshot(itemsCollectionRef, (itemsSnapshot) => {
  //             const updatedItems = itemsSnapshot.docs.map(itemDoc => {
  //               const itemData = itemDoc.data();
  //               return {
  //                 id: itemDoc.id,
  //                 category: itemData.category || "N/A",
  //                 condition: itemData.condition
  //                   ? `Good: ${itemData.condition.Good ?? 0}, Defect: ${itemData.condition.Defect ?? 0}, Damage: ${itemData.condition.Damage ?? 0}, Lost: ${itemData.condition.Lost ?? 0}`
  //                   : "N/A",
  //                 department: itemData.department || "N/A",
  //                 entryCurrentDate: itemData.entryCurrentDate || "N/A",
  //                 expiryDate: itemData.expiryDate || null,
  //                 itemId: itemData.itemId || "N/A",
  //                 itemName: itemData.itemName || "N/A",
  //                 itemDetails: itemData.itemDetails || "N/A",
  //                 labRoom: itemData.labRoom || "N/A",
  //                 quantity: itemData.quantity || 0,
  //                 status: itemData.status || "N/A",
  //                 type: itemData.type || "N/A",
  //                 rawTimestamp: itemData.rawTimestamp || "N/A",
  //                 timestamp: itemData.timestamp || "N/A",
  //                 unit: ["Chemical", "Reagent"].includes(itemData.category) ? itemData.unit || "N/A" : "N/A",
  //               };
  //             });

  //             setLabRooms(prevRooms =>
  //               prevRooms.map(room =>
  //                 room.id === roomId ? { ...room, items: updatedItems } : room
  //               )
  //             );
  //           });

  //           unsubscribeFunctions.push(unsub);

  //           // Fetch shelves for each room
  //           const shelvesCollectionRef = collection(db, `labRoom/${roomId}/shelves`);
  //           const shelvesUnsub = onSnapshot(shelvesCollectionRef, async (shelvesSnapshot) => {
  //             const updatedShelves = {};

  //             // Loop through shelves and fetch rows for each shelf
  //             for (const shelfDoc of shelvesSnapshot.docs) {
  //               const shelfId = shelfDoc.id;
  //               const shelfData = shelfDoc.data();

  //               // Fetch rows for each shelf
  //               const rowsCollectionRef = collection(db, `labRoom/${roomId}/shelves/${shelfId}/rows`);
  //               const rowsSnapshot = await getDocs(rowsCollectionRef);
  //               const rows = rowsSnapshot.docs.map(rowDoc => rowDoc.data());

  //               // Add shelf and rows data
  //               updatedShelves[shelfId] = {
  //                 ...shelfData,
  //                 rows: rows,
  //               };
  //             }

  //             setLabRooms(prevRooms =>
  //               prevRooms.map(room =>
  //                 room.id === roomId ? { ...room, shelves: updatedShelves } : room
  //               )
  //             );
  //           });

  //           unsubscribeFunctions.push(shelvesUnsub);
  //         });
  //       });

  //       unsubscribeFunctions.push(labRoomUnsub);

  //     } catch (error) {
  //       console.error("Error setting up real-time listeners:", error);
  //     }
  //   };

  //   fetchLabRoomsWithItems();

  //   return () => {
  //     unsubscribeFunctions.forEach(unsub => unsub());
  //   };
  // }, []);

  useEffect(() => {
    const unsubscribeFunctions = [];

    const fetchLabRoomsWithItems = async () => {
      try {
        /* ---------- STEP 1: listen to every lab room ---------- */
        const labRoomUnsub = onSnapshot(
          collection(db, "labRoom"),
          (labRoomSnapshot) => {
            /* ---------- skeleton rooms ---------- */
            const rooms = labRoomSnapshot.docs.map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                name: data.name || "N/A",
                roomNumber: data.roomNumber || "N/A",
                qrCode: data.qrCode || "",
                items: [],     // will fill later
                shelves: {},   // will fill later
              };
            });

            setLabRooms(rooms);

            /* store original room numbers */
            const originalNumbers = {};
            rooms.forEach((room) => (originalNumbers[room.id] = room.roomNumber));
            setOriginalRoomNumbers(originalNumbers);

            /* ---------- STEP 2: listeners inside each room ---------- */
            labRoomSnapshot.docs.forEach((roomDoc) => {
              const roomId = roomDoc.id;

              /* 2‑A  items at /labRoom/{roomId}/items  (might be empty) */
              const itemsCollectionRef = collection(db, `labRoom/${roomId}/items`);
              const itemsUnsub = onSnapshot(itemsCollectionRef, (itemsSnap) => {
                const updatedItems = itemsSnap.docs.map((itemDoc) => {
                  const d = itemDoc.data();
                  return {
                    id: itemDoc.id,
                    category: d.category || "N/A",
                    condition: d.condition
                      ? `Good: ${d.condition.Good ?? 0}, Defect: ${
                          d.condition.Defect ?? 0
                        }, Damage: ${d.condition.Damage ?? 0}, Lost: ${
                          d.condition.Lost ?? 0
                        }`
                      : "N/A",
                    department: d.department || "N/A",
                    entryCurrentDate: d.entryCurrentDate || "N/A",
                    expiryDate: d.expiryDate || null,
                    itemId: d.itemId || "N/A",
                    itemName: d.itemName || "N/A",
                    itemDetails: d.itemDetails || "N/A",
                    labRoom: d.labRoom || "N/A",
                    quantity: d.quantity || 0,
                    status: d.status || "N/A",
                    type: d.type || "N/A",
                    rawTimestamp: d.rawTimestamp || "N/A",
                    timestamp: d.timestamp || "N/A",
                    unit: ["Chemical", "Reagent"].includes(d.category)
                      ? d.unit || "N/A"
                      : "N/A",
                  };
                });

                setLabRooms((prev) =>
                  prev.map((r) =>
                    r.id === roomId ? { ...r, items: updatedItems } : r
                  )
                );
              });
              unsubscribeFunctions.push(itemsUnsub);

              /* 2‑B  shelves & rows listener */
              const shelvesRef = collection(db, `labRoom/${roomId}/shelves`);
              const shelvesUnsub = onSnapshot(shelvesRef, async (shelfSnap) => {
                const updatedShelves = {};

                /* ---------- STEP 3: for each shelf → rows → items ---------- */
                for (const shelfDoc of shelfSnap.docs) {
                  const shelfId = shelfDoc.id;
                  const shelfData = shelfDoc.data();

                  /* rows under this shelf */
                  const rowsRef = collection(
                    db,
                    `labRoom/${roomId}/shelves/${shelfId}/rows`
                  );
                  const rowsSnap = await getDocs(rowsRef);

                  /* build rows with *items* sub‑collection */
                  const rows = await Promise.all(
                    rowsSnap.docs.map(async (rowDoc) => {
                      const rowData = rowDoc.data(); // rowQR, createdAt, etc.
                      const rowId = rowDoc.id;

                      /* items under this row */
                      const itemsRef = collection(
                        db,
                        `labRoom/${roomId}/shelves/${shelfId}/rows/${rowId}/items`
                      );
                      const itemsSnap = await getDocs(itemsRef);
                      const items = itemsSnap.docs.map((it) => ({
                        id: it.id,
                        ...it.data(),
                      }));

                      return {
                        rowId,
                        ...rowData,
                        items, // ← aggregated items for this row
                      };
                    })
                  );

                  updatedShelves[shelfId] = {
                    ...shelfData,
                    rows,
                  };
                }

                /* ---------- STEP 4: write shelves back to room ---------- */
                setLabRooms((prev) =>
                  prev.map((r) =>
                    r.id === roomId ? { ...r, shelves: updatedShelves } : r
                  )
                );
              });

              unsubscribeFunctions.push(shelvesUnsub);
            });
          }
        );

        unsubscribeFunctions.push(labRoomUnsub);
      } catch (err) {
        console.error("Error setting up real‑time listeners:", err);
      }
    };

    fetchLabRoomsWithItems();

    /* cleanup */
    return () => {
      unsubscribeFunctions.forEach((unsub) => unsub && unsub());
    };
  }, []);

  // const toggleRoomExpansion = (roomId) => {
  //   setExpandedRooms(prev => ({
  //     ...prev,
  //     [roomId]: !prev[roomId],
  //   }));
  // };

  const toggleRoomExpansion = (roomId) => {
    // Toggle the expansion state for the room
    setExpandedRooms((prev) => ({
      ...prev,
      [roomId]: !prev[roomId],
    }));

    // Automatically set the active tab to Shelves (tab 2) when expanding the room
    setSelectedRoom(roomId); 
    setActiveTab("2"); // Switch to Shelves tab
  };

  // Example: When the room number is clicked, set the selected room
  const selectRoom = (roomId) => {
    setSelectedRoom(roomId);
  };

  const closeQrModal = () =>
    setQrModal((prev) => ({ ...prev, visible: false }));

 const updateRoomNumber = async (roomId, oldRoomNumber, newRoomNumber) => {
    try {
      // 🔍 Step 1: Check if the new room number already exists (excluding the current roomId)
      const labRoomRef = collection(db, "labRoom");
      const existingRoomQuery = query(
        labRoomRef,
        where("roomNumber", "==", newRoomNumber)
      );
      const existingRoomSnapshot = await getDocs(existingRoomQuery);

      const isRoomNumberTaken = existingRoomSnapshot.docs.some(doc => doc.id !== roomId);

      if (isRoomNumberTaken) {
        alert(`❌ Room number "${newRoomNumber}" already exists.`);
        return;
      }

      // ✅ Step 2: Proceed with update
      const roomRef = doc(db, "labRoom", roomId);
      await updateDoc(roomRef, {
        roomNumber: newRoomNumber,
      });

      const batch = writeBatch(db);

      // 🔁 Update labRoom field in labRoom/{roomId}/items
      const itemsRef = collection(db, "labRoom", roomId, "items");
      const itemsSnapshot = await getDocs(itemsRef);

      itemsSnapshot.forEach((itemDoc) => {
        const itemRef = doc(db, "labRoom", roomId, "items", itemDoc.id);
        batch.update(itemRef, {
          labRoom: newRoomNumber,
        });
      });

      // 🔁 Update labRoom field in inventory
      const inventoryRef = collection(db, "inventory");
      const inventoryQuery = query(
        inventoryRef,
        where("labRoom", "==", oldRoomNumber.trim())
      );

      const inventorySnapshot = await getDocs(inventoryQuery);

      inventorySnapshot.forEach((invDoc) => {
        const invRef = doc(db, "inventory", invDoc.id);
        batch.update(invRef, {
          labRoom: newRoomNumber,
        });
      });

      await batch.commit();

      // ✅ Update UI state
      setOriginalRoomNumbers((prev) => ({
        ...prev,
        [roomId]: newRoomNumber,
      }));

      console.log(`✅ Updated labRoom ${roomId} to ${newRoomNumber} and synced all items/inventory.`);
      
    } catch (error) {
      console.error("❌ Error updating lab room and related data:", error);
    }
  };

  // const downloadQRCode = (id) => {
  //   const canvas = qrRefs.current[id]?.querySelector("canvas");
  //   if (!canvas) return;
  //   const pngUrl = canvas
  //     .toDataURL("image/png")
  //     .replace("image/png", "image/octet-stream");

  //   const downloadLink = document.createElement("a");
  //   downloadLink.href = pngUrl;
  //   downloadLink.download = `${id}-QR.png`;
  //   document.body.appendChild(downloadLink);
  //   downloadLink.click();
  //   document.body.removeChild(downloadLink);
  // };

  const downloadQRCode = (id) => {
    setDownloadLoading(prev => ({ ...prev, [id]: true }));
    
    const svg = qrRefs.current[id]?.querySelector("svg");
    if (!svg) {
      setDownloadLoading(prev => ({ ...prev, [id]: false }));
      return;
    }

    try {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const img = new Image();
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        try {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);

          const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");

          const downloadLink = document.createElement("a");
          downloadLink.href = pngUrl;
          downloadLink.download = `${id}-QR.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        } catch (error) {
          console.error("Error downloading QR code:", error);
        } finally {
          setDownloadLoading(prev => ({ ...prev, [id]: false }));
        }
      };

      img.onerror = () => {
        console.error("Error loading image for QR code download");
        setDownloadLoading(prev => ({ ...prev, [id]: false }));
      };

      img.src = url;
    } catch (error) {
      console.error("Error setting up QR code download:", error);
      setDownloadLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const downloadQRCodeFromModal = () => {
    setModalDownloadLoading(true);
    
    const svg = qrModalRef.current?.querySelector("svg");
    if (!svg) {
      setModalDownloadLoading(false);
      return;
    }

    try {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const img = new Image();
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        try {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);

          const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");

          const downloadLink = document.createElement("a");
          downloadLink.href = pngUrl;
          downloadLink.download = `${qrModal.title || "qr"}-QR.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        } catch (error) {
          console.error("Error downloading QR code from modal:", error);
        } finally {
          setModalDownloadLoading(false);
        }
      };

      img.onerror = () => {
        console.error("Error loading image for modal QR code download");
        setModalDownloadLoading(false);
      };

      img.src = url;
    } catch (error) {
      console.error("Error setting up modal QR code download:", error);
      setModalDownloadLoading(false);
    }
  };

  // return (
  //   <div className="labroom-container">
  //     <h2 className="labroom-header">Lab Room QR Codes</h2>

  //     {labRooms.length === 0 ? (
  //       <p>Loading lab rooms and items...</p>
  //     ) : (
  //       // labRooms.map(room => (
  //       //   <div key={room.id} className="labroom-card">
  //       //     <h3 className="labroom-title">
  //       //       Room: {room.name} ({room.id})
  //       //     </h3>

  //       //     {/* Lab Room QR Code */}
  //       //     <div
  //       //       ref={el => (qrRefs.current[room.id] = el)}
  //       //       className="labroom-qr"
  //       //       style={{ marginBottom: "10px" }}
  //       //     >
  //       //       <QRCodeCanvas value={room.qrCode || "No QR code available"} size={200} />
  //       //     </div>

  //       //     <button
  //       //       onClick={() => downloadQRCode(room.id)}
  //       //       className="labroom-download-button"
  //       //     >
  //       //       Download Room QR Code
  //       //     </button>

  //       //     {/* {(!room.items || room.items.length === 0) ? (
  //       //       <p>No items found in this room.</p>
  //       //     ) : (
  //       //       room.items.map(item => (
  //       //         <div key={item.id} className="labroom-item-card">
  //       //           <h4>{item.itemName} ({item.itemId})</h4>
  //       //           <p><strong>Category:</strong> {item.category}</p>
  //       //           <p><strong>Condition:</strong> {item.condition}</p>
  //       //           <p><strong>Department:</strong> {item.department}</p>
  //       //           <p><strong>Quantity:</strong> {item.quantity}</p>
  //       //           <p><strong>Status:</strong> {item.status}</p>
  //       //           <p><strong>Type:</strong> {item.type}</p>
  //       //         </div>
  //       //       ))
  //       //     )} */}

  //       //     {(!room.items || room.items.length === 0) ? (
  //       //       <p>No items found in this room.</p>
  //       //     ) : (
  //       //       <div className="labroom-table-container">
  //       //         <table className="labroom-table">
  //       //           <thead>
  //       //             <tr>
  //       //               <th>Item Name</th>
  //       //               <th>Item ID</th>
  //       //               <th>Category</th>
  //       //               <th>Condition</th>
  //       //               <th>Department</th>
  //       //               <th>Quantity</th>
  //       //               <th>Status</th>
  //       //               <th>Type</th>
  //       //             </tr>
  //       //           </thead>
  //       //           <tbody>
  //       //             {room.items.map(item => (
  //       //               <tr key={item.id}>
  //       //                 <td>{item.itemName}</td>
  //       //                 <td>{item.itemId}</td>
  //       //                 <td>{item.category}</td>
  //       //                 <td>{item.condition}</td>
  //       //                 <td>{item.department}</td>
  //       //                 <td>{item.quantity}</td>
  //       //                 <td>{item.status}</td>
  //       //                 <td>{item.type}</td>
  //       //               </tr>
  //       //             ))}
  //       //           </tbody>
  //       //         </table>
  //       //       </div>
  //       //     )}
  //       //   </div>
  //       // ))
        
  //       labRooms.map(room => (
  //         <div key={room.id} className="labroom-table-wrapper">
  //           <h3 className="labroom-title">
  //             Room: {room.name} ({room.id})
  //           </h3>
  //           <table className="labroom-table">
  //             <thead>
  //               <tr>
  //                 <th>QR Code</th>
  //                 <th>Item Name</th>
  //                 <th>Item ID</th>
  //                 <th>Category</th>
  //                 <th>Condition</th>
  //                 <th>Department</th>
  //                 <th>Quantity</th>
  //                 <th>Status</th>
  //                 <th>Type</th>
  //               </tr>
  //             </thead>

  //             <tbody>
  //               {room.items && room.items.length > 0 ? (
  //                 room.items.map((item, index) => (
  //                   <tr key={item.id}>
  //                     {index === 0 ? (
  //                       <td
  //                         rowSpan={room.items.length}
  //                         className="labroom-qr-cell"
  //                       >
  //                         <div
  //                           ref={(el) => (qrRefs.current[room.id] = el)}
  //                           className="labroom-qr"
  //                         >
  //                           <QRCodeCanvas
  //                             value={room.qrCode || "No QR code available"}
  //                             size={128}
  //                           />
  //                           <button
  //                             onClick={() => downloadQRCode(room.id)}
  //                             className="labroom-download-button"
  //                           >
  //                             Download QR
  //                           </button>
  //                         </div>
  //                       </td>
  //                     ) : null}
  //                     <td>{item.itemName}</td>
  //                     <td>{item.itemId}</td>
  //                     <td>{item.category}</td>
  //                     <td>{item.condition}</td>
  //                     <td>{item.department}</td>
  //                     <td>
  //                       {item.quantity}
  //                       {["Chemical", "Reagent"].includes(item.category) && item.unit ? ` ${item.unit}` : ""}
  //                     </td>
  //                     <td>{item.status}</td>
  //                     <td>{item.type}</td>
  //                   </tr>
  //                 ))
  //               ) : (
  //                 <tr>
  //                   <td colSpan="9">No items found in this room.</td>
  //                 </tr>
  //               )}
  //             </tbody>
  //           </table>
  //         </div>
  //       ))
  //     )}
  //   </div>
  // );

  // const filteredRooms = labRooms.filter((room) =>
  //   room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //   room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase())
  // );

  const filteredRooms = labRooms.filter((room) => {
    const roomMatch =
      room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const itemMatch = room.items.some((item) =>
      item.itemName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return roomMatch || itemMatch;
  });

// const renderShelves = (roomId) => {
//   const room = labRooms.find((r) => r.id === roomId);

//   if (!room || !room.shelves || typeof room.shelves !== "object") {
//     return <div>No shelves available for this room.</div>;
//   }

//   const cols = Array.isArray([
//     {
//       title: "Shelf",
//       dataIndex: "shelfLabel",
//       key: "shelfLabel",
//     },
//     {
//       title: "Shelf QR",
//       dataIndex: "shelfQR",
//       key: "shelfQR",
//       render: (qr) => <QRCodeSVG value={qr || "No QR"} size={96} />,
//     },
//     {
//       title: "Row",
//       dataIndex: "rowId",
//       key: "rowId",
//     },
//     {
//       title: "Row QR",
//       dataIndex: "rowQR",
//       key: "rowQR",
//       render: (qr) => <QRCodeSVG value={qr || "No QR"} size={96} />,
//     },
//     {
//       title: "Items on Row",
//       dataIndex: "itemNames",
//       key: "itemNames",
//       render: (names) =>
//         Array.isArray(names) && names.length > 0 ? (
//           names.map((n, i) => <div key={i}>{n}</div>)
//         ) : (
//           <i>No items</i>
//         ),
//     },
//   ])
//     ? [
//         {
//           title: "Shelf",
//           dataIndex: "shelfLabel",
//           key: "shelfLabel",
//         },
//         {
//           title: "Shelf QR",
//           dataIndex: "shelfQR",
//           key: "shelfQR",
//           render: (qr) => <QRCodeSVG value={qr || "No QR"} size={96} />,
//         },
//         {
//           title: "Row",
//           dataIndex: "rowId",
//           key: "rowId",
//         },
//         {
//           title: "Row QR",
//           dataIndex: "rowQR",
//           key: "rowQR",
//           render: (qr) => <QRCodeSVG value={qr || "No QR"} size={96} />,
//         },
//         {
//           title: "Items on Row",
//           dataIndex: "itemNames",
//           key: "itemNames",
//           render: (names) =>
//             Array.isArray(names) && names.length > 0 ? (
//               names.map((n, i) => <div key={i}>{n}</div>)
//             ) : (
//               <i>No items</i>
//             ),
//         },
//       ]
//     : [];

//   const data = [];

//   Object.entries(room.shelves || {}).forEach(([shelfId, shelfData]) => {
//     (shelfData.rows ?? []).forEach((row) => {
//       const itemNames = Array.isArray(row.items)
//         ? row.items.map((it) => it.itemName || "(Unnamed)")
//         : [];

//       data.push({
//         key: `${shelfId}-${row.rowId}`,
//         shelfLabel: shelfData.name || `Shelf ${shelfId}`,
//         shelfQR: shelfData.shelvesQR,
//         rowId: row.rowId,
//         rowQR: row.rowQR,
//         itemNames,
//       });
//     });
//   });

//   return (
//     <Table
//       columns={cols}
//       dataSource={Array.isArray(data) ? data : []}
//       pagination={false}
//     />
//   );
// };

  const renderShelves = (roomId) => {
    const room = labRooms.find((r) => r.id === roomId);

    /* guard */
    if (!room || !room.shelves || typeof room.shelves !== "object") {
      return <div>No shelves available for this room.</div>;
    }

    /* ---------- table columns (one record per shelf) ---------- */
    const cols = [
      {
        title: "Shelf",
        dataIndex: "shelfLabel",
        key: "shelfLabel",
      },
      // {
      //   title: "Shelf QR",
      //   dataIndex: "shelfQR",
      //   key: "shelfQR",
      //   render: (qr) => <QRCodeSVG value={qr || "No QR"} size={96} />,
      // },
      {
        title: "Shelf QR",
        dataIndex: "shelfQR",
        key: "shelfQR",
        render: (qr, record, index) => (
          <div ref={(el) => (qrRefs.current[record.key] = el)}>
            <QRCodeSVG value={qr || "No QR"} size={96} />
            <Button onClick={() => downloadQRCode(record.key)}>Download</Button>
          </div>
        ),
      },
      {
        /* list of row numbers under this shelf */
        title: "Rows",
        dataIndex: "rows",
        key: "rows",
        render: (rows) =>
          rows.length ? (
            rows.map((r) => <div key={r.rowId}>Row {r.rowId}</div>)
          ) : (
            <i>No rows</i>
          ),
      },
      // {
      //   /* every row’s QR stacked */
      //   title: "Row QR",
      //   dataIndex: "rows",
      //   key: "rowQR",
      //   render: (rows) =>
      //     rows.length ? (
      //       rows.map((r) => (
      //         <div key={r.rowId}>
      //           <QRCodeSVG value={r.rowQR || "No QR"} size={96} />
      //         </div>
      //       ))
      //     ) : (
      //       <i>No rows</i>
      //     ),
      // },
      {
        title: "Row QR",
        dataIndex: "rows",
        key: "rowQR",
        render: (rows, record) =>
          rows.length ? (
            rows.map((r) => (
              <div key={r.rowId} style={{ marginBottom: 8 }}>
                <Button
                  size="small"
                  type="link"
                  onClick={() =>
                    setQrModal({
                      visible: true,
                      title: `${record.shelfLabel} – Row ${r.rowId}`,
                      value: r.rowQR || "No QR",
                    })
                  }
                >
                  View QR
                </Button>
              </div>
            ))
          ) : (
            <i>No rows</i>
          ),
      },
      {
        title: "Items on Row",
        dataIndex: "rows",
        key: "itemNames",
        render: (rows) =>
          rows.length ? (
            rows.map((r) => (
              <div key={r.rowId} style={{ marginBottom: 8 }}>
                <strong>Row {r.rowId}</strong>
                {Array.isArray(r.items) && r.items.length ? (
                  <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
                    {r.items.map((it) => (
                      <li key={it.id || it.itemId}>{it.itemName || "(Unnamed)"}</li>
                    ))}
                  </ul>
                ) : (
                  <i style={{ marginLeft: 6 }}>No items</i>
                )}
              </div>
            ))
          ) : (
            <i>No rows</i>
          ),
      },
    ];

    /* ---------- one table row per shelf ---------- */
    const data = Object.entries(room.shelves).map(([shelfId, shelfData]) => ({
      key: shelfId,
      shelfLabel: shelfData.name || `Shelf ${shelfId}`,
      shelfQR: shelfData.shelvesQR,
      rows: shelfData.rows || [], // contains rowId, rowQR, items[]
    }));

    return (
      <div className="labroom-table-container">
        <Table 
          columns={cols} 
          dataSource={data} 
          pagination={false}
          scroll={{ x: 800 }} // Enable horizontal scrolling
        />
      </div>
    );
  };

  const renderRows = (roomId) => {
    const room = labRooms.find((r) => r.id === roomId);
    if (!room || !room.shelves || Object.keys(room.shelves).length === 0) {
      return <div>No rows available for this room.</div>;
    }

    const rowColumns = [
      {
        title: 'Row Number',
        dataIndex: 'row',
        key: 'row',
        render: (text) => <span>{text}</span>,
      },
      {
        title: 'Item ID',
        dataIndex: 'itemId',
        key: 'itemId',
        render: (text) => <span>{text}</span>,
      },
      {
        title: 'Row QR Code',
        dataIndex: 'rowQR',
        key: 'rowQR',
        render: (text) => <QRCodeSVG value={text} size={128} />,
      },
    ];

    // Prepare row data
    const rowData = [];
    Object.entries(room.shelves).forEach(([shelfId, shelfData]) => {
      if (shelfData.rows && shelfData.rows.length > 0) {
        shelfData.rows.forEach((row) => {
          rowData.push({
            row: row.row,
            itemId: row.itemId,
            rowQR: row.rowQR,
          });
        });
      }
    });

    return (
      <div className="labroom-table-container">
        <Table 
          columns={rowColumns} 
          dataSource={rowData} 
          rowKey="row"
          scroll={{ x: 600 }} // Enable horizontal scrolling
        />
      </div>
    );
  };

  // 1. Filter rooms based on a general search term (searchTerm)
// const filteredRooms = labRooms.filter((room) => {
//   const lowerSearchTerm = searchTerm.toLowerCase();

//   // Check if room matches the search term
//   const roomMatch =
//     room.name.toLowerCase().includes(lowerSearchTerm) ||
//     room.roomNumber.toLowerCase().includes(lowerSearchTerm);

//   // Check if any item inside the room matches the search term
//   const itemMatch = room.items.some((item) =>
//     item.itemName.toLowerCase().includes(lowerSearchTerm)
//   );

//   return roomMatch || itemMatch;
// });

// // 2. For each filtered room, filter its items using itemSearchTerms for that specific room.id
// // Assuming you do this inside a render/map or a function with access to each room:

// filteredRooms.forEach(room => {
//   const searchForThisRoom = (itemSearchTerms[room.id] || "").toLowerCase();

//   const filteredItems = room.items.filter(item =>
//     item.itemName.toLowerCase().includes(searchForThisRoom) ||
//     item.itemDetails.toLowerCase().includes(searchForThisRoom) ||
//     item.category.toLowerCase().includes(searchForThisRoom)
//   );

//   console.log(`Filtered items for room ${room.name}:`, filteredItems);
//   // You can use filteredItems now for rendering or logic per room
// });

  return (
    <div className="labroom-container">
      <h2 className="labroom-header">Lab Room QR Codes</h2>

      <Input.Search
        placeholder="Search lab room by name or room number"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ 
          width: window.innerWidth <= 768 ? '100%' : 300, 
          marginBottom: 20,
          maxWidth: '100%'
        }}
        allowClear
      />

      {/* {filteredRooms.length === 0 ? (
        <p>Loading lab rooms and items...</p>
      ) : (
        filteredRooms
          .filter(room => room.items && room.items.length > 0)
          .map(room => (
            <div key={room.id} className="labroom-table-wrapper">
              <h3 className="labroom-title">
                Room:
                <input
                  type="number"
                  value={room.roomNumber}
                  onChange={(e) => {
                    const newRoomNumber = e.target.value;
                    setLabRooms(prev =>
                      prev.map(r => r.id === room.id ? { ...r, roomNumber: newRoomNumber } : r)
                    );
                  }}
                  style={{ marginLeft: "10px", width: "120px" }}
                />

                <button
                  onClick={() =>
                    updateRoomNumber(room.id, originalRoomNumbers[room.id], room.roomNumber)
                  }
                  style={{ marginLeft: "10px" }}
                >
                  Save
                </button>

              <button
                onClick={() => {
                  const confirmed = window.confirm(
                    `Are you sure you want to change the room number from "${originalRoomNumbers[room.id]}" to "${room.roomNumber}"?`
                  );
                  if (confirmed) {
                    updateRoomNumber(room.id, originalRoomNumbers[room.id], room.roomNumber);
                  }
                }}
                style={{ marginLeft: "10px" }}
              >
                Save
              </button>

                <Button
                  type="primary"
                  onClick={() => {
                    setConfirmRoomId(room.id);
                    setIsConfirmModalVisible(true);
                  }}
                  style={{ marginLeft: "10px" }}
                >
                  Save
                </Button>
              </h3>

              <table className="labroom-table">
                <thead>
                  <tr>
                    <th>QR Code</th>
                    <th>Item Name</th>
                    <th>Item Description</th>
                    <th>Item ID</th>
                    <th>Category</th>
                    <th>Condition</th>
                    <th>Department</th>
                    <th>Quantity</th>
                    <th>Status</th>
                    <th>Type</th>
                  </tr>
                </thead>

                <tbody>
                  {room.items.map((item, index) => (
                    <tr key={item.id}>
                      {index === 0 ? (
                        <td
                          rowSpan={room.items.length}
                          className="labroom-qr-cell"
                        >
                          <div
                            ref={(el) => (qrRefs.current[room.id] = el)}
                            className="labroom-qr"
                          >
                            <QRCodeSVG
                              value={room.qrCode || "No QR code available"}
                              size={128}
                            />
                            <button
                              onClick={() => downloadQRCode(room.id)}
                              className="labroom-download-button"
                            >
                              Download QR
                            </button>
                          </div>
                        </td>
                      ) : null}
                      <td>{item.itemName}</td>
                      <td>{item.itemDetails}</td>
                      <td>{item.itemId}</td>
                      <td>{item.category}</td>
                      <td>{item.condition}</td>
                      <td>{["Chemical", "Reagent"].includes(item.category) ? "N/A" : item.condition}</td>
                      <td>
                        {item.category === "Chemical" || item.category === "Reagent" ? (
                          <span style={{ fontStyle: "italic", color: "#999" }}>N/A</span>
                        ) : (
                          <>
                            <div>Good: {item.condition?.Good ?? 0}</div>
                            <div>Defect: {item.condition?.Defect ?? 0}</div>
                            <div>Damage: {item.condition?.Damage ?? 0}</div>
                          </>
                        )}
                      </td> 
                      <td>{item.department}</td>
                      <td>{item.quantity}</td>
                      <td>
                        {item.quantity}
                        {["Chemical", "Reagent"].includes(item.category) && item.unit ? ` ${item.unit}` : ""}
                      </td>
                      <td>
                        {item.quantity}
                        {item.category === "Glasswares" ? " pcs" : ""}
                        {item.category === "Glasswares" && item.volume ? ` / ${item.volume} ML` : ""}
                        {["Chemical", "Reagent"].includes(item.category) && item.unit ? ` ${item.unit}` : ""}
                      </td>
                      <td>
                        {item.quantity}
                        {(item.category === "Glasswares" || ["Chemical", "Reagent"].includes(item.category)) ? " pcs" : ""}
                        {item.category === "Glasswares" && item.volume ? ` / ${item.volume} ML` : ""}
                        {["Chemical", "Reagent"].includes(item.category) && item.unit ? ` / ${item.unit} ML` : ""}
                      </td>
                      <td>{item.status}</td>
                      <td>{item.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
      )} */}

      {filteredRooms.length === 0 && (
        <p style={{ color: 'red', marginTop: '20px' }}>Room Not Found</p>
      )}

      {filteredRooms
        .filter(room => room.items && room.items.length > 0)
        .map(room => {
          const isExpanded = expandedRooms[room.id];

          const filteredItems = room.items.filter(item =>
            item.itemName.toLowerCase().includes((itemSearchTerms[room.id] || "").toLowerCase()) ||
            item.itemDetails.toLowerCase().includes((itemSearchTerms[room.id] || "").toLowerCase()) ||
            item.category.toLowerCase().includes((itemSearchTerms[room.id] || "").toLowerCase())
          );

return (
  <div key={room.id} className="labroom-table-wrapper">
    <div className="labroom-title-wrapper" onClick={() => toggleRoomExpansion(room.id)}>
      <h3 className="labroom-title" onClick={(e) => e.stopPropagation()}>
        Room:
        {editingRoomId === room.id ? (
          <input
            type="number"
            value={room.roomNumber}
            onChange={(e) => {
              const newRoomNumber = e.target.value;
              setLabRooms(prev =>
                prev.map(r => r.id === room.id ? { ...r, roomNumber: newRoomNumber } : r)
              );
            }}
            style={{ marginLeft: "10px", width: "120px" }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span style={{ marginLeft: "10px" }}>{room.roomNumber}</span>
        )}

        {/* Only show the button when the room is expanded */}
        {isExpanded && (
          <Button
            type="primary"
            onClick={(e) => {
              e.stopPropagation();
              if (editingRoomId === room.id) {
                // Save logic
                setConfirmRoomId(room.id);
                setIsConfirmModalVisible(true);
                setEditingRoomId(null);
              } else {
                // Enter edit mode
                setEditingRoomId(room.id);
              }
            }}
            style={{ marginLeft: "10px" }}
          >
            {editingRoomId === room.id ? "Save" : "Edit"}
          </Button>
        )}
      </h3>

      <span className="dropdown-arrow">{isExpanded ? "▲" : "▼"}</span>
    </div>


              {isExpanded && (
                <>
                <Input
                  type="text"
                  placeholder="Search items in this room"
                  value={itemSearchTerms[room.id] || ""}
                  onChange={(e) => setItemSearchTerms(prev => ({ ...prev, [room.id]: e.target.value }))}
                  style={{ 
                    marginBottom: 10, 
                    padding: 5, 
                    width: "100%",
                    fontSize: window.innerWidth <= 768 ? '14px' : '16px'
                  }}
                />

                {/* Add the Tabs for Shelves and Rows */}
                <Tabs defaultActiveKey="1">
                  <TabPane tab="Stock Room" key="1">
                    <div className="labroom-table-container">
                      <table className="labroom-table">
                        <thead>
                          <tr>
                            <th>QR Code</th>
                            <th>Item Name</th>
                            <th>Item Description</th>
                            <th>Category</th>
                            <th>Condition</th>
                            <th>Department</th>
                            <th>Quantity</th>
                            <th>Status</th>
                            <th>Type</th>
                            <th>Unit</th>
                          </tr>
                        </thead>

                        <tbody>
                          {/* {room.items.map((item, index) => (
                            <tr key={item.id}>
                              {index === 0 ? (
                                <td
                                  rowSpan={room.items.length}
                                  className="labroom-qr-cell"
                                >
                                  <div
                                    ref={(el) => (qrRefs.current[room.id] = el)}
                                    className="labroom-qr"
                                  >
                                    <QRCodeSVG
                                      value={room.qrCode || "No QR code available"}
                                      size={128}
                                    />
                                    <button
                                      onClick={() => downloadQRCode(room.id)}
                                      className="labroom-download-button"
                                    >
                                      Download QR
                                    </button>
                                  </div>
                                </td>
                              ) : null}
                              <td>{item.itemName}</td>
                              <td>{item.itemDetails}</td>
                              <td>{item.category}</td>
                              <td>{item.condition}</td>
                              <td>{item.department}</td>
                              <td>{item.quantity}</td>
                              <td>{item.status}</td>
                              <td>{item.type}</td>
                              <td>{item.unit}</td>
                            </tr>
                          ))} */}

                          {filteredItems.map((item, index) => (
                            <tr key={item.id}>
                              {index === 0 ? (
                                <td
                                  rowSpan={filteredItems.length}
                                  className="labroom-qr-cell"
                                >
                                  <div
                                    ref={(el) => (qrRefs.current[room.id] = el)}
                                    className="labroom-qr"
                                  >
                                    <QRCodeSVG
                                      value={room.qrCode || "No QR code available"}
                                      size={128}
                                    />
                                    <button
                                      onClick={() => downloadQRCode(room.id)}
                                      className="labroom-download-button"
                                      disabled={downloadLoading[room.id]}
                                    >
                                      {downloadLoading[room.id] ? "Downloading..." : "Download QR"}
                                    </button>
                                  </div>
                                </td>
                              ) : null}
                              <td>{item.itemName}</td>
                              <td>{item.itemDetails}</td>
                              <td>{item.category}</td>
                              <td>{item.condition}</td>
                              <td>{item.department}</td>
                              <td>{item.quantity}</td>
                              <td>{item.status}</td>
                              <td>{item.type}</td>
                              <td>{item.unit}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </TabPane>

                  <TabPane tab="Shelves" key="2">
                      {selectedRoom ? (
                        renderShelves(selectedRoom) // Automatically show shelves when room is expanded
                      ) : (
                        <div>Select a room to view shelves</div>
                      )}
                    </TabPane>

                    {/* <TabPane tab="Rows" key="3">
                      {selectedRoom ? (
                        renderRows(selectedRoom) // Automatically show rows when room is expanded
                      ) : (
                        <div>Select a room to view rows</div>
                      )}
                    </TabPane> */}
                </Tabs>
                </>
              )}
            </div>
          );
        })}

        <Modal
          title="Confirm Room Number Update"
          open={isConfirmModalVisible}
          zIndex={1023}
          onOk={() => {
            if (confirmRoomId) {
              updateRoomNumber(
                confirmRoomId,
                originalRoomNumbers[confirmRoomId],
                labRooms.find(r => r.id === confirmRoomId)?.roomNumber
              );
            }
            setIsConfirmModalVisible(false);
            setConfirmRoomId(null);
          }}
          onCancel={() => {
            setIsConfirmModalVisible(false);
            setConfirmRoomId(null);
          }}
          okText="Yes, Update"
          cancelText="Cancel"
        >
          <p>
            Are you sure you want to change the room number from "
            <strong>{originalRoomNumbers[confirmRoomId]}</strong>" to "
            <strong>{labRooms.find(r => r.id === confirmRoomId)?.roomNumber}</strong>"?
          </p>
        </Modal>

        {/* <Modal
          open={qrModal.visible}
          onCancel={closeQrModal}
          footer={null}
          title={qrModal.title}
          destroyOnClose
          centered
          zIndex={1031}
        >
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <QRCodeSVG value={qrModal.value} size={200} />
          </div>
        </Modal> */}

        <Modal
          open={qrModal.visible}
          onCancel={closeQrModal}
          footer={null}
          title={qrModal.title}
          destroyOnClose
          centered
          zIndex={1031}
        >
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <div ref={qrModalRef}>
              <QRCodeSVG value={qrModal.value} size={200} />
            </div>
            <button
              onClick={downloadQRCodeFromModal}
              disabled={modalDownloadLoading}
              style={{
                marginTop: "1rem",
                padding: "6px 12px",
                background: "#1677ff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: modalDownloadLoading ? "not-allowed" : "pointer",
                opacity: modalDownloadLoading ? 0.6 : 1,
              }}
            >
              {modalDownloadLoading ? "Downloading..." : "Download QR"}
            </button>
          </div>
        </Modal>
    </div>
  );
};

export default LabRoomQR;
