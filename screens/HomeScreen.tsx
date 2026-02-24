import React, { useEffect, useState, useMemo } from 'react';
import { View, ActivityIndicator, Button, Text, TouchableOpacity, StyleSheet } from 'react-native';
import DraggableFurniture from '../components/DraggableFurniture';
import FloorPlanSVG from '../components/FloorPlanSVG';
import FurniturePanel from '../components/FurniturePanel';
import { useFurnitureManager } from '../hooks/useFurnitureManager';
import { calculateDoors } from '../utils/geometryUtils';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';

const SVG_WIDTH = 384;     
const SVG_HEIGHT = 268.8;  

const HomeScreen = () => { 
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setData(require('../assets/floor-plan.json')); } catch (e) { setData(null); }
      setLoading(false);
    })();
  }, []);

  const doors = useMemo(() => calculateDoors(data), [data]);
  const { 
    placed, setPlaced, selectedKey, setSelectedKey, statusMessage, 
    addFurniture, moveFurniture, rotationPan 
  } = useFurnitureManager(data, doors);

  const loadNewFloorPlan = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
    if (!result.canceled) {
      const content = await FileSystem.readAsStringAsync(result.assets[0].uri);
      setData(JSON.parse(content));
      setPlaced([]);
    }
  };

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <View style={styles.sidebarContainer} pointerEvents="box-none">
        <FurniturePanel onAddFurniture={addFurniture} selectedId={selectedKey} />
      </View>

      <View style={styles.mainContent}>     
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Floor Plan Designer</Text>
            <Text style={[styles.subtitle, { color: statusMessage.startsWith('Error') ? '#ff5252' : '#666' }]}>
              {statusMessage}
            </Text>
          </View>
          <Button title="Load JSON" onPress={loadNewFloorPlan} />
        </View>

        <View style={styles.mapContainer}>
          <View style={styles.svgWrapper}>
            <FloorPlanSVG width={SVG_WIDTH} height={SVG_HEIGHT} rooms={data?.floorPlan?.rooms?.room || []} doors={doors} />
            {placed.map(item => (
              <DraggableFurniture 
                key={item.key} item={item} onMove={moveFurniture} 
                isSelected={selectedKey === item.key} onSelect={setSelectedKey} 
              />
            ))}
          </View>
        </View>
      </View>

      {selectedKey && (
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderLabel}>ROTATE</Text>
          <View {...rotationPan.panHandlers} style={styles.sliderTrack}>
            <View style={[styles.sliderHandle, { top: `${((placed.find(p => p.key === selectedKey)?.rotation || 0) / 360) * 85}%` }]} />
          </View>
          <Text style={styles.degreeText}>{placed.find(p => p.key === selectedKey)?.rotation || 0}°</Text>
          <TouchableOpacity onPress={() => setPlaced(prev => prev.map(p => p.key === selectedKey ? {...p, rotation: 0} : p))} style={styles.resetBtn}>
            <Text style={styles.resetText}>RESET</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity onPress={() => setPlaced([])} style={styles.clearButton}>
        <Text style={styles.clearText}>Clear All</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#fff' },
  sidebarContainer: { position: 'absolute', width: 140, height: '100%', zIndex: 100 },
  mainContent: { flex: 1, marginLeft: 140, paddingRight: 100 },
  header: { paddingTop: 40, paddingLeft: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 20 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 13, marginTop: 4 },
  mapContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  svgWrapper: { width: SVG_WIDTH, height: SVG_HEIGHT, position: 'relative' },
  sliderContainer: {
    position: 'absolute', right: 20, top: '25%', height: 300, width: 60,
    backgroundColor: '#fff', borderRadius: 30, borderWidth: 1, borderColor: '#ddd',
    alignItems: 'center', paddingVertical: 20, elevation: 10, shadowOpacity: 0.1
  },
  sliderLabel: { fontSize: 8, fontWeight: 'bold', color: '#999', marginBottom: 10 },
  sliderTrack: { width: 10, flex: 1, backgroundColor: '#f0f0f0', borderRadius: 5, position: 'relative' },
  sliderHandle: { 
    width: 26, height: 26, borderRadius: 13, backgroundColor: '#2196F3',
    position: 'absolute', left: -8, borderWidth: 2, borderColor: '#fff' 
  },
  degreeText: { fontSize: 14, fontWeight: 'bold', marginVertical: 10, color: '#2196F3' },
  resetBtn: { padding: 8, backgroundColor: '#f5f5f5', borderRadius: 8 },
  resetText: { fontSize: 9, fontWeight: 'bold', color: '#666' },
  clearButton: { position: 'absolute', bottom: 30, right: 30, backgroundColor: '#ff5252', borderRadius: 25, paddingVertical: 12, paddingHorizontal: 20, elevation: 5 },
  clearText: { color: 'white', fontWeight: 'bold' }
});

export default HomeScreen;