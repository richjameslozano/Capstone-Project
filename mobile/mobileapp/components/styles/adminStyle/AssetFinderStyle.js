import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cameraContent: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 30,
  },
  flipButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 5,
  },
  captureButton: {
    width: 70,
    height: 70,
    backgroundColor: 'red',
    borderRadius: 35,
    alignSelf: 'center',
    marginBottom: 20,
  },
  previewContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  preview: { width: '80%', height: '60%', borderRadius: 10 },
  retakeButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: 'black',
    borderRadius: 5,
  },
  text: { color: 'white', textAlign: 'center' },
});
