import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const frameSize = width * 0.7; // Ensure frame is square
const frameBorderWidth = 4;

export default StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    marginTop: 100,
  },

  camera: {
    flex: 1,
    width: '100%',
  },

  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },

  scannerFrame: {
    width: frameSize,
    height: frameSize,
    position: 'relative',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#39FF14',
  },

  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: frameBorderWidth,
    borderLeftWidth: frameBorderWidth,
  },

  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: frameBorderWidth,
    borderRightWidth: frameBorderWidth,
  },

  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: frameBorderWidth,
    borderLeftWidth: frameBorderWidth,
  },

  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: frameBorderWidth,
    borderRightWidth: frameBorderWidth,
  },

  scanLine: {
    position: 'absolute',
    width: '100%',
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },

  // Dark overlays to dim the area outside the scanning frame
  maskTop: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: (height - frameSize) / 2,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },

  maskBottom: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: (height - frameSize) / 2,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },

  maskLeft: {
    position: 'absolute',
    left: 0,
    width: (width - frameSize) / 2,
    height: frameSize,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },

  maskRight: {
    position: 'absolute',
    right: 0,
    width: (width - frameSize) / 2,
    height: frameSize,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },

  controls: {
    position: 'absolute',
    bottom: 60,
    width: '100%',
    alignItems: 'center',
  },

  flipButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 12,
    borderRadius: 30,
  },

  text: {
    color: 'white',
    textAlign: 'center',
  },
});
