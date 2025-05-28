// VERSION 1
// import React, { useEffect, useState, useRef } from "react";
// import { QRCodeCanvas } from "qrcode.react";
// import { collection, getDocs, onSnapshot } from "firebase/firestore";
// import { db } from "../../backend/firebase/FirebaseConfig";
// import "../styles/adminStyle/LabRoomQR.css";

// const LabRoomQR = () => {
//   const [labRooms, setLabRooms] = useState([]);
//   const qrRefs = useRef({});

//   useEffect(() => {
//     const unsubscribeFunctions = [];

//     const fetchLabRoomsWithItems = async () => {
//       try {
//         const labRoomUnsub = onSnapshot(collection(db, "labRoom"), (labRoomSnapshot) => {
//           const initialRooms = labRoomSnapshot.docs.map(doc => ({
//             id: doc.id,
//             name: doc.data().name || "N/A",
//             qrCode: doc.data().qrCode || "",
//             items: [],
//           }));

//           setLabRooms(initialRooms);

//           labRoomSnapshot.docs.forEach((roomDoc) => {
//             const roomId = roomDoc.id;
//             const itemsCollectionRef = collection(db, `labRoom/${roomId}/items`);

//             const unsub = onSnapshot(itemsCollectionRef, (itemsSnapshot) => {
//               const updatedItems = itemsSnapshot.docs.map(itemDoc => {
//                 const itemData = itemDoc.data();
//                 return {
//                   id: itemDoc.id,
//                   category: itemData.category || "N/A",
//                   condition: itemData.condition
//                   ? `Good: ${itemData.condition.Good ?? 0}, Defect: ${itemData.condition.Defect ?? 0}, Damage: ${itemData.condition.Damage ?? 0}`
//                   : "N/A",
//                   department: itemData.department || "N/A",
//                   entryCurrentDate: itemData.entryCurrentDate || "N/A",
//                   expiryDate: itemData.expiryDate || null,
//                   itemId: itemData.itemId || "N/A",
//                   itemName: itemData.itemName || "N/A",
//                   labRoom: itemData.labRoom || "N/A",
//                   quantity: itemData.quantity || 0,
//                   status: itemData.status || "N/A",
//                   type: itemData.type || "N/A",
//                   rawTimestamp: itemData.rawTimestamp || "N/A",
//                   timestamp: itemData.timestamp || "N/A",
//                   unit: itemData.unit || "N/A",
//                 };
//               });

//               setLabRooms(prevRooms => prevRooms.map(room =>
//                 room.id === roomId ? { ...room, items: updatedItems } : room
//               ));
//             });

//             unsubscribeFunctions.push(unsub);
//           });
//         });

//         unsubscribeFunctions.push(labRoomUnsub);

//       } catch (error) {
//         console.error("Error setting up real-time listeners:", error);
//       }
//     };

//     fetchLabRoomsWithItems();

//     return () => {
//       unsubscribeFunctions.forEach(unsub => unsub());
//     };
//   }, []);

//   const downloadQRCode = (id) => {
//     const canvas = qrRefs.current[id]?.querySelector("canvas");
//     if (!canvas) return;
//     const pngUrl = canvas
//       .toDataURL("image/png")
//       .replace("image/png", "image/octet-stream");

//     const downloadLink = document.createElement("a");
//     downloadLink.href = pngUrl;
//     downloadLink.download = `${id}-QR.png`;
//     document.body.appendChild(downloadLink);
//     downloadLink.click();
//     document.body.removeChild(downloadLink);
//   };

//   return (
//     <div className="labroom-container">
//       <h2 className="labroom-header">Lab Room QR Codes</h2>

//       {labRooms.length === 0 ? (
//         <p>Loading lab rooms and items...</p>
//       ) : (
//         labRooms.map(room => (
//           <div key={room.id} className="labroom-table-wrapper">
//             <h3 className="labroom-title">
//               Room: {room.name} ({room.id})
//             </h3>
//             <table className="labroom-table">
//               <thead>
//                 <tr>
//                   <th>QR Code</th>
//                   <th>Item Name</th>
//                   <th>Item ID</th>
//                   <th>Category</th>
//                   <th>Condition</th>
//                   <th>Department</th>
//                   <th>Quantity</th>
//                   <th>Status</th>
//                   <th>Type</th>
//                 </tr>
//               </thead>

