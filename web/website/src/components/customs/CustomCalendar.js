// import React, { useEffect, useState } from "react";
// import { Calendar, Badge, Modal, List, Descriptions, Select } from "antd";
// import { collection, getDoc, doc, query, onSnapshot, orderBy } from "firebase/firestore";
// import { db } from "../../backend/firebase/FirebaseConfig";
// import "../styles/customsStyle/CalendarModal.css";

// const { Option } = Select;

// const CustomCalendar = ({ onSelectDate }) => {
//   const [approvedRequests, setApprovedRequests] = useState([]);
//   const [selectedDateRequests, setSelectedDateRequests] = useState([]);
//   const [isModalVisible, setIsModalVisible] = useState(false);
//   const [filterStatus, setFilterStatus] = useState("all");
//   const [filterProgram, setFilterProgram] = useState("all");
//   const [userRequests, setUserRequests] = useState([]);

//   useEffect(() => {
//     const unsubscribe = onSnapshot(
//       collection(db, "borrowcatalog"),
//       (querySnapshot) => {
//         const groupedRequests = {};

//         querySnapshot.forEach((doc) => {
//           const data = doc.data();
//           const key = `${data.userName}-${data.dateRequired}`;

//           if (!groupedRequests[key]) {
//             groupedRequests[key] = {
//               date: data.dateRequired,
//               userName: data.userName || "N/A",
//               room: data.room || "N/A",
//               status: data.status || "N/A",
//               approvedBy: data.approvedBy || "N/A",
//               program: data.program || "N/A",
//               requestList: [], // holds all items requested by this user on this date
//             };
//           }

//           if (Array.isArray(data.requestList)) {
//             groupedRequests[key].requestList.push(...data.requestList);
//           }
//         });

//         setApprovedRequests(Object.values(groupedRequests));
//       },
//       (error) => {
//       }
//     );

//     return () => unsubscribe();
//   }, []);

// //   useEffect(() => {
// //   const unsubscribe = onSnapshot(
// //     collection(db, "userrequest"),
// //     (querySnapshot) => {
// //       const requests = [];
// //       querySnapshot.forEach((doc) => {
// //         requests.push({ id: doc.id, ...doc.data() });
// //       });
// //       setUserRequests(requests);
// //     },
// //     (error) => {
// //       console.error("Error fetching userrequest:", error);
// //     }
// //   );

// //   return () => unsubscribe();
// // }, []);




//   const filteredApprovedRequests = approvedRequests.filter((item) => {
//     const statusMatches =
//       filterStatus === "all" || item.status.toLowerCase() === filterStatus;

//     const programMatches =
//       filterProgram === "all" ||
//       item.program?.toLowerCase().trim() === filterProgram.toLowerCase().trim();

//     return statusMatches && programMatches;
//   });





//   const getListData = (value) => {
//   const dateStr = value.format("YYYY-MM-DD");
//   return filteredApprovedRequests
//     .filter(
//       (item) =>
//         item.date === dateStr &&
//         item.status?.toLowerCase().trim() !== "deployed" &&
//         item.status?.toLowerCase().trim() !== "return approved" &&
//         item.status?.toLowerCase().trim() !== "returned" && 
//         item.status?.toLowerCase().trim() !== "unclaimed"
//     )
//     .map((item) => {
//       const status = item.status?.toLowerCase().trim();
//       let type = "default";

//       if (status === "borrowed") type = "warning";
//       else if (status === "returned") type = "error"; 

//       return {
//         type,
//         content: `${item.userName}`,
//       };
//     });
// };


//   // const dateCellRender = (value) => {
//   //   const listData = getListData(value);
//   //   return (
//   //     <ul className="events">
//   //       {listData.map((item, index) => (
//   //         <li key={index}>
//   //           <Badge status={item.type} text={item.content} />
//   //         </li>
//   //       ))}
//   //     </ul>
//   //   );
//   // };

//   const dateCellRender = (value) => {
//   const dateStr = value.format("YYYY-MM-DD");

//   // approvedRequests (same as before)
//   const approvedList = approvedRequests.filter(
//     (item) => item.date === dateStr
//   );

//   // userRequests (check dateRequired instead of date)
//   const userList = userRequests.filter(
//     (item) => item.dateRequired === dateStr
//   );

//   // Merge them, but add a tag to know which source
//   const listData = [
//     ...approvedList.map((item) => ({ ...item, source: "approved" })),
//     ...userList.map((item) => ({ ...item, source: "user" })),
//   ];

//   return (
//     <ul className="events">
//       {listData.map((item, index) => (
//         <li key={index}>
//           <Badge
//             status={item.source === "user" ? "processing" : "success"} 
//             text={item.userName || "Request"}

//           />
//         </li>
//       ))}
//     </ul>
//   );
// };


// const formatStatus = (status) => {
//   if (!status) return "N/A";
//   switch (status.toLowerCase()) {
//     case "borrowed":
//       return "For Deployment";
//     default:
//       return status.charAt(0).toUpperCase() + status.slice(1);
//   }
// };



// const handleDateSelect = (date) => {
//   const dateStr = date.format("YYYY-MM-DD");

