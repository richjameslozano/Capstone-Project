import React, { useState, useRef, useEffect } from 'react';
import './styles/Policies.css';

const PoliciesModal = ({ isOpen, onClose }) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const modalRef = useRef(null);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('hidePoliciesModal', 'true');
    }
    onClose();
  };

  const handleClickOutside = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      handleClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container" ref={modalRef}>
        <div className="modal-header">
          <h2>Laboratory Policies</h2>
          <button className="close-btn" onClick={handleClose}>
            &times;
          </button>
        </div>
        <div className="modal-body">
          <p>
            LABORATORY REQUESTS MUST BE SUBMITTED (7) SEVEN DAYS BEFORE THE SCHEDULED DATE NEEDED.
            FAILURE TO ADHERE WITH THIS PROTOCOL WILL RESULT TO NON-FULFILLMENT OF THE REQUEST.
            <br /><br />
            RETURN THE BORROWED ITEMS TO THE LABORATORY STOCK ROOM.
            MICROSCOPES, GLASSWARES AND EQUIPMENTS MUST BE CLEANED AND IN INTACT CONDITION.
            DIRTY, MISSING, BROKEN AND EXTREMELY DAMAGED LABORATORY ITEMS SHOULD BE REPORTED TO
            THE LABORATORY CUSTODIAN FOR PROPER DOCUMENTATION.
          </p>
        </div>
        <div className="modal-footer">
          <label className="checkbox-container">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
            />
            Don't show this again
          </label>
          <button className="close-btn" onClick={handleClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PoliciesModal;
