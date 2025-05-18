import React from 'react';
import '../components/styles/PrivacyPolicy.css';

const PrivacyPolicy = () => {
    console.log("Privacy Policy page loaded");

  return (
    <div className="policy-container">
      <h1>Privacy Policy</h1>
      <p>
        This Privacy Policy explains how the NU MOA Laboratory System ("we", "our", or "us") collects, uses, and protects your information when you use our mobile and web application services.
      </p>

      <h2>1. Information We Collect</h2>
      <ul>
        <li><strong>User Information:</strong> Name, email address, role (Dean, Program Chair, Laboratory Custodian, Faculty Staff), and other identifying data required for authentication and authorization.</li>
        <li><strong>Inventory and Usage Data:</strong> Logs related to requisitions, borrowings, approvals, and user activity.</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>To manage inventory and requisition processes effectively within the university laboratory system.</li>
        <li>To verify and authorize access based on user roles.</li>
        <li>To improve the performance, functionality, and reliability of our system.</li>
      </ul>

      <h2>3. Data Security</h2>
      <p>
        We implement appropriate technical and organizational security measures to protect your data from unauthorized access, disclosure, alteration, or destruction.
      </p>

      <h2>4. Data Sharing and Disclosure</h2>
      <ul>
        <li>We do not sell, trade, or otherwise transfer your information to outside parties.</li>
        <li>Your data may be shared within the university administration only as necessary for laboratory operations.</li>
        <li>We may disclose your information when legally required or to protect the integrity of the platform.</li>
      </ul>

      <h2>5. Your Rights</h2>
      <ul>
        <li>You may request access, correction, or deletion of your personal information.</li>
        <li>You may request to deactivate your account at any time.</li>
      </ul>

      <h2>6. Changes to This Privacy Policy</h2>
      <p>
        We reserve the right to update this Privacy Policy at any time. Users will be notified of significant changes. Continued use of the Platform after such changes constitutes your agreement to the new terms.
      </p>

      <h2>7. Contact Us</h2>
      <p>
        If you have any questions or concerns regarding this Privacy Policy, please contact us at <strong>support@email.com</strong>.
      </p>
    </div>
  );
};

export default PrivacyPolicy;
