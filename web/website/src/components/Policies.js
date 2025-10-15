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
    <div className="modal-box-wrapper">
      <div className="modal-container-policy">

        <div className="modal-header-policy">
          <h2 style={{margin:0, color: '#fff'}}>Laboratory Policies</h2>
          <button className="close-btn close-top-right" onClick={handleClose}>
            &times;
          </button>
        </div>

        <div className="modal-body">
          <strong>Laboratory Request and Return Guidelines</strong>
          <ul>
            <li>Laboratory requests must be submitted <strong>at least seven (7) days </strong> before the date of usage/required date.</li>
            <li>Failure to adhere with this protocol may result in non-fulfillment of the request.</li>
          </ul>

          <strong>Item Returns:</strong>
          <ul>
            <li>Return all borrowed items to the laboratory stockroom in clean and intact condition.</li>
            <li><strong>Report any damaged</strong> to the laboratory personnel for proper documentation.</li>
          </ul>
        </div>

        <div className="modal-footer">
          <button className="close-btn" onClick={handleClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
);
};

export default PoliciesModal;