//               <tbody>
//                 {room.items && room.items.length > 0 ? (
//                   room.items.map((item, index) => (
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
//                             <QRCodeCanvas
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
//                       <td>{item.itemId}</td>
//                       <td>{item.category}</td>
//                       <td>{item.condition}</td>
//                       <td>{item.department}</td>
//                       <td>
//                         {item.quantity}
//                         {["Chemical", "Reagent"].includes(item.category) && item.unit ? ` ${item.unit}` : ""}
//                       </td>
//                       <td>{item.status}</td>
//                       <td>{item.type}</td>
//                     </tr>
//                   ))
//                 ) : (
//                   <tr>
//                     <td colSpan="9">No items found in this room.</td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         ))
//       )}
//     </div>
//   );
// };

// export default LabRoomQR;


// VERSION 2
// import React, { useEffect, useState, useRef } from "react";
// import { QRCodeCanvas } from "qrcode.react";
// import { collection, getDocs } from "firebase/firestore";
// import { db } from "../../backend/firebase/FirebaseConfig";
// import "../styles/adminStyle/LabRoomQR.css";

// const LabRoomQR = () => {
//   const [labRooms, setLabRooms] = useState([]);
//   const qrRefs = useRef({});

//   useEffect(() => {
//     const fetchLabRoomsWithItems = async () => {
//       try {
//         const labRoomSnapshot = await getDocs(collection(db, "labRoom"));
//         const roomsWithItems = [];

//         for (const roomDoc of labRoomSnapshot.docs) {
//           const roomData = roomDoc.data();
//           const roomId = roomDoc.id;

//           // Fetch items subcollection for this room
//           const itemsSnapshot = await getDocs(collection(db, `labRoom/${roomId}/items`));
//           const items = itemsSnapshot.docs.map(itemDoc => {
//             const itemData = itemDoc.data();
//             return {
//               id: itemDoc.id,
//               category: itemData.category || "N/A",
//               condition: itemData.condition || "N/A",
//               department: itemData.department || "N/A",
//               entryCurrentDate: itemData.entryCurrentDate || "N/A",
//               expiryDate: itemData.expiryDate || null,
//               itemId: itemData.itemId || "N/A",
//               itemName: itemData.itemName || "N/A",
//               labRoom: itemData.labRoom || "N/A",
//               qrCode: itemData.qrCode || "",
//               quantity: itemData.quantity || 0,
//               status: itemData.status || "N/A",
//               type: itemData.type || "N/A",
//               rawTimestamp: itemData.rawTimestamp || "N/A",
//               timestamp: itemData.timestamp || "N/A",
//             };
//           });

//           roomsWithItems.push({
//             id: roomId,
//             name: roomData.name || "N/A",
//             items,
//           });
//         }

//         setLabRooms(roomsWithItems);
//       } catch (error) {
//         console.error("Error fetching lab rooms and items:", error);
//       }
//     };

//     fetchLabRoomsWithItems();
//   }, []);

//   const downloadQRCode = (id) => {
//     const canvas = qrRefs.current[id].querySelector("canvas");
//     if (!canvas) return;
//     const pngUrl = canvas
//       .toDataURL("image/png")
//       .replace("image/png", "image/octet-stream");

//     const downloadLink = document.createElement("a");
//     downloadLink.href = pngUrl;
//     downloadLink.download = `${id}-QR.png`;
//     document.body.appendChild(downloadLink);
//     downloadLink.click();
//     document.body.removeChild(downloadLink);
//   };

//   return (
//     <div className="labroom-container">
//       <h2 className="labroom-header">Lab Room and Items QR Codes</h2>

//       {labRooms.length === 0 ? (
//         <p>Loading lab rooms and items...</p>
//       ) : (
//         labRooms.map(room => (
//           <div key={room.id} className="labroom-card">
//             <h3 className="labroom-title">
//               Room: {room.name} ({room.id})
//             </h3>

//             {(!room.items || room.items.length === 0) ? (
//             <p>No items found in this room.</p>
//             ) : (
//             room.items.map(item => {
//                 const qrValue = item.qrCode || "No QR code available";
//                 return (
//                   <div key={item.id} className="labroom-item-card">
//                     <h4>{item.itemName} ({item.itemId})</h4>
//                     <p><strong>Category:</strong> {item.category}</p>
//                     <p><strong>Condition:</strong> {item.condition}</p>
//                     <p><strong>Department:</strong> {item.department}</p>
//                     <p><strong>Quantity:</strong> {item.quantity}</p>
//                     <p><strong>Status:</strong> {item.status}</p>
//                     <p><strong>Type:</strong> {item.type}</p>

