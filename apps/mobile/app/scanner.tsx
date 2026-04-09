import React, { useState } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '@camp/convex';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scannedId, setScannedId] = useState<string | null>(null);
  const router = useRouter();

  // Query to check if camper exists (only runs when we have a scannedId)
  const camper = useQuery(
    api.campers.getByExternalId,
    scannedId ? { externalId: scannedId } : "skip"
  );

  // Handle navigation when camper query completes
  React.useEffect(() => {
    if (scannedId && camper !== undefined) {
      if (camper) {
        router.replace({ pathname: '/camper/[id]', params: { id: scannedId } });
      } else {
        router.replace({ pathname: '/camper/register', params: { id: scannedId } });
      }
    }
  }, [camper, scannedId]);

  if (!permission) return <View style={styles.container}><Text>Loading...</Text></View>;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Card style={{ padding: 20, alignItems: 'center' }}>
          <Text style={{ marginBottom: 16 }}>Camera permission is required to scan IDs</Text>
          <Button onPress={requestPermission}>Grant Permission</Button>
        </Card>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setScannedId(data);
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      >
        <View style={styles.overlay}>
          <View style={styles.scanArea} />
          <Text variant="heading" style={{ color: 'white', marginTop: 24 }}>Scan Camper ID</Text>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  camera: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderRadius: 16,
  },
});
