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

import React, { useEffect, useState, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../backend/firebase/FirebaseConfig";
import "../styles/adminStyle/LabRoomQR.css";

const LabRoomQR = () => {
  const [labRooms, setLabRooms] = useState([]);
  const qrRefs = useRef({});

  useEffect(() => {
    const fetchLabRoomsWithItems = async () => {
      try {
        const labRoomSnapshot = await getDocs(collection(db, "labRoom"));
        const roomsWithItems = [];

        for (const roomDoc of labRoomSnapshot.docs) {
          const roomData = roomDoc.data();
          const roomId = roomDoc.id;

          // Fetch items subcollection for this room
          const itemsSnapshot = await getDocs(collection(db, `labRoom/${roomId}/items`));
          const items = itemsSnapshot.docs.map(itemDoc => {
            const itemData = itemDoc.data();
            return {
              id: itemDoc.id,
              category: itemData.category || "N/A",
              condition: itemData.condition || "N/A",
              department: itemData.department || "N/A",
              entryCurrentDate: itemData.entryCurrentDate || "N/A",
              expiryDate: itemData.expiryDate || null,
              itemId: itemData.itemId || "N/A",
              itemName: itemData.itemName || "N/A",
              labRoom: itemData.labRoom || "N/A",
              quantity: itemData.quantity || 0,
              status: itemData.status || "N/A",
              type: itemData.type || "N/A",
              rawTimestamp: itemData.rawTimestamp || "N/A",
              timestamp: itemData.timestamp || "N/A",
            };
          });

          roomsWithItems.push({
            id: roomId,
            name: roomData.name || "N/A",
            qrCode: roomData.qrCode || "",   // <-- Add lab room QR here
            items,
          });
        }

        setLabRooms(roomsWithItems);

      } catch (error) {
        console.error("Error fetching lab rooms and items:", error);
      }
    };

    fetchLabRoomsWithItems();
  }, []);

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
        labRooms.map(room => (
          <div key={room.id} className="labroom-card">
            <h3 className="labroom-title">
              Room: {room.name} ({room.id})
            </h3>

            {/* Lab Room QR Code */}
            <div
              ref={el => (qrRefs.current[room.id] = el)}
              className="labroom-qr"
              style={{ marginBottom: "10px" }}
            >
              <QRCodeCanvas value={room.qrCode || "No QR code available"} size={200} />
            </div>

            <button
              onClick={() => downloadQRCode(room.id)}
              className="labroom-download-button"
            >
              Download Room QR Code
            </button>

            {(!room.items || room.items.length === 0) ? (
              <p>No items found in this room.</p>
            ) : (
              room.items.map(item => (
                <div key={item.id} className="labroom-item-card">
                  <h4>{item.itemName} ({item.itemId})</h4>
                  <p><strong>Category:</strong> {item.category}</p>
                  <p><strong>Condition:</strong> {item.condition}</p>
                  <p><strong>Department:</strong> {item.department}</p>
                  <p><strong>Quantity:</strong> {item.quantity}</p>
                  <p><strong>Status:</strong> {item.status}</p>
                  <p><strong>Type:</strong> {item.type}</p>
                </div>
              ))
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default LabRoomQR;