//                     <div
//                       ref={el => (qrRefs.current[item.id] = el)}
//                       className="labroom-qr"
//                     >
//                       <QRCodeCanvas value={qrValue} size={150} />
//                     </div>

//                     <button
//                       onClick={() => downloadQRCode(item.id)}
//                       className="labroom-download-button"
//                     >
//                       Download QR Code
//                     </button>
//                   </div>
//                 );
//               })
//             )}
//           </div>
//         ))
//       )}
//     </div>
//   );
// };

// export default LabRoomQR;

// VERSION 3
// import React, { useEffect, useState, useRef } from "react";
// import { QRCodeCanvas } from "qrcode.react";
// import { collection, getDocs, onSnapshot } from "firebase/firestore";
// import { db } from "../../backend/firebase/FirebaseConfig";
// import "../styles/adminStyle/LabRoomQR.css";

// const LabRoomQR = () => {
//   const [labRooms, setLabRooms] = useState([]);
//   const qrRefs = useRef({});

//   useEffect(() => {
//   const unsubscribeFunctions = [];

//   const fetchLabRoomsWithItems = async () => {
//     try {
//       const labRoomUnsub = onSnapshot(collection(db, "labRoom"), (labRoomSnapshot) => {
//         const rooms = labRoomSnapshot.docs.map(doc => ({
//           id: doc.id,
//           name: doc.data().name || "N/A",
//           qrCode: doc.data().qrCode || "",
//           items: [],
//         }));

//         // Set initial rooms (empty items for now)
//         setLabRooms(rooms);

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
//                   ? `Good: ${itemData.condition.Good ?? 0}, Defect: ${itemData.condition.Defect ?? 0}, Damage: ${itemData.condition.Damage ?? 0}`
//                   : "N/A",
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
//                 volume: itemData.volume || "N/A",
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


//   const downloadQRCode = (id) => {
//     const canvas = qrRefs.current[id]?.querySelector("canvas");
//     if (!canvas) return;
//     const pngUrl = canvas
//       .toDataURL("image/png")
//       .replace("image/png", "image/octet-stream");

//     const downloadLink = document.createElement("a");
//     downloadLink.href = pngUrl;
//     downloadLink.download = `${id}-QR.png`;
//     document.body.appendChild(downloadLink);
//     downloadLink.click();
//     document.body.removeChild(downloadLink);
//   };

//   return (
//     <div className="labroom-container">
//       <h2 className="labroom-header">Lab Room QR Codes</h2>

//       {labRooms.length === 0 ? (
//         <p>Loading lab rooms and items...</p>
//       ) : (
//         labRooms
//           .filter(room => room.items && room.items.length > 0)
//           .map(room => (
//             <div key={room.id} className="labroom-table-wrapper">
//               <h3 className="labroom-title">
//                 Room: {room.id}
//               </h3>
//               <table className="labroom-table">
//                 <thead>
//                   <tr>
//                     <th>QR Code</th>
//                     <th>Item Name</th>
//                     <th>Item ID</th>
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
//                             <QRCodeCanvas
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
//                       <td>{item.itemId}</td>
//                       <td>{item.category}</td>
//                       {/* <td>{item.condition}</td> */}
//                       <td>{["Chemical", "Reagent"].includes(item.category) ? "N/A" : item.condition}</td>
//                       <td>{item.department}</td>
//                       <td>
//                         {item.quantity}
//                         {item.category === "Glasswares" ? " pcs" : ""}
//                         {item.category === "Glasswares" && item.volume ? ` / ${item.volume} ML` : ""}
//                         {["Chemical", "Reagent"].includes(item.category) && item.unit ? ` ${item.unit}` : ""}
//                       </td>
//                       <td>{item.status}</td>
//                       <td>{item.type}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           ))
//       )}
//     </div>
//   );
// };

// export default LabRoomQR;


// VERSION 4
import React, { useEffect, useState, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Layout, Row, Col, Table, Input, Button, Typography, Modal } from "antd";
import { collection, getDocs, onSnapshot, doc, updateDoc, writeBatch, query, where } from "firebase/firestore";
import { db } from "../../backend/firebase/FirebaseConfig";
import "../styles/adminStyle/LabRoomQR.css";

