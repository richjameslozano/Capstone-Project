import React from 'react';
import '../styles/customsStyle/TermsModal.css'; 
import { useNavigate } from 'react-router-dom';

const TermsModal = ({ isVisible, onClose }) => {
  const navigate = useNavigate();

  const handleOpenPrivacyPolicy = () => {
  window.open('/privacy-policy', '_blank');
};

  if (!isVisible) return null;
  
return (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
      <div className="terms-modal">

        <div className="terms-header">
          <h2>Terms and Conditions</h2>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '2rem',
              right: '2rem',
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#888'
            }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <hr />
        <div className="terms-content" style={{ paddingTop: '1rem', maxHeight: '70vh', overflowY: 'auto' }}>
          <p>
            Welcome to the NU MOA Laboratory System. Please read these Terms and Conditions carefully before using this application. By accessing or using the platform, you agree to these Terms.
          </p>

          <h3>1. Acceptance of Terms</h3>
          <p>By using the platform, you confirm you have read, understood, and accepted these Terms, including future updates.</p>

          <h3>2. Platform Usage</h3>
          <ul>
            <li>Only authorized users (Deans, Program Chairs, Custodians, Faculty Staff) may access the platform.</li>
            <li>Users must provide accurate information and maintain the confidentiality of their login credentials.</li>
            <li>Unauthorized access, misuse, or system interference is prohibited.</li>
          </ul>

          <h3>3. User Roles and Responsibilities</h3>
          <ul>
            <li><strong>Deans and Program Chairs</strong> have an overview of the inventory and requisition process. They can add or remove inventory items, approve requisitions (in the absence of the Laboratory Custodians), track equipment, access analytics, generate inventory reports, and request items to accommodate their class needs.</li>
            <li><strong>Laboratory Custodians</strong> are responsible for managing and maintaining the inventory. They oversee restocking, adding/removing items, approving requisitions, tracking expiry dates, and ensuring borrowed items are returned.</li>
            <li><strong>Faculty Staff</strong> can request items based on their classroom needs. They can track the status of their requisitions (approved, pending, or canceled).</li>
          </ul>

          <h3>4. Inventory Data</h3>
          <ul>
            <li>All inventory data must be entered accurately and in good faith.</li>
            <li>The Platform is not liable for any loss resulting from incorrect entries or misuse of the system.</li>
          </ul>

          <h3>5. Requisition Requests</h3>
          <ul>
            <li>Requests are subject to approval by designated administrators (Deans, Program Chairs, Laboratory Custodians).</li>
            <li>Users must not submit fraudulent or duplicate requisitions.</li>
            <li>Requisitions may be rejected due to budget constraints, stock availability, or policy-related reasons.</li>
          </ul>

          <h3>6. Liability for Damaged Items</h3>
          <ul>
            <li>Borrowers are responsible for any damage to items they borrow, regardless of department ownership.</li>
            <li>This includes faculty borrowing from departments other than their own.</li>
          </ul>

          <h3>7. Data Privacy</h3>
          <ul>
            <li>We collect and store user and inventory-related data to provide our services.</li>
            <li>We will not share your information with third parties without your consent, except as required by law.</li>
            <li>
              For more details, please see our{" "}
              <span onClick={handleOpenPrivacyPolicy} style={{ textDecoration: 'underline', color: 'blue' }}>
                Privacy Policy
              </span>.
            </li>
          </ul>

          <h3 >8. Intellectual Property</h3>
          <ul>
            <li>The Platform and its content (excluding user data) are the intellectual property of <strong>OnePixel</strong>.</li>
            <li>You may not copy, modify, or distribute any part of the Platform without written permission.</li>
          </ul>

          <h3>9. Termination</h3>
          <ul>
            <li>We reserve the right to suspend or terminate access to the Platform at our discretion in the event of a violation of these Terms.</li>
            <li>Users may request account deactivation by contacting support.</li>
          </ul>

          <h3>10. Limitation of Liability</h3>
          <ul>
            <li>The Platform is provided "as is." We are not liable for any damages arising from your use of the Service.</li>
            <li>We do not guarantee 100% uptime or error-free functionality.</li>
          </ul>

          <h3>11. Changes to Terms</h3>
          <ul>
            <li>We reserve the right to update these Terms at any time. Continued use of the Platform after changes have been made indicates acceptance of the revised Terms.</li>
          </ul>

          <h3>12. Contact</h3>
          <p>If you have any questions about these Terms, please contact us at [support@email.com].</p>
        </div>


      </div>
    </div>
  </div>
);
};

export default TermsModal;
