import React from 'react';
import { Modal, View, Text, ScrollView, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { Button } from 'react-native-paper';
  import { StatusBar } from 'react-native';
const TermsModal = ({ visible, onClose }) => {
  return (
<Modal
  animationType="fade"
  transparent={true}
  visible={visible}
  onRequestClose={onClose}
>

<StatusBar
  backgroundColor="rgba(0,0,0,0.5)" // same as modalOverlay
  translucent={true}
  barStyle="light-content" // or 'dark-content' depending on your overlay brightness
/>

  <TouchableWithoutFeedback onPress={onClose}>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <ScrollView contentContainerStyle={{ paddingBottom: 20, paddingRight: 10 }}>
          <Text style={styles.modalTitle}>Terms and Conditions</Text>

          <Text style={styles.modalText}>
            Please read these Terms and Conditions carefully before using this application.
          </Text>

          <Text style={styles.modalText}>
            Welcome to the NU MOA Laboratory System. These Terms and Conditions govern your access to and use of the service, provided through our web and mobile application. By using the Platform, you agree to be bound by these Terms.
          </Text>

          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.modalText}>
            By accessing or using the Service, you confirm that you have read, understood, and agreed to be bound by these Terms, including any future modifications.
          </Text>

          <Text style={styles.sectionTitle}>2. Use of the Platform</Text>
          <Text style={styles.modalText}>• The Platform is intended for authorized users (Deans, Program Chairs, Laboratory Custodians, Faculty Staff) only. Unauthorized access or use is strictly prohibited.</Text>
          <Text style={styles.modalText}>• Users must provide accurate information and maintain the confidentiality of their login credentials.</Text>
          <Text style={styles.modalText}>• You agree not to misuse the system, attempt to gain unauthorized access, or interfere with other users' access.</Text>

          <Text style={styles.sectionTitle}>3. User Roles and Responsibilities</Text>
          <Text style={styles.modalText}>• Deans and Program Chairs: Overview inventory and requisitions, manage items, approve requests (if custodians are unavailable), track equipment, view analytics, and request items for class needs.</Text>
          <Text style={styles.modalText}>• Laboratory Custodians: Manage inventory, restock or update items, approve requisitions, track expiry dates, and ensure borrowed items are returned.</Text>
          <Text style={styles.modalText}>• Faculty Staff: Request class-related items, and monitor the status of their requisitions (approved, pending, or canceled).</Text>

          <Text style={styles.sectionTitle}>4. Inventory Data</Text>
          <Text style={styles.modalText}>• All inventory data must be entered accurately and in good faith.</Text>
          <Text style={styles.modalText}>• The platform is not liable for loss caused by incorrect entries or misuse of the system.</Text>

          <Text style={styles.sectionTitle}>5. Requisition Requests</Text>
          <Text style={styles.modalText}>• Requests are subject to approval by designated administrators.</Text>
          <Text style={styles.modalText}>• Users must not submit fraudulent or duplicate requisitions.</Text>
          <Text style={styles.modalText}>• Requisitions may be rejected due to budget constraints, stock availability, or policy rules.</Text>

          <Text style={styles.sectionTitle}>6. Data Privacy</Text>
          <Text style={styles.modalText}>• We collect and store user and inventory-related data to provide our services.</Text>
          <Text style={styles.modalText}>• Your information will not be shared with third parties without your consent, except as required by law.</Text>
          <Text style={styles.modalText}>• For more details, please see our <Text style={{color: 'blue', textDecorationLine: 'underline'}}>Privacy Policy</Text>.</Text>

          <Text style={styles.sectionTitle}>7. Intellectual Property</Text>
          <Text style={styles.modalText}>• The Platform and its content (excluding user data) are the intellectual property of OnePixel.</Text>
          <Text style={styles.modalText}>• You may not copy, modify, or distribute any part of the platform without written permission.</Text>

          <Text style={styles.sectionTitle}>8. Termination</Text>
          <Text style={styles.modalText}>• We may suspend or terminate access if you violate these Terms.</Text>
          <Text style={styles.modalText}>• Users may request account deactivation by contacting support.</Text>

          <Text style={styles.sectionTitle}>9. Limitation of Liability</Text>
          <Text style={styles.modalText}>• The Platform is provided "as is." We are not liable for damages from using the Service.</Text>
          <Text style={styles.modalText}>• We do not guarantee 100% uptime or error-free operation.</Text>

          <Text style={styles.sectionTitle}>10. Changes to Terms</Text>
          <Text style={styles.modalText}>• These Terms may be updated anytime. Continued use implies acceptance of the revised Terms.</Text>

          <Text style={styles.sectionTitle}>11. Contact</Text>
          <Text style={styles.modalText}>If you have questions, please contact us at [nulsnumoa@gmail.com].</Text>

          <Button mode="contained" onPress={onClose} style={styles.closeButton}>
            Close
          </Button>
        </ScrollView>
      </View>
    </View>
  </TouchableWithoutFeedback>
</Modal>

  );
};

export default TermsModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    maxHeight: '85%',
    paddingRight: 15
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 6,
  },
  modalText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'justify',
    marginBottom: 6,
  },
  closeButton: {
    marginTop: 20,
    alignSelf: 'center',
    backgroundColor: '#6e9fc1',
    borderRadius: 5
  },
});
