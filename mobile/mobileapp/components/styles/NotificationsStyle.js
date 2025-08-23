import { StatusBar, StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e9ecee', // subtle off-white gray
    padding: 5
  },

  header: {
    fontSize: 22,
    fontWeight: '700',
    marginVertical: 20,
    textAlign: 'center',
    color: '#111827',
  },

    profileHeader:{
      position: 'absolute',
      backgroundColor: '#165a72',
      flex: 1,
      paddingTop: StatusBar.currentHeight+15,
      left: 0,
      right:0,
      alignItems: 'center',
      justifyContent:'space-between',
      zIndex: 999,
    },

  notificationCard: {
    backgroundColor: '#e9f5f9',
    borderRadius: 5,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    gap: 20
  },

  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },

  message: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    lineHeight: 20,
  },

  timestamp: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    fontWeight: 300
  },
});