//   // Filter approved requests
//   const matchedApproved = filteredApprovedRequests.filter((item) => {
//     const status = item.status?.toLowerCase().trim();
//     return (
//       item.date === dateStr &&
//       status !== "deployed" &&
//       status !== "return approved" &&
//       status !== "unclaimed" &&
//       status !== "returned"
//     );
//   });

//   // Filter user requests
// // Match from userRequests (second collection)
// const matchedUserRequests = userRequests
//   .filter(item => {
//     console.log("dateRequired value:", item.dateRequired, "type:", typeof item.dateRequired);

//     let requiredDate;

//     // If Firestore Timestamp
//     if (item.dateRequired?.toDate) {
//       requiredDate = item.dateRequired.toDate().toISOString().split("T")[0];
//     }
//     // If already a string
//     else if (typeof item.dateRequired === "string") {
//       requiredDate = item.dateRequired;
//     }
//     // If JS Date object
//     else if (item.dateRequired instanceof Date) {
//       requiredDate = item.dateRequired.toISOString().split("T")[0];
//     }

//     return requiredDate === dateStr;
//   })
//   .map(item => ({ ...item, source: "user" }));

//   // Merge both
//   const matchedRequests = [
//     ...matchedApproved,
//     ...matchedUserRequests
//   ];

//   setSelectedDateRequests(matchedRequests);
//   setIsModalVisible(true);
//   onSelectDate(date);
// };



//   return (
//     <div style={{borderRadius: '10px', overflow: 'hidden', border: '1px solid #dfdfdf', padding: 25,  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',backgroundColor: '#e9f5f9'}}>
//       <div   className="calendar-filters">
//         <div>
//           <span style={{ marginRight: 8, fontWeight: "bold" }}>Filter by status:</span>
//           <Select
//             value={filterStatus}
//             onChange={setFilterStatus}
//             style={{ width: 160 }}
//           >
//             <Option value="all">All</Option>
//             {/* <Option value="return approved">Return Approved</Option> */}
//             <Option value="borrowed">For Deployment</Option>
//             {/* <Option value="deployed">Deployed</Option>
//             <Option value="returned">Returned</Option> */}
//           </Select>
//         </div>

//         {/* <div>
//           <span style={{ marginRight: 8, fontWeight: "bold" }}>Filter by program:</span>
//           <Select
//             value={filterProgram}
//             onChange={setFilterProgram}
//             style={{ width: 200 }}
//           >
//             <Option value="all">All</Option>
//             <Option value="SAM - BSMT">SAM - BSMT</Option>
//             <Option value="SAH - BSN">SAH - BSN</Option>
//             <Option value="SHS">SHS</Option>
//           </Select>
//         </div> */}
//       </div>

//       <Calendar dateCellRender={dateCellRender} onSelect={handleDateSelect} style={{width: '100%', borderRadius: 10, padding: 10}} className="custom-calendar"/>

//       <Modal
//   title="Requests"
//   open={isModalVisible}
//   onCancel={() => setIsModalVisible(false)}
//   footer={null}
//   width={700}
//   zIndex={1027}
// >
//   {selectedDateRequests.length === 0 ? (
//     <p>No requests for this date.</p>
//   ) : (
//     <List
//       itemLayout="vertical"
//       dataSource={selectedDateRequests}
//       renderItem={(item, index) => (
//         <List.Item key={index}>
//           <div
//             style={{
//               marginBottom: 8,
//               fontWeight: "bold",
//               color: item.source === "user" ? "#52c41a" : "#1890ff", // green for user, blue for approved
//             }}
//           >
//             Requested By: {item.userName || "N/A"} | Status: {formatStatus(item.status)}
//           </div>

//           <Descriptions column={2} bordered size="small">
//             <Descriptions.Item label="Room">
//               {item.room || "N/A"}
//             </Descriptions.Item>
//             <Descriptions.Item label="Department">
//               {/* For approvedRequests, department might be in requestList[0] */}
//               {item.requestList?.[0]?.department || item.department || "N/A"}
//             </Descriptions.Item>
//             <Descriptions.Item label="Approved By">
//               {item.approvedBy || "N/A"}
//             </Descriptions.Item>
//             <Descriptions.Item label="Program">
//               {item.program || "N/A"}
//             </Descriptions.Item>
//           </Descriptions>

//           <div style={{ marginTop: 12 }}>
//             <i style={{ fontSize: 12, color: "#888" }}>
//               Source: {item.source === "user" ? "User Request" : "Approved Request"}
//             </i>
//           </div>
//         </List.Item>
//       )}
//     />
//   )}
// </Modal>

//     </div>
//   );
// };

// export default CustomCalendar;


import React, { useEffect, useState } from "react";
import { Calendar, Badge, Modal, List, Descriptions, Select } from "antd";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../backend/firebase/FirebaseConfig";
import "../styles/customsStyle/CalendarModal.css";

const { Option } = Select;

