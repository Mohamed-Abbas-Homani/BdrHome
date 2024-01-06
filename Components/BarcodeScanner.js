// BarcodeScannerScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Audio } from 'expo-av';

const BarcodeScanner = ({route, navigation }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [barcodeData, setBarcodeData] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = ({ data }) => {
    setScanned(true);
    setBarcodeData(data);
    playSound();
  };

  const playSound = async () => {
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/beep.mp3')
    );
    await sound.playAsync();
  };

  useEffect(() => {
    if (scanned) {
      // console.log(barcodeData + "scanned")
      navigation.navigate(route.params?.page, { barcodeData });
    }
  }, [scanned, barcodeData, navigation]);

  return (
    <View style={{ flex: 1 }}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />
      {scanned && (
        <TouchableOpacity onPress={() => setScanned(false)} style={{ position: 'absolute', top: 20, right: 20 }}>
          <Text style={{ color: 'white' }}>Rescan</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default BarcodeScanner;
