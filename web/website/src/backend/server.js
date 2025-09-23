const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const CryptoJS = require("crypto-js");
const { GoogleAuth } = require("google-auth-library");
const axios = require("axios");
const nodemailer = require("nodemailer");
const SibApiV3Sdk = require('sib-api-v3-sdk');

// Load environment variables from the .env file in the same directory
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
// app.use(cors());
const allowedOrigins = [
  'https://nuls-web.vercel.app',
  'http://localhost:3000',
  'https://www.nuls-moa.com'
];

// const corsOptions = {
//   origin: (origin, callback) => {
//     if (!origin || allowedOrigins.includes(origin)) {
//       return callback(null, true);
//     }
//     return callback(new Error('Not allowed by CORS'));
//   },
//   credentials: true,
// };

const corsOptions = {
  origin: (origin, callback) => {
    // Allow no origin (React Native), or if it's in the allowed list
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

// 🔐 Apply to all routes
app.use(cors(corsOptions));

// 🔁 Respond to preflight OPTIONS requests
// app.options('/*', cors(corsOptions));

app.use(express.json());

//VERSION 1
// Firebase Admin Init
// Read and parse the stringified service account from environment variable
// const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

//VERSION 2

// const db = admin.firestore();

// const SECRET_KEY = process.env.SECRET_KEY;

// // const admin = require("firebase-admin");
// // const dotenv = require("dotenv");
// // dotenv.config();

// let serviceAccount;

// if (process.env.FIREBASE_SERVICE_ACCOUNT) {
//   // Use Render env var in production
//   serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
// } else {
//   // Use local file for development
//   serviceAccount = require("./firebase-service-account.json");
// }

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

// Top of the file (after dotenv)
dotenv.config();

// const transporter = nodemailer.createTransport({
//   service: 'Outlook', // Use 'Outlook' for outlook.com or Office365
//   auth: {
//     user: process.env.OUTLOOK_EMAIL, // set in .env file
//     pass: process.env.OUTLOOK_PASS   // set in .env file
//   }
// });

// Brevo configuration
const brevoApiKey = process.env.BREVO_API_KEY;

// Debug: Check if API key is loaded
console.log('🔑 Brevo API Key loaded:', brevoApiKey ? 'Yes' : 'No');
console.log('🔑 API Key source:', process.env.BREVO_API_KEY ? 'Environment variable' : 'Missing');

if (!brevoApiKey) {
  console.error('❌ BREVO_API_KEY environment variable is missing!');
  console.error('💡 Please add BREVO_API_KEY to your environment variables.');
}

const brevoApiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
SibApiV3Sdk.ApiClient.instance.authentications['api-key'].apiKey = brevoApiKey;

// Helper function to send emails via Brevo
const sendEmailViaBrevo = async (emailData) => {
  try {
    const sendSmtpEmail = {
      sender: { 
        email: emailData.from || 'nulsnumoa@gmail.com',
        name: 'NU MOA NULS Team'
      },
      to: [{ 
        email: emailData.to,
        name: emailData.toName || 'User'
      }],
      subject: emailData.subject,
      htmlContent: emailData.html,
      textContent: emailData.text,
      // Add headers to improve Microsoft delivery
      headers: {
        'X-Mailer': 'NU MOA NULS System',
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal',
        'Importance': 'Normal'
      },
      // Add reply-to for better deliverability
      replyTo: {
        email: emailData.from || 'nulsnumoa@gmail.com',
        name: 'NU MOA NULS Team'
      }
    };

    const result = await brevoApiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('✅ Email sent successfully via Brevo:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Brevo email send failed:', error.message);
    throw error;
  }
};

let db; // Firestore instance
const SECRET_KEY = process.env.SECRET_KEY;

(async () => {
  try {
    let serviceAccount;

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      // ✅ Use env variable in production (Render)
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      console.log("✅ Using FIREBASE_SERVICE_ACCOUNT from environment");
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

    } else if (process.env.NODE_ENV !== "production") {
      // ✅ Use local file in development only
      serviceAccount = require("./firebase-service-account.json");
      console.log("✅ Using local firebase-service-account.json");

    } else {
      // ❌ Prevent fallback in production
      throw new Error("FIREBASE_SERVICE_ACCOUNT env var is missing and local fallback is not allowed in production.");
    }

    const admin = require("firebase-admin");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    db = admin.firestore();
    console.log("✅ Firebase initialized");

    // Initialize FCM messaging
    const messaging = admin.messaging();
    app.locals.messaging = messaging;

    // ✅ Start your server here
    // const app = require("./app"); // or inline app definition
    const PORT = process.env.PORT || 5000;
    app.locals.db = db; // optional
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

  } catch (error) {
    console.error("❌ Firebase init error:", error.message);
    process.exit(1);
  }
})();

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// HEALTH CHECK ENDPOINT - Keep server alive on Render
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: 'Server is running and healthy'
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SEND EMAIL FOR MOBILE
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.post('/send-email', async (req, res) => {
  const { to, subject, text, html } = req.body;

  try {
    const result = await sendEmailViaBrevo({
      to,
      subject,
      text,
      html,
      from: process.env.GMAIL_USER
    });

    console.log(`✅ Email sent to ${to} via Brevo`);
    res.status(200).json({ success: true, messageId: result.messageId });
    
  } catch (error) {
    console.error('❌ Email send failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ADD ITEM / ARCHIVE ITEM / UPDATE ITEM QUANTITY / FULL UPDATE ITEM
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

// app.post("/add-inventory", async (req, res) => {
//   try {
//     const values = req.body;
//     const {
//       itemName,
//       itemDetails,
//       department,
//       category,
//       labRoom,
//       quantity,
//       type,
//       unit,
//       entryDate,
//       expiryDate,
//       criticalLevel,
//       userId,
//       userName
//     } = values;

//     if (!itemName || !department || !itemDetails) {
//       return res.status(400).json({ error: "Missing fields" });
//     }

//     const trimmedName = itemName.trim();
//     const normalizedInputName = trimmedName.toLowerCase();
//     const normalizedInputDetails = itemDetails.trim().toLowerCase();

//     const inventoryRef = db.collection("inventory");
//     const snapshot = await inventoryRef.get();
//     const allItems = snapshot.docs.map(doc => doc.data());

//     const sameNameItems = allItems.filter(item =>
//       item.itemName?.toLowerCase().startsWith(normalizedInputName)
//     );

//     const exactMatch = sameNameItems.find(item => {
//       return (
//         (item.itemDetails?.trim().toLowerCase() || "") === normalizedInputDetails &&
//         (item.itemName?.trim().toLowerCase() || "") === normalizedInputName
//       );
//     });

//     if (exactMatch) {
//       return res.status(409).json({ error: "Item already exists with same name and details" });
//     }

//     // Unique ID logic
//     const itemCategoryPrefixMap = {
//       Chemical: "CHEM",
//       Equipment: "EQP",
//       Reagent: "RGT",
//       Glasswares: "GLS",
//       Materials: "MAT",
//     };

//     const baseName = trimmedName.replace(/\d+$/, "");
//     const similarItemCount = sameNameItems.length + 1;
//     const finalItemName = sameNameItems.length > 0
//       ? `${baseName}${String(similarItemCount).padStart(2, "0")}`
//       : trimmedName;

//     const itemCategoryPrefix = itemCategoryPrefixMap[category] || "UNK01";
//     let itemIdQuery = await inventoryRef.where("category", "==", category).get();
//     let itemCategoryCount = itemIdQuery.size + 1;
//     let generatedItemId = `${itemCategoryPrefix}${String(itemCategoryCount).padStart(2, "0")}`;

//     while (!(await inventoryRef.where("itemId", "==", generatedItemId).get()).empty) {
//       itemCategoryCount++;
//       generatedItemId = `${itemCategoryPrefix}${String(itemCategoryCount).padStart(2, "0")}`;
//     }

//     const timestamp = new Date();
//     const entryCurrentDate = timestamp.toISOString().split("T")[0];
//     const finalCriticalLevel = criticalLevel !== undefined ? Number(criticalLevel) : 20;
//     const quantityNumber = Number(quantity);

//     const inventoryItem = {
//       itemId: generatedItemId,
//       itemName: finalItemName,
//       itemDetails,
//       entryCurrentDate,
//       expiryDate: type === "Fixed" ? null : expiryDate || null,
//       timestamp,
//       criticalLevel: finalCriticalLevel,
//       category,
//       labRoom,
//       quantity: quantityNumber,
//       department,
//       type,
//       status: "Available",
//       ...(category === "Chemical" || category === "Reagent" ? { unit } : {}),
//       rawTimestamp: new Date(),
//       ...(category !== "Chemical" && category !== "Reagent" && {
//         condition: {
//           Good: quantityNumber,
//           Defect: 0,
//           Damage: 0,
//           Lost: 0,
//         },
//       }),
//     };

//     const encryptedData = CryptoJS.AES.encrypt(
//       JSON.stringify(inventoryItem),
//       SECRET_KEY
//     ).toString();

//     const docRef = await db.collection("inventory").add({
//       ...inventoryItem,
//       qrCode: encryptedData,
//     });

//     await db.collection(`accounts/${userId}/activitylog`).add({
//       action: `Added new item (${finalItemName}) to inventory`,
//       userName: userName || "User",
//       timestamp: admin.firestore.FieldValue.serverTimestamp(),
//     });

//     await db.collection("allactivitylog").add({
//       action: `Added new item (${finalItemName}) to inventory`,
//       userName: userName || "User",
//       timestamp: admin.firestore.FieldValue.serverTimestamp(),
//     });

//     await docRef.collection("stockLog").add({
//       date: entryCurrentDate,
//       noOfItems: quantityNumber,
//       deliveryNumber: "DLV-00001",
//       createdAt: admin.firestore.FieldValue.serverTimestamp(),
//       ...(expiryDate && { expiryDate }),
//     });

//     const labRoomQuery = await db.collection("labRoom").where("roomNumber", "==", labRoom).get();
//     let labRoomRef;

//     if (labRoomQuery.empty) {
//       labRoomRef = await db.collection("labRoom").add({
//         roomNumber: labRoom,
//         createdAt: new Date(),
//       });

//     } else {
//       labRoomRef = labRoomQuery.docs[0].ref;
//     }

//     await labRoomRef.collection("items").doc(generatedItemId).set({
//       ...inventoryItem,
//       qrCode: encryptedData,
//       roomNumber: labRoom,
//     });

//     const labRoomQR = CryptoJS.AES.encrypt(
//       JSON.stringify({ labRoomId: labRoomRef.id }),
//       SECRET_KEY
//     ).toString();

//     await labRoomRef.update({
//       qrCode: labRoomQR,
//       updatedAt: new Date(),
//     });

//     return res.status(200).json({ message: "Item added successfully", itemId: generatedItemId });

//   } catch (err) {
//     console.error("Error in /add-inventory:", err);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// });

app.post("/archive-inventory", async (req, res) => {
  const item = req.body.item;
  const userId = req.body.userId || "unknown";
  const userName = req.body.userName || "User";

  if (!item || !item.itemId || !item.itemName) {
    return res.status(400).json({ error: "Invalid item data." });
  }

  try {
    const inventorySnap = await db.collection("inventory").get();

    for (const docItem of inventorySnap.docs) {
      const data = docItem.data();

      if (data.itemId === item.itemId) {
        const inventoryId = docItem.id;

        // Step 1: Archive item
        await db.collection("archiveItems").doc(inventoryId).set({
          ...data,
          archivedAt: new Date(),
        });

        // Step 1.5: Delete stockLog subcollection
        const stockLogRef = db.collection("inventory").doc(inventoryId).collection("stockLog");
        const stockLogSnap = await stockLogRef.get();

        const stockLogDeletions = stockLogSnap.docs.map((doc) => doc.ref.delete());
        await Promise.all(stockLogDeletions);

        // ✅ Log to allactivitylog
        await db.collection("allactivitylog").add({
          action: `Archived item (${data.itemName}) from inventory`,
          userName: userName,
          userId: userId,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

        // ✅ Optionally log to user's activity log
        if (userId !== "unknown") {
          await db.collection(`accounts/${userId}/activitylog`).add({
            action: `Archived item (${data.itemName}) from inventory`,
            userName: userName,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        // Step 2: Delete main inventory document
        await db.collection("inventory").doc(inventoryId).delete();

        // Step 3: Delete from labRoom items subcollection
        if (data.labRoom && data.itemId) {
          const labRoomQuery = await db.collection("labRoom")
            .where("roomNumber", "==", data.labRoom)
            .get();

          if (!labRoomQuery.empty) {
            const labRoomDoc = labRoomQuery.docs[0];
            const labRoomItemRef = labRoomDoc.ref.collection("items").doc(data.itemId);
            await labRoomItemRef.delete();
          }
        }
      }
    }

    // Step 4: Clean up userRequests
    const usersSnapshot = await db.collection("accounts").get();

    for (const userDoc of usersSnapshot.docs) {
      const userRequestsRef = db.collection("accounts").doc(userDoc.id).collection("userRequests");
      const userRequestsSnap = await userRequestsRef.get();

      for (const requestDoc of userRequestsSnap.docs) {
        const requestData = requestDoc.data();
        const filteredData = requestData?.filteredMergedData;

        if (!Array.isArray(filteredData)) continue;

        const hasMatch = filteredData.some(entry => entry.itemName === item.itemName);

        if (hasMatch) {
          await userRequestsRef.doc(requestDoc.id).delete();

          const rootQuery = db.collection("userrequests")
            .where("accountId", "==", userDoc.id)
            .where("timestamp", "==", requestData.timestamp);

          const rootSnap = await rootQuery.get();
          const rootDeletes = rootSnap.docs.map(doc => doc.ref.delete());
          await Promise.all(rootDeletes);
        }
      }
    }

    return res.status(200).json({ message: "Item successfully archived and removed." });

  } catch (error) {
    console.error("Error archiving item:", error);
    return res.status(500).json({ error: "Internal error during deletion process." });
  }
});

app.post("/update-inventory-item", async (req, res) => {
  const { values, userId, userName } = req.body;
  const editingItem = values.editingItem;

  if (!editingItem || !editingItem.itemId || !values.quantity) {
    return res.status(400).json({ error: "Missing item data." });
  }

  const isChemicalOrReagent = editingItem.category === "Chemical" || editingItem.category === "Reagent";
  const addedQuantity = Number(values.quantity);

  // if (isNaN(addedQuantity) || addedQuantity < 0) {
  if (isNaN(addedQuantity)) {
    return res.status(400).json({ error: "Invalid quantity." });
  }

  // ✅ Treat expiryDate as string
  const sanitizedExpiryDate = isChemicalOrReagent && values.expiryDate
    ? values.expiryDate.toString()
    : null;

  try {
    const inventorySnap = await db.collection("inventory").get();

    for (const docItem of inventorySnap.docs) {
      const data = docItem.data();

      if (data.itemId === editingItem.itemId) {
        const inventoryId = docItem.id;
        const itemRef = db.collection("inventory").doc(inventoryId);
        const existingLabRoom = data.labRoom;

        if (!existingLabRoom) {
          return res.status(400).json({ error: "Item has no labRoom assigned." });
        }

        const prevCondition = data.condition || {};
        const newCondition = {
          Good: (prevCondition.Good || 0) + addedQuantity,
          Defect: prevCondition.Defect || 0,
          Damage: prevCondition.Damage || 0,
          Lost: prevCondition.Lost || 0,
        };

        const newQuantity = (Number(data.quantity) || 0) + addedQuantity;
        // const updatedData = {
        //   labRoom: existingLabRoom,
        //   quantity: newQuantity,
        //   condition: newCondition,
        // };

        // if (sanitizedExpiryDate) {
        //   updatedData.expiryDate = sanitizedExpiryDate;
        // }

        const updatedData = {
          labRoom: existingLabRoom,
          quantity: newQuantity,
        };

        // Only set condition if NOT Chemical or Reagent
        if (!isChemicalOrReagent) {
          updatedData.condition = newCondition;
        }

        if (sanitizedExpiryDate) {
          updatedData.expiryDate = sanitizedExpiryDate;
        }

        // 🔁 Determine status based on new quantity
        const lowerCategory = (editingItem.category || "").toLowerCase();
        let newStatus = "Available";

        if (newQuantity === 0) {
          if (["chemical", "reagent", "materials"].includes(lowerCategory)) {
            newStatus = "out of stock";
            
          } else if (["equipment", "glasswares"].includes(lowerCategory)) {
            newStatus = "in use";
          }
        }

        updatedData.status = newStatus;

        // 🔄 Update inventory
        await itemRef.update(updatedData);

         // 🔧 Generate additional QR codes for equipment items when quantity increases
        if (editingItem.category === "Equipment" && addedQuantity > 0) {
          console.log(`🔧 Generating ${addedQuantity} additional QR codes for equipment item ${editingItem.itemId}`);
          
          const qrSubcollectionRef = itemRef.collection("qrCodes");
          
          // Get current QR codes count to determine starting unit number
          const existingQRCodesSnapshot = await qrSubcollectionRef.get();
          const currentQRCount = existingQRCodesSnapshot.docs.length;
          
          // Generate individual QR codes for each additional unit
          for (let i = 1; i <= addedQuantity; i++) {
            const unitNumber = currentQRCount + i;
            const individualItemId = `${editingItem.itemId}${String(unitNumber).padStart(2, "0")}`;
            
            // Create individual item data
            const individualItemData = {
              ...data,
              individualItemId: individualItemId,
              itemName: `${data.itemName} #${unitNumber}`,
              quantity: 1,
              condition: "Good",
              status: "Available",
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              parentItemId: editingItem.itemId,
              unitNumber: unitNumber,
            };

            // Encrypt individual item data for QR code
            const individualQRData = CryptoJS.AES.encrypt(
              JSON.stringify(individualItemData),
              SECRET_KEY
            ).toString();

            // Add to QR subcollection
            await qrSubcollectionRef.add({
              ...individualItemData,
              qrCode: individualQRData,
            });
            
            console.log(`✅ Generated QR code for unit ${unitNumber}: ${individualItemId}`);
          }
          
          console.log(`✅ Successfully generated ${addedQuantity} additional QR codes for equipment item ${editingItem.itemId}`);
        }

        // ✅ Log to allactivitylog
        const activityMessage = `Updated item (${data.itemName}) in inventory`;

        await db.collection("allactivitylog").add({
          action: activityMessage,
          userName,
          userId,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

        // ✅ Log to user's activitylog if available
        if (userId && userId !== "unknown") {
          await db.collection(`accounts/${userId}/activitylog`).add({
            action: activityMessage,
            userName,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        // 🔄 Update labRoom item
        const labRoomQuery = await db.collection("labRoom").where("roomNumber", "==", existingLabRoom).get();

        if (!labRoomQuery.empty) {
          const labRoomDoc = labRoomQuery.docs[0];
          const labRoomItemRef = labRoomDoc.ref.collection("items").doc(data.itemId);
          await labRoomItemRef.update(updatedData);

          // ➕ Add stock log
          const stockLogRef = db.collection("inventory").doc(inventoryId).collection("stockLog");
          const latestLogSnap = await stockLogRef.orderBy("createdAt", "desc").limit(1).get();

          let newDeliveryNumber = "DLV-00001";
          if (!latestLogSnap.empty) {
            const lastDelivery = latestLogSnap.docs[0].data().deliveryNumber;
            const match = lastDelivery?.match(/DLV-(\d+)/);
            if (match) {
              const next = (parseInt(match[1], 10) + 1).toString().padStart(5, "0");
              newDeliveryNumber = `DLV-${next}`;
            }
          }
          // Add allactivitylog
           await db.collection("allactivitylog").add({
          action: `Added New Stock (${data.itemName}) from inventory`,
          userName: userName,
          userId: userId,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

          const logPayload = {
            date: new Date().toISOString().split("T")[0],
            deliveryNumber: newDeliveryNumber,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            noOfItems: addedQuantity,
          };

          if (sanitizedExpiryDate) {
            logPayload.expiryDate = sanitizedExpiryDate;
          }

          await stockLogRef.add(logPayload);
        }

        return res.status(200).json({ message: "Item updated successfully." });
      }
    }

    return res.status(404).json({ error: "Item not found." });

  } catch (err) {
    console.error("Update item error:", err);
    return res.status(500).json({ error: "Failed to update item." });
  }
});

app.post("/deduct-stocklog-item", async (req, res) => {
  const { values, userId, userName } = req.body;
  const editingItem = values.editingItem;

  if (!editingItem || !editingItem.itemId || !values.quantity) {
    return res.status(400).json({ error: "Missing item data." });
  }

  const isChemicalOrReagent = editingItem.category === "Chemical" || editingItem.category === "Reagent";
  const deductedQty = Number(values.quantity);     // this is positive number coming in
  if (isNaN(deductedQty)) {
    return res.status(400).json({ error: "Invalid quantity." });
  }

  try {
    const inventorySnap = await db.collection("inventory").get();

    for (const docItem of inventorySnap.docs) {
      const data = docItem.data();
      if (data.itemId === editingItem.itemId) {
        const inventoryId = docItem.id;
        const itemRef = db.collection("inventory").doc(inventoryId);
        const existingLabRoom = data.labRoom;

        if (!existingLabRoom) {
          return res.status(400).json({ error: "Item has no labRoom assigned." });
        }

        const prevCondition = data.condition || {};

        // subtract good condition units first
        const newCondition = {
          Good: Math.max((prevCondition.Good || 0) - deductedQty, 0),
          Defect: prevCondition.Defect || 0,
          Damage: prevCondition.Damage || 0,
          Lost: prevCondition.Lost || 0,
        };

        // Subtract quantity
        const newQuantity = Math.max((Number(data.quantity) || 0) - deductedQty, 0);

        const updatedData = {
          labRoom: existingLabRoom,
          quantity: newQuantity,
        };

        if (!isChemicalOrReagent) {
          updatedData.condition = newCondition;
        }

        // Set new status
        const lowerCategory = (editingItem.category || "").toLowerCase();
        let newStatus = "Available";

        if (newQuantity === 0) {
          if (["chemical", "reagent", "materials"].includes(lowerCategory)) {
            newStatus = "out of stock";
            
          } else if (["equipment", "glasswares"].includes(lowerCategory)) {
            newStatus = "in use";
          }
        }

        updatedData.status = newStatus;

        // 🔄 Update inventory & labRoom
        await itemRef.update(updatedData);

        const labRoomQuery = await db
          .collection("labRoom")
          .where("roomNumber", "==", existingLabRoom)
          .get();

        if (!labRoomQuery.empty) {
          const labRoomDoc = labRoomQuery.docs[0];
          const labRoomItemRef = labRoomDoc.ref
            .collection("items")
            .doc(data.itemId);
          await labRoomItemRef.update(updatedData);
        }

        // ✅ Log this removal to activity logs
        const activityMessage = `Removed ${deductedQty} pcs from stock (${data.itemName})`;

        await db.collection("allactivitylog").add({
          action: activityMessage,
          userName,
          userId,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

        if (userId && userId !== "unknown") {
          await db
            .collection(`accounts/${userId}/activitylog`)
            .add({
              action: activityMessage,
              userName,
              timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });
        }

        if (values.logId) {
          await db.collection("inventory")
            .doc(inventoryId)
            .collection("stockLog")
            .doc(values.logId)
            .update({ deducted: true });
        }

        return res.status(200).json({ message: "Stock deducted successfully." });
      }
    }

    return res.status(404).json({ error: "Item not found." });

  } catch (err) {
    console.error("Deduct stockLog error:", err);
    return res.status(500).json({ error: "Failed to deduct stock." });
  }
});

// WITH CRITICAL LEVEL 
// app.post("/add-inventory", async (req, res) => {
//   try {
//     const values = req.body;
//     const {
//       itemName,
//       itemDetails,
//       department,
//       category,
//       labRoom,
//       quantity,
//       type,
//       unit,
//       entryDate,
//       expiryDate,
//       userId,
//       userName,
//       shelves,
//       row,
//     } = values;

//     if (!itemName || !department || !itemDetails) {
//       return res.status(400).json({ error: "Please fill up the form!" });
//     }

//     const trimmedName = itemName.trim();
//     const normalizedInputName = trimmedName.toLowerCase();
//     const normalizedInputDetails = itemDetails.trim().toLowerCase();
//     const normalizedDepartment = department.trim().toLowerCase();

//     const inventoryRef = db.collection("inventory");
//     const snapshot = await inventoryRef.get();
//     const allItems = snapshot.docs.map(doc => doc.data());

//     const sameNameItems = allItems.filter(item =>
//       item.itemName?.toLowerCase().startsWith(normalizedInputName)
//     );

//     const exactMatch = sameNameItems.find(item => {
//       const itemNameSafe = item.itemName?.toLowerCase() || "";
//       const itemDetailsSafe = item.itemDetails?.toLowerCase() || "";
//       const itemDepartmentSafe = item.department?.toLowerCase() || "";
//       return (
//         itemNameSafe === normalizedInputName &&
//         itemDetailsSafe === normalizedInputDetails &&
//         itemDepartmentSafe === normalizedDepartment
//       );
//     });

//     if (exactMatch) {
//       return res.status(409).json({ error: "Duplicate item exists in inventory." });
//     }

//     // 🔢 Generate itemId
//     const itemCategoryPrefixMap = {
//       Chemical: "CHEM",
//       Equipment: "EQP",
//       Reagent: "RGT",
//       Glasswares: "GLS",
//       Materials: "MAT",
//     };
//     const itemCategoryPrefix = itemCategoryPrefixMap[category] || "UNK";

//     const categoryDocs = await inventoryRef.where("category", "==", category).get();
//     let itemCategoryCount = categoryDocs.size + 1;
//     let generatedItemId = `${itemCategoryPrefix}${itemCategoryCount.toString().padStart(2, "0")}`;

//     while (!(await inventoryRef.where("itemId", "==", generatedItemId).get()).empty) {
//       itemCategoryCount++;
//       generatedItemId = `${itemCategoryPrefix}${itemCategoryCount.toString().padStart(2, "0")}`;
//     }

//     const timestamp = new Date();
//     const entryCurrentDate = new Date().toISOString().split("T")[0];
//     const quantityNumber = Number(quantity);
//     const defaultCriticalDays = 7;
//     const averageDailyUsage = 0; // future logic
//     const criticalLevel = Math.ceil(averageDailyUsage * defaultCriticalDays) || 1;

//     const finalItemName = sameNameItems.length > 0 ? trimmedName.replace(/\d+$/, "") : trimmedName;

//     const inventoryItem = {
//       itemId: generatedItemId,
//       itemName: finalItemName,
//       itemDetails,
//       entryCurrentDate,
//       expiryDate: type === "Fixed" ? null : expiryDate || null,
//       timestamp,
//       criticalLevel,
//       category,
//       labRoom,
//       quantity: quantityNumber,
//       department,
//       type,
//       status: "Available",
//       shelves,
//       row,
//       rawTimestamp: new Date(),
//       ...(category === "Chemical" || category === "Reagent" ? { unit } : {}),
//       ...(category !== "Chemical" && category !== "Reagent" && {
//         condition: {
//           Good: quantityNumber,
//           Defect: 0,
//           Damage: 0,
//           Lost: 0,
//         },
//       }),
//     };

//     const encryptedData = CryptoJS.AES.encrypt(
//       JSON.stringify(inventoryItem),
//       SECRET_KEY
//     ).toString();

//     const docRef = await db.collection("inventory").add({
//       ...inventoryItem,
//       qrCode: encryptedData,
//     });

//     // 🔍 Logs
//     await db.collection(`accounts/${userId}/activitylog`).add({
//       action: `Added new item (${finalItemName}) to inventory`,
//       userName: userName || "User",
//       timestamp: admin.firestore.FieldValue.serverTimestamp(),
//     });

//     await db.collection("allactivitylog").add({
//       action: `Added new item (${finalItemName}) to inventory`,
//       userName: userName || "User",
//       timestamp: admin.firestore.FieldValue.serverTimestamp(),
//     });

//     await docRef.collection("stockLog").add({
//       date: entryCurrentDate,
//       noOfItems: quantityNumber,
//       deliveryNumber: "DLV-00001",
//       createdAt: admin.firestore.FieldValue.serverTimestamp(),
//       ...(expiryDate && { expiryDate }),
//     });

//     // 🔁 Lab room
//     const labRoomQuery = await db.collection("labRoom").where("roomNumber", "==", labRoom).get();
//     let labRoomRef;

//     if (labRoomQuery.empty) {
//       labRoomRef = await db.collection("labRoom").add({
//         roomNumber: labRoom,
//         createdAt: new Date(),
//       });
//     } else {
//       labRoomRef = labRoomQuery.docs[0].ref;
//     }

//     await labRoomRef.collection("items").doc(generatedItemId).set({
//       ...inventoryItem,
//       qrCode: encryptedData,
//       roomNumber: labRoom,
//     });

//     const labRoomQR = CryptoJS.AES.encrypt(
//       JSON.stringify({ labRoomId: labRoomRef.id }),
//       SECRET_KEY
//     ).toString();

//     await labRoomRef.update({
//       qrCode: labRoomQR,
//       updatedAt: new Date(),
//     });

//     return res.status(200).json({
//       message: "Item successfully added!",
//       itemId: generatedItemId,
//     });

//   } catch (err) {
//     console.error("Error in /add-inventory:", err);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// });

// app.post("/add-inventory", async (req, res) => {
//   try {
//     const values = req.body;
//     const {
//       itemName,
//       itemDetails,
//       department,
//       category,
//       labRoom,
//       quantity,
//       type,
//       unit,
//       entryDate,
//       expiryDate,
//       userId,
//       userName,
//       shelves,
//       row,
//     } = values;

//     if (!itemName || !department || !itemDetails) {
//       return res.status(400).json({ error: "Please fill up the form!" });
//     }

//     const trimmedName = itemName.trim();
//     const normalizedInputName = trimmedName.toLowerCase();
//     const normalizedInputDetails = itemDetails.trim().toLowerCase();
//     const normalizedDepartment = department.trim().toLowerCase();

//     const inventoryRef = db.collection("inventory");
//     const snapshot = await inventoryRef.get();
//     const allItems = snapshot.docs.map(doc => doc.data());

//     const sameNameItems = allItems.filter(item =>
//       item.itemName?.toLowerCase().startsWith(normalizedInputName)
//     );

//     const exactMatch = sameNameItems.find(item => {
//       const itemNameSafe = item.itemName?.toLowerCase() || "";
//       const itemDetailsSafe = item.itemDetails?.toLowerCase() || "";
//       const itemDepartmentSafe = item.department?.toLowerCase() || "";
//       return (
//         itemNameSafe === normalizedInputName &&
//         itemDetailsSafe === normalizedInputDetails &&
//         itemDepartmentSafe === normalizedDepartment
//       );
//     });

//     if (exactMatch) {
//       return res.status(409).json({ error: "Duplicate item exists in inventory." });
//     }

//     // 🔢 Generate itemId
//     const itemCategoryPrefixMap = {
//       Chemical: "CHEM",
//       Equipment: "EQP",
//       Reagent: "RGT",
//       Glasswares: "GLS",
//       Materials: "MAT",
//     };
//     const itemCategoryPrefix = itemCategoryPrefixMap[category] || "UNK";

//     const categoryDocs = await inventoryRef.where("category", "==", category).get();
//     let itemCategoryCount = categoryDocs.size + 1;
//     let generatedItemId = `${itemCategoryPrefix}${itemCategoryCount.toString().padStart(2, "0")}`;

//     while (!(await inventoryRef.where("itemId", "==", generatedItemId).get()).empty) {
//       itemCategoryCount++;
//       generatedItemId = `${itemCategoryPrefix}${itemCategoryCount.toString().padStart(2, "0")}`;
//     }

//     const timestamp = new Date();
//     const entryCurrentDate = new Date().toISOString().split("T")[0];
//     const quantityNumber = Number(quantity);
//     const defaultCriticalDays = 7;
//     const averageDailyUsage = 0; // future logic
//     const criticalLevel = Math.ceil(averageDailyUsage * defaultCriticalDays) || 1;

//     const finalItemName = sameNameItems.length > 0 ? trimmedName.replace(/\d+$/, "") : trimmedName;

//     const inventoryItem = {
//       itemId: generatedItemId,
//       itemName: finalItemName,
//       itemDetails,
//       entryCurrentDate,
//       expiryDate: type === "Fixed" ? null : expiryDate || null,
//       timestamp,
//       criticalLevel,
//       category,
//       labRoom,
//       quantity: quantityNumber,
//       department,
//       type,
//       status: "Available",
//       shelves,
//       row,
//       rawTimestamp: new Date(),
//       ...(category === "Chemical" || category === "Reagent" ? { unit } : {}),
//       ...(category !== "Chemical" && category !== "Reagent" && {
//         condition: {
//           Good: quantityNumber,
//           Defect: 0,
//           Damage: 0,
//           Lost: 0,
//         },
//       }),
//     };

//     const encryptedData = CryptoJS.AES.encrypt(
//       JSON.stringify(inventoryItem),
//       SECRET_KEY
//     ).toString();

//     const docRef = await db.collection("inventory").add({
//       ...inventoryItem,
//       qrCode: encryptedData,
//     });

//     // 🔍 Logs
//     await db.collection(`accounts/${userId}/activitylog`).add({
//       action: `Added new item (${finalItemName}) to inventory`,
//       userName: userName || "User",
//       timestamp: admin.firestore.FieldValue.serverTimestamp(),
//     });

//     await db.collection("allactivitylog").add({
//       action: `Added new item (${finalItemName}) to inventory`,
//       userName: userName || "User",
//       timestamp: admin.firestore.FieldValue.serverTimestamp(),
//     });

//     await docRef.collection("stockLog").add({
//       date: entryCurrentDate,
//       noOfItems: quantityNumber,
//       deliveryNumber: "DLV-00001",
//       createdAt: admin.firestore.FieldValue.serverTimestamp(),
//       ...(expiryDate && { expiryDate }),
//     });

//     // 🔁 Lab room
//     const labRoomQuery = await db.collection("labRoom").where("roomNumber", "==", labRoom).get();
//     let labRoomRef;

//     if (labRoomQuery.empty) {
//       labRoomRef = await db.collection("labRoom").add({
//         roomNumber: labRoom,
//         createdAt: new Date(),
//       });
//     } else {
//       labRoomRef = labRoomQuery.docs[0].ref;
//     }

//     await labRoomRef.collection("items").doc(generatedItemId).set({
//       ...inventoryItem,
//       qrCode: encryptedData,
//       roomNumber: labRoom,
//     });

//     const labRoomQR = CryptoJS.AES.encrypt(
//       JSON.stringify({ labRoomId: labRoomRef.id }),
//       SECRET_KEY
//     ).toString();

//     await labRoomRef.update({
//       qrCode: labRoomQR,
//       updatedAt: new Date(),
//     });

//     // 📦 Shelves QR with Nested Rows:
//     const shelvesQRData = CryptoJS.AES.encrypt(
//       JSON.stringify({ shelves }),
//       SECRET_KEY
//     ).toString();

//     const shelvesDocRef = labRoomRef.collection("shelves").doc(shelves);  // e.g., "A"

//     // await shelvesDocRef.collection("rows").add({
//     //   ...inventoryItem,
//     //   rowQR: rowQRData,
//     //   row,
//     //   itemId: generatedItemId,
//     //   createdAt: new Date(),
//     // });

//     // Create or update the shelves doc
//     await shelvesDocRef.set({
//       shelvesQR: shelvesQRData,
//       shelves,
//       createdAt: new Date(),
//     }, { merge: true });    await shelvesDocRef.set({
//       shelvesQR: shelvesQRData,
//       shelves,
//       createdAt: new Date(),
//     });

//     // 📦 Rows and Item IDs under Shelves:
//     // const rowQRData = CryptoJS.AES.encrypt(
//     //   JSON.stringify({ row, itemId: generatedItemId }),
//     //   SECRET_KEY
//     // ).toString();

//     // 📦 Row document reference (e.g., row "1")
//     const rowString = String(row);

//     // encrypt FIRST
//     const rowQRData = CryptoJS.AES.encrypt(
//       JSON.stringify({ row, itemId: generatedItemId }),
//       SECRET_KEY
//     ).toString();

//     // const rowDocRef = shelvesDocRef.collection("rows").doc(rowString);

//     // 📦 Rows and Item IDs under Shelves:
//     // const rowQRData = CryptoJS.AES.encrypt(
//     //   JSON.stringify({ row, itemId: generatedItemId }),
//     //   SECRET_KEY
//     // ).toString();

//     // Create the row document if not exists
//     // await rowDocRef.set({
//     //   row,
//     //   createdAt: new Date(),
//     // }, { merge: true });

//     // // Add item under this row
//     // await rowDocRef.collection("items").add({
//     //   ...inventoryItem,
//     //   rowQR: rowQRData,
//     //   row,
//     //   itemId: generatedItemId,
//     //   createdAt: new Date(),
//     // });

//     // now create or merge the row doc with its QR
//     await shelvesDocRef
//       .collection("rows")
//       .doc(rowString)
//       .set(
//         {
//           row,
//           rowQR: rowQRData,   // ✅ stored on the row doc
//           createdAt: new Date(),
//         },
//         { merge: true }
//       );

//     // add the item
//     await shelvesDocRef
//       .collection("rows")
//       .doc(rowString)
//       .collection("items")
//       .add({
//         ...inventoryItem,
//         rowQR: rowQRData,
//         row,
//         itemId: generatedItemId,
//         createdAt: new Date(),
//       });
  
//     // // Store Row QR using .add (auto-generated doc ID)
//     // await shelvesDocRef.collection("rows").add({
//     //   ...inventoryItem,
//     //   rowQR: rowQRData,
//     //   row,
//     //   itemId: generatedItemId,
//     //   createdAt: new Date(),
//     // });

//     return res.status(200).json({
//       message: "Item successfully added!",
//       itemId: generatedItemId,
//     });

//   } catch (err) {
//     console.error("Error in /add-inventory:", err);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// });

app.post("/add-inventory", async (req, res) => {
  try {
    const values = req.body;
    const {
      itemName,
      itemDetails,
      department,
      category,
      labRoom,
      quantity,
      type,
      unit,
      entryDate,
      expiryDate,
      userId,
      userName,
      shelves,
      row,
      itemIdMode,
      manualItemId,
    } = values;

    if (!itemName || !department || !itemDetails) {
      return res.status(400).json({ error: "Please fill up the form!" });
    }

    const trimmedName = itemName.trim();
    const normalizedInputName = trimmedName.toLowerCase();
    const normalizedInputDetails = itemDetails.trim().toLowerCase();
    const normalizedDepartment = department.trim().toLowerCase();

    const inventoryRef = db.collection("inventory");
    const snapshot = await inventoryRef.get();
    const allItems = snapshot.docs.map(doc => doc.data());

    const sameNameItems = allItems.filter(item =>
      item.itemName?.toLowerCase().startsWith(normalizedInputName)
    );

    const exactMatch = sameNameItems.find(item => {
      const itemNameSafe = item.itemName?.toLowerCase() || "";
      const itemDetailsSafe = item.itemDetails?.toLowerCase() || "";
      const itemDepartmentSafe = item.department?.toLowerCase() || "";
      return (
        itemNameSafe === normalizedInputName &&
        itemDetailsSafe === normalizedInputDetails &&
        itemDepartmentSafe === normalizedDepartment
      );
    });

    if (exactMatch) {
      return res.status(409).json({ error: "Duplicate item exists in inventory." });
    }

    // 🔢 Generate or validate itemId
    let finalItemId;
    
    if (itemIdMode === "manual" && manualItemId) {
      // Manual mode: validate the provided itemId
      const trimmedManualId = manualItemId.trim().toUpperCase();
      
      // Check if manual itemId already exists
      const existingItemQuery = await inventoryRef.where("itemId", "==", trimmedManualId).get();
      if (!existingItemQuery.empty) {
        return res.status(409).json({ error: "Item ID already exists. Please choose a different ID." });
      }
      
      // Validate format (uppercase letters and numbers only)
      if (!/^[A-Z0-9]+$/.test(trimmedManualId)) {
        return res.status(400).json({ error: "Item ID must contain only uppercase letters and numbers." });
      }
      
      // Validate length
      if (trimmedManualId.length < 3 || trimmedManualId.length > 20) {
        return res.status(400).json({ error: "Item ID must be between 3 and 20 characters." });
      }
      
      finalItemId = trimmedManualId;
    } else {
      // Automatic mode: generate itemId based on category
      const itemCategoryPrefixMap = {
        Chemical: "CHEM",
        Equipment: "EQP",
        Reagent: "RGT",
        Glasswares: "GLS",
        Materials: "MAT",
      };
      const itemCategoryPrefix = itemCategoryPrefixMap[category] || "UNK";

      const categoryDocs = await inventoryRef.where("category", "==", category).get();
      let itemCategoryCount = categoryDocs.size + 1;
      let generatedItemId = `${itemCategoryPrefix}${itemCategoryCount.toString().padStart(2, "0")}`;

      while (!(await inventoryRef.where("itemId", "==", generatedItemId).get()).empty) {
        itemCategoryCount++;
        generatedItemId = `${itemCategoryPrefix}${itemCategoryCount.toString().padStart(2, "0")}`;
      }
      
      finalItemId = generatedItemId;
    }

    const timestamp = new Date();
    const entryCurrentDate = new Date().toISOString().split("T")[0];
    const quantityNumber = Number(quantity);
    const defaultCriticalDays = 7;
    const averageDailyUsage = 0; // future logic
    const criticalLevel = Math.ceil(averageDailyUsage * defaultCriticalDays) || 1;

    const finalItemName = sameNameItems.length > 0 ? trimmedName.replace(/\d+$/, "") : trimmedName;

    const inventoryItem = {
      itemId: finalItemId,
      itemName: finalItemName,
      itemDetails,
      entryCurrentDate,
      expiryDate: type === "Fixed" ? null : expiryDate || null,
      timestamp,
      criticalLevel,
      category,
      labRoom,
      quantity: quantityNumber,
      department,
      type,
      status: "Available",
      shelves,
      row,
      rawTimestamp: new Date(),
      ...(category === "Chemical" || category === "Reagent" ? { unit } : {}),
      ...(category !== "Chemical" && category !== "Reagent" && {
        condition: {
          Good: quantityNumber,
          Defect: 0,
          Damage: 0,
          Lost: 0,
        },
      }),
    };

    const encryptedData = CryptoJS.AES.encrypt(
      JSON.stringify(inventoryItem),
      SECRET_KEY
    ).toString();

    const docRef = await db.collection("inventory").add({
      ...inventoryItem,
      qrCode: encryptedData,
    });

    // 🔍 Logs
    await db.collection(`accounts/${userId}/activitylog`).add({
      action: `Added new item (${finalItemName}) to inventory`,
      userName: userName || "User",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    await db.collection("allactivitylog").add({
      action: `Added new item (${finalItemName}) to inventory`,
      userName: userName || "User",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    await docRef.collection("stockLog").add({
      date: entryCurrentDate,
      noOfItems: quantityNumber,
      deliveryNumber: "DLV-00001",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      ...(expiryDate && { expiryDate }),
    });

    // 🔁 Lab room
    const labRoomQuery = await db.collection("labRoom").where("roomNumber", "==", labRoom).get();
    let labRoomRef;

    if (labRoomQuery.empty) {
      labRoomRef = await db.collection("labRoom").add({
        roomNumber: labRoom,
        createdAt: new Date(),
      });
    } else {
      labRoomRef = labRoomQuery.docs[0].ref;
    }

    const labRoomId = labRoomRef.id;

    await labRoomRef.collection("items").doc(finalItemId).set({
      ...inventoryItem,
      qrCode: encryptedData,
      roomNumber: labRoom,
    });

    const labRoomQR = CryptoJS.AES.encrypt(
      JSON.stringify({ labRoomId: labRoomRef.id }),
      SECRET_KEY
    ).toString();

    await labRoomRef.update({
      qrCode: labRoomQR,
      updatedAt: new Date(),
    });

     // 📦 Generate Shelf QR with labRoomId
    const shelvesQRData = CryptoJS.AES.encrypt(
      JSON.stringify({ labRoomId, shelves }),
      SECRET_KEY
    ).toString();

    const shelvesDocRef = labRoomRef.collection("shelves").doc(shelves);

    await shelvesDocRef.set({
      shelvesQR: shelvesQRData,
      shelves,
      createdAt: new Date(),
    }, { merge: true });

    // 📦 Generate Row QR with labRoomId + shelf + row
    const rowString = String(row);

    const rowQRData = CryptoJS.AES.encrypt(
      JSON.stringify({ labRoomId, shelves, row }),
      SECRET_KEY
    ).toString();

    await shelvesDocRef
      .collection("rows")
      .doc(rowString)
      .set({
        row,
        rowQR: rowQRData,
        createdAt: new Date(),
      }, { merge: true });

    await shelvesDocRef
      .collection("rows")
      .doc(rowString)
      .collection("items")
      .add({
        ...inventoryItem,
        rowQR: rowQRData,
        row,
        itemId: finalItemId,
        createdAt: new Date(),
      });

    // 🔧 Create QR subcollection for equipment items
    if (category === "Equipment" && quantityNumber > 0) {
      const qrSubcollectionRef = docRef.collection("qrCodes");
      
      // Generate individual QR codes for each equipment unit
      for (let i = 1; i <= quantityNumber; i++) {
        // Create individual item ID (e.g., MS01, MS02, MS03...)
        const individualItemId = `${finalItemId}${String(i).padStart(2, "0")}`;
        
        // Create individual item data
        const individualItemData = {
          ...inventoryItem,
          individualItemId: individualItemId,
          itemName: `${finalItemName} #${i}`,
          quantity: 1,
          condition: "Good",
          status: "Available",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          parentItemId: finalItemId,
          unitNumber: i,
        };

        // Encrypt individual item data for QR code
        const individualQRData = CryptoJS.AES.encrypt(
          JSON.stringify(individualItemData),
          SECRET_KEY
        ).toString();

        // Add to QR subcollection
        await qrSubcollectionRef.add({
          ...individualItemData,
          qrCode: individualQRData,
        });
      }
    }

    return res.status(200).json({
      message: "Item successfully added!",
      itemId: finalItemId,
    });

  } catch (err) {
    console.error("Error in /add-inventory:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get individual QR codes for an equipment item
app.get("/get-item-qr-codes/:itemId", async (req, res) => {
  try {
    const { itemId } = req.params;

    if (!itemId) {
      return res.status(400).json({ error: "Item ID is required" });
    }

    // Find the main inventory item
    const inventoryQuery = await db.collection("inventory").where("itemId", "==", itemId).get();
    
    if (inventoryQuery.empty) {
      return res.status(404).json({ error: "Item not found" });
    }

    const inventoryDoc = inventoryQuery.docs[0];
    const inventoryData = inventoryDoc.data();

    // Check if this is an equipment item
    if (inventoryData.category !== "Equipment") {
      return res.status(400).json({ error: "QR subcollection is only available for equipment items" });
    }

    // Get QR codes from subcollection
    const qrCodesSnapshot = await inventoryDoc.ref.collection("qrCodes").orderBy("unitNumber", "asc").get();
    
    const qrCodes = qrCodesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        individualItemId: data.individualItemId,
        itemName: data.itemName,
        condition: data.condition,
        status: data.status,
        unitNumber: data.unitNumber,
        qrCode: data.qrCode,
        createdAt: data.createdAt,
      };
    });

    return res.status(200).json({
      parentItem: {
        itemId: inventoryData.itemId,
        itemName: inventoryData.itemName,
        itemDetails: inventoryData.itemDetails,
        category: inventoryData.category,
        quantity: inventoryData.quantity,
      },
      qrCodes: qrCodes,
    });

  } catch (err) {
    console.error("Error in /get-item-qr-codes:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Update individual QR code condition/status
app.post("/update-qr-code", async (req, res) => {
  try {
    const { itemId, qrCodeId, condition, status, userId, userName } = req.body;

    if (!itemId || !qrCodeId) {
      return res.status(400).json({ error: "Item ID and QR Code ID are required" });
    }

    // Find the main inventory item
    const inventoryQuery = await db.collection("inventory").where("itemId", "==", itemId).get();
    
    if (inventoryQuery.empty) {
      return res.status(404).json({ error: "Item not found" });
    }

    const inventoryDoc = inventoryQuery.docs[0];
    const inventoryData = inventoryDoc.data();

    // Check if this is an equipment item
    if (inventoryData.category !== "Equipment") {
      return res.status(400).json({ error: "QR code updates are only available for equipment items" });
    }

    // Update the specific QR code document
    const qrCodeRef = inventoryDoc.ref.collection("qrCodes").doc(qrCodeId);
    const qrCodeDoc = await qrCodeRef.get();

    if (!qrCodeDoc.exists) {
      return res.status(404).json({ error: "QR code not found" });
    }

    const updateData = {};
    if (condition) updateData.condition = condition;
    if (status) updateData.status = status;
    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await qrCodeRef.update(updateData);

    // Update main item condition totals if condition was changed
    if (condition) {
      const qrCodesSnapshot = await inventoryDoc.ref.collection("qrCodes").get();
      const qrCodes = qrCodesSnapshot.docs.map(doc => doc.data());
      
      // Count conditions
      const conditionCounts = {
        Good: 0,
        Defect: 0,
        Damage: 0,
        Lost: 0
      };
      
      qrCodes.forEach(qr => {
        if (conditionCounts.hasOwnProperty(qr.condition)) {
          conditionCounts[qr.condition]++;
        }
      });
      
      // Calculate total available quantity (only Good items count)
      const availableQuantity = conditionCounts.Good;
      
      // Update main inventory item condition and quantity
      await inventoryDoc.ref.update({
        condition: conditionCounts,
        quantity: availableQuantity,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      // Also update in lab room if exists
      if (inventoryData.labRoom) {
        const labRoomQuery = await db.collection("labRoom").where("roomNumber", "==", inventoryData.labRoom).get();
        if (!labRoomQuery.empty) {
          const labRoomDoc = labRoomQuery.docs[0];
          const labRoomItemRef = labRoomDoc.ref.collection("items").doc(inventoryData.itemId);
          await labRoomItemRef.update({
            condition: conditionCounts,
            quantity: availableQuantity,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }
    }

    // Log the activity
    await db.collection("allactivitylog").add({
      action: `Updated QR code condition/status for ${inventoryData.itemName} (${qrCodeId})`,
      userName: userName || "User",
      userId: userId || "unknown",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    if (userId !== "unknown") {
      await db.collection(`accounts/${userId}/activitylog`).add({
        action: `Updated QR code condition/status for ${inventoryData.itemName} (${qrCodeId})`,
        userName: userName || "User",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return res.status(200).json({ 
      message: "QR code updated successfully",
      updatedCondition: condition ? await inventoryDoc.ref.get().then(doc => doc.data().condition) : null
    });

  } catch (err) {
    console.error("Error in /update-qr-code:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Deploy individual QR codes for equipment items
// app.post("/deploy-individual-qr-codes", async (req, res) => {
//   try {
//     console.log("🚀 DEPLOY ENDPOINT CALLED with data:", req.body);
//     const { itemId, quantity, userId, userName } = req.body;

//     if (!itemId || !quantity) {
//       return res.status(400).json({ error: "Item ID and quantity are required" });
//     }

//     // Find the main inventory item
//     console.log(`🔍 Searching for itemId: "${itemId}" (type: ${typeof itemId})`);
    
//     let inventoryDoc, inventoryData;
    
    
//     // Let's try multiple search approaches
//     console.log(`🔍 Approach 1: Search by itemId field`);
//     const inventoryQuery = await db.collection("inventory").where("itemId", "==", itemId).get();
//     console.log(`📊 Found ${inventoryQuery.docs.length} documents with itemId: "${itemId}"`);
    
//     if (inventoryQuery.empty) {
//       console.log(`🔍 Approach 2: Search by itemId field with trim`);
//       const trimmedItemId = itemId.toString().trim();
//       const inventoryQuery2 = await db.collection("inventory").where("itemId", "==", trimmedItemId).get();
//       console.log(`📊 Found ${inventoryQuery2.docs.length} documents with trimmed itemId: "${trimmedItemId}"`);
      
//       if (inventoryQuery2.empty) {
//         console.log(`🔍 Approach 3: Search by itemId field with toString()`);
//         const stringItemId = itemId.toString();
//         const inventoryQuery3 = await db.collection("inventory").where("itemId", "==", stringItemId).get();
//         console.log(`📊 Found ${inventoryQuery3.docs.length} documents with string itemId: "${stringItemId}"`);
        
//         if (inventoryQuery3.empty) {
//           console.log(`🔍 Approach 4: Get all inventory items to debug`);
//           const allInventory = await db.collection("inventory").get();
//           console.log(`📊 Total inventory items: ${allInventory.docs.length}`);
          
//           allInventory.docs.forEach((doc, index) => {
//             const data = doc.data();
//             console.log(`  Item ${index + 1}: docId="${doc.id}", itemId="${data.itemId}" (type: ${typeof data.itemId}), itemName="${data.itemName}"`);
//           });
          
//           return res.status(404).json({ error: `Item not found with itemId: ${itemId}` });
//         } else {
//           inventoryDoc = inventoryQuery3.docs[0];
//           inventoryData = inventoryDoc.data();
//         }
//       } else {
//         inventoryDoc = inventoryQuery2.docs[0];
//         inventoryData = inventoryDoc.data();
//       }
//     } else {
//       inventoryDoc = inventoryQuery.docs[0];
//       inventoryData = inventoryDoc.data();
//     }
    
//     console.log(`✅ Found item:`, { 
//       docId: inventoryDoc.id, 
//       itemId: inventoryData.itemId, 
//       itemName: inventoryData.itemName,
//       category: inventoryData.category 
//     });

//     // Check if this is an equipment item
//     if (inventoryData.category !== "Equipment") {
//       return res.status(400).json({ error: "Individual QR code deployment is only available for equipment items" });
//     }

//     // // Get available "Good" QR codes
//     // const qrCodesSnapshot = await inventoryDoc.ref
//     //   .collection("qrCodes")
//     //   .where("condition", "==", "Good")
//     //   .where("status", "==", "Available")
//     //   .orderBy("unitNumber", "asc")
//     //   .limit(parseInt(quantity))
//     //   .get();

//     // console.log(`🔍 Found ${qrCodesSnapshot.docs.length} available QR codes for deployment`);
//     // qrCodesSnapshot.docs.forEach((doc, index) => {
//     //   const data = doc.data();
//     //   console.log(`  QR Code ${index + 1}: ${data.individualItemId} - ${data.condition} - ${data.status}`);
//     // });

//     // if (qrCodesSnapshot.empty || qrCodesSnapshot.docs.length < quantity) {
//     //   return res.status(400).json({ 
//     //     error: `Not enough available items. Found ${qrCodesSnapshot.docs.length} available items, but ${quantity} requested.` 
//     //   });
//     // }

//     // // Update the selected QR codes to "In Use"
//     // const deployedQRCodes = [];
//     // const batch = db.batch();

//     // qrCodesSnapshot.docs.forEach(doc => {
//     //   const qrCodeRef = doc.ref;
//     //   batch.update(qrCodeRef, {
//     //     status: "In Use",
//     //     deployedBy: userName || "Unknown",
//     //     deployedById: userId || "unknown",
//     //     deployedAt: admin.firestore.FieldValue.serverTimestamp(),
//     //   });
//     //   deployedQRCodes.push({
//     //     id: doc.id,
//     //     individualItemId: doc.data().individualItemId,
//     //     itemName: doc.data().itemName,
//     //     unitNumber: doc.data().unitNumber,
//     //   });
//     // });

//     // await batch.commit();

//     // Use transaction to prevent race conditions
//     let deployedQRCodes;
//     try {
//       deployedQRCodes = await db.runTransaction(async (transaction) => {
//         // Get available "Good" QR codes within transaction
//         const qrCodesSnapshot = await transaction.get(
//           inventoryDoc.ref
//             .collection("qrCodes")
//             .where("condition", "==", "Good")
//             .where("status", "==", "Available")
//             .orderBy("unitNumber", "asc")
//             .limit(parseInt(quantity))
//         );

//         console.log(`🔍 Found ${qrCodesSnapshot.docs.length} available QR codes for deployment`);
//         qrCodesSnapshot.docs.forEach((doc, index) => {
//           const data = doc.data();
//           console.log(`  QR Code ${index + 1}: ${data.individualItemId} - ${data.condition} - ${data.status}`);
//         });

//         if (qrCodesSnapshot.empty || qrCodesSnapshot.docs.length < quantity) {
//           throw new Error(`Not enough available items. Found ${qrCodesSnapshot.docs.length} available items, but ${quantity} requested.`);
//         }

//         // Update the selected QR codes to "In Use" within transaction
//         const deployedQRCodes = [];
        
//         qrCodesSnapshot.docs.forEach(doc => {
//           const qrCodeRef = doc.ref;
//           transaction.update(qrCodeRef, {
//             status: "In Use",
//             deployedBy: userName || "Unknown",
//             deployedById: userId || "unknown",
//             deployedAt: admin.firestore.FieldValue.serverTimestamp(),
//           });
//           deployedQRCodes.push({
//             id: doc.id,
//             individualItemId: doc.data().individualItemId,
//             itemName: doc.data().itemName,
//             unitNumber: doc.data().unitNumber,
//           });
//         });

//         return deployedQRCodes;
//       });
      
//     } catch (transactionError) {
//       console.error("❌ Transaction failed:", transactionError.message);
//       return res.status(400).json({ 
//         error: transactionError.message 
//       });
//     }

//     console.log(`✅ Successfully updated ${deployedQRCodes.length} QR codes to "In Use" status`);

//     // Update main inventory item condition counts after deployment
//     const allQRCodesSnapshot = await inventoryDoc.ref.collection("qrCodes").get();
//     const conditionCounts = {
//       Good: 0,
//       Defect: 0,
//       Damage: 0,
//       Lost: 0
//     };

//     allQRCodesSnapshot.forEach((doc) => {
//       const data = doc.data();
//       const condition = data.condition;
//       const status = data.status;
      
//       // Only count items that are "Available" status for condition counts
//       // "In Use" items should not be counted in available quantity
//       if (status === "Available" && conditionCounts.hasOwnProperty(condition)) {
//         conditionCounts[condition]++;
//       }
//     });

//     console.log(`📊 Updated condition counts:`, conditionCounts);
//     console.log(`📊 Available quantity (Good + Available): ${conditionCounts.Good}`);

//     // Update main inventory item condition totals
//     await inventoryDoc.ref.update({
//       condition: conditionCounts,
//       quantity: conditionCounts.Good, // Only Good + Available items count toward available quantity
//       updatedAt: admin.firestore.FieldValue.serverTimestamp(),
//     });

//     // Also update in lab room if exists
//     if (inventoryData.labRoom) {
//       const labRoomQuery = await db.collection("labRoom").where("roomNumber", "==", inventoryData.labRoom).get();
//       if (!labRoomQuery.empty) {
//         const labRoomDoc = labRoomQuery.docs[0];
//         const labRoomItemRef = labRoomDoc.ref.collection("items").doc(inventoryData.itemId);
//         await labRoomItemRef.update({
//           condition: conditionCounts,
//           quantity: conditionCounts.Good,
//           updatedAt: admin.firestore.FieldValue.serverTimestamp(),
//         });
//       }
//     }

//     // Log the activity
//     await db.collection("allactivitylog").add({
//       action: `Deployed ${quantity} individual QR codes for ${inventoryData.itemName}`,
//       userName: userName || "User",
//       userId: userId || "unknown",
//       timestamp: admin.firestore.FieldValue.serverTimestamp(),
//     });

//     if (userId !== "unknown") {
//       await db.collection(`accounts/${userId}/activitylog`).add({
//         action: `Deployed ${quantity} individual QR codes for ${inventoryData.itemName}`,
//         userName: userName || "User",
//         timestamp: admin.firestore.FieldValue.serverTimestamp(),
//       });
//     }

//     return res.status(200).json({ 
//       message: `Successfully deployed ${quantity} individual items`,
//       deployedQRCodes: deployedQRCodes,
//     });

//   } catch (err) {
//     console.error("❌ Error in /deploy-individual-qr-codes:", err);
//     console.error("❌ Error stack:", err.stack);
//     return res.status(500).json({ error: `Internal server error: ${err.message}` });
//   }
// });

// Reserve individual QR codes for equipment items (set to "Borrowed" status)
app.post("/reserve-individual-qr-codes", async (req, res) => {
  try {
    console.log("🔒 RESERVE ENDPOINT CALLED with data:", req.body);
    const { itemId, quantity, userId, userName } = req.body;

    if (!itemId || !quantity) {
      return res.status(400).json({ error: "Item ID and quantity are required" });
    }

    // Find the main inventory item
    console.log(`🔍 Searching for itemId: "${itemId}" (type: ${typeof itemId})`);
    
    let inventoryDoc, inventoryData;
    
    // Let's try multiple search approaches
    console.log(`🔍 Approach 1: Search by itemId field`);
    const inventoryQuery = await db.collection("inventory").where("itemId", "==", itemId).get();
    console.log(`📊 Found ${inventoryQuery.docs.length} documents with itemId: "${itemId}"`);
    
    if (inventoryQuery.empty) {
      console.log(`🔍 Approach 2: Search by itemId field with trim`);
      const trimmedItemId = itemId.toString().trim();
      const inventoryQuery2 = await db.collection("inventory").where("itemId", "==", trimmedItemId).get();
      console.log(`📊 Found ${inventoryQuery2.docs.length} documents with trimmed itemId: "${trimmedItemId}"`);
      
      if (inventoryQuery2.empty) {
        console.log(`🔍 Approach 3: Search by itemId field with toString()`);
        const stringItemId = itemId.toString();
        const inventoryQuery3 = await db.collection("inventory").where("itemId", "==", stringItemId).get();
        console.log(`📊 Found ${inventoryQuery3.docs.length} documents with string itemId: "${stringItemId}"`);
        
        if (inventoryQuery3.empty) {
          console.log(`🔍 Approach 4: Get all inventory items to debug`);
          const allInventory = await db.collection("inventory").get();
          console.log(`📊 Total inventory items: ${allInventory.docs.length}`);
          
          allInventory.docs.forEach((doc, index) => {
            const data = doc.data();
            console.log(`  Item ${index + 1}: docId="${doc.id}", itemId="${data.itemId}" (type: ${typeof data.itemId}), itemName="${data.itemName}"`);
          });
          
          return res.status(404).json({ error: `Item not found with itemId: ${itemId}` });
        } else {
          inventoryDoc = inventoryQuery3.docs[0];
          inventoryData = inventoryDoc.data();
        }
      } else {
        inventoryDoc = inventoryQuery2.docs[0];
        inventoryData = inventoryDoc.data();
      }
    } else {
      inventoryDoc = inventoryQuery.docs[0];
      inventoryData = inventoryDoc.data();
    }
    
    console.log(`✅ Found item:`, { 
      docId: inventoryDoc.id, 
      itemId: inventoryData.itemId, 
      itemName: inventoryData.itemName,
      category: inventoryData.category 
    });

    // Check if this is an equipment item
    if (inventoryData.category !== "Equipment") {
      return res.status(400).json({ error: "Individual QR code reservation is only available for equipment items" });
    }

    // Use transaction to prevent race conditions
    let reservedQRCodes;
    try {
      reservedQRCodes = await db.runTransaction(async (transaction) => {
        // Get available "Good" QR codes within transaction
        console.log(`🔍 SEARCHING FOR QR CODES: condition="Good", status="Available", limit=${quantity}`);
        const qrCodesSnapshot = await transaction.get(
          inventoryDoc.ref
            .collection("qrCodes")
            .where("condition", "==", "Good")
            .where("status", "==", "Available")
            .orderBy("unitNumber", "asc")
            .limit(parseInt(quantity))
        );
        
        console.log(`🔍 QUERY RESULT: Found ${qrCodesSnapshot.docs.length} QR codes`);
        qrCodesSnapshot.docs.forEach((doc, index) => {
          const data = doc.data();
          console.log(`  Query Result ${index + 1}: ${data.individualItemId} - condition="${data.condition}" - status="${data.status}" - deployedById="${data.deployedById}"`);
        });

        // Double-check that these QR codes are not already assigned to other users
        console.log(`🔍 DOUBLE-CHECKING QR CODES ARE NOT ALREADY ASSIGNED:`);
        for (const doc of qrCodesSnapshot.docs) {
          const freshDoc = await transaction.get(doc.ref);
          const freshData = freshDoc.data();
          console.log(`  Checking ${freshData.individualItemId}: status="${freshData.status}", deployedById="${freshData.deployedById}"`);
          
          if (freshData.status !== "Available") {
            throw new Error(`QR Code ${freshData.individualItemId} is not available! Status: ${freshData.status}`);
          }
          
        //   // Check if this QR code is already deployed to another user
        //   if (freshData.deployedById && freshData.deployedById !== userId) {
        //     throw new Error(`QR Code ${freshData.individualItemId} is already deployed to another user (${freshData.deployedById})!`);
        //   }
          
        //   // Check if this QR code is already deployed to the same user (prevent duplicates)
        //   if (freshData.deployedById === userId) {
        //     throw new Error(`QR Code ${freshData.individualItemId} is already deployed to this user!`);
        //   }
        }

        console.log(`🔍 Found ${qrCodesSnapshot.docs.length} available QR codes for reservation`);
        qrCodesSnapshot.docs.forEach((doc, index) => {
          const data = doc.data();
          console.log(`  QR Code ${index + 1}: ${data.individualItemId} - ${data.condition} - ${data.status}`);
        });

        if (qrCodesSnapshot.empty || qrCodesSnapshot.docs.length < quantity) {
          throw new Error(`Not enough available items. Found ${qrCodesSnapshot.docs.length} available items, but ${quantity} requested.`);
        }

        // Update the selected QR codes to "Borrowed" within transaction
        const reservedQRCodes = [];
        
        console.log(`🔒 RESERVING QR CODES TO "Borrowed" for user: ${userId} (${userName})`);
        qrCodesSnapshot.docs.forEach(doc => {
          const qrCodeRef = doc.ref;
          const qrData = doc.data();
          console.log(`  Reserving ${qrData.individualItemId} to "Borrowed" for user ${userId}`);
          
          transaction.update(qrCodeRef, {
            status: "Borrowed",
            reservedBy: userName || "Unknown",
            reservedById: userId || "unknown",
            reservedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          reservedQRCodes.push({
            id: doc.id,
            individualItemId: qrData.individualItemId,
            itemName: qrData.itemName,
            unitNumber: qrData.unitNumber,
          });
        });

        console.log(`✅ TRANSACTION WILL RESERVE:`, reservedQRCodes.map(qr => qr.individualItemId));
        return reservedQRCodes;
      });
    } catch (transactionError) {
      console.error("❌ Transaction failed:", transactionError.message);
      return res.status(400).json({ 
        error: transactionError.message 
      });
    }
    console.log(`✅ Successfully reserved ${reservedQRCodes.length} QR codes to "Borrowed" status`);
    console.log(`🎯 RESERVED QR CODES:`, reservedQRCodes.map(qr => qr.individualItemId));
    
    // Verify the reservation by checking the QR codes again
    console.log(`🔍 VERIFYING RESERVATION - Checking QR codes after transaction:`);
    const verifySnapshot = await inventoryDoc.ref.collection("qrCodes").get();
    verifySnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.status === "Borrowed" && data.reservedById === userId) {
        console.log(`  ✅ VERIFIED: ${data.individualItemId} is "Borrowed" for user ${userId}`);
      }
    });

    // Update main inventory item condition counts after reservation
    const allQRCodesSnapshot = await inventoryDoc.ref.collection("qrCodes").get();
    const conditionCounts = {
      Good: 0,
      Defect: 0,
      Damage: 0,
      Lost: 0,
    };

    allQRCodesSnapshot.forEach((doc) => {
      const data = doc.data();
      const condition = data.condition;
      const status = data.status;
      // Only count items that are "Available" status for condition counts
      // "Borrowed" and "In Use" items should not be counted in available quantity
      if (status === "Available" && conditionCounts.hasOwnProperty(condition)) {
        conditionCounts[condition]++;
      }
    });

    // Update main inventory item condition totals
    await inventoryDoc.ref.update({
      condition: conditionCounts,
      quantity: conditionCounts.Good, // Only Good items count toward available quantity
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Also update in lab room if exists
    if (inventoryData.labRoom) {
      const labRoomQuery = await db.collection("labRoom").where("roomNumber", "==", inventoryData.labRoom).get();
      if (!labRoomQuery.empty) {
        const labRoomDoc = labRoomQuery.docs[0];
        const labRoomItemRef = labRoomDoc.ref.collection("items").doc(inventoryData.itemId);
        await labRoomItemRef.update({
          condition: conditionCounts,
          quantity: conditionCounts.Good,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    // Log the activity
    await db.collection("allactivitylog").add({
      action: `Reserved ${reservedQRCodes.length} individual QR codes for ${inventoryData.itemName}`,
      userName: userName || "User",
      userId: userId || "unknown",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    if (userId !== "unknown") {
      await db.collection(`accounts/${userId}/activitylog`).add({
        action: `Reserved ${reservedQRCodes.length} individual QR codes for ${inventoryData.itemName}`,
        userName: userName || "User",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return res.status(200).json({
      message: `Successfully reserved ${reservedQRCodes.length} individual items`,
      reservedQRCodes: reservedQRCodes,
      updatedCondition: conditionCounts,
    });
  } catch (err) {
    console.error("Error in /reserve-individual-qr-codes:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Deploy individual QR codes for equipment items
app.post("/deploy-individual-qr-codes", async (req, res) => {
  try {
    console.log("🚀 DEPLOY ENDPOINT CALLED with data:", req.body);
    const { itemId, quantity, userId, userName, specificQRCodes } = req.body;
    console.log("🔍 SPECIFIC QR CODES RECEIVED:", specificQRCodes);

    if (!itemId || !quantity) {
      return res.status(400).json({ error: "Item ID and quantity are required" });
    }

    // Find the main inventory item
    console.log(`🔍 Searching for itemId: "${itemId}" (type: ${typeof itemId})`);
    
    let inventoryDoc, inventoryData;
    
    
    // Let's try multiple search approaches
    console.log(`🔍 Approach 1: Search by itemId field`);
    const inventoryQuery = await db.collection("inventory").where("itemId", "==", itemId).get();
    console.log(`📊 Found ${inventoryQuery.docs.length} documents with itemId: "${itemId}"`);
    
    if (inventoryQuery.empty) {
      console.log(`🔍 Approach 2: Search by itemId field with trim`);
      const trimmedItemId = itemId.toString().trim();
      const inventoryQuery2 = await db.collection("inventory").where("itemId", "==", trimmedItemId).get();
      console.log(`📊 Found ${inventoryQuery2.docs.length} documents with trimmed itemId: "${trimmedItemId}"`);
      
      if (inventoryQuery2.empty) {
        console.log(`🔍 Approach 3: Search by itemId field with toString()`);
        const stringItemId = itemId.toString();
        const inventoryQuery3 = await db.collection("inventory").where("itemId", "==", stringItemId).get();
        console.log(`📊 Found ${inventoryQuery3.docs.length} documents with string itemId: "${stringItemId}"`);
        
        if (inventoryQuery3.empty) {
          console.log(`🔍 Approach 4: Get all inventory items to debug`);
          const allInventory = await db.collection("inventory").get();
          console.log(`📊 Total inventory items: ${allInventory.docs.length}`);
          
          allInventory.docs.forEach((doc, index) => {
            const data = doc.data();
            console.log(`  Item ${index + 1}: docId="${doc.id}", itemId="${data.itemId}" (type: ${typeof data.itemId}), itemName="${data.itemName}"`);
          });
          
          return res.status(404).json({ error: `Item not found with itemId: ${itemId}` });
        } else {
          inventoryDoc = inventoryQuery3.docs[0];
          inventoryData = inventoryDoc.data();
        }
      } else {
        inventoryDoc = inventoryQuery2.docs[0];
        inventoryData = inventoryDoc.data();
      }
    } else {
      inventoryDoc = inventoryQuery.docs[0];
      inventoryData = inventoryDoc.data();
    }
    
    console.log(`✅ Found item:`, { 
      docId: inventoryDoc.id, 
      itemId: inventoryData.itemId, 
      itemName: inventoryData.itemName,
      category: inventoryData.category 
    });
    console.log("🔍 ITEM NAME FROM INVENTORY:", inventoryData.itemName);

    // Check if this is an equipment item
    if (inventoryData.category !== "Equipment") {
      return res.status(400).json({ error: "Individual QR code deployment is only available for equipment items" });
    }

    // Use transaction to prevent race conditions
    let deployedQRCodes;
    try {
      deployedQRCodes = await db.runTransaction(async (transaction) => {
        // Search for QR codes by base itemName (without unit number) that are "Borrowed" for this user
        const baseItemName = inventoryData.itemName; // e.g., "FINALMIKMIK"
        console.log(`🔍 SEARCHING FOR QR CODES BY BASE ITEMNAME: baseItemName="${baseItemName}", status="Borrowed", reservedById="${userId}", limit=${quantity}`);
        console.log(`🔍 DEPLOY DEBUG - itemId: ${itemId}, userId: ${userId}, userName: ${userName}`);
        
        // Get all QR codes for this item and filter by base itemName
        const allQRCodesSnapshot = await transaction.get(
          inventoryDoc.ref
            .collection("qrCodes")
            .where("status", "==", "Borrowed")
            .where("reservedById", "==", userId)
        );
        
        // Filter by base itemName (QR codes have itemName like "FINALMIKMIK #1", "FINALMIKMIK #2", etc.)
        const filteredDocs = allQRCodesSnapshot.docs.filter(doc => {
          const data = doc.data();
          const qrItemName = data.itemName || "";
          return qrItemName.startsWith(baseItemName);
        });
        
        // Sort by unitNumber and limit
        const sortedDocs = filteredDocs.sort((a, b) => {
          const unitA = a.data().unitNumber || 0;
          const unitB = b.data().unitNumber || 0;
          return unitA - unitB;
        }).slice(0, parseInt(quantity));
        
        const qrCodesSnapshot = { docs: sortedDocs, empty: sortedDocs.length === 0 };
        
        console.log(`🔍 QUERY RESULT: Found ${qrCodesSnapshot.docs.length} QR codes`);
        qrCodesSnapshot.docs.forEach((doc, index) => {
          const data = doc.data();
          console.log(`  Query Result ${index + 1}: ${data.individualItemId} - condition="${data.condition}" - status="${data.status}" - deployedById="${data.deployedById}"`);
        });

        // Double-check that these QR codes are not already assigned to other users
        console.log(`🔍 DOUBLE-CHECKING QR CODES ARE NOT ALREADY ASSIGNED:`);
        for (const doc of qrCodesSnapshot.docs) {
          const freshDoc = await transaction.get(doc.ref);
          const freshData = freshDoc.data();
          console.log(`  Checking ${freshData.individualItemId}: status="${freshData.status}", deployedById="${freshData.deployedById}"`);
          
          if (freshData.status !== "Borrowed") {
            throw new Error(`QR Code ${freshData.individualItemId} is not borrowed! Status: ${freshData.status}`);
          }
          
        //   // Check if this QR code is already deployed to another user
        //   if (freshData.deployedById && freshData.deployedById !== userId) {
        //     throw new Error(`QR Code ${freshData.individualItemId} is already deployed to another user (${freshData.deployedById})!`);
        //   }
          
        //   // Check if this QR code is already deployed to the same user (prevent duplicates)
        //   if (freshData.deployedById === userId) {
        //     throw new Error(`QR Code ${freshData.individualItemId} is already deployed to this user!`);
        //   }
        }

        console.log(`🔍 Found ${qrCodesSnapshot.docs.length} available QR codes for deployment`);
        qrCodesSnapshot.docs.forEach((doc, index) => {
          const data = doc.data();
          console.log(`  QR Code ${index + 1}: ${data.individualItemId} - ${data.condition} - ${data.status}`);
        });

        if (qrCodesSnapshot.empty || qrCodesSnapshot.docs.length < quantity) {
          throw new Error(`Not enough available items. Found ${qrCodesSnapshot.docs.length} available items, but ${quantity} requested.`);
        }

        // Update the selected QR codes to "In Use" within transaction
        const deployedQRCodes = [];
        
        console.log(`🔧 UPDATING QR CODES TO "In Use" for user: ${userId} (${userName})`);
        qrCodesSnapshot.docs.forEach(doc => {
          const qrCodeRef = doc.ref;
          const qrData = doc.data();
          console.log(`  Updating ${qrData.individualItemId} to "In Use" for user ${userId}`);
          
          transaction.update(qrCodeRef, {
            status: "In Use",
            deployedBy: userName || "Unknown",
            deployedById: userId || "unknown",
            deployedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          deployedQRCodes.push({
            id: doc.id,
            individualItemId: qrData.individualItemId,
            itemName: qrData.itemName,
            unitNumber: qrData.unitNumber,
          });
        });

        console.log(`✅ TRANSACTION WILL DEPLOY:`, deployedQRCodes.map(qr => qr.individualItemId));
        return deployedQRCodes;
      });
    } catch (transactionError) {
      console.error("❌ Transaction failed:", transactionError.message);
      return res.status(400).json({ 
        error: transactionError.message 
      });
    }
    console.log(`✅ Successfully updated ${deployedQRCodes.length} QR codes to "In Use" status`);
    console.log(`🎯 DEPLOYED QR CODES:`, deployedQRCodes.map(qr => qr.individualItemId));
    
    // Verify the deployment by checking the QR codes again
    console.log(`🔍 VERIFYING DEPLOYMENT - Checking QR codes after transaction:`);
    const verifySnapshot = await inventoryDoc.ref.collection("qrCodes").get();
    verifySnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.status === "In Use" && data.deployedById === userId) {
        console.log(`  ✅ VERIFIED: ${data.individualItemId} is "In Use" for user ${userId}`);
      }
    });

    // Update main inventory item condition counts after deployment
    const allQRCodesSnapshot = await inventoryDoc.ref.collection("qrCodes").get();
    const conditionCounts = {
      Good: 0,
      Defect: 0,
      Damage: 0,
      Lost: 0
    };

    allQRCodesSnapshot.forEach((doc) => {
      const data = doc.data();
      const condition = data.condition;
      const status = data.status;
      
      // Only count items that are "Available" status for condition counts
      // "In Use" items should not be counted in available quantity
      if (status === "Available" && conditionCounts.hasOwnProperty(condition)) {
        conditionCounts[condition]++;
      }
    });

    console.log(`📊 Updated condition counts:`, conditionCounts);
    console.log(`📊 Available quantity (Good + Available): ${conditionCounts.Good}`);

    // Update main inventory item condition totals
    await inventoryDoc.ref.update({
      condition: conditionCounts,
      quantity: conditionCounts.Good, // Only Good + Available items count toward available quantity
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Also update in lab room if exists
    if (inventoryData.labRoom) {
      const labRoomQuery = await db.collection("labRoom").where("roomNumber", "==", inventoryData.labRoom).get();
      if (!labRoomQuery.empty) {
        const labRoomDoc = labRoomQuery.docs[0];
        const labRoomItemRef = labRoomDoc.ref.collection("items").doc(inventoryData.itemId);
        await labRoomItemRef.update({
          condition: conditionCounts,
          quantity: conditionCounts.Good,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    // Log the activity
    await db.collection("allactivitylog").add({
      action: `Deployed ${quantity} individual QR codes for ${inventoryData.itemName}`,
      userName: userName || "User",
      userId: userId || "unknown",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    if (userId !== "unknown") {
      await db.collection(`accounts/${userId}/activitylog`).add({
        action: `Deployed ${quantity} individual QR codes for ${inventoryData.itemName}`,
        userName: userName || "User",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return res.status(200).json({ 
      message: `Successfully deployed ${quantity} individual items`,
      deployedQRCodes: deployedQRCodes,
    });

  } catch (err) {
    console.error("❌ Error in /deploy-individual-qr-codes:", err);
    console.error("❌ Error stack:", err.stack);
    return res.status(500).json({ error: `Internal server error: ${err.message}` });
  }
});

// Return individual QR codes for equipment items
app.post("/return-individual-qr-codes", async (req, res) => {
  try {
    console.log("🚀 RETURN INDIVIDUAL QR CODES ENDPOINT CALLED");
    console.log("📦 Request body:", JSON.stringify(req.body, null, 2));
    
    const { itemId, individualQRConditions, userId, userName } = req.body;

    if (!itemId || !individualQRConditions || !Array.isArray(individualQRConditions)) {
      return res.status(400).json({ error: "Item ID and individual QR conditions are required" });
    }

    // Find the main inventory item
    const inventoryQuery = await db.collection("inventory").where("itemId", "==", itemId).get();
    
    if (inventoryQuery.empty) {
      return res.status(404).json({ error: "Item not found" });
    }

    const inventoryDoc = inventoryQuery.docs[0];
    const inventoryData = inventoryDoc.data();

    // Check if this is an equipment item
    if (inventoryData.category !== "Equipment") {
      return res.status(400).json({ error: "Individual QR code returns are only available for equipment items" });
    }

    // Update individual QR codes with new conditions
    const batch = db.batch();

    for (const qrCondition of individualQRConditions) {
      let qrCodeRef;
      
      // Check if qrCodeId is a placeholder (starts with "placeholder-")
      if (qrCondition.qrCodeId.startsWith("placeholder-")) {
        // Find the actual QR code by individualItemId
        const qrCodesQuery = await inventoryDoc.ref
          .collection("qrCodes")
          .where("individualItemId", "==", qrCondition.individualItemId)
          .where("status", "==", "In Use")
          .limit(1)
          .get();
        
        if (!qrCodesQuery.empty) {
          qrCodeRef = qrCodesQuery.docs[0].ref;
          console.log(`🔍 Found QR code for placeholder ${qrCondition.qrCodeId}: ${qrCondition.individualItemId}`);
        } else {
          console.log(`❌ No QR code found for placeholder ${qrCondition.qrCodeId}: ${qrCondition.individualItemId}`);
          continue;
        }
      } else {
        // Use the actual qrCodeId
        qrCodeRef = inventoryDoc.ref.collection("qrCodes").doc(qrCondition.qrCodeId);
      }
      
      const qrCodeDoc = await qrCodeRef.get();
      if (qrCodeDoc.exists) {
        batch.update(qrCodeRef, {
          condition: qrCondition.condition,
          status: "Available",
          returnedBy: userName || "Unknown",
          returnedById: userId || "unknown",
          returnedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`✅ Updated QR code ${qrCondition.individualItemId} to condition: ${qrCondition.condition}`);
      } else {
        console.log(`❌ QR code document not found for ${qrCondition.qrCodeId}`);
      }
    }

    await batch.commit();

    // Get ALL QR codes in the subcollection to count conditions properly
    const allQRCodesSnapshot = await inventoryDoc.ref.collection("qrCodes").get();
    const conditionCounts = {
      Good: 0,
      Defect: 0,
      Damage: 0,
      Lost: 0
    };

    allQRCodesSnapshot.forEach((doc) => {
      const data = doc.data();
      const condition = data.condition;
      const status = data.status;
      
      // Only count items that are "Available" status for condition counts
      // "In Use" items should not be counted in available quantity
      if (status === "Available" && conditionCounts.hasOwnProperty(condition)) {
        conditionCounts[condition]++;
      }
    });

    // Update main inventory item condition totals
    await inventoryDoc.ref.update({
      condition: conditionCounts,
      quantity: conditionCounts.Good, // Only Good items count toward available quantity
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Also update in lab room if exists
    if (inventoryData.labRoom) {
      const labRoomQuery = await db.collection("labRoom").where("roomNumber", "==", inventoryData.labRoom).get();
      if (!labRoomQuery.empty) {
        const labRoomDoc = labRoomQuery.docs[0];
        const labRoomItemRef = labRoomDoc.ref.collection("items").doc(inventoryData.itemId);
        await labRoomItemRef.update({
          condition: conditionCounts,
          quantity: conditionCounts.Good,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    // Log the activity
    await db.collection("allactivitylog").add({
      action: `Returned ${individualQRConditions.length} individual QR codes for ${inventoryData.itemName}`,
      userName: userName || "User",
      userId: userId || "unknown",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    if (userId !== "unknown") {
      await db.collection(`accounts/${userId}/activitylog`).add({
        action: `Returned ${individualQRConditions.length} individual QR codes for ${inventoryData.itemName}`,
        userName: userName || "User",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return res.status(200).json({ 
      message: `Successfully returned ${individualQRConditions.length} individual items`,
      updatedCondition: conditionCounts,
    });

  } catch (err) {
    console.error("❌ Error in /return-individual-qr-codes:", err);
    console.error("❌ Error stack:", err.stack);
    console.error("❌ Request body:", req.body);
    return res.status(500).json({ error: `Internal server error: ${err.message}` });
  }
});

// app.post("/update-inventory-full", async (req, res) => {
//   const { values, editingItem, userId, userName } = req.body;

//   if (!editingItem || !editingItem.docId) {
//     return res.status(400).json({ error: "Missing editing item or document ID." });
//   }

//   try {
//     // Sanitize inputs
//     const sanitizedItemName = values.itemName?.trim() || "";
//     const sanitizedItemDetails = values.itemDetails?.trim() || "";
//     const sanitizedCriticalLevel = Math.max(Number(values.criticalLevel || 1), 1);
//     const validCategories = ["Glasswares", "Equipment", "Materials", "Chemical", "Reagent"];
//     const sanitizedCategory = values.category;
//     const sanitizedShelves = values.shelves ? values.shelves.toString() : null;
//     const sanitizedRow = values.row ? values.row.toString() : null;

//     if (!sanitizedItemName || !sanitizedItemDetails) {
//       return res.status(400).json({ error: "Item name and details are required." });
//     }

//     if (!validCategories.includes(sanitizedCategory)) {
//       return res.status(400).json({ error: "Invalid item category." });
//     }

//     const sanitizedLabRoom = values.labRoom ? values.labRoom.toString().padStart(4, "0") : null;

//     const sanitizedCondition = {
//       Good: Number(values.condition?.Good) || 0,
//       Defect: Number(values.condition?.Defect) || 0,
//       Damage: Number(values.condition?.Damage) || 0,
//       Lost: Number(values.condition?.Lost) || 0,
//     };

//     const sanitizedQuantity =
//       ["Glasswares", "Equipment", "Materials"].includes(sanitizedCategory)
//         ? sanitizedCondition.Good
//         : Number(values.quantity) || 0;

//     const updatedData = {
//       itemName: sanitizedItemName,
//       itemDetails: sanitizedItemDetails,
//       category: sanitizedCategory,
//       department: values.department || null,
//       criticalLevel: sanitizedCriticalLevel,
//       labRoom: sanitizedLabRoom,
//       shelves: sanitizedShelves, 
//       row: sanitizedRow, 
//       status: values.status || "pending",
//       unit: values.unit || null,
//       condition: sanitizedCondition,
//       quantity: sanitizedQuantity,
//     };

//     // 🔄 Update inventory doc
//     const itemRef = db.collection("inventory").doc(editingItem.docId);
//     await itemRef.update(updatedData);

//     // Fetch existing item name for logging (from snapshot)
//     const itemSnap = await itemRef.get();
//     const data = itemSnap.data();
//     const activityMessage = `Updated item (${data.itemName}) in inventory`;

//     // 🧾 Log to allactivitylog
//     await db.collection("allactivitylog").add({
//       action: activityMessage,
//       userName: userName || "User",
//       userId: userId || "unknown",
//       timestamp: admin.firestore.FieldValue.serverTimestamp(),
//     });

//     // 🧾 Log to user's activity log
//     if (userId && userId !== "unknown") {
//       await db.collection(`accounts/${userId}/activitylog`).add({
//         action: activityMessage,
//         userName: userName || "User",
//         timestamp: admin.firestore.FieldValue.serverTimestamp(),
//       });
//     }

//     // // 🔄 Update labRoom subcollection item
//     // if (sanitizedLabRoom) {
//     //   const labRoomQuery = await db
//     //     .collection("labRoom")
//     //     .where("roomNumber", "==", sanitizedLabRoom)
//     //     .get();

//     //   if (!labRoomQuery.empty) {
//     //     const labRoomDoc = labRoomQuery.docs[0];
//     //     const labRoomItemRef = labRoomDoc.ref.collection("items").doc(editingItem.itemId);

//     //     const labRoomItemSnap = await labRoomItemRef.get();
//     //     if (labRoomItemSnap.exists) {
//     //       await labRoomItemRef.update(updatedData);
//     //     } else {
//     //       console.warn(`⚠️ Item ${editingItem.itemId} not found in labRoom ${sanitizedLabRoom}/items`);
//     //     }
//     //   } else {
//     //     console.warn(`⚠️ No labRoom found with roomNumber "${sanitizedLabRoom}"`);
//     //   }
//     // }

//     // /* ---------- ALSO update shelves/{shelf}/rows/{row}/items/{itemId} ---------- */
//     // if (sanitizedLabRoom && sanitizedShelves && sanitizedRow) {
//     //   const rowItemRef = db
//     //     .collection("labRoom")
//     //     .doc(labRoomDoc.id)                 // from earlier query
//     //     .collection("shelves")
//     //     .doc(sanitizedShelves)
//     //     .collection("rows")
//     //     .doc(sanitizedRow)
//     //     .collection("items")
//     //     .doc(editingItem.itemId);

//     //   const rowItemSnap = await rowItemRef.get();
//     //   if (rowItemSnap.exists) {
//     //     await rowItemRef.update(updatedData);
//     //   } else {
//     //     console.warn(
//     //       `⚠️ Item ${editingItem.itemId} not found in shelves/${sanitizedShelves}/rows/${sanitizedRow}`
//     //     );
//     //   }
//     // }

//     // 🔄 Update labRoom subcollection item
//     let labRoomDoc = null; // Declare labRoomDoc in a wider scope

//     if (sanitizedLabRoom) {
//       const labRoomQuery = await db
//         .collection("labRoom")
//         .where("roomNumber", "==", sanitizedLabRoom)
//         .get();

//       if (!labRoomQuery.empty) {
//         labRoomDoc = labRoomQuery.docs[0];

//         const labRoomItemRef = labRoomDoc.ref
//           .collection("items")
//           .doc(editingItem.itemId);

//         const labRoomItemSnap = await labRoomItemRef.get();
//         if (labRoomItemSnap.exists) {
//           await labRoomItemRef.update(updatedData);
//         } else {
//           console.warn(`⚠️ Item ${editingItem.itemId} not found in labRoom ${sanitizedLabRoom}/items`);
//         }
//       } else {
//         console.warn(`⚠️ No labRoom found with roomNumber "${sanitizedLabRoom}"`);
//       }
//     }

//     /* ---------- ALSO update shelves/{shelf}/rows/{row}/items/{itemId} ---------- */
//     if (labRoomDoc && sanitizedShelves && sanitizedRow) {
//       const rowItemRef = db
//         .collection("labRoom")
//         .doc(labRoomDoc.id)
//         .collection("shelves")
//         .doc(sanitizedShelves)
//         .collection("rows")
//         .doc(sanitizedRow)
//         .collection("items")
//         .doc(editingItem.itemId);

//       const rowItemSnap = await rowItemRef.get();
//       if (rowItemSnap.exists) {
//         await rowItemRef.update(updatedData);
//       } else {
//         console.warn(
//           `⚠️ Item ${editingItem.itemId} not found in shelves/${sanitizedShelves}/rows/${sanitizedRow}`
//         );
//       }
//     }

//     return res.status(200).json({ message: "Item fully updated successfully." });

//   } catch (error) {
//     console.error("Full update error:", error);
//     return res.status(500).json({ error: "Internal error during full update." });
//   }
// });

// app.post("/update-inventory-full", async (req, res) => {
//   const { values, editingItem, userId, userName } = req.body;

//   if (!editingItem || !editingItem.docId) {
//     return res
//       .status(400)
//       .json({ error: "Missing editing item or document ID." });
//   }

//   try {
//     /* ---------- sanitize inputs ---------- */
//     const sanitizedItemName = values.itemName?.trim() || "";
//     const sanitizedItemDetails = values.itemDetails?.trim() || "";
//     const sanitizedCriticalLevel = Math.max(
//       Number(values.criticalLevel || 1),
//       1
//     );
//     const validCategories = [
//       "Glasswares",
//       "Equipment",
//       "Materials",
//       "Chemical",
//       "Reagent",
//     ];
//     const sanitizedCategory = values.category;

//     const sanitizedShelves = values.shelves
//       ? values.shelves.toString()
//       : null;
//     const sanitizedRow = values.row ? values.row.toString() : null;
//     const sanitizedLabRoom = values.labRoom
//       ? values.labRoom.toString().padStart(4, "0")
//       : null;

//     if (!sanitizedItemName || !sanitizedItemDetails) {
//       return res
//         .status(400)
//         .json({ error: "Item name and details are required." });
//     }

//     if (!validCategories.includes(sanitizedCategory)) {
//       return res.status(400).json({ error: "Invalid item category." });
//     }

//     // const sanitizedCondition = {
//     //   Good: Number(values.condition?.Good) || 0,
//     //   Defect: Number(values.condition?.Defect) || 0,
//     //   Damage: Number(values.condition?.Damage) || 0,
//     //   Lost: Number(values.condition?.Lost) || 0,
//     // };

//     // const sanitizedQuantity = ["Glasswares", "Equipment", "Materials"].includes(
//     //   sanitizedCategory
//     // )
//     //   ? sanitizedCondition.Good
//     //   : Number(values.quantity) || 0;

//     const isChemOrReagent = ["Chemical", "Reagent"].includes(sanitizedCategory);

//     const sanitizedCondition = isChemOrReagent
//       ? {}
//       : {
//           Good: Number(values.condition?.Good) || 0,
//           Defect: Number(values.condition?.Defect) || 0,
//           Damage: Number(values.condition?.Damage) || 0,
//           Lost: Number(values.condition?.Lost) || 0,
//         };

//     // const sanitizedQuantity = isChemOrReagent
//     //   ? Number(values.quantity) || 0
//     //   : sanitizedCondition.Good;

//     // ✅ Keep existing quantity if not provided in update
//     const existingQuantity = editingItem.quantity || 0;

//     const sanitizedQuantity = isChemOrReagent
//       ? (values.quantity !== undefined ? Number(values.quantity) : existingQuantity)
//       : (values.condition?.Good !== undefined
//           ? Number(values.condition.Good) || 0
//           : existingQuantity);

//     const updatedData = {
//       itemName: sanitizedItemName,
//       itemDetails: sanitizedItemDetails,
//       category: sanitizedCategory,
//       department: values.department || null,
//       criticalLevel: sanitizedCriticalLevel,
//       labRoom: sanitizedLabRoom,
//       shelves: sanitizedShelves,
//       row: sanitizedRow,
//       status: values.status || "pending",
//       unit: values.unit || null,
//       condition: sanitizedCondition,
//       quantity: sanitizedQuantity,
//     };

//     /* ---------- update /inventory/{docId} ---------- */
//     const itemRef = db.collection("inventory").doc(editingItem.docId);
//     await itemRef.update(updatedData);

//     /* ---------- logging ---------- */
//     const itemSnap = await itemRef.get();
//     const data = itemSnap.data();
//     const activityMessage = `Updated item (${data.itemName}) in inventory`;

//     await db.collection("allactivitylog").add({
//       action: activityMessage,
//       userName: userName || "User",
//       userId: userId || "unknown",
//       timestamp: admin.firestore.FieldValue.serverTimestamp(),
//     });

//     if (userId && userId !== "unknown") {
//       await db.collection(`accounts/${userId}/activitylog`).add({
//         action: activityMessage,
//         userName: userName || "User",
//         timestamp: admin.firestore.FieldValue.serverTimestamp(),
//       });
//     }

//     /* ---------- update labRoom/{roomNumber}/items ---------- */
//     let labRoomDoc = null;

//     if (sanitizedLabRoom) {
//       const labRoomQuery = await db
//         .collection("labRoom")
//         .where("roomNumber", "==", sanitizedLabRoom)
//         .get();

//       if (!labRoomQuery.empty) {
//         labRoomDoc = labRoomQuery.docs[0];

//         const labRoomItemRef = labRoomDoc.ref
//           .collection("items")
//           .doc(editingItem.itemId);

//         const labRoomItemSnap = await labRoomItemRef.get();
//         if (labRoomItemSnap.exists) {
//           await labRoomItemRef.update(updatedData);
//         } else {
//           console.warn(
//             `⚠️ Item ${editingItem.itemId} not found in labRoom ${sanitizedLabRoom}/items`
//           );
//         }
//       } else {
//         console.warn(
//           `⚠️ No labRoom found with roomNumber "${sanitizedLabRoom}"`
//         );
//       }
//     }

//     /* ---------- move / update shelves/{shelf}/rows/{row}/items ---------- */
//     if (labRoomDoc && sanitizedShelves && sanitizedRow) {
//       const oldShelf = editingItem.shelves ?? null;
//       const oldRow = editingItem.row ?? null;
//       const shelfChanged = oldShelf && oldShelf !== sanitizedShelves;
//       const rowChanged = oldRow && oldRow !== sanitizedRow;

//       // 🧹 Remove from old location if needed (query by itemId)
//       if (shelfChanged || rowChanged) {
//         try {
//           const oldItemsSnap = await labRoomDoc.ref
//             .collection("shelves")
//             .doc(oldShelf)
//             .collection("rows")
//             .doc(oldRow)
//             .collection("items")
//             .where("itemId", "==", editingItem.itemId)
//             .get();

//           if (!oldItemsSnap.empty) {
//             const batch = db.batch();
//             oldItemsSnap.docs.forEach((doc) => batch.delete(doc.ref));
//             await batch.commit();
//             console.log(
//               `✅ Removed ${oldItemsSnap.size} old item doc(s) from shelves/${oldShelf}/rows/${oldRow}`
//             );
//           } else {
//             console.warn(
//               `⚠️ No matching itemId in shelves/${oldShelf}/rows/${oldRow}`
//             );
//           }
//         } catch (err) {
//           console.warn(
//             `⚠️ Could not delete old item doc(s): ${err.message}`
//           );
//         }
//       }

//       // 🔄 Insert at new location with all original fields + updates
//       const fullRowData = {
//         ...editingItem,  // preserves timestamps, QR, etc.
//         ...updatedData,  // user edits override
//       };

//       // await labRoomDoc.ref
//       //   .collection("shelves")
//       //   .doc(sanitizedShelves)
//       //   .collection("rows")
//       //   .doc(sanitizedRow)
//       //   .collection("items")
//       //   .add(fullRowData);  // auto-ID

//       const newItemRef = labRoomDoc.ref
//         .collection("shelves")
//         .doc(sanitizedShelves)
//         .collection("rows")
//         .doc(sanitizedRow)
//         .collection("items")
//         .doc(editingItem.itemId);  // <-- use the same doc ID as before

//       await newItemRef.set(fullRowData);


//       console.log(
//         `✅ Item ${editingItem.itemId} now at shelves/${sanitizedShelves}/rows/${sanitizedRow} (new auto doc ID)`
//       );
//     }

//     return res
//       .status(200)
//       .json({ message: "Item fully updated successfully." });

//   } catch (error) {
//     console.error("Full update error:", error);
//     return res
//       .status(500)
//       .json({ error: "Internal error during full update." });
//   }
// });

app.post("/update-inventory-full", async (req, res) => {
  const { values, editingItem, userId, userName } = req.body;

  if (!editingItem || !editingItem.docId) {
    return res
      .status(400)
      .json({ error: "Missing editing item or document ID." });
  }

  try {
    /* ---------- sanitize inputs ---------- */
    const sanitizedItemName = values.itemName?.trim() || "";
    const sanitizedItemDetails = values.itemDetails?.trim() || "";
    const sanitizedCriticalLevel = Math.max(
      Number(values.criticalLevel || 1),
      1
    );
    const validCategories = [
      "Glasswares",
      "Equipment",
      "Materials",
      "Chemical",
      "Reagent",
    ];
    const sanitizedCategory = values.category;

    const sanitizedShelves = values.shelves
      ? values.shelves.toString()
      : null;
    const sanitizedRow = values.row ? values.row.toString() : null;
    const sanitizedLabRoom = values.labRoom
      ? values.labRoom.toString().padStart(4, "0")
      : null;

    if (!sanitizedItemName || !sanitizedItemDetails) {
      return res
        .status(400)
        .json({ error: "Item name and details are required." });
    }

    if (!validCategories.includes(sanitizedCategory)) {
      return res.status(400).json({ error: "Invalid item category." });
    }

    const isChemOrReagent = ["Chemical", "Reagent"].includes(sanitizedCategory);

    const sanitizedCondition = isChemOrReagent
      ? {}
      : {
          Good: Number(values.condition?.Good) || 0,
          Defect: Number(values.condition?.Defect) || 0,
          Damage: Number(values.condition?.Damage) || 0,
          Lost: Number(values.condition?.Lost) || 0,
        };

    const existingQuantity = editingItem.quantity || 0;

    const sanitizedQuantity = isChemOrReagent
      ? (values.quantity !== undefined ? Number(values.quantity) : existingQuantity)
      : (values.condition?.Good !== undefined
          ? Number(values.condition.Good) || 0
          : existingQuantity);

    const updatedData = {
      itemName: sanitizedItemName,
      itemDetails: sanitizedItemDetails,
      category: sanitizedCategory,
      department: values.department || null,
      criticalLevel: sanitizedCriticalLevel,
      labRoom: sanitizedLabRoom,
      shelves: sanitizedShelves,
      row: sanitizedRow,
      status: values.status || "pending",
      unit: values.unit || null,
      condition: sanitizedCondition,
      quantity: sanitizedQuantity,
    };

    /* ---------- update /inventory/{docId} ---------- */
    const itemRef = db.collection("inventory").doc(editingItem.docId);
    await itemRef.update(updatedData);

    /* ---------- logging ---------- */
    const itemSnap = await itemRef.get();
    const data = itemSnap.data();
    const activityMessage = `Updated item (${data.itemName}) in inventory`;

    await db.collection("allactivitylog").add({
      action: activityMessage,
      userName: userName || "User",
      userId: userId || "unknown",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    if (userId && userId !== "unknown") {
      await db.collection(`accounts/${userId}/activitylog`).add({
        action: activityMessage,
        userName: userName || "User",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    /* ---------- update labRoom/{roomNumber}/items ---------- */
    let labRoomDoc = null;

    if (sanitizedLabRoom) {
      const labRoomQuery = await db
        .collection("labRoom")
        .where("roomNumber", "==", sanitizedLabRoom)
        .get();

      if (!labRoomQuery.empty) {
        labRoomDoc = labRoomQuery.docs[0];

        const labRoomItemRef = labRoomDoc.ref
          .collection("items")
          .doc(editingItem.itemId);

        const labRoomItemSnap = await labRoomItemRef.get();
        if (labRoomItemSnap.exists) {
          await labRoomItemRef.update(updatedData);
        } else {
          console.warn(
            `⚠️ Item ${editingItem.itemId} not found in labRoom ${sanitizedLabRoom}/items`
          );
        }
      } else {
        console.warn(
          `⚠️ No labRoom found with roomNumber "${sanitizedLabRoom}"`
        );
      }
    }

    /* ---------- move / update shelves/{shelf}/rows/{row}/items ---------- */
    if (labRoomDoc && sanitizedShelves && sanitizedRow) {
      const oldShelf = editingItem.shelves ?? null;
      const oldRow = editingItem.row ?? null;
      const shelfChanged = oldShelf && oldShelf !== sanitizedShelves;
      const rowChanged = oldRow && oldRow !== sanitizedRow;

      // 🧹 Remove from old location if needed (query by itemId)
      if (shelfChanged || rowChanged) {
        try {
          const oldItemsSnap = await labRoomDoc.ref
            .collection("shelves")
            .doc(oldShelf)
            .collection("rows")
            .doc(oldRow)
            .collection("items")
            .where("itemId", "==", editingItem.itemId)
            .get();

          if (!oldItemsSnap.empty) {
            const batch = db.batch();
            oldItemsSnap.docs.forEach((doc) => batch.delete(doc.ref));
            await batch.commit();
            console.log(
              `✅ Removed ${oldItemsSnap.size} old item doc(s) from shelves/${oldShelf}/rows/${oldRow}`
            );
          } else {
            console.warn(
              `⚠️ No matching itemId in shelves/${oldShelf}/rows/${oldRow}`
            );
          }
        } catch (err) {
          console.warn(
            `⚠️ Could not delete old item doc(s): ${err.message}`
          );
        }
      }

      // 🔄 Insert at new location with all original fields + updates
      const fullRowData = {
        ...editingItem,  // preserves timestamps, QR, etc.
        ...updatedData,  // user edits override
      };

      // Generate QR for shelves and row like in your add-inventory logic
      const shelvesQRData = CryptoJS.AES.encrypt(
        JSON.stringify({ labRoomId: labRoomDoc.id, shelves: sanitizedShelves }),
        SECRET_KEY
      ).toString();

      const rowQRData = CryptoJS.AES.encrypt(
        JSON.stringify({ labRoomId: labRoomDoc.id, shelves: sanitizedShelves, row: sanitizedRow }),
        SECRET_KEY
      ).toString();

      // Upsert shelves doc
      const shelvesDocRef = labRoomDoc.ref.collection("shelves").doc(sanitizedShelves);
      await shelvesDocRef.set({
        shelvesQR: shelvesQRData,
        shelves: sanitizedShelves,
        updatedAt: new Date(),
      }, { merge: true });

      // Check if row doc exists, create if not
      const rowDocRef = shelvesDocRef.collection("rows").doc(sanitizedRow);
      const rowDocSnap = await rowDocRef.get();

      if (!rowDocSnap.exists) {
        await rowDocRef.set({
          row: sanitizedRow,
          rowQR: rowQRData,
          createdAt: new Date(),
        });
      } else {
        await rowDocRef.update({ updatedAt: new Date() });
      }

      // Insert / update the item inside the row
      const newItemRef = rowDocRef.collection("items").doc(editingItem.itemId);
      await newItemRef.set(fullRowData, { merge: true });

      console.log(
        `✅ Item ${editingItem.itemId} now at shelves/${sanitizedShelves}/rows/${sanitizedRow}`
      );
    }

    return res
      .status(200)
      .json({ message: "Item fully updated successfully." });

  } catch (error) {
    console.error("Full update error:", error);
    return res
      .status(500)
      .json({ error: "Internal error during full update." });
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// LOGIN / SIGN UP 
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Missing email or password" });

    let userDoc = null;
    let userData = null;
    let isSuperAdmin = false;

    // 🔍 Check 'accounts' collection
    const accountsRef = db.collection("accounts");
    const accountSnap = await accountsRef.where("email", "==", email).get();

    if (!accountSnap.empty) {
      userDoc = accountSnap.docs[0];
      userData = userDoc.data();
    } else {
      // 🔍 Check 'super-admin' collection
      const superAdminRef = db.collection("super-admin");
      const superSnap = await superAdminRef.where("email", "==", email).get();

      if (!superSnap.empty) {
        isSuperAdmin = true;
        userDoc = superSnap.docs[0];
        userData = userDoc.data();
      }
    }

    // Check if user is in pendingaccounts (not yet approved) FIRST
    const pendingRef = db.collection("pendingaccounts");
    const pendingSnap = await pendingRef.where("email", "==", email).get();
    
    if (!pendingSnap.empty) {
      return res.status(403).json({ 
        error: "Account is pending approval from technical admin" 
      });
    }

    // If user is not in pendingaccounts and not in accounts/super-admin, they don't exist
    if (!userData) {
      return res.status(404).json({ error: "User not found" });
    }

    if (userData.disabled) {
      return res.status(403).json({ error: "Account is disabled" });
    }

    // 🔐 Check password for super-admins (plain-text comparison for now)
    if (isSuperAdmin) {
      if (userData.password !== password) {
        return res.status(401).json({ error: "Invalid password" });
      }

      await userDoc.ref.update({ loginAttempts: 0 });

      const userResponse = {
        userId: userDoc.id,
        email: userData.email,
        name: userData.name || "Super Admin",
        department: userData.department || "Admin",
        role: "super-admin",
        jobTitle: userData.jobTitle || "User",
        requiresFirebaseLogin: false,
      };

      return res.status(200).json({ message: "Super Admin login successful", user: userResponse });
    }

    // If user doesn't have UID, they're not in the system
    if (!userData.uid) {
      return res.status(403).json({ error: "User not found in system" });
    }

    // Check if user is using temporary password (first-time login)
    console.log("🔍 User data check:", {
      hasTemporaryPassword: !!userData.temporaryPassword,
      passwordSet: userData.passwordSet,
      temporaryPassword: userData.temporaryPassword,
      email: email
    });
    
    if (userData.temporaryPassword && !userData.passwordSet) {
      if (userData.temporaryPassword === password) {
        // Check if email is verified before allowing password reset
        try {
          const firebaseUser = await admin.auth().getUserByEmail(email);
          console.log("🔍 Firebase user email verification status:", firebaseUser.emailVerified);
          console.log("🔍 Firebase user email:", firebaseUser.email);
          
          if (!firebaseUser.emailVerified) {
            console.log("❌ Email not verified, blocking login");
            return res.status(403).json({ 
              error: "Please verify your email address before logging in. Check your email for the verification link." 
            });
          }
          
          console.log("✅ Email verified, allowing login");
          
          // Email is verified, allow login but require password reset
          await userDoc.ref.update({ loginAttempts: 0 });

          const role = (userData.role || "user").toLowerCase().trim().replace(/[\s_]/g, "-");
          const mappedRole = role === "admin1" || role === "admin2" ? "admin" : role;

          const userResponse = {
            userId: userDoc.id,
            email: userData.email,
            name: userData.name || "User",
            department: userData.department || "",
            role: mappedRole,
            jobTitle: userData.jobTitle || "User",
            requiresFirebaseLogin: false, // Don't require Firebase Auth for temp password
            requiresPasswordReset: true, // Flag to indicate password reset needed
          };

          await db.collection(`accounts/${userDoc.id}/activitylog`).add({
            action: "User Logged In with Temporary Password (API)",
            userName: userData.name || "User",
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
          });

          return res.status(200).json({ 
            message: "Temporary password accepted - password reset required", 
            user: userResponse 
          });
          
        } catch (authError) {
          console.error("Firebase Auth check failed:", authError.message);
          return res.status(401).json({ error: "Invalid password or account not found in Auth" });
        }
      } else {
        return res.status(401).json({ error: "Invalid temporary password" });
      }
    }

    // 🔐 Firebase Auth login for regular users (after password has been set)
    console.log("🔍 Going to regular user login path - this should NOT happen for temp password users");
    try {
      // Get Firebase user to check email verification
      const firebaseUser = await admin.auth().getUserByEmail(email);

      if (!firebaseUser.emailVerified) {
        return res.status(403).json({ error: "Email not verified" });
      }

      // Validate password by attempting to sign in with Firebase Auth
      // Since Admin SDK can't verify passwords directly, we'll use a different approach
      // We'll create a custom token and verify it, or use the REST API
      
      // For now, let's implement a simple password verification using Firebase REST API
      const firebaseApiKey = "AIzaSyALjlpbo1i5vgCmXLxkIEe-ydsw-Rx6mSI"; // Firebase API key from config

      // Use Firebase REST API to verify password
      const verifyPasswordResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
          returnSecureToken: true
        })
      });

      const verifyPasswordData = await verifyPasswordResponse.json();

      if (!verifyPasswordResponse.ok) {
        console.error("Password verification failed:", verifyPasswordData.error?.message);
        return res.status(401).json({ error: "Invalid password" });
      }

      // Password is valid, proceed with login
      await userDoc.ref.update({ loginAttempts: 0 });

      const role = (userData.role || "user").toLowerCase().trim().replace(/[\s_]/g, "-");
      const mappedRole = role === "admin1" || role === "admin2" ? "admin" : role;

      const userResponse = {
        userId: userDoc.id,
        email: userData.email,
        name: userData.name || "User",
        department: userData.department || "",
        role: mappedRole,
        jobTitle: userData.jobTitle || "User",
        requiresFirebaseLogin: true,
        requiresPasswordReset: false,
      };

      await db.collection(`accounts/${userDoc.id}/activitylog`).add({
        action: "User Logged In (API)",
        userName: userData.name || "User",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return res.status(200).json({ message: "Login successful", user: userResponse });

    } catch (authError) {
      console.error("Firebase Auth check failed:", authError.message);
      return res.status(401).json({ error: "Invalid password or account not found in Auth" });
    }

  } catch (err) {
    console.error("Login error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Password reset endpoint for users with temporary passwords
app.post("/password-reset", async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    // Password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ 
        error: "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character." 
      });
    }

    // Find user in accounts collection
    const accountsRef = db.collection("accounts");
    const accountSnap = await accountsRef.where("email", "==", email).get();

    if (accountSnap.empty) {
      return res.status(404).json({ error: "User not found" });
    }

    const userDoc = accountSnap.docs[0];
    const userData = userDoc.data();

    // Check if user has temporary password and hasn't set their own password yet
    if (!userData.temporaryPassword || userData.passwordSet) {
      return res.status(400).json({ error: "Password reset not allowed for this account" });
    }

    // Check if email is verified before allowing password reset
    try {
      const firebaseUser = await admin.auth().getUserByEmail(email);
      console.log("🔍 Password reset - Firebase user email verification status:", firebaseUser.emailVerified);
      
      if (!firebaseUser.emailVerified) {
        console.log("❌ Password reset blocked - email not verified");
        return res.status(403).json({ 
          error: "Please verify your email address before resetting your password. Check your email for the verification link." 
        });
      }
      
      console.log("✅ Password reset allowed - email verified");
    } catch (authError) {
      console.error("Firebase Auth check failed in password reset:", authError.message);
      return res.status(401).json({ error: "Invalid account or account not found in Auth" });
    }

    // Update existing Firebase Auth user's password
    try {
      // Use the existing UID to update the password
      const firebaseUser = await admin.auth().updateUser(userData.uid, {
        password: newPassword,
        // Don't auto-verify email - let user verify through email link
      });

      // Update user document
      await userDoc.ref.update({
        passwordSet: true,
        temporaryPassword: admin.firestore.FieldValue.delete(), // Remove temporary password
        passwordResetAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Log the password reset action
      await db.collection(`accounts/${userDoc.id}/activitylog`).add({
        action: "Password Reset - Temporary Password Replaced",
        userName: userData.name || "User",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return res.status(200).json({ 
        message: "Password set successfully! You can now log in with your new password." 
      });

    } catch (authError) {
      console.error("Firebase Auth user creation failed:", authError.message);
      return res.status(500).json({ error: "Failed to create user account. Please try again." });
    }

  } catch (error) {
    console.error("Password reset error:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/signup", async (req, res) => {
  try {
    const {
      name,
      email,
      employeeId,
      password,
      confirmPassword,
      jobTitle,
      department,
      termsChecked
    } = req.body;

    const capitalizeWords = (str) =>
    str
      .trim()
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());

    const formattedName = capitalizeWords(name);

    // Terms and Conditions Check
    if (!termsChecked) {
      return res.status(400).json({ error: "Terms and conditions must be accepted." });
    }

    // Employee ID Format Validation
    const employeeIdPattern = /^\d{2}-\d{4}$/;
    if (!employeeIdPattern.test(employeeId.trim())) {
      return res.status(400).json({ error: "Invalid employee ID format. Use ##-#### (e.g., 12-3456)." });
    }

    // Valid Email Domains
    const validDomains = ["nu-moa.edu.ph", "students.nu-moa.edu.ph"];
    const emailDomain = email.split("@")[1];
    if (!validDomains.includes(emailDomain)) {
      return res.status(400).json({
        error: "Only @nu-moa.edu.ph and @students.nu-moa.edu.ph email addresses are allowed.",
      });
    }

    // Password Confirmation Check
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match." });
    }

    // Department Validation
    if (
      jobTitle.toLowerCase() !== "laboratory custodian" &&
      (!department || department.trim() === "")
    ) {
      return res.status(400).json({ error: "Department is required for this job title." });
    }

    // Check Duplicate Email and Employee ID in Firestore (both 'pendingaccounts' and 'accounts')
    const pendingRef = db.collection("pendingaccounts");
    const accountsRef = db.collection("accounts");

    const [pendingEmailSnap, accountEmailSnap, pendingEmpSnap, accountEmpSnap] = await Promise.all([
      pendingRef.where("email", "==", email.trim().toLowerCase()).get(),
      accountsRef.where("email", "==", email.trim().toLowerCase()).get(),
      pendingRef.where("employeeId", "==", employeeId.trim()).get(),
      accountsRef.where("employeeId", "==", employeeId.trim()).get(),
    ]);

    if (!pendingEmailSnap.empty || !accountEmailSnap.empty) {
      return res.status(400).json({ error: "Email is already registered." });
    }

    if (!pendingEmpSnap.empty || !accountEmpSnap.empty) {
      return res.status(400).json({ error: "Employee ID is already registered." });
    }

    // Assign role based on jobTitle
    // let role = "user";
    // const jt = jobTitle.toLowerCase();
    // if (jt === "dean" || jt === "program chair") {
    //   role = "admin";

    // } else if (jt.includes("custodian")) {
    //   role = "super-user";
    // }

    // Assign role based on jobTitle and department
    let role = "user";
    const jt = jobTitle.toLowerCase();
    const dept = department.trim().toLowerCase();

    if (jt === "dean" && dept === "sah") {
      role = "admin";

    } else if (jt === "dean") {
      role = "user";

    } else if (jt === "program chair") {
      role = "admin";
      
    } else if (jt.includes("custodian")) {
      role = "super-user";
    }

    // Generate temporary password for new users that meets Firebase requirements
    const generateTemporaryPassword = () => {
      const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const lowercase = 'abcdefghijklmnopqrstuvwxyz';
      const numbers = '0123456789';
      const special = '@$!%*#?&'; // Firebase allowed special characters
      
      let result = '';
      
      // Ensure at least one character from each required category
      result += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
      result += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
      result += numbers.charAt(Math.floor(Math.random() * numbers.length));
      result += special.charAt(Math.floor(Math.random() * special.length));
      
      // Fill the rest with random characters from all categories
      const allChars = uppercase + lowercase + numbers + special;
      for (let i = 4; i < 12; i++) {
        result += allChars.charAt(Math.floor(Math.random() * allChars.length));
      }
      
      // Shuffle the result to randomize the order
      return result.split('').sort(() => Math.random() - 0.5).join('');
    };

    const temporaryPassword = generateTemporaryPassword();
    console.log("🔑 Generated temporary password:", temporaryPassword);

    // Create Firebase Auth user immediately with temporary password
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().createUser({
        email: email.trim().toLowerCase(),
        password: temporaryPassword,
        emailVerified: false, // Will be verified after approval
      });
      console.log("✅ Firebase Auth user created with temporary password");
      
    // Send Firebase email verification immediately after signup
    try {
      const actionCodeSettings = {
        url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`,
        handleCodeInApp: false,
      };
      
      const verificationLink = await admin.auth().generateEmailVerificationLink(
        email.trim().toLowerCase(),
        actionCodeSettings
      );
      
      console.log("✅ Firebase email verification link generated");
      
      // Send the verification email using Brevo
      await sendEmailViaBrevo({
        from: process.env.GMAIL_USER,
        to: email.trim().toLowerCase(),
        subject: "Verify your email for NULS",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; text-align: center;">NU MOA NULS - Email Verification</h2>
            <p>Hello,</p>
            <p>Thank you for registering with NU MOA NULS. Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" style="background-color: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Verify Email Address</a>
            </div>
            <p>After verifying your email, your account will be pending approval from the technical admin.</p>
            <p><strong>Important:</strong> If you didn't request this account, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #666; font-size: 12px;">This email was sent from NU MOA NULS System. Please do not reply to this email.</p>
            <p style="color: #666; font-size: 12px;">If the button doesn't work, copy and paste this link: ${verificationLink}</p>
          </div>
        `,
      });
      
      console.log("✅ Firebase email verification sent immediately after signup");
      
    } catch (emailError) {
      console.error("❌ Failed to send email verification:", emailError.message);
      // Don't fail the signup if email fails
    }
      
    } catch (authError) {
      console.error("❌ Failed to create Firebase Auth user:", authError.message);
      console.error("❌ Password used:", temporaryPassword);
      
      // Provide more specific error messages
      if (authError.code === 'auth/weak-password') {
        return res.status(400).json({ error: "Password does not meet security requirements. Please try again." });
      } else if (authError.code === 'auth/email-already-exists') {
        return res.status(400).json({ error: "An account with this email already exists." });
      } else {
        return res.status(500).json({ error: "Failed to create user account. Please try again." });
      }
    }

    // Construct the pending account object
    const pendingAccount = {
      // name: name.trim(),
      name: formattedName,
      email: email.trim().toLowerCase(),
      employeeId: employeeId.trim(),
      jobTitle,
      department,
      role,
      uid: firebaseUser.uid, // Store Firebase UID
      temporaryPassword,
      passwordSet: false, // Track if user has set their own password
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: "pending",
    };

    await pendingRef.add(pendingAccount);

    // ✅ Send confirmation email
    // await fetch("https://sendemail-guopzbbmca-uc.a.run.app", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({
    //     to: email.trim().toLowerCase(),
    //     subject: "Account Registration - Pending Approval",
    //     text: `Hi ${formattedName},\n\nThank you for registering. Your account is now pending approval from the ITSO.\n\nRegards,\nNU MOA ITSO Team`,
    //     html: `<p>Hi ${formattedName},</p><p>Thank you for registering. Your account is now <strong>pending approval</strong> from the ITSO.</p><p>Regards,<br>NU MOA ITSO Team</p>`,
    //   }),
    // });

    // await transporter.sendMail({
    //   from: `"NU MOA ITSO" <${process.env.OUTLOOK_EMAIL}>`,
    //   to: email.trim().toLowerCase(),
    //   subject: "Account Registration - Pending Approval",
    //   text: `Hi ${formattedName},\n\nThank you for registering. Your account is now pending approval from the ITSO.\n\nRegards,\nNU MOA ITSO Team`,
    //   html: `<p>Hi ${formattedName},</p><p>Thank you for registering. Your account is now <strong>pending approval</strong> from the ITSO.</p><p>Regards,<br>NU MOA ITSO Team</p>`,
    // });

    // No custom email needed - Firebase will send the verification email
    console.log("✅ Firebase email verification will be sent automatically");

    return res.status(201).json({
      message: "Successfully registered. Email verification sent. Your account is pending for approval.",
      // temporaryPassword: temporaryPassword,
      instructions: "After email verification, wait for admin approval before you can login."
    });

  } catch (error) {
    console.error("Sign-up error:", error.message);
    return res.status(500).json({ error: "Failed to create account. Try again." });
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ACCOUNT APPROVE / ADD ACCOUNT
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

// app.post("/account/save", async (req, res) => {
//   try {
//     const {
//       id, // Optional: If present, update existing account; else create new
//       name,
//       email,
//       employeeId,
//       jobTitle,
//       department,
//       // any other fields you want to support
//     } = req.body;

//     // Sanitize inputs
//     // const sanitizedName = name.trim().toLowerCase();

//     const capitalizeWords = (str) =>
//     str
//       .trim()
//       .toLowerCase()
//       .replace(/\b\w/g, (char) => char.toUpperCase());

//     const sanitizedName = capitalizeWords(name);
//     const sanitizedEmail = email.trim().toLowerCase();
//     const sanitizedEmployeeId = employeeId.trim();

//     // Validate email domain
//     const validDomains = ["@students.nu-moa.edu.ph", "@nu-moa.edu.ph"];
//     const isValidEmail = validDomains.some(domain => sanitizedEmail.endsWith(domain));
//     if (!isValidEmail) {
//       return res.status(400).json({ error: "Only @students.nu-moa.edu.ph or @nu-moa.edu.ph emails are allowed!" });
//     }

//     const accountsRef = db.collection("accounts");

//     // Check if employeeId already exists (excluding current id if editing)
//     const employeeQuerySnap = await accountsRef
//       .where("employeeId", "==", sanitizedEmployeeId)
//       .get();

//     if (!employeeQuerySnap.empty) {
//       // If editing, allow if the found document id matches the current id
//       if (!id || employeeQuerySnap.docs.some(doc => doc.id !== id)) {
//         return res.status(400).json({ error: "This employee ID is already in use!" });
//       }
//     }

//     // Check duplicate name or email (excluding current id if editing)
//     const allAccountsSnap = await accountsRef.get();
//     const allAccounts = allAccountsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

//     const isDuplicate = allAccounts.some(acc =>
//       acc.id !== id &&
//       (acc.name.toLowerCase() === sanitizedName || acc.email.toLowerCase() === sanitizedEmail)
//     );

//     if (isDuplicate) {
//       return res.status(400).json({ error: "An account with the same name or email already exists!" });
//     }

//     const accountData = {
//       name: sanitizedName,
//       email: sanitizedEmail,
//       employeeId: sanitizedEmployeeId,
//       jobTitle,
//       department,
//       updatedAt: admin.firestore.FieldValue.serverTimestamp(),
//     };

//     if (id) {
//       // Update existing account
//       await accountsRef.doc(id).update(accountData);
//       return res.status(200).json({ message: "Account updated successfully!" });

//     } else {
//       // Create new account
//       accountData.createdAt = admin.firestore.FieldValue.serverTimestamp();
//       const docRef = await accountsRef.add(accountData);

//       // Send confirmation email
//       await fetch("https://sendemail-guopzbbmca-uc.a.run.app", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           to: sanitizedEmail,
//           subject: "Account Registration - Pending Approval",
//           text: `Hi ${sanitizedName},\n\nYour account has been added by the ITSO. You may now login your account.\n\nRegards,\nNU MOA ITSO Team`,
//           html: `<p>Hi ${sanitizedName},</p><p>Your account has been added by the ITSO. You may now login your account.</p><p>Regards,<br>NU MOA ITSO Team</p>`,
//         }),
//       });

//       return res.status(201).json({ message: "Account added successfully!", id: docRef.id });
//     }
    
//   } catch (error) {
//     console.error("Error handling account:", error);
//     return res.status(500).json({ error: "Failed to update account." });
//   }
// });

app.post("/account/save", async (req, res) => {
  try {
    const {
      id, // Optional: If present, update existing account; else create new
      name,
      email,
      employeeId,
      jobTitle,
      department,
      role,
      userId,    
      userName, 
    } = req.body;

    
    const capitalizeWords = (str) =>
      str
        .trim()
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());

    const sanitizedName = capitalizeWords(name);
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedEmployeeId = employeeId.trim();

    const validDomains = ["@students.nu-moa.edu.ph", "@nu-moa.edu.ph"];
    const isValidEmail = validDomains.some(domain =>
      sanitizedEmail.endsWith(domain)
    );

    if (!isValidEmail) {
      return res.status(400).json({
        error: "Only @students.nu-moa.edu.ph or @nu-moa.edu.ph emails are allowed!",
      });
    }

    const accountsRef = db.collection("accounts");

    const employeeQuerySnap = await accountsRef
      .where("employeeId", "==", sanitizedEmployeeId)
      .get();

    if (!employeeQuerySnap.empty) {
      if (!id || employeeQuerySnap.docs.some(doc => doc.id !== id)) {
        return res.status(400).json({ error: "This employee ID is already in use!" });
      }
    }

    const allAccountsSnap = await accountsRef.get();
    const allAccounts = allAccountsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const isDuplicate = allAccounts.some(acc => {
      if (!acc || acc.id === id) return false;
      
      const accName = acc.name ? acc.name.toLowerCase() : '';
      const accEmail = acc.email ? acc.email.toLowerCase() : '';
      
      return accName === sanitizedName || accEmail === sanitizedEmail;
    });

    if (isDuplicate) {
      return res.status(400).json({ error: "An account with the same name or email already exists!" });
    }

    const accountData = {
      name: sanitizedName,
      email: sanitizedEmail,
      employeeId: sanitizedEmployeeId,
      jobTitle,
      department,
      role,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    let actionMessage;

    if (id) {
      // ✅ Update existing
      await accountsRef.doc(id).update(accountData);
      actionMessage = `Updated account: ${sanitizedName}`;
      res.status(200).json({ message: "Account updated successfully!" });
    } else {
      // ✅ Create new account with Firebase Auth (same logic as signup)
      
      // Generate temporary password for new users that meets Firebase requirements
      const generateTemporaryPassword = () => {
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        const special = '@$!%*#?&'; // Firebase allowed special characters
        
        let result = '';
        
        // Ensure at least one character from each required category
        result += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
        result += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
        result += numbers.charAt(Math.floor(Math.random() * numbers.length));
        result += special.charAt(Math.floor(Math.random() * special.length));
        
        // Fill the rest with random characters from all categories
        const allChars = uppercase + lowercase + numbers + special;
        for (let i = 4; i < 12; i++) {
          result += allChars.charAt(Math.floor(Math.random() * allChars.length));
        }
        
        // Shuffle the result to randomize the order
        return result.split('').sort(() => Math.random() - 0.5).join('');
      };

      const temporaryPassword = generateTemporaryPassword();
      console.log("🔑 Generated temporary password for account creation:", temporaryPassword);

      // Create Firebase Auth user immediately with temporary password
      let firebaseUser;
      try {
        firebaseUser = await admin.auth().createUser({
          email: sanitizedEmail,
          password: temporaryPassword,
          emailVerified: false, // Will be verified after approval
        });
        console.log("✅ Firebase Auth user created with temporary password");
        
        // Send Firebase email verification immediately after account creation
        try {
          const actionCodeSettings = {
            url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`,
            handleCodeInApp: false,
          };
          
          const verificationLink = await admin.auth().generateEmailVerificationLink(
            sanitizedEmail,
            actionCodeSettings
          );
          
          console.log("✅ Firebase email verification link generated");
          
          // Send the verification email using the generated link
          const nodemailer = require('nodemailer');
          await sendEmailViaBrevo({
            from: process.env.GMAIL_USER,
            to: sanitizedEmail,
            subject: "Verify your email for NULS",
            html: `
              <p>Hello ${sanitizedName},</p>
              <p>Your account has been created by the administrator. Please verify your email address by clicking the link below:</p>
              <p><a href="${verificationLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Verify Email Address</a></p>
              <p>Your temporary password is: <strong>${temporaryPassword}</strong></p>
              <p>After verifying your email, you can login immediately with your temporary password and will be required to change it on your first login.</p>
              <p>If you didn't request this, please ignore this email.</p>
              <p>Thanks,<br>NULS Team</p>
            `,
          });

          console.log("✅ Firebase email verification sent immediately after account creation");
          
        } catch (emailError) {
          console.error("❌ Failed to send email verification:", emailError.message);
          // Don't fail the account creation if email fails
        }
        
      } catch (authError) {
        console.error("❌ Failed to create Firebase Auth user:", authError.message);
        console.error("❌ Password used:", temporaryPassword);
        
        // Provide more specific error messages
        if (authError.code === 'auth/weak-password') {
          return res.status(400).json({ error: "Password does not meet security requirements. Please try again." });
        } else if (authError.code === 'auth/email-already-exists') {
          return res.status(400).json({ error: "An account with this email already exists." });
        } else {
          return res.status(500).json({ error: "Failed to create user account. Please try again." });
        }
      }

      // Store account in accounts collection (auto-approved from admin creation)
      const approvedAccount = {
        name: sanitizedName,
        email: sanitizedEmail,
        employeeId: sanitizedEmployeeId,
        jobTitle,
        department,
        role,
        uid: firebaseUser.uid, // Store Firebase UID
        temporaryPassword: temporaryPassword,
        passwordSet: false, // User hasn't set their own password yet
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: "approved",
        approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const accountsRef = db.collection("accounts");
      const docRef = await accountsRef.add(approvedAccount);

      actionMessage = `Created new account: ${sanitizedName}`;
      res.status(201).json({ 
        message: "Account created successfully! Firebase email verification sent. Account is auto-approved.",
        id: docRef.id,
        temporaryPassword: temporaryPassword,
        instructions: "Use this temporary password with the Firebase email verification. After email verification, the user can login immediately."
      });
    }

    // // ✅ Activity logging
    // await db.collection("allactivitylog").add({
    //   action: actionMessage,
    //   userName: userName || "Admin",
    //   userId: userId || "system",
    //   timestamp: admin.firestore.FieldValue.serverTimestamp(),
    // });

    if (userId && userId !== "unknown") {
      await db.collection(`accounts/${userId}/activitylog`).add({
        action: actionMessage,
        userName: userName || "Admin",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

  } catch (error) {
    console.error("Error handling account:", error);
    return res.status(500).json({ error: "Failed to update account." });
  }
});

// app.post("/account/approve", async (req, res) => {
//   try {
//     const { requestIds } = req.body;

//     if (!Array.isArray(requestIds) || requestIds.length === 0) {
//       return res.status(400).json({ error: "No request IDs provided." });
//     }

//     const batch = db.batch(); // Batch for delete + add

//     for (const requestId of requestIds) {
//       const requestRef = db.collection("pendingaccounts").doc(requestId);
//       const requestSnapshot = await requestRef.get();

//       if (!requestSnapshot.exists) {
//         console.warn(`Request not found: ${requestId}`);
//         continue;
//       }

//       const requestData = requestSnapshot.data();

//       // Check if user already exists
//       const accountsRef = db.collection("accounts");
//       const existingUserSnap = await accountsRef
//         .where("email", "==", requestData.email)
//         .get();

//       if (!existingUserSnap.empty) {
//         console.log(`User with email ${requestData.email} already exists. Skipping.`);
//         continue;
//       }

//       // Remove password, prepare data
//       const { password, ...accountData } = requestData;

//       const newAccountRef = accountsRef.doc(); // Auto-generated ID
//       batch.set(newAccountRef, {
//         ...accountData,
//         uid: "",
//         status: "approved",
//         approvedAt: admin.firestore.FieldValue.serverTimestamp(),
//       });

//       batch.delete(requestRef);

//       // Send email per account (outside batch)
//       await fetch("https://sendemail-guopzbbmca-uc.a.run.app", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           to: accountData.email,
//           subject: "Account Approved",
//           text: `Hi ${accountData.name},\n\nYour account request has been approved. You may now log in to the system.\n\nRegards,\nNU MOA ITSO Team`,
//           html: `<p>Hi ${accountData.name},</p><p>Your account request has been <b>approved</b>. You may now log in to the system.</p><p>Regards,<br>NU MOA ITSO Team</p>`,
//         }),
//       });
//     }

//     await batch.commit();

//     return res.status(200).json({ message: "Selected account requests have been approved." });
    
//   } catch (error) {
//     console.error("Error in /account/approve:", error);
//     return res.status(500).json({ error: "Server error while approving requests." });
//   }
// });

app.post("/account/approve", async (req, res) => {
  try {
    const { requestIds, userId, userName } = req.body;

    if (!Array.isArray(requestIds) || requestIds.length === 0) {
      return res.status(400).json({ error: "No request IDs provided." });
    }

    const batch = db.batch(); // Batch for delete + add
    const approvedAccounts = [];

    for (const requestId of requestIds) {
      const requestRef = db.collection("pendingaccounts").doc(requestId);
      const requestSnapshot = await requestRef.get();

      if (!requestSnapshot.exists) {
        console.warn(`Request not found: ${requestId}`);
        continue;
      }

      const requestData = requestSnapshot.data();

      // Check if user already exists
      const accountsRef = db.collection("accounts");
      const existingUserSnap = await accountsRef
        .where("email", "==", requestData.email)
        .get();

      if (!existingUserSnap.empty) {
        console.log(`User with email ${requestData.email} already exists. Skipping.`);
        continue;
      }

      const { password, ...accountData } = requestData;
      const newAccountRef = accountsRef.doc(); // Auto-generated ID

      const accountDocData = {
        ...accountData,
          uid: accountData.uid, // Keep the Firebase UID from pendingaccounts
          temporaryPassword: accountData.temporaryPassword,
          passwordSet: false, // User hasn't set their own password yet
        status: "approved",
        approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      batch.set(newAccountRef, accountDocData);
      batch.delete(requestRef);

      // Send approval email
      // await fetch("https://sendemail-guopzbbmca-uc.a.run.app", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     to: accountData.email,
      //     subject: "Account Approved",
      //     text: `Hi ${accountData.name},\n\nYour account request has been approved. You may now log in to the system.\n\nRegards,\nNU MOA ITSO Team`,
      //     html: `<p>Hi ${accountData.name},</p><p>Your account request has been <b>approved</b>. You may now log in to the system.</p><p>Regards,<br>NU MOA ITSO Team</p>`,
      //   }),
      // });

      // await transporter.sendMail({
      //   from: `"NU MOA ITSO" <${process.env.OUTLOOK_EMAIL}>`,
      //   to: accountData.email,
      //   subject: "Account Approved",
      //   text: `Hi ${accountData.name},\n\nYour account request has been approved. You may now log in to the system.\n\nRegards,\nNU MOA ITSO Team`,
      //   html: `<p>Hi ${accountData.name},</p><p>Your account request has been <b>approved</b>. You may now log in to the system.</p><p>Regards,<br>NU MOA ITSO Team</p>`,
      // });

      try {
        console.log("Email credentials:", process.env.GMAIL_USER, process.env.GMAIL_PASS);

        await sendEmailViaBrevo({
          from: process.env.GMAIL_USER,
          to: accountData.email,
          subject: "Account Approved - Login Credentials",
          text: `Hi ${accountData.name},\n\nYour account request has been approved!\n\nLogin Credentials:\nEmail: ${accountData.email}\nTemporary Password: ${accountData.temporaryPassword}\n\nIMPORTANT: You must change this temporary password on your first login for security reasons.\n\nRegards,\nNU MOA NULS Team`,
          html: `
            <p>Hi ${accountData.name},</p>
            <p>Your account request has been <b>approved</b>!</p>
            <p><strong>Login Credentials:</strong></p>
            <p>Email: ${accountData.email}</p>
            <p>Temporary Password: <strong>${accountData.temporaryPassword}</strong></p>
            <p style="color: red;"><strong>IMPORTANT:</strong> You must change this temporary password on your first login for security reasons.</p>
            <p>Regards,<br>NU MOA NULS Team</p>
          `,
        });

        console.log("✅ Account approval email sent successfully");

      } catch (emailErr) {
        console.error("❌ Failed to send account approval email:", emailErr.message);
      }

      // ✅ Logging approval action
      const activityMessage = `Approved account for (${accountData.name})`;

      // await db.collection("allactivitylog").add({
      //   action: activityMessage,
      //   userName: userName || "System",
      //   userId: userId || "system",
      //   timestamp: admin.firestore.FieldValue.serverTimestamp(),
      // });

      if (userId && userId !== "unknown") {
        await db.collection(`accounts/${userId}/activitylog`).add({
          action: activityMessage,
          userName: userName || "System",
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      approvedAccounts.push(accountData.name);
    }

    await batch.commit();

    return res.status(200).json({ message: `Approved accounts: ${approvedAccounts.join(", ")}` });

  } catch (error) {
    console.error("Error in /account/approve:", error);
    return res.status(500).json({ error: "Server error while approving requests." });
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// REJECT / APPROVE OF REQUEST ITEMS
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.post("/request/reject", async (req, res) => {
  try {
    const {
      selectedRequest,
      enrichedItems,
      rejectReason,
      userName = "Unknown",
      userId = "system",
    } = req.body;

    if (!selectedRequest || !Array.isArray(enrichedItems) || enrichedItems.length === 0) {
      return res.status(400).json({ error: "Missing or invalid request data." });
    }

    const rejectLogEntry = {
      accountId: selectedRequest.accountId || "N/A",
      userName: selectedRequest.userName || "N/A",
      room: selectedRequest.room || "N/A",
      course: selectedRequest.course || "N/A",
      courseDescription: selectedRequest.courseDescription || "N/A",
      dateRequired: selectedRequest.dateRequired || "N/A",
      timeFrom: selectedRequest.timeFrom || "N/A",
      timeTo: selectedRequest.timeTo || "N/A",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      requestList: enrichedItems,
      status: "Rejected",
      rejectedBy: userName,
      reason: rejectReason || "No reason provided",
      program: selectedRequest.program || "N/A",
    };

    // ➕ Log to general requestlog
    await db.collection("requestlog").add(rejectLogEntry);

    // ➕ Log to user's historylog
    if (selectedRequest.accountId) {
      await db
        .collection("accounts")
        .doc(selectedRequest.accountId)
        .collection("historylog")
        .add({
          ...rejectLogEntry,
          action: "Request Rejected",
        });
    }

    // 🗑️ Delete from userrequests
    await db.collection("userrequests").doc(selectedRequest.id).delete();

    // 🗑️ Remove from user's userRequests subcollection
    const subRef = db
      .collection("accounts")
      .doc(selectedRequest.accountId)
      .collection("userRequests");
    const subSnap = await subRef.get();

    const targetTimestamp = selectedRequest.timestamp?.seconds;
    const targetItemId = selectedRequest.filteredMergedData?.[0]?.selectedItemId;

    const deleteOps = subSnap.docs.map((docSnap) => {
      const d = docSnap.data();
      const match =
        d.timestamp?.seconds === targetTimestamp &&
        d.filteredMergedData?.[0]?.selectedItemId === targetItemId;

      if (match) {
        return docSnap.ref.delete();
      }
      return Promise.resolve();
    });

    await Promise.all(deleteOps);

    // 🪵 Log to allactivitylog
    // await db.collection("allactivitylog").add({
    //   action: `Rejected a request from ${selectedRequest.userName}`,
    //   userId,
    //   userName,
    //   timestamp: admin.firestore.FieldValue.serverTimestamp(),
    // });

    // 🪵 Log to user's activitylog
    if (userId && userId !== "system") {
      await db
        .collection("accounts")
        .doc(userId)
        .collection("activitylog")
        .add({
          action: `Rejected request for ${selectedRequest.userName}`,
          userId,
          userName,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
    }

    // 🪵 Log to user's notification
    if (selectedRequest.accountId && selectedRequest.accountId !== "system") {
      await db
        .collection("accounts")
        .doc(selectedRequest.accountId)
        .collection("userNotifications")
        .add({
          action: `Rejected request for ${selectedRequest.userName}`,
          requestId: selectedRequest.id,
          userName: selectedRequest.userName,
          read: false,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
    }

    return res.status(200).json({ message: "Request successfully rejected and logged." });

  } catch (err) {
    console.error("Error rejecting request:", err);
    return res.status(500).json({ error: "Server error during rejection." });
  }
});

app.post("/request/approve", async (req, res) => {
  try {
    const {
      selectedRequest,
      enrichedItems,
      rejectedItems = [],
      userName = "Unknown",
      userId = "system",
    } = req.body;

    if (!selectedRequest || !Array.isArray(enrichedItems) || enrichedItems.length === 0) {
      return res.status(400).json({ error: "Invalid or missing approval data." });
    }

    const timestamp = selectedRequest.timestamp || admin.firestore.Timestamp.now();
    const rawTimestamp = new Date();

    const requestLogEntry = {
      accountId: selectedRequest.accountId || "N/A",
      userName: selectedRequest.userName || "N/A",
      room: selectedRequest.room || "N/A",
      course: selectedRequest.course || "N/A",
      courseDescription: selectedRequest.courseDescription || "N/A",
      dateRequired: selectedRequest.dateRequired || "N/A",
      timeFrom: selectedRequest.timeFrom || "N/A",
      timeTo: selectedRequest.timeTo || "N/A",
      timestamp,
      rawTimestamp,
      requestList: enrichedItems,
      status: "Approved",
      approvedBy: userName,
      reason: selectedRequest.reason || "No reason provided",
      program: selectedRequest.program || "N/A",
    };

    const rejectLogEntry = rejectedItems.length > 0 ? {
      ...requestLogEntry,
      requestList: rejectedItems,
      status: "Rejected",
      rejectedBy: userName,
    } : null;

    // 🔁 Update inventory and labRoom quantities
    for (const item of enrichedItems) {
      const { selectedItemId, quantity = 0, labRoom } = item;
      const inventoryRef = db.collection("inventory").doc(selectedItemId);
      const inventorySnap = await inventoryRef.get();

      if (!inventorySnap.exists) continue;

      const invData = inventorySnap.data();
      const newQty = Math.max((invData.quantity || 0) - quantity, 0);

      await inventoryRef.update({ quantity: newQty });

      // Update condition
      const updateCondition = (conditionObj, qty) => {
        const result = { ...conditionObj };
        let remaining = qty;

        ["Good", "Damage", "Defect", "Lost"].forEach((key) => {
          const deduct = Math.min(result[key] || 0, remaining);
          result[key] = (result[key] || 0) - deduct;
          remaining -= deduct;
        });

        return result;
      };

      const updatedCondition = updateCondition(invData.condition || {}, quantity);
      await inventoryRef.update({ condition: updatedCondition });

      // 🔁 Update labRoom item
      if (labRoom) {
        const roomQuery = await db.collection("labRoom").where("roomNumber", "==", labRoom).get();
        if (!roomQuery.empty) {
          const roomDoc = roomQuery.docs[0];
          const itemsRef = roomDoc.ref.collection("items");
          const itemQuery = await itemsRef.where("itemId", "==", invData.itemId).get();

          if (!itemQuery.empty) {
            const itemDoc = itemQuery.docs[0];
            const itemRef = itemDoc.ref;
            const labItem = itemDoc.data();
            const newLabQty = Math.max((labItem.quantity || 0) - quantity, 0);

            await itemRef.update({
              quantity: newLabQty,
              condition: updateCondition(labItem.condition || {}, quantity),
            });
          }
        }
      }
    }

    // 📝 Log to Firestore
    await db.collection("requestlog").add(requestLogEntry);
    await db.collection("accounts").doc(selectedRequest.accountId).collection("historylog").add({
      ...requestLogEntry,
      action: "Request Approved",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    if (rejectLogEntry) {
      await db.collection("requestlog").add(rejectLogEntry);
      await db.collection("accounts").doc(selectedRequest.accountId).collection("historylog").add({
        ...rejectLogEntry,
        action: "Request Rejected",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // ➕ Add to userrequestlog if Fixed
    const fixedItems = enrichedItems.filter(i => i.itemType === "Fixed");
    if (fixedItems.length > 0) {
      await db.collection("accounts").doc(selectedRequest.accountId).collection("userrequestlog").add({
        ...requestLogEntry,
        requestList: fixedItems,
      });

      await db.collection("borrowcatalog").add({
        ...requestLogEntry,
        requestList: fixedItems,
        status: "Borrowed",
      });
    }

    // 🧹 Cleanup
    await db.collection("userrequests").doc(selectedRequest.id).delete();

    const subRef = db.collection("accounts").doc(selectedRequest.accountId).collection("userRequests");
    const subSnap = await subRef.get();

    const targetTimestamp = selectedRequest.timestamp?.seconds;
    const targetItemId = selectedRequest.filteredMergedData?.[0]?.selectedItemId;

    const deleteOps = subSnap.docs.map((docSnap) => {
      const d = docSnap.data();
      const match =
        d.timestamp?.seconds === targetTimestamp &&
        d.filteredMergedData?.[0]?.selectedItemId === targetItemId;

      if (match) return docSnap.ref.delete();
      return Promise.resolve();
    });

    await Promise.all(deleteOps);

    // 🪵 Log to allactivitylog
    // await db.collection("allactivitylog").add({
    //   action: `Approved request from ${selectedRequest.userName}`,
    //   userId,
    //   userName,
    //   timestamp: admin.firestore.FieldValue.serverTimestamp(),
    // });

    // 🪵 Log to user's activitylog
    if (userId && userId !== "system") {
      await db
        .collection("accounts")
        .doc(userId)
        .collection("activitylog")
        .add({
          action: `Approved request for ${selectedRequest.userName}`,
          userId,
          userName,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
    }

    
    // 🪵 Log to user's notification
    // 🪵 Log to user's notification
    if (selectedRequest.accountId && selectedRequest.accountId !== "system") {
      await db
        .collection("accounts")
        .doc(selectedRequest.accountId)
        .collection("userNotifications")
        .add({
          action: `Approved request for ${selectedRequest.userName}`,
          requestId: selectedRequest.id,
          userName: selectedRequest.userName,
          read: false,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
    }

    return res.status(200).json({ message: "Request approved and processed." });

  } catch (err) {
    console.error("Error in /request/approve:", err);
    return res.status(500).json({ error: "Server error during approval." });
  }
});

app.post("/request/multireject", async (req, res) => {
  try {
    const {
      selectedRequest,
      enrichedItems,
      rejectedItems,
      rejectionReasons = {},
      userName = "Unknown",
      userId = "system",
    } = req.body;

    if (!selectedRequest || !Array.isArray(enrichedItems)) {
      return res.status(400).json({ error: "Missing required data." });
    }

    const timestamp = selectedRequest.timestamp || admin.firestore.Timestamp.now();
    const rawTimestamp = new Date();

    const requestLogEntry = {
      accountId: selectedRequest.accountId || "N/A",
      userName: selectedRequest.userName || "N/A",
      room: selectedRequest.room || "N/A",
      course: selectedRequest.course || "N/A",
      courseDescription: selectedRequest.courseDescription || "N/A",
      dateRequired: selectedRequest.dateRequired || "N/A",
      timeFrom: selectedRequest.timeFrom || "N/A",
      timeTo: selectedRequest.timeTo || "N/A",
      timestamp,
      rawTimestamp,
      requestList: enrichedItems,
      status: "Approved",
      approvedBy: userName,
      reason: selectedRequest.reason || "No reason provided",
      program: selectedRequest.program || "N/A",
    };

    const rejectLogEntry = {
      accountId: selectedRequest.accountId || "N/A",
      userName: selectedRequest.userName || "N/A",
      room: selectedRequest.room || "N/A",
      course: selectedRequest.course || "N/A",
      courseDescription: selectedRequest.courseDescription || "N/A",
      dateRequired: selectedRequest.dateRequired || "N/A",
      timeFrom: selectedRequest.timeFrom || "N/A",
      timeTo: selectedRequest.timeTo || "N/A",
      timestamp,
      rawTimestamp,
      requestList: rejectedItems.map((item, idx) => ({
        ...item,
        rejectionReason: rejectionReasons[`${item.selectedItemId}-${idx}`] || "No reason provided",
      })),
      status: "Rejected",
      rejectedBy: userName,
      program: selectedRequest.program || "N/A",
    };

    // 📝 Log to Firestore
    if (enrichedItems.length > 0) {
      await db.collection("requestlog").add(requestLogEntry);
      await db.collection("accounts").doc(selectedRequest.accountId).collection("historylog").add({
        ...requestLogEntry,
        action: "Request Approved",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    if (rejectedItems.length > 0) {
      await db.collection("requestlog").add(rejectLogEntry);
      await db.collection("accounts").doc(selectedRequest.accountId).collection("historylog").add({
        ...rejectLogEntry,
        action: "Request Rejected",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // 🧮 Update Inventory & LabRoom
    for (const item of enrichedItems) {
      const { selectedItemId, quantity = 0, labRoom } = item;
      const inventoryRef = db.collection("inventory").doc(selectedItemId);
      const inventorySnap = await inventoryRef.get();
      if (!inventorySnap.exists) continue;

      const invData = inventorySnap.data();
      const newQty = Math.max((invData.quantity || 0) - quantity, 0);

      const updateCondition = (conditionObj, qty) => {
        const updated = { ...conditionObj };
        let remaining = qty;
        ["Good", "Damage", "Defect", "Lost"].forEach((key) => {
          const deduct = Math.min(updated[key] || 0, remaining);
          updated[key] -= deduct;
          remaining -= deduct;
        });
        return updated;
      };

      await inventoryRef.update({
        quantity: newQty,
        condition: updateCondition(invData.condition || {}, quantity),
      });

      // 🔁 Update labRoom quantity
      if (labRoom) {
        const roomSnap = await db.collection("labRoom").where("roomNumber", "==", labRoom).get();
        if (!roomSnap.empty) {
          const roomDoc = roomSnap.docs[0];
          const itemsRef = roomDoc.ref.collection("items");
          const itemSnap = await itemsRef.where("itemId", "==", invData.itemId).get();
          if (!itemSnap.empty) {
            const itemDoc = itemSnap.docs[0];
            const labItem = itemDoc.data();
            await itemDoc.ref.update({
              quantity: Math.max((labItem.quantity || 0) - quantity, 0),
              condition: updateCondition(labItem.condition || {}, quantity),
            });
          }
        }
      }
    }

    // 📦 Borrow catalog & user request log (for fixed items)
    const fixedItems = enrichedItems.filter(i => i.itemType === "Fixed");
    if (fixedItems.length > 0) {
      await db.collection("borrowcatalog").add({
        ...requestLogEntry,
        requestList: fixedItems,
        status: "Borrowed",
      });

      await db.collection("accounts").doc(selectedRequest.accountId).collection("userrequestlog").add({
        ...requestLogEntry,
        requestList: fixedItems,
      });
    }

    // 🧹 Cleanup
    await db.collection("userrequests").doc(selectedRequest.id).delete();

    const subSnap = await db.collection("accounts").doc(selectedRequest.accountId).collection("userRequests").get();
    const matchTimestamp = selectedRequest.timestamp?.seconds;
    const matchItemId = selectedRequest.filteredMergedData?.[0]?.selectedItemId;

    const deleteOps = subSnap.docs.map((docSnap) => {
      const d = docSnap.data();
      const match = d.timestamp?.seconds === matchTimestamp &&
                    d.filteredMergedData?.[0]?.selectedItemId === matchItemId;
      return match ? docSnap.ref.delete() : Promise.resolve();
    });
    await Promise.all(deleteOps);

    // 📋 All activity log
    // await db.collection("allactivitylog").add({
    //   action: `Partially approved request for ${selectedRequest.userName} (some items rejected)`,
    //   userName,
    //   userId,
    //   timestamp: admin.firestore.FieldValue.serverTimestamp(),
    // });

    // 📂 Log to user's activitylog
    if (userId && userId !== "system") {
      await db.collection(`accounts/${userId}/activitylog`).add({
        action: `Request Rejected for ${selectedRequest.userName}`,
        userName,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    
    // 🪵 Log to user's notification
    if (selectedRequest.accountId && selectedRequest.accountId !== "system") {
      await db
        .collection("accounts")
        .doc(selectedRequest.accountId)
        .collection("userNotifications")
        .add({
          action: `Partially approved request for ${selectedRequest.userName}`,
          requestId: selectedRequest.id,
          userName: selectedRequest.userName,
          read: false,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
    }

    res.status(200).json({ message: "Request processed: approved and rejected items logged." });
  } catch (err) {
    console.error("Error in /request/multireject:", err);
    res.status(500).json({ error: "Failed to process multi-reject request." });
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ANALYTICS / AI / MONTHLY BREAKDOWN / BAR GRAPH / PIE CHART 
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// IN USE
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

// app.post("/ai-inventory-analysis", async (req, res) => {
//   try {
//     const snapshot = await db.collection("inventory").get();
//     // const inventoryData = snapshot.docs.map(doc => doc.data());
//     const inventoryData = snapshot.docs.map(doc => {
//       const data = doc.data();
//       return {
//         itemName: data.itemName || "Unnamed",
//         quantity: Number(data.quantity ?? 0),
//         criticalLevel: Number(data.criticalLevel ?? 0),
//       };
//     });

// //     const inputPrompt = `
// // You are an AI assistant. You are given a list of inventory items, each with a quantity and criticalLevel.

// // Classify each item into:
// // - "Safe" if quantity > criticalLevel
// // - "Warning" if quantity == criticalLevel
// // - "Critical" if quantity < criticalLevel

// // Count how many items fall into each category.

// // Return ONLY this JSON:
// // {
// //   "Safe": number,
// //   "Warning": number,
// //   "Critical": number
// // }
// // No markdown, no explanation.

// // Here is the inventory data:
// // ${JSON.stringify(inventoryData)}
// // `;

// // const inputPrompt = `
// // You are an AI assistant. You are given a list of inventory items, each with a quantity and a criticalLevel.

// // Classify each item into:
// // - "Safe" if quantity > criticalLevel
// // - "Warning" if quantity == criticalLevel
// // - "Critical" if quantity < criticalLevel

// // Count how many items fall into each category.

// // Then, explain what this distribution means in simple terms for a non-technical inventory manager. For example, highlight if most items are safe or if any attention is needed.

// // Return ONLY this JSON:
// // {
// //   "Safe": number,
// //   "Warning": number,
// //   "Critical": number,
// //   "Explanation": "short paragraph"
// // }

// // Here is the inventory data:
// // ${JSON.stringify(inventoryData)}
// // `;

// const inputPrompt = `
// You are an AI assistant. You are given a list of inventory items, each with a quantity and a criticalLevel.

// Classify each item into:
// - "Safe" if quantity > criticalLevel
// - "Warning" if quantity == criticalLevel
// - "Critical" if quantity < criticalLevel

// Count how many items fall into each category.

// Then explain this in a way a non-technical inventory manager would understand. Mention:
// - How many items are Safe, Warning, and Critical
// - The **names** of only the Critical items (not the Safe or Warning ones)
// - Why the Critical items need attention urgently

// Return ONLY this JSON:
// {
//   "Safe": number,
//   "Warning": number,
//   "Critical": number,
//   "Explanation": "We have X items with a safe quantity, meaning we have more than enough. Y items are at their critical level, so we need to order more soon. Z items (name1, name2, name3) are below the critical level and need to be ordered immediately to avoid running out."
// }

// No markdown, no code blocks.

// Here is the inventory data:
// ${JSON.stringify(inventoryData)}
// `;


//     const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

//     const response = await axios.post(
//       `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
//       {
//         contents: [
//           {
//             role: "user",
//             parts: [{ text: inputPrompt }]
//           }
//         ],
//         generationConfig: {
//           maxOutputTokens: 256,
//           temperature: 0.5
//         }
//       },
//       {
//         headers: {
//           "Content-Type": "application/json"
//         }
//       }
//     );

//     // const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
//     // const match = rawText.match(/\{[\s\S]*?\}/);

//     // let result = {};
//     // if (match) {
//     //   result = JSON.parse(match[0]);
//     // }

//     const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

//     // Remove ```json or ``` if they exist
//     const cleaned = rawText.replace(/```json|```/g, "").trim();

//     let result = {};
//     try {
//       result = JSON.parse(cleaned);
//     } catch (err) {
//       console.error("❌ Failed to parse Gemini JSON:", cleaned);
//     }

//     return res.status(200).json({ data: result });

//   } catch (err) {
//     console.error("AI Analysis Error:", err.response?.data || err.message);
//     return res.status(500).json({
//       error: err.response?.data || "Failed to get AI analysis"
//     });
//   }
// });

// app.post("/ai-most-requested-items-bar", async (req, res) => {
//   try {
//     const snapshot = await db.collection("requestlog").get();
//     const requestLogs = snapshot.docs.map(doc => doc.data());

//     const itemNames = requestLogs.flatMap(entry => {
//       const list = entry.requestList || [];
//       return list.map(i => i.itemName || "Unnamed");
//     });

// //     const inputPrompt = `
// // You are an advanced AI data analyst for a university laboratory inventory system.

// // You are given a list of item names requested by different departments. Your tasks:

// // 1. Count how many times each unique itemName appears.
// // 2. Identify patterns among frequently requested items (e.g., similar names, categories, usage in experiments).
// // 3. Provide a concise explanation why these items are in high demand — based on trends such as course schedules, lab operations, or academic cycles.
// // 4. Predict whether these items will remain in demand and briefly explain why.

// // Return ONLY the following strict JSON format:
// // {
// //   "items": {
// //     "Item A": number,
// //     "Item B": number
// //   },
// //   "summary": {
// //     "patterns": ["bullet point", "bullet point", "..."],
// //     "reasons": ["bullet point", "bullet point", "..."],
// //     "forecasts": ["bullet point", "bullet point", "..."]
// //   }
// // }

// // Do NOT include markdown, code blocks, or comments.
// // Use only valid JSON.
// // Here is the list of item names:
// // ${JSON.stringify(itemNames)}
// // `;

// // const inputPrompt = `
// // You are an advanced AI data analyst for a university laboratory inventory system.

// // You are given a list of item names requested by different departments. Your tasks:

// // 1. Count how many times each unique itemName appears.
// // 2. Identify common patterns among the most frequently requested items, such as naming conventions, categories, or functional usage.
// // 3. Summarize in paragraph form (maximum three sentences) the reasons these items are in high demand—based on trends like academic schedules, lab activities, or operational needs.
// // 4. Predict whether these items will remain in high demand and summarize the reasoning in three sentences.

// // Return ONLY the following strict JSON format:
// // {
// //   "items": {
// //     "Item A": number,
// //     "Item B": number
// //   },
// //   "summary": {
// //     "patterns": "**Patterns:** paragraph summary (max 3 sentences)",
// //     "reasons": "**Reasons:** paragraph summary (max 3 sentences)",
// //     "forecasts": "**Forecasts:** paragraph summary (max 3 sentences)"
// //   }
// // }

// // Do NOT include markdown, code blocks, or comments.
// // Use only valid JSON.
// // Here is the list of item names:
// // ${JSON.stringify(itemNames)}
// // `;

// // const inputPrompt = `
// // You are an advanced AI data analyst for a university laboratory inventory system.

// // You are given a list of item names requested by different departments. Your tasks:

// // 1. Count how many times each unique itemName appears.
// // 2. Identify common patterns among the most frequently requested items, such as naming conventions, categories, or functional usage.
// // 3. List the reasons these items are frequently requested (e.g., due to academic cycles, lab dependencies, etc.).
// // 4. Forecast whether these items will remain in high demand and explain why.

// // Return ONLY this strict JSON format:
// // {
// //   "items": {
// //     "Item A": number,
// //     "Item B": number
// //   },
// //   "summary": {
// //     "patterns": ["bullet", "bullet", "bullet"],
// //     "reasons": ["bullet", "bullet", "bullet"],
// //     "forecasts": ["bullet", "bullet", "bullet"]
// //   }
// // }

// // Do NOT include markdown, code blocks, or comments.
// // Use only valid JSON.
// // Here is the list of item names:
// // ${JSON.stringify(itemNames)}
// // `;

// const inputPrompt = `
// You are an advanced AI data analyst for a university laboratory inventory system.

// You are given a list of item names requested by different departments. Your tasks:

// 1. Count how many times each unique itemName appears.
// 2. Identify any common patterns among frequently requested items (e.g., similar names, categories, experimental use).
// 3. Analyze the reasons behind their frequent requests, such as academic schedules, lab procedures, or operational demands.
// 4. Predict whether these items will remain in high demand in the near future and why.

// Return ONLY this strict JSON format:
// {
//   "items": {
//     "Item A": number,
//     "Item B": number
//   },
//   "summary": "A short, unified paragraph (max 4 sentences) that explains observed patterns, reasons for demand, and future forecasts. Make it simple and clear for a non-technical inventory officer."
// }

// Do NOT include markdown, code blocks, or comments.
// Use only valid JSON.

// Here is the list of item names:
// ${JSON.stringify(itemNames)}
// `;

//     const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

//     const response = await axios.post(
//       `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
//       {
//         contents: [
//           {
//             role: "user",
//             parts: [{ text: inputPrompt }]
//           }
//         ],
//         generationConfig: {
//           maxOutputTokens: 600,
//           temperature: 0.4
//         }
//       },
//       {
//         headers: {
//           "Content-Type": "application/json"
//         }
//       }
//     );

//     const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
//     const cleaned = rawText.replace(/```json|```|\\n/g, "").trim();

//     let parsed;
//     try {
//       parsed = JSON.parse(cleaned);

//       if (!parsed.items || !parsed.summary) {
//         throw new Error("Missing 'items' or 'summary' in Gemini response.");
//       }

//       return res.status(200).json({ data: parsed });
//     } catch (err) {
//       console.error("❌ Failed to parse Gemini response:", cleaned);
//       return res.status(500).json({
//         error: "Failed to parse AI response",
//         raw: cleaned,
//       });
//     }
//   } catch (err) {
//     console.error("AI Item Frequency Error:", err.response?.data || err.message);
//     return res.status(500).json({
//       error: err.response?.data || "Failed to analyze most requested items"
//     });
//   }
// });

// app.post("/ai-most-requested-items-bar", async (req, res) => {
//   try {
//     const snapshot = await db.collection("requestlog").get();
//     const requestLogs = snapshot.docs.map(doc => doc.data());

//     // Extract items with their quantities instead of just names
//     const itemData = requestLogs.flatMap(entry => {
//       const list = entry.requestList || [];
//       return list.map(i => ({
//         itemName: i.itemName || "Unnamed",
//         quantity: parseInt(i.quantity) || 0
//       }));
//     });

// //     const inputPrompt = `
// // You are an advanced AI data analyst for a university laboratory inventory system.

// // You are given a list of item names requested by different departments. Your tasks:

// // 1. Count how many times each unique itemName appears.
// // 2. Identify patterns among frequently requested items (e.g., similar names, categories, usage in experiments).
// // 3. Provide a concise explanation why these items are in high demand — based on trends such as course schedules, lab operations, or academic cycles.
// // 4. Predict whether these items will remain in demand and briefly explain why.

// // Return ONLY the following strict JSON format:
// // {
// //   "items": {
// //     "Item A": number,
// //     "Item B": number
// //   },
// //   "summary": {
// //     "patterns": ["bullet point", "bullet point", "..."],
// //     "reasons": ["bullet point", "bullet point", "..."],
// //     "forecasts": ["bullet point", "bullet point", "..."]
// //   }
// // }

// // Do NOT include markdown, code blocks, or comments.
// // Use only valid JSON.
// // Here is the list of item names:
// // ${JSON.stringify(itemNames)}
// // `;

// // const inputPrompt = `
// // You are an advanced AI data analyst for a university laboratory inventory system.

// // You are given a list of item names requested by different departments. Your tasks:

// // 1. Count how many times each unique itemName appears.
// // 2. Identify common patterns among the most frequently requested items, such as naming conventions, categories, or functional usage.
// // 3. Summarize in paragraph form (maximum three sentences) the reasons these items are in high demand—based on trends like academic schedules, lab activities, or operational needs.
// // 4. Predict whether these items will remain in high demand and summarize the reasoning in three sentences.

// // Return ONLY the following strict JSON format:
// // {
// //   "items": {
// //     "Item A": number,
// //     "Item B": number
// //   },
// //   "summary": {
// //     "patterns": "**Patterns:** paragraph summary (max 3 sentences)",
// //     "reasons": "**Reasons:** paragraph summary (max 3 sentences)",
// //     "forecasts": "**Forecasts:** paragraph summary (max 3 sentences)"
// //   }
// // }

// // Do NOT include markdown, code blocks, or comments.
// // Use only valid JSON.
// // Here is the list of item names:
// // ${JSON.stringify(itemNames)}
// // `;

// // const inputPrompt = `
// // You are an advanced AI data analyst for a university laboratory inventory system.

// // You are given a list of item names requested by different departments. Your tasks:

// // 1. Count how many times each unique itemName appears.
// // 2. Identify common patterns among the most frequently requested items, such as naming conventions, categories, or functional usage.
// // 3. List the reasons these items are frequently requested (e.g., due to academic cycles, lab dependencies, etc.).
// // 4. Forecast whether these items will remain in high demand and explain why.

// // Return ONLY this strict JSON format:
// // {
// //   "items": {
// //     "Item A": number,
// //     "Item B": number
// //   },
// //   "summary": {
// //     "patterns": ["bullet", "bullet", "bullet"],
// //     "reasons": ["bullet", "bullet", "bullet"],
// //     "forecasts": ["bullet", "bullet", "bullet"]
// //   }
// // }

// // Do NOT include markdown, code blocks, or comments.
// // Use only valid JSON.
// // Here is the list of item names:
// // ${JSON.stringify(itemNames)}
// // `;

// const inputPrompt = `
// You are an advanced AI data analyst for a university laboratory inventory system.

// You are given a list of items with their requested quantities from different departments. Your tasks:

// 1. Calculate the total quantity requested for each unique item (sum all quantities for each itemName).
// 2. Identify items with the highest volume consumption and any patterns among them (e.g., similar categories, experimental use, bulk items).
// 3. Analyze which items are most prone to stock-outs based on high volume consumption patterns, considering factors like academic schedules, lab procedures, or seasonal demands.
// 4. Predict which items will likely face stock-out risks in the near future and recommend inventory management strategies.

// Return ONLY this strict JSON format:
// {
//   "items": {
//     "Item A": total_quantity_number,
//     "Item B": total_quantity_number
//   },
//   "summary": "A short, unified paragraph (max 4 sentences) that explains high-volume consumption patterns, identifies stock-out risks, and provides inventory management recommendations. Make it simple and clear for a non-technical inventory officer."
// }

// Do NOT include markdown, code blocks, or comments.
// Use only valid JSON.

// Here is the list of items with quantities:
// ${JSON.stringify(itemData)}
// `;

//     const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

//     const response = await axios.post(
//       `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
//       {
//         contents: [
//           {
//             role: "user",
//             parts: [{ text: inputPrompt }]
//           }
//         ],
//         generationConfig: {
//           maxOutputTokens: 600,
//           temperature: 0.4
//         }
//       },
//       {
//         headers: {
//           "Content-Type": "application/json"
//         }
//       }
//     );

//     const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
//     const cleaned = rawText.replace(/```json|```|\\n/g, "").trim();

//     let parsed;
//     try {
//       parsed = JSON.parse(cleaned);

//       if (!parsed.items || !parsed.summary) {
//         throw new Error("Missing 'items' or 'summary' in Gemini response.");
//       }

//       return res.status(200).json({ data: parsed });
//     } catch (err) {
//       console.error("❌ Failed to parse Gemini response:", cleaned);
//       return res.status(500).json({
//         error: "Failed to parse AI response",
//         raw: cleaned,
//       });
//     }
//   } catch (err) {
//     console.error("AI Item Volume Analysis Error:", err.response?.data || err.message);
//     return res.status(500).json({
//       error: err.response?.data || "Failed to analyze item volume consumption"
//     });
//   }
// });

// // app.post("/ai-monthly-request-trend", async (req, res) => {
// //   try {
// //     const snapshot = await db.collection("requestlog").get();
// //     const requestLogs = snapshot.docs.map(doc => doc.data());

// //     const monthCounts = {};
// //     const dailyDataMap = {}; // <-- 👈 for daily breakdown
// //     const monthNames = [
// //       "January", "February", "March", "April", "May", "June",
// //       "July", "August", "September", "October", "November", "December"
// //     ];

// //     requestLogs.forEach(log => {
// //       const date = new Date(log.dateRequired);
// //       if (!isNaN(date)) {
// //         const year = date.getFullYear();
// //         const month = monthNames[date.getMonth()];
// //         const day = date.getDate();
// //         const yearMonth = `${month} ${year}`;

// //         // Count for monthly
// //         monthCounts[yearMonth] = (monthCounts[yearMonth] || 0) + 1;

// //         // Count for daily
// //         if (!dailyDataMap[yearMonth]) dailyDataMap[yearMonth] = {};
// //         dailyDataMap[yearMonth][day] = (dailyDataMap[yearMonth][day] || 0) + 1;
// //       }
// //     });

// //     // Format data for chart
// //     const sortedMonths = Object.keys(monthCounts).sort((a, b) => {
// //       const [monthA, yearA] = a.split(" ");
// //       const [monthB, yearB] = b.split(" ");
// //       return new Date(`${monthA} 1, ${yearA}`) - new Date(`${monthB} 1, ${yearB}`);
// //     });

// //     const sortedCounts = sortedMonths.map(month => ({
// //       month,
// //       count: monthCounts[month]
// //     }));

// //     // AI Prompt
// //     const prompt = `
// // You are an AI analyst. You are given monthly request counts in this format:
// // ${JSON.stringify(sortedCounts)}

// // Write a short analysis in 3 sentences, highlighting key patterns, peaks, or dips.

// // Return ONLY this JSON:
// // {
// //   "data": [ { "month": "Month", "count": number }, ... ],
// //   "explanation": "short insight summary"
// // }
// // `;

// //     const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// //     const response = await axios.post(
// //       `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
// //       {
// //         contents: [{ role: "user", parts: [{ text: prompt }] }],
// //         generationConfig: { maxOutputTokens: 300, temperature: 0.4 }
// //       },
// //       { headers: { "Content-Type": "application/json" } }
// //     );

// //     const raw = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
// //     const cleaned = raw.replace(/```json|```/g, "").trim();
// //     const parsed = JSON.parse(cleaned);

// //     const availableYears = Array.from(
// //       new Set(requestLogs.map(log => new Date(log.dateRequired).getFullYear()))
// //     ).sort();

// //     return res.status(200).json({
// //       data: parsed.data,
// //       explanation: parsed.explanation,
// //       years: availableYears,
// //       dailyData: dailyDataMap // 👈 this is the new key required by frontend
// //     });

// //   } catch (err) {
// //     console.error("Error generating monthly trend:", err.message);
// //     res.status(500).json({ error: "Failed to get request trend data" });
// //   }
// // });

// app.post("/ai-monthly-request-trend", async (req, res) => {
//   try {
//     const snapshot = await db.collection("requestlog").get();
//     const requestLogs = snapshot.docs.map(doc => doc.data());

//     const monthCounts = {};
//     const dailyDataMap = {}; // <-- 👈 for daily breakdown
//     const monthNames = [
//       "January", "February", "March", "April", "May", "June",
//       "July", "August", "September", "October", "November", "December"
//     ];

//     requestLogs.forEach(log => {
//       const date = new Date(log.dateRequired);
//       if (!isNaN(date)) {
//         const year = date.getFullYear();
//         const month = monthNames[date.getMonth()];
//         const day = date.getDate();
//         const yearMonth = `${month} ${year}`;

//         // Count for monthly
//         monthCounts[yearMonth] = (monthCounts[yearMonth] || 0) + 1;

//         // Count for daily
//         if (!dailyDataMap[yearMonth]) dailyDataMap[yearMonth] = {};
//         dailyDataMap[yearMonth][day] = (dailyDataMap[yearMonth][day] || 0) + 1;
//       }
//     });

//     // Format data for chart
//     const sortedMonths = Object.keys(monthCounts).sort((a, b) => {
//       const [monthA, yearA] = a.split(" ");
//       const [monthB, yearB] = b.split(" ");
//       return new Date(`${monthA} 1, ${yearA}`) - new Date(`${monthB} 1, ${yearB}`);
//     });

//     const sortedCounts = sortedMonths.map(month => ({
//       month,
//       count: monthCounts[month]
//     }));

//     // AI Prompt - More explicit about JSON-only response
//     const prompt = `
// You are an AI analyst. You are given monthly request counts in this format:
// ${JSON.stringify(sortedCounts)}

// Write a short analysis in 3 sentences, highlighting key patterns, peaks, or dips.

// IMPORTANT: You must respond with ONLY valid JSON. Do not include any code, explanations, or text outside the JSON. Do not use markdown formatting.

// Return ONLY this exact JSON format:
// {
//   "data": [ { "month": "Month", "count": number }, ... ],
//   "explanation": "short insight summary"
// }
// `;

//     const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
//     let parsed;
//     let response;
    
//     try {
//       response = await axios.post(
//         `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
//         {
//           contents: [{ role: "user", parts: [{ text: prompt }] }],
//           generationConfig: { 
//             maxOutputTokens: 300, 
//             temperature: 0.4,
//             responseMimeType: "application/json"
//           }
//         },
//         { headers: { "Content-Type": "application/json" } }
//       );

//       const raw = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
//       const cleaned = raw.replace(/```json|```/g, "").trim();
      
//       // Try to parse the response
//       parsed = JSON.parse(cleaned);
      
//       // Validate the response structure
//       if (!parsed.data || !parsed.explanation) {
//         throw new Error("Invalid response structure from AI");
//       }
      
//     } catch (aiError) {
//       console.error("AI response parsing failed:", aiError.message);
//       console.log("Raw AI response:", response?.data?.candidates?.[0]?.content?.parts?.[0]?.text);
      
//       // Fallback: return the data without AI analysis
//       parsed = {
//         data: sortedCounts,
//         explanation: "AI analysis temporarily unavailable. Showing raw monthly request data."
//       };
//     }

//     const availableYears = Array.from(
//       new Set(requestLogs.map(log => new Date(log.dateRequired).getFullYear()))
//     ).sort();

//     return res.status(200).json({
//       data: parsed.data,
//       explanation: parsed.explanation,
//       years: availableYears,
//       dailyData: dailyDataMap // 👈 this is the new key required by frontend
//     });

//   } catch (err) {
//     console.error("Error generating monthly trend:", err.message);
//     res.status(500).json({ error: "Failed to get request trend data" });
//   }
// });

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ANALYTICS / AI / MONTHLY BREAKDOWN / BAR GRAPH / PIE CHART 
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// NOT USED
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

// app.post("/gemini", async (req, res) => {
//   try {
//     const prompt = req.body.prompt;
//     if (!prompt) {
//       return res.status(400).json({ error: "Prompt is required" });
//     }

//     const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

//     const response = await axios.post(
//       `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
//       {
//         contents: [
//           {
//             role: "user",
//             parts: [{ text: prompt }]
//           }
//         ],
//         generationConfig: {
//           maxOutputTokens: 256,
//           temperature: 0.7
//         }
//       },
//       {
//         headers: {
//           "Content-Type": "application/json"
//         }
//       }
//     );

//     return res.status(200).json(response.data);
//   } catch (err) {
//     console.error("Gemini API Error:", err.response?.data || err.message);
//     return res.status(500).json({
//       error: err.response?.data || "Failed to get response from Gemini"
//     });
//   }
// });

// app.post("/predict-inventory-trends", async (req, res) => {
//   try {
//     const snapshot = await db.collection("inventory").get();
//     const inventoryData = snapshot.docs.map(doc => doc.data());

//     const inputPrompt = `
// You are an AI assistant. Based on the following inventory data, provide a predictive analysis for criticalLevel stocks only. Do not suggest recommendations.

// Here is the inventory data:
// ${JSON.stringify(inventoryData, null, 2)}
// `;

//     const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

//     const response = await axios.post(
//       `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
//       {
//         contents: [
//           {
//             role: "user",
//             parts: [{ text: inputPrompt }]
//           }
//         ],
//         generationConfig: {
//           maxOutputTokens: 512,
//           temperature: 0.5
//         }
//       },
//       {
//         headers: {
//           "Content-Type": "application/json"
//         }
//       }
//     );

//     res.status(200).json(response.data);
//   } catch (err) {
//     console.error("Prediction Error:", err.response?.data || err.message);
//     res.status(500).json({
//       error: err.response?.data || "Failed to get prediction from Gemini"
//     });
//   }
// });

// app.post("/predict-inventory-trends", async (req, res) => {
//   try {
//     const snapshot = await db.collection("requestlog").get();
//     const inventoryData = snapshot.docs.map(doc => doc.data());

//     const inputPrompt = `
// You are an AI assistant. Analyze the following requestlog data from a university inventory system.

// Your tasks:
// - Identify and list the **most requested items**.
// - Identify **frequent requestors** (faculty or departments).
// - Identify **frequently requested subjects** or categories.
// - Give Insight regarding the trend in requisition

// Formatting Instructions:

// - Keep language human-readable and concise (avoid technical terms).
// - Return only the bullet points. No introductions, summaries, or closing statements.
// - Short Paragraph only on the Insights

// Here is the request log data:
// ${JSON.stringify(inventoryData)}
// `;

//     const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

//     const response = await axios.post(
//       `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
//       {
//         contents: [
//           {
//             role: "user",
//             parts: [{ text: inputPrompt }]
//           }
//         ],
//         generationConfig: {
//           maxOutputTokens: 500,
//           temperature: 0.5
//         }
//       },
//       {
//         headers: {
//           "Content-Type": "application/json"
//         }
//       }
//     );

//     // Extract and sanitize response text
//     // const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
//     // const cleaned = rawText.replace(/```[\s\S]*?```/g, '').trim();

//     // res.status(200).json({ analysis: cleaned });

//     const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

// // Deep clean markdown, backticks, and ensure consistent format
// // const cleaned = rawText
// //   .replace(/```[\s\S]*?```/g, '') // Remove code blocks
// //   .replace(/`+/g, '')             // Remove stray backticks
// //   .replace(/^\s*[\-\•]\s*/gm, '- ') // Normalize bullet points
// //   .trim();

// res.status(200).json({ analysis: rawText});


//   } catch (err) {
//     console.error("Prediction Error:", err.response?.data || err.message);
//     res.status(500).json({
//       error: err.response?.data || "Failed to get prediction from Gemini"
//     });
//   }
// });

// app.post("/ai-most-requested-items-bar", async (req, res) => {
//   try {
//     const snapshot = await db.collection("requestlog").get();
//     const requestLogs = snapshot.docs.map(doc => doc.data());

//     // Extract all item names from nested requestList arrays
//     const itemNames = requestLogs.flatMap(entry => {
//       const list = entry.requestList || [];
//       return list.map(i => i.itemName || "Unnamed");
//     });

//     const inputPrompt = `
// You are an AI assistant. Analyze the following inventory item request names.

// Your task:
// - Count how many times each unique itemName appears.
// - Return the result as a clean JSON object where keys are item names and values are their counts.

// Strict JSON format only:
// {
//   "Item A": number,
//   "Item B": number,
//   ...
// }

// Here is the list of item names:
// ${JSON.stringify(itemNames)}
// `;

//     const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

//     const response = await axios.post(
//       `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
//       {
//         contents: [
//           {
//             role: "user",
//             parts: [{ text: inputPrompt }]
//           }
//         ],
//         generationConfig: {
//           maxOutputTokens: 300,
//           temperature: 0.3
//         }
//       },
//       {
//         headers: {
//           "Content-Type": "application/json"
//         }
//       }
//     );

//     const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
//     const cleaned = rawText.replace(/```json|```/g, "").trim();

//     let result = {};
//     try {
//       result = JSON.parse(cleaned);
//     } catch (err) {
//       console.error("❌ Failed to parse Gemini item frequency JSON:", cleaned);
//       return res.status(500).json({ error: "Failed to parse AI result" });
//     }

//     return res.status(200).json({ data: result });
//   } catch (err) {
//     console.error("AI Item Frequency Error:", err.response?.data || err.message);
//     return res.status(500).json({
//       error: err.response?.data || "Failed to analyze most requested items"
//     });
//   }
// });

// app.post("/ai-most-requested-items-bar", async (req, res) => {
//   try {
//     const snapshot = await db.collection("requestlog").get();
//     const requestLogs = snapshot.docs.map(doc => doc.data());

//     // Extract all item names from nested requestList arrays
//     const itemNames = requestLogs.flatMap(entry => {
//       const list = entry.requestList || [];
//       return list.map(i => i.itemName || "Unnamed");
//     });

// //     const inputPrompt = `
// // You are an AI assistant. Analyze the following inventory item request names.

// // Tasks:
// // 1. Count how many times each unique itemName appears.
// // 2. Provide a short summary of which items are most frequently requested and any noticeable pattern.

// // Return ONLY this strict JSON:
// // {
// //   "items": {
// //     "Item A": number,
// //     "Item B": number
// //   },
// //   "explanation": "short paragraph"
// // }

// // DO NOT include markdown, code blocks, or comments.

// // Here is the list of item names:
// // ${JSON.stringify(itemNames)}
// // `;

// const inputPrompt = `
// You are an advanced AI data analyst for a university laboratory inventory system.

// You are given a list of item names requested by different departments. Your tasks:

// 1. Count the number of times each unique itemName appears.
// 2. Identify patterns: Are there naming conventions, categories, or functions shared among the most requested items?
// 3. Explain *why* these items might be requested more frequently. Think about seasonality, course cycles, experiment usage, or critical operations.
// 4. Predict whether these items are likely to remain in high demand and explain why.

// Return ONLY the following strict JSON format:
// {
//   "items": {
//     "Item A": number,
//     "Item B": number
//   },
//   "explanation": "Insightful short paragraph including observed trends, usage reasons, and demand forecasts."
// }

// DO NOT include markdown, code blocks, or comments.
// Use only valid JSON.
// Here is the list of item names:
// ${JSON.stringify(itemNames)}
// `;

//     const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

//     const response = await axios.post(
//       `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
//       {
//         contents: [
//           {
//             role: "user",
//             parts: [{ text: inputPrompt }]
//           }
//         ],
//         generationConfig: {
//           maxOutputTokens: 500,
//           temperature: 0.3
//         }
//       },
//       {
//         headers: {
//           "Content-Type": "application/json"
//         }
//       }
//     );

//     const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
//     const cleaned = rawText.replace(/```json|```/g, "").trim();

//     // Fallback parser that deduplicates and extracts explanation
//     function safeParseAIResponse(raw) {
//       const itemBlock = raw.match(/"items"\s*:\s*\{([\s\S]*?)\}/);
//       const explanationBlock = raw.match(/"explanation"\s*:\s*"([^"]*)/);

//       if (!itemBlock || !explanationBlock) {
//         throw new Error("Could not locate valid 'items' or 'explanation' fields");
//       }

//       const itemLines = itemBlock[1].split(/,\n|,\r?\n/);
//       const itemMap = {};

//       itemLines.forEach(line => {
//         const [rawKey, rawValue] = line.split(":");
//         if (!rawKey || !rawValue) return;

//         const key = rawKey.trim().replace(/^"|"$/g, "");
//         const value = parseInt(rawValue.trim().replace(/,?$/, ""), 10);
//         if (!isNaN(value)) {
//           itemMap[key] = (itemMap[key] || 0) + value; // deduplicate safely
//         }
//       });

//       const explanation = explanationBlock[1].replace(/\s+/g, " ").trim();

//       return {
//         items: itemMap,
//         explanation
//       };
//     }

//     let parsed;
//     try {
//       parsed = safeParseAIResponse(cleaned);
//     } catch (err) {
//       console.error("❌ Failed to parse Gemini response as expected JSON:", cleaned);
//       return res.status(500).json({
//         error: "Failed to parse AI response",
//         raw: cleaned,
//       });
//     }

//     return res.status(200).json({ data: parsed });

//   } catch (err) {
//     console.error("AI Item Frequency Error:", err.response?.data || err.message);
//     return res.status(500).json({
//       error: err.response?.data || "Failed to analyze most requested items"
//     });
//   }
// });

// app.post("/ai-most-requested-items-bar", async (req, res) => {
//   try {
//     const snapshot = await db.collection("requestlog").get();
//     const requestLogs = snapshot.docs.map(doc => doc.data());

//     // Extract all item names from nested requestList arrays
//     const itemNames = requestLogs.flatMap(entry => {
//       const list = entry.requestList || [];
//       return list.map(i => i.itemName || "Unnamed");
//     });

//     const inputPrompt = `
// You are an advanced AI data analyst for a university laboratory inventory system.

// You are given a list of item names requested by different departments. Your tasks:

// 1. Count how many times each unique itemName appears.
// 2. Identify patterns: Are there naming conventions, categories, or functions shared among the most requested items?
// 3. Explain *why* these items might be requested more frequently. Consider factors like academic semester cycles, laboratory schedules, student workloads, and equipment usage.
// 4. Predict whether these items are likely to remain in high demand and justify your reasoning.

// Return ONLY this strict JSON format:
// {
//   "items": {
//     "Item A": number,
//     "Item B": number
//   },
//   "explanation": "Insightful short paragraph with trends, usage context, and future demand expectations."
// }

// Do NOT include markdown, code blocks, or comments.
// Use only valid JSON.
// Here is the list of item names:
// ${JSON.stringify(itemNames)}
// `;

//     const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

//     const response = await axios.post(
//       `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
//       {
//         contents: [
//           {
//             role: "user",
//             parts: [{ text: inputPrompt }]
//           }
//         ],
//         generationConfig: {
//           maxOutputTokens: 600,
//           temperature: 0.4
//         }
//       },
//       {
//         headers: {
//           "Content-Type": "application/json"
//         }
//       }
//     );

//     const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
//     const cleaned = rawText.replace(/```json|```|\\n/g, "").trim();

//     // Fallback-safe parser
//     function safeParseAIResponse(raw) {
//       const itemBlock = raw.match(/"items"\s*:\s*\{([\s\S]*?)\}/);
//       const explanationBlock = raw.match(/"explanation"\s*:\s*"([\s\S]*?)"[\s\}]*$/);

//       if (!itemBlock || !explanationBlock) {
//         throw new Error("Could not locate valid 'items' or 'explanation' fields");
//       }

//       const itemLines = itemBlock[1].split(/,\s*/);
//       const itemMap = {};

//       itemLines.forEach(line => {
//         const [rawKey, rawValue] = line.split(":");
//         if (!rawKey || !rawValue) return;

//         const key = rawKey.trim().replace(/^"|"$/g, "");
//         const value = parseInt(rawValue.trim(), 10);
//         if (!isNaN(value)) {
//           itemMap[key] = (itemMap[key] || 0) + value;
//         }
//       });

//       const explanation = explanationBlock[1].replace(/\s+/g, " ").trim();

//       return {
//         items: itemMap,
//         explanation
//       };
//     }

//     let parsed;
//     try {
//       parsed = safeParseAIResponse(cleaned);
//     } catch (err) {
//       console.error("❌ Failed to parse Gemini response as expected JSON:", cleaned);
//       return res.status(500).json({
//         error: "Failed to parse AI response",
//         raw: cleaned,
//       });
//     }

//     return res.status(200).json({ data: parsed });

//   } catch (err) {
//     console.error("AI Item Frequency Error:", err.response?.data || err.message);
//     return res.status(500).json({
//       error: err.response?.data || "Failed to analyze most requested items"
//     });
//   }
// });


// app.post("/monthly-breakdown", async (req, res) => {
//   try {
//     const snapshot = await db.collection("requestlog").get();
//     const inventoryData = snapshot.docs.map(doc => doc.data());

//     const inputPrompt = `
// You are an AI assistant. Analyze the following requestlog data from a university inventory system.

// Your tasks:
// - Provide a **monthly breakdown** of request volume and notable trends (e.g., spikes or drops).
// - Include any other useful patterns or operational insights.

// Formatting Instructions:
// - Highlight important details, Format it clean.
// - Organize the analysis clearly by **month**  (e.g., "January 2025", "February 2025", etc.)
// - Make the Month name and Year Bold Text
// - Keep language human-readable and concise (avoid technical terms).
// - DO NOT include code blocks,introductory/concluding text, markdown syntax, or explanation text.
// - Short Paragraphs only, Justify the texts and Provide space ever after month 




// Here is the request log data:
// ${JSON.stringify(inventoryData)}
// `;

//     const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

//     const response = await axios.post(
//       `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
//       {
//         contents: [
//           {
//             role: "user",
//             parts: [{ text: inputPrompt }]
//           }
//         ],
//         generationConfig: {
//           maxOutputTokens: 300,
//           temperature: 0.5
//         }
//       },
//       {
//         headers: {
//           "Content-Type": "application/json"
//         }
//       }
//     );

//     // Extract and sanitize response text
//     // const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
//     // const cleaned = rawText.replace(/```[\s\S]*?```/g, '').trim();

//     // res.status(200).json({ analysis: cleaned });

//     const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

//   // Deep clean markdown, backticks, and ensure consistent format
//   const cleaned = rawText
//     .replace(/```[\s\S]*?```/g, '') // Remove code blocks
//     .replace(/`+/g, '')             // Remove stray backticks
//     .replace(/^\s*[\-\•]\s*/gm, '- ') // Normalize bullet points
//     .trim();

//   res.status(200).json({ analysis: cleaned });


//     } catch (err) {
//       console.error("Prediction Error:", err.response?.data || err.message);
//       res.status(500).json({
//         error: err.response?.data || "Failed to get prediction from Gemini"
//       });
//     }
// });

// app.listen(5000, () => console.log("Server is running on http://localhost:5000"));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// FCM NOTIFICATION FUNCTIONS APPROVE, REJECT AND SUBMIT 
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Helper function to get FCM token for a user
async function getUserFCMToken(userId) {
  try {
    const tokenDoc = await db.collection('pushTokens').doc(userId).get();
    if (tokenDoc.exists) {
      const tokenData = tokenDoc.data();
      // Return FCM token or Expo token as fallback
      return tokenData.fcmToken || tokenData.expoPushToken || null;
    }
    return null;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

// Helper function to send notification to a specific user
async function sendNotificationToUser(userId, title, body, data = {}) {
  try {
    const messaging = app.locals.messaging;
    if (!messaging) {
      throw new Error('FCM messaging not initialized');
    }

    const token = await getUserFCMToken(userId);
    if (!token) {
      console.log(`No FCM token found for user ${userId}`);
      return false;
    }

    const message = {
      token: token,
      notification: {
        title: title,
        body: body,
      },
      data: {
        ...Object.fromEntries(
          Object.entries(data).map(([key, value]) => [key, String(value)])
        ),
        timestamp: new Date().toISOString(),
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await messaging.send(message);
    console.log('Successfully sent message:', response);
    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
}

// Helper function to send notification to multiple users
async function sendNotificationToUsers(userIds, title, body, data = {}) {
  const results = [];
  for (const userId of userIds) {
    const result = await sendNotificationToUser(userId, title, body, data);
    results.push({ userId, success: result });
  }
  return results;
}

// API endpoint to send notification to a specific user
app.post('/api/send-notification', async (req, res) => {
  try {
    const { userId, title, body, data } = req.body;

    if (!userId || !title || !body) {
      return res.status(400).json({
        error: 'Missing required fields: userId, title, body'
      });
    }

    const success = await sendNotificationToUser(userId, title, body, data);
    
    res.status(200).json({
      success: success,
      message: success ? 'Notification sent successfully' : 'Failed to send notification'
    });
  } catch (error) {
    console.error('Error in send-notification endpoint:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// API endpoint to send notification to multiple users
app.post('/api/send-notification-bulk', async (req, res) => {
  try {
    const { userIds, title, body, data } = req.body;

    if (!userIds || !Array.isArray(userIds) || !title || !body) {
      return res.status(400).json({
        error: 'Missing required fields: userIds (array), title, body'
      });
    }

    const results = await sendNotificationToUsers(userIds, title, body, data);
    
    res.status(200).json({
      results: results,
      message: 'Bulk notification processing completed'
    });
  } catch (error) {
    console.error('Error in send-notification-bulk endpoint:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// API endpoint to get user's FCM token status
app.get('/api/fcm-token/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const token = await getUserFCMToken(userId);
    
    res.status(200).json({
      hasToken: !!token,
      token: token ? '***' + token.slice(-4) : null // Only show last 4 characters for security
    });
  } catch (error) {
    console.error('Error getting FCM token status:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// API endpoint to send notification to a specific user
app.post('/api/notify-user', async (req, res) => {
  try {
    const { userId, title, body, data } = req.body;

    if (!userId || !title || !body) {
      return res.status(400).json({
        error: 'Missing required fields: userId, title, body'
      });
    }

    console.log(`🔔 Sending notification to user ${userId}: ${title}`);

    const success = await sendNotificationToUser(userId, title, body, data);
    
    res.status(200).json({
      success: success,
      message: success ? 'Notification sent successfully' : 'Failed to send notification'
    });
  } catch (error) {
    console.error('Error in notify-user endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// API endpoint to send notification to all admins when user submits request
app.post('/api/notify-admins-request', async (req, res) => {
  try {
    const { userName, userId, requestData } = req.body;

    if (!userName || !userId) {
      return res.status(400).json({
        error: 'Missing required fields: userName, userId'
      });
    }

    console.log('🔔 Sending notifications to admins for request from:', userName);

    // Get all admin and super-user accounts
    const adminAccountsSnapshot = await db.collection('accounts')
      .where('role', 'in', ['admin', 'admin1', 'admin2', 'super-user'])
      .get();

    const adminIds = [];
    const notificationResults = [];

    // Collect admin IDs
    adminAccountsSnapshot.forEach((doc) => {
      adminIds.push(doc.id);
    });

    console.log(`🔔 Found ${adminIds.length} admins to notify`);

    // Send notification to each admin
    for (const adminId of adminIds) {
      try {
        // Determine notification title and body based on request type
        const requestType = requestData?.type || 'request_submitted';
        const isReorder = requestType === 'reorder_submitted';
        
        const title = isReorder ? 'New Reorder Request' : 'New Request Submitted';
        const body = isReorder 
          ? `${userName} has submitted a reorder request`
          : `${userName} has submitted a new requisition request`;

        const success = await sendNotificationToUser(
          adminId,
          title,
          body,
          {
            type: requestType,
            fromUserId: userId,
            fromUserName: userName,
            screen: 'PendingRequestScreen',
            requestId: userId
          }
        );

        notificationResults.push({
          adminId: adminId,
          success: success
        });

        if (success) {
          console.log(`✅ Push notification sent to admin: ${adminId}`);
        } else {
          console.log(`⚠️ Failed to send push notification to admin: ${adminId}`);
        }
      } catch (error) {
        console.error(`❌ Error sending notification to admin ${adminId}:`, error);
        notificationResults.push({
          adminId: adminId,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = notificationResults.filter(r => r.success).length;
    
    res.status(200).json({
      success: true,
      message: `Notifications sent to ${successCount}/${adminIds.length} admins`,
      results: notificationResults,
      totalAdmins: adminIds.length,
      successfulNotifications: successCount
    });

  } catch (error) {
    console.error('Error in notify-admins-request endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// FCM NOTIFICATION FUNCTIONS TODAY REQUEST
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Scheduled notification system for today's requests
const scheduleTodayRequestNotifications = async () => {
  try {
    console.log('🔔 Starting scheduled check for today\'s requests...');
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    console.log('📅 Checking for requests scheduled for:', todayStr);
    
    // Get all user accounts to check their historylog
    const accountsSnapshot = await db.collection('accounts').get();
    console.log(`👥 Found ${accountsSnapshot.docs.length} user accounts to check`);
    
    const userRequests = {};
    
    // Check each user's historylog for approved requests
    for (const accountDoc of accountsSnapshot.docs) {
      const userId = accountDoc.id;
      const accountData = accountDoc.data();
      
      try {
        // Query user's approved requests from historylog collection
        const historyLogRef = db.collection(`accounts/${userId}/historylog`);
        const q = historyLogRef.where('action', '==', 'Request Approved');
        const querySnapshot = await q.get();
        
        let todayCount = 0;
        
        // Check approved requests from historylog for required date
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          
          // Check if the required date is today
          if (data.dateRequired === todayStr) {
            todayCount++;
          }
        });
        
        // If user has requests for today, add to notification list
        if (todayCount > 0) {
          userRequests[userId] = {
            userId: userId,
            userName: accountData.name || 'User',
            requestCount: todayCount,
            requests: []
          };
        }
        
      } catch (error) {
        console.error(`❌ Error checking historylog for user ${userId}:`, error);
      }
    }
    
    console.log(`👥 Found ${Object.keys(userRequests).length} users with requests for today`);
    
    // Send notifications to each user
    for (const [userId, userData] of Object.entries(userRequests)) {
      try {
        const success = await sendNotificationToUser(
          userId,
          'Request Reminder',
          `You have ${userData.requestCount} approved request${userData.requestCount !== 1 ? 's' : ''} scheduled for today`,
          {
            type: 'today_request_reminder',
            requestCount: userData.requestCount,
            dateRequired: todayStr,
            userName: userData.userName,
            screen: 'OrdersScreen'
          }
        );
        
        if (success) {
          console.log(`✅ Today request notification sent to user: ${userData.userName} (${userId})`);
        } else {
          console.log(`⚠️ Failed to send notification to user: ${userData.userName} (${userId})`);
        }
      } catch (error) {
        console.error(`❌ Error sending notification to user ${userData.userName} (${userId}):`, error);
      }
    }
    
    console.log('✅ Scheduled today request notifications completed');
    
  } catch (error) {
    console.error('❌ Error in scheduled today request notifications:', error);
  }
};

// Schedule the notification check to run daily at 8:00 AM
const scheduleDailyNotifications = () => {
  // For now, we'll run it immediately for testing
  // In production, you'd want to use a proper cron job or scheduled function
  console.log('⏰ Setting up daily notification schedule...');
  
  // Run immediately for testing
  scheduleTodayRequestNotifications();
  
  // Schedule to run every day at 8:00 AM
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(8, 0, 0, 0);
  
  const timeUntilTomorrow = tomorrow.getTime() - now.getTime();
  
  setTimeout(() => {
    scheduleTodayRequestNotifications();
    
    // Then run every 24 hours
    setInterval(scheduleTodayRequestNotifications, 24 * 60 * 60 * 1000);
  }, timeUntilTomorrow);
  
  console.log('⏰ Daily notifications scheduled to run at 8:00 AM');
};

// API endpoint to manually trigger today request notifications (for testing)
app.post('/api/trigger-today-notifications', async (req, res) => {
  try {
    console.log('🔔 Manual trigger of today request notifications...');
    
    await scheduleTodayRequestNotifications();
    
    res.status(200).json({
      success: true,
      message: 'Today request notifications triggered successfully'
    });
  } catch (error) {
    console.error('Error triggering today notifications:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// FCM NOTIFICATION FUNCTIONS RETURN REMINDERS
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

// API endpoint to manually trigger return reminder notifications (for testing)
app.post('/api/trigger-return-reminders', async (req, res) => {
  try {
    console.log('🔔 Manual trigger of return reminder notifications...');
    
    await scheduleReturnReminderNotifications();
    
    res.status(200).json({
      success: true,
      message: 'Return reminder notifications triggered successfully'
    });
  } catch (error) {
    console.error('Error triggering return reminders:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Scheduled notification system for return reminders
const scheduleReturnReminderNotifications = async () => {
  try {
    console.log('🔔 Starting scheduled check for return reminders...');
    
    // Get current time
    const now = new Date();
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM format
    const todayStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    console.log('📅 Checking for items to return on:', todayStr, 'at time:', currentTime);
    
    // Get all deployed items from borrowcatalog for today
    const borrowCatalogSnapshot = await db.collection('borrowcatalog')
      .where('dateRequired', '==', todayStr)
      .where('status', '==', 'Deployed')
      .get();
    
    console.log(`📊 Found ${borrowCatalogSnapshot.docs.length} deployed items for today`);
    
    // Group items by user that need to be returned
    const userReturnReminders = {};
    
    borrowCatalogSnapshot.forEach((doc) => {
      const data = doc.data();
      const userId = data.accountId;
      const timeTo = data.timeTo;
      
      // Check if the return time has passed
      if (timeTo && timeTo <= currentTime) {
        if (userId && !userReturnReminders[userId]) {
          userReturnReminders[userId] = {
            userId: userId,
            userName: data.userName || 'User',
            itemCount: 0,
            items: []
          };
        }
        
        if (userId) {
          userReturnReminders[userId].itemCount++;
          userReturnReminders[userId].items.push({
            room: data.room || 'N/A',
            timeFrom: data.timeFrom || 'N/A',
            timeTo: data.timeTo || 'N/A',
            program: data.program || 'N/A',
            requestList: data.requestList || []
          });
        }
      }
    });
    
    console.log(`👥 Found ${Object.keys(userReturnReminders).length} users with items to return`);
    
    // Send return reminder notifications to each user
    for (const [userId, userData] of Object.entries(userReturnReminders)) {
      try {
        const success = await sendNotificationToUser(
          userId,
          'Return Reminder',
          `It's time to return your borrowed items. You have ${userData.itemCount} item${userData.itemCount !== 1 ? 's' : ''} due for return.`,
          {
            type: 'return_reminder',
            itemCount: userData.itemCount,
            dateRequired: todayStr,
            userName: userData.userName,
            screen: 'ReturnItems',
            timeTo: userData.items[0]?.timeTo || 'N/A'
          }
        );
        
        if (success) {
          console.log(`✅ Return reminder sent to user: ${userData.userName} (${userId})`);
        } else {
          console.log(`⚠️ Failed to send return reminder to user: ${userData.userName} (${userId})`);
        }
      } catch (error) {
        console.error(`❌ Error sending return reminder to user ${userData.userName} (${userId}):`, error);
      }
    }
    
    console.log('✅ Scheduled return reminder notifications completed');
    
  } catch (error) {
    console.error('❌ Error in scheduled return reminder notifications:', error);
  }
};

// Schedule return reminders to run every 30 minutes
// const scheduleReturnReminders = () => {
//   console.log('⏰ Setting up return reminder schedule...');
  
//   // Run immediately for testing
//   scheduleReturnReminderNotifications();
  
//   // Schedule to run every 30 minutes
//   setInterval(scheduleReturnReminderNotifications, 30 * 60 * 1000);
  
//   console.log('⏰ Return reminders scheduled to run every 30 minutes');
// };

// Schedule return reminders to run every 24 hours
const scheduleReturnReminders = () => {
  console.log('⏰ Setting up return reminder schedule...');
  
  // Run immediately for testing
  scheduleReturnReminderNotifications();
  
  // Schedule to run every 24 hours
  setInterval(scheduleReturnReminderNotifications, 24 * 60 * 60 * 1000);
  
  console.log('⏰ Return reminders scheduled to run every 24 hours');
};

// Start the scheduled notifications
scheduleDailyNotifications();
scheduleReturnReminders();

// Export functions for use in other parts of the application
module.exports = {
  sendNotificationToUser,
  sendNotificationToUsers,
  getUserFCMToken,
  scheduleTodayRequestNotifications,
  scheduleReturnReminderNotifications
};