const CustomCalendar = ({ onSelectDate }) => {
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [selectedDateRequests, setSelectedDateRequests] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterProgram, setFilterProgram] = useState("all");

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "borrowcatalog"),
      (querySnapshot) => {
        const groupedRequests = {};

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const key = `${data.userName}-${data.dateRequired}`;

          if (!groupedRequests[key]) {
            groupedRequests[key] = {
              date: data.dateRequired,
              userName: data.userName || "N/A",
              room: data.room || "N/A",
              status: data.status || "N/A",
              approvedBy: data.approvedBy || "N/A",
              program: data.program || "N/A",
              requestList: [],
            };
          }

          if (Array.isArray(data.requestList)) {
            groupedRequests[key].requestList.push(...data.requestList);
          }
        });

        setApprovedRequests(Object.values(groupedRequests));
      },
      (error) => {
        console.error("Error fetching borrowcatalog:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredApprovedRequests = approvedRequests.filter((item) => {
    const statusMatches =
      filterStatus === "all" || item.status.toLowerCase() === filterStatus;

    const programMatches =
      filterProgram === "all" ||
      item.program?.toLowerCase().trim() === filterProgram.toLowerCase().trim();

    return statusMatches && programMatches;
  });

  const getListData = (value) => {
    const dateStr = value.format("YYYY-MM-DD");
    return filteredApprovedRequests
      .filter(
        (item) =>
          item.date === dateStr &&
          item.status?.toLowerCase().trim() !== "deployed" &&
          item.status?.toLowerCase().trim() !== "return approved" &&
          item.status?.toLowerCase().trim() !== "returned" &&
          item.status?.toLowerCase().trim() !== "unclaimed"
      )
      .map((item) => {
        const status = item.status?.toLowerCase().trim();
        let type = "default";

        if (status === "borrowed") type = "warning";
        else if (status === "returned") type = "error";

        return {
          type,
          content: `${item.userName}`,
        };
      });
  };

  const dateCellRender = (value) => {
    const listData = getListData(value);
    return (
      <ul className="events">
        {listData.map((item, index) => (
          <li key={index}>
            <Badge status={item.type} text={item.content} />
          </li>
        ))}
      </ul>
    );
  };

  const formatStatus = (status) => {
    if (!status) return "N/A";
    switch (status.toLowerCase()) {
      case "borrowed":
        return "For Deployment";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const handleDateSelect = (date) => {
    const dateStr = date.format("YYYY-MM-DD");

    const matchedRequests = filteredApprovedRequests.filter((item) => {
      const status = item.status?.toLowerCase().trim();
      return (
        item.date === dateStr &&
        status !== "deployed" &&
        status !== "return approved" &&
        status !== "unclaimed" &&
        status !== "returned"
      );
    });

    setSelectedDateRequests(matchedRequests);
    setIsModalVisible(true);
    onSelectDate(date);
  };

  return (
    <div
      style={{
        borderRadius: "10px",
        overflow: "hidden",
        border: "1px solid #dfdfdf",
        padding: 25,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
        backgroundColor: "#e9f5f9",
      }}
    >
      <div className="calendar-filters">
        <div>
          <span style={{ marginRight: 8, fontWeight: "bold" }}>
            Filter by status:
          </span>
          <Select
            value={filterStatus}
            onChange={setFilterStatus}
            style={{ width: 160 }}
          >
            <Option value="all">All</Option>
            <Option value="borrowed">For Deployment</Option>
          </Select>
        </div>
      </div>

      <Calendar
        dateCellRender={dateCellRender}
        onSelect={handleDateSelect}
        style={{ width: "100%", borderRadius: 10, padding: 10 }}
        className="custom-calendar"
      />

      <Modal
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={700}
        zIndex={1027}
      >
        {selectedDateRequests.length === 0 ? (
          <p>No approved requests for this date.</p>
        ) : (
          <div style={{paddingTop: 50}}>
            <div style={{display: 'flex', position:'absolute', top: 0, left: 0, right: 0, backgroundColor:'#d3eaf2', height: 50, borderTopLeftRadius: '8px', borderTopRightRadius: '8px', alignItems: 'center', paddingLeft: 20}}>
              <p style={{margin: 0, fontSize: 18, color: '#134b5f'}}>Calendar Overview</p>
            </div>

            <i style={{color: 'gray'}}>To process deployment requisitions, please navigate to the "Borrow Catalog" page.</i>
          <List
            itemLayout="vertical"
            dataSource={selectedDateRequests}
            renderItem={(item, index) => (
              <List.Item key={index}>
                <div
                  style={{
                    marginBottom: 8,
                    fontWeight: "bold",
                    color: "#1890ff",
                  }}
                >
                  Requested By: {item.userName} | Status:{" "}
                  {formatStatus(item.status)}
                </div>
                <Descriptions column={2} bordered size="small">
                  <Descriptions.Item label="Room">
                    {item.room}
                  </Descriptions.Item>
                  {/* <Descriptions.Item label="Department">
                    {item.requestList[0]?.department || "N/A"}
                  </Descriptions.Item> */}
                  <Descriptions.Item label="Approved By">
                    {item.approvedBy}
                  </Descriptions.Item>
                  {/* <Descriptions.Item label="Program">
                    {item.program}
                  </Descriptions.Item> */}
                </Descriptions>
              </List.Item>
            )}
          />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CustomCalendar;