const LabRoomQR = () => {
  const [labRooms, setLabRooms] = useState([]);
  const [originalRoomNumbers, setOriginalRoomNumbers] = useState({});
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const [confirmRoomId, setConfirmRoomId] = useState(null);
  const qrRefs = useRef({});

  // useEffect(() => {
  //   const unsubscribeFunctions = [];

  //   const fetchLabRoomsWithItems = async () => {
  //     try {
  //       const labRoomUnsub = onSnapshot(collection(db, "labRoom"), (labRoomSnapshot) => {
  //       const rooms = labRoomSnapshot.docs.map(doc => {
  //         const data = doc.data();
  //         return {
  //           id: doc.id,
  //           name: data.name || "N/A",
  //           roomNumber: data.roomNumber || "N/A", // 🟢 get roomNumber here
  //           qrCode: data.qrCode || "",
  //           items: [],
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
  //                   ? `Good: ${itemData.condition.Good ?? 0}, Defect: ${itemData.condition.Defect ?? 0}, Damage: ${itemData.condition.Damage ?? 0}`
  //                   : "N/A",
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
  //                 volume: itemData.volume || "N/A",
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

   useEffect(() => {
    const unsubscribeFunctions = [];

    const fetchLabRoomsWithItems = async () => {
      try {
        const labRoomUnsub = onSnapshot(collection(db, "labRoom"), (labRoomSnapshot) => {
          // const rooms = labRoomSnapshot.docs.map(doc => ({
          //   id: doc.id,
          //   name: doc.data().name || "N/A",
          //   qrCode: doc.data().qrCode || "",
          //   items: [],
          // }));

        const rooms = labRoomSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || "N/A",
            roomNumber: data.roomNumber || "N/A", // 🟢 get roomNumber here
            qrCode: data.qrCode || "",
            items: [],
          };
        });


          // Set initial rooms (empty items for now)
          setLabRooms(rooms);

          const originalNumbers = {};
          rooms.forEach(room => {
            originalNumbers[room.id] = room.roomNumber;
          });
          setOriginalRoomNumbers(originalNumbers);

          // Set up item listeners per room
          labRoomSnapshot.docs.forEach((roomDoc) => {
            const roomId = roomDoc.id;
            const itemsCollectionRef = collection(db, `labRoom/${roomId}/items`);

            const unsub = onSnapshot(itemsCollectionRef, (itemsSnapshot) => {
              const updatedItems = itemsSnapshot.docs.map(itemDoc => {
                const itemData = itemDoc.data();
                return {
                  id: itemDoc.id,
                  category: itemData.category || "N/A",
                  condition: itemData.condition
                    ? `Good: ${itemData.condition.Good ?? 0}, Defect: ${itemData.condition.Defect ?? 0}, Damage: ${itemData.condition.Damage ?? 0}`
                    : "N/A",
                  department: itemData.department || "N/A",
                  entryCurrentDate: itemData.entryCurrentDate || "N/A",
                  expiryDate: itemData.expiryDate || null,
                  itemId: itemData.itemId || "N/A",
                  itemName: itemData.itemName || "N/A",
                  labRoom: itemData.labRoom || "N/A",
                  // quantity: itemData.quantity || 0,
                  // quantity: itemData.quantity ?? (itemData.category === "Glasswares" ? [] : 0),
                  quantity: itemData.category === "Glasswares"
                    ? itemData.quantity ?? []
                    : itemData.quantity ?? 0,
                  status: itemData.status || "N/A", 
                  type: itemData.type || "N/A",
                  rawTimestamp: itemData.rawTimestamp || "N/A",
                  timestamp: itemData.timestamp || "N/A",
                  unit: itemData.unit || "N/A",
                  volume: itemData.volume || "N/A",
                };
              });

              setLabRooms(prevRooms =>
                prevRooms.map(room =>
                  room.id === roomId ? { ...room, items: updatedItems } : room
                )
              );
            });

            unsubscribeFunctions.push(unsub);
          });
        });

        unsubscribeFunctions.push(labRoomUnsub);

      } catch (error) {
        console.error("Error setting up real-time listeners:", error);
      }
    };

    fetchLabRoomsWithItems();

    return () => {
      unsubscribeFunctions.forEach(unsub => unsub());
    };
  }, []);

  // const updateRoomNumber = async (roomId, oldRoomNumber, newRoomNumber) => {
  //   try {
  //     const roomRef = doc(db, "labRoom", roomId);
  //     await updateDoc(roomRef, {
  //       roomNumber: newRoomNumber,
  //     });

  //     const batch = writeBatch(db);

  //     // 🔁 Update labRoom field in labRoom/{roomId}/items
  //     const itemsRef = collection(db, "labRoom", roomId, "items");
  //     const itemsSnapshot = await getDocs(itemsRef);

  //     itemsSnapshot.forEach((itemDoc) => {
  //       const itemRef = doc(db, "labRoom", roomId, "items", itemDoc.id);
  //       batch.update(itemRef, {
  //         labRoom: newRoomNumber,
  //       });
  //     });

  //     // ✅ Fix: Ensure oldRoomNumber is trimmed and matched exactly
  //     const inventoryRef = collection(db, "inventory");
  //     const inventoryQuery = query(
  //       inventoryRef,
  //       where("labRoom", "==", oldRoomNumber.trim())
  //     );
      
  //     const inventorySnapshot = await getDocs(inventoryQuery);

  //     console.log(`Matching inventory docs for labRoom = "${oldRoomNumber}":`, inventorySnapshot.size);

  //     inventorySnapshot.forEach((invDoc) => {
  //       const invRef = doc(db, "inventory", invDoc.id);
  //       batch.update(invRef, {
  //         labRoom: newRoomNumber,
  //       });
  //     });

  //     await batch.commit();

  //     // ✅ Also update UI state
  //     setOriginalRoomNumbers((prev) => ({
  //       ...prev,
  //       [roomId]: newRoomNumber,
  //     }));

  //     console.log(`✅ Updated labRoom ${roomId} to ${newRoomNumber} and synced all items/inventory.`);

  //   } catch (error) {
  //     console.error("❌ Error updating lab room and related data:", error);
  //   }
  // };

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

  const downloadQRCode = (id) => {
    const canvas = qrRefs.current[id]?.querySelector("canvas");
    if (!canvas) return;
    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");

    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `${id}-QR.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="labroom-container">
      <h2 className="labroom-header">Lab Room QR Codes</h2>

      {labRooms.length === 0 ? (
        <p>Loading lab rooms and items...</p>
      ) : (
        labRooms
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

                {/* <button
                  onClick={() =>
                    updateRoomNumber(room.id, originalRoomNumbers[room.id], room.roomNumber)
                  }
                  style={{ marginLeft: "10px" }}
                >
                  Save
                </button> */}

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
                            <QRCodeCanvas
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
                      <td>{item.itemId}</td>
                      <td>{item.category}</td>
                      <td>{["Chemical", "Reagent"].includes(item.category) ? "N/A" : item.condition}</td>
                      <td>{item.department}</td>
                      {/* <td>
                        {item.quantity}
                        {(item.category === "Glasswares" || ["Chemical", "Reagent"].includes(item.category)) ? " pcs" : ""}
                        {item.category === "Glasswares" && item.volume ? ` / ${item.volume} ML` : ""}
                        {["Chemical", "Reagent"].includes(item.category) && item.unit ? ` / ${item.unit} ML` : ""}
                      </td> */}
                      <td>
                        {Array.isArray(item.quantity) && item.category === "Glasswares" ? (
                          item.quantity
                            .map(({ qty, volume }) => `${qty} pcs${volume ? ` / ${volume} ML` : ""}`)
                            .join(", ")
                        ) : typeof item.quantity === "object" &&
                          item.quantity !== null &&
                          item.category === "Glasswares" ? (
                          `${item.quantity.qty} pcs${item.quantity.volume ? ` / ${item.quantity.volume} ML` : ""}`
                        ) : (
                          <>
                            {item.quantity}
                            {(item.category === "Glasswares" || ["Chemical", "Reagent"].includes(item.category)) ? " pcs" : ""}
                            {item.category === "Glasswares" && item.volume ? ` / ${item.volume} ML` : ""}
                            {["Chemical", "Reagent"].includes(item.category) && item.unit ? ` / ${item.unit} ML` : ""}
                          </>
                        )}
                      </td>
                      <td>{item.status}</td>
                      <td>{item.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
      )}

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
    </div>
  );
};

export default LabRoomQR;
