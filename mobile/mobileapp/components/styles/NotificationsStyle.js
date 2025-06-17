import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 20,
  },

  header: {
    fontSize: 24,
    fontWeight: '700',
    marginVertical: 20,
    textAlign: 'center',
    color: '#111827',
  },

  notificationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 5,
    elevation: 2,
  },

  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#1F2937',
  },

  message: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 5,
  },
  
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
  },
});
