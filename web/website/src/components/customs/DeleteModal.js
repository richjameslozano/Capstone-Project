import React from 'react'; 
import { Modal, message } from 'antd'; 
import { deleteDoc, doc, collection, getDocs, query, where, setDoc } from 'firebase/firestore'; 
import { db } from '../../backend/firebase/FirebaseConfig';

const DeleteModal = ({ visible, onClose, item, onDeleteSuccess, setDataSource }) => {

  const handleDelete = async () => {
    if (!item) return;

    try {
      const snapshot = await getDocs(collection(db, 'inventory'));

      for (const docItem of snapshot.docs) {
        const data = docItem.data();

        if (data.itemId === item.itemId) {
          const inventoryId = docItem.id;

          // Step 1: Archive the item before deleting
          await setDoc(doc(db, "archiveItems", inventoryId), {
            ...data,
            archivedAt: new Date(),
          });

          // Step 1.5: Delete subcollection (stockLog) if it exists
          const stockLogRef = collection(db, 'inventory', inventoryId, 'stockLog');
          const stockLogSnapshot = await getDocs(stockLogRef);

          const stockLogDeletions = stockLogSnapshot.docs.map((doc) =>
            deleteDoc(doc.ref)
          );
          
          await Promise.all(stockLogDeletions);

          // Step 2: Delete from inventory
          await deleteDoc(doc(db, 'inventory', inventoryId));

          // Step 3: Delete from labRoom if labRoom and itemId exist
          // if (data.labRoom && data.itemId) {
          //   const labRoomRef = doc(db, "labRoom", data.labRoom, "items", data.itemId);
          //   await deleteDoc(labRoomRef);
          //   console.log(`✅ Removed from labRoom/${data.labRoom}/items/${data.itemId}`);
          // }

          if (data.labRoom && data.itemId) {
            const labRoomQuery = query(collection(db, "labRoom"), where("roomNumber", "==", data.labRoom));
            const labRoomSnapshot = await getDocs(labRoomQuery);

            if (!labRoomSnapshot.empty) {
              const labRoomDoc = labRoomSnapshot.docs[0];
              const labRoomRef = labRoomDoc.ref;

              const labRoomItemRef = doc(collection(labRoomRef, "items"), data.itemId);
              await deleteDoc(labRoomItemRef);

              console.log(`✅ Removed from labRoom/${labRoomRef.id}/items/${data.itemId}`);
            }
          }
        }
      }

      // Step 4: Delete matching userRequests in each user's subcollection
      const usersSnapshot = await getDocs(collection(db, 'accounts'));

      for (const userDoc of usersSnapshot.docs) {
        const userRequestsRef = collection(db, 'accounts', userDoc.id, 'userRequests');
        const userRequestsSnapshot = await getDocs(userRequestsRef);

        for (const requestDoc of userRequestsSnapshot.docs) {
          const requestData = requestDoc.data();
          const filteredData = requestData?.filteredMergedData;

          if (!Array.isArray(filteredData)) continue;

          const hasMatchingItem = filteredData.some(entry => entry.itemName === item.itemName);

          if (hasMatchingItem) {
            await deleteDoc(doc(userRequestsRef, requestDoc.id));

            // Step 5: Delete from root 'userrequests'
            const rootQuery = query(
              collection(db, 'userrequests'),
              where('accountId', '==', userDoc.id),
              where('timestamp', '==', requestData.timestamp)
            );

            const rootSnap = await getDocs(rootQuery);

            const batchDeletes = rootSnap.docs.map(docSnap =>
              deleteDoc(doc(db, 'userrequests', docSnap.id))
            );
            await Promise.all(batchDeletes);
          }
        }
      }

      // Step 6: Update UI
      setDataSource(prevData =>
        prevData.filter(row => row.itemName !== item.itemName)
      );

      message.success('Item archived successfully');
      onDeleteSuccess(item.itemId);
      onClose();

    } catch (error) {
      console.error('Error archiving item:', error);
      message.error('Failed to archive item');
    }
  };

  return (
    <Modal
      title="Confirm Archive"
      visible={visible}
      onOk={handleDelete}
      onCancel={onClose}
      okText="Archive"
      okType="danger"
      cancelText="Cancel"
      zIndex={1021}
    >
      <p>Are you sure you want to archive <strong>{item?.name}</strong>?</p>
    </Modal>
  );
};

export default DeleteModal;
