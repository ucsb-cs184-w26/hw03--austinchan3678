import React, { useEffect, useState, useRef, useMemo } from 'react';
import { 
  View, 
  ActivityIndicator, 
  Button, 
  Text, 
  TouchableOpacity, 
  Alert, 
  StyleSheet, 
  PanResponder 
} from 'react-native';
import DraggableFurniture from '../components/DraggableFurniture';
import FloorPlanSVG from '../components/FloorPlanSVG';
import FurniturePanel from '../components/FurniturePanel';

import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';

const GRID_UNIT = 19.2;    
const SVG_WIDTH = 384;     
const SVG_HEIGHT = 268.8;  

const HomeScreen = () => { 
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [placed, setPlaced] = useState<any[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("Drag furniture to the map");

  // --- REF TRACKING FOR SLIDER INTERACTION ---
  const selectedKeyRef = useRef<string | null>(null);
  useEffect(() => {
    selectedKeyRef.current = selectedKey;
  }, [selectedKey]);

  useEffect(() => {
    (async () => {
      try {
        const json = require('../assets/floor-plan.json');
        setData(json);
      } catch (e) {
        setData(null);
      }
      setLoading(false);
    })();
  }, []);

  // --- DOORWAY LOGIC ---
  const doors = useMemo(() => {
    const doorPoints: {x: number, y: number}[] = [];
    const rooms = data?.floorPlan?.rooms?.room || [];
    
    rooms.forEach((room: any) => {
      const r1 = room.position['@attributes'];
      const adjacents = Array.isArray(room.adjacentTo) ? room.adjacentTo : [room.adjacentTo];
      
      adjacents.forEach((adjId: string) => {
        const adjRoom = rooms.find((r: any) => r['@attributes'].id === adjId);
        if (!adjRoom) return;
        const r2 = adjRoom.position['@attributes'];
        const x1 = parseFloat(r1.x), y1 = parseFloat(r1.y), w1 = parseFloat(r1.width), h1 = parseFloat(r1.height);
        const x2 = parseFloat(r2.x), y2 = parseFloat(r2.y), w2 = parseFloat(r2.width), h2 = parseFloat(r2.height);

        let doorPos = null;
        if (x1 + w1 === x2) { 
          const yStart = Math.max(y1, y2);
          const yEnd = Math.min(y1 + h1, y2 + h2);
          doorPos = { x: x2, y: (yStart + yEnd) / 2 };
        } else if (y1 + h1 === y2) { 
          const xStart = Math.max(x1, x2);
          const xEnd = Math.min(x1 + w1, x2 + w2);
          doorPos = { x: (xStart + xEnd) / 2, y: y2 };
        }
        if (doorPos && !doorPoints.find(d => d.x === doorPos.x && d.y === doorPos.y)) {
          doorPoints.push(doorPos);
        }
      });
    });
    return doorPoints;
  }, [data]);

  // --- FREE-FORM ROTATION PAN RESPONDER ---
  const rotationPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const currentId = selectedKeyRef.current;
        if (!currentId) return;

        setPlaced(prev => prev.map(p => {
          if (p.key === currentId) {
            // dy is pixels moved. 1 pixel = 0.5 degrees for smooth control.
            let newAngle = (p.rotation || 0) + gestureState.dy * 0.5;
            // Keep within 0-359 range
            newAngle = ((newAngle % 360) + 360) % 360;
            return { ...p, rotation: Math.round(newAngle) };
          }
          return p;
        }));
      },
    })
  ).current;

  // --- COLLISION & PLACEMENT LOGIC ---
const isValidPosition = (nx, ny, itemW, itemH, currentKey) => {
  // 1. Find the current rotation of the item we are checking
  const item = placed.find(p => p.key === currentKey);
  const rotation = item?.rotation || 0;

  // 2. Simple Rotation Logic: If rotated 90 or 270 degrees, swap W and H
  // This handles the "effective" space the item takes up on the grid
  const is90Rotated = Math.round(rotation / 90) % 2 !== 0;
  const eW = is90Rotated ? itemH : itemW;
  const eH = is90Rotated ? itemW : itemH;

  // 3. Boundary Check (Use effective width/height)
  if (nx < 0 || ny < 0 || nx + eW > 20 || ny + eH > 14) {
    setStatusMessage("Error: Out of bounds");
    return false;
  }

  // 4. Furniture Collision
  const collision = placed.some(other => {
    if (other.key === currentKey) return false;
    // Note: To be perfect, 'other' also needs effectiveW/H, 
    // but checking current item vs other's static box is usually enough for a demo
    return nx < other.x + other.w && nx + eW > other.x && ny < other.y + other.h && ny + eH > other.y;
  });
  if (collision) {
    setStatusMessage("Error: Furniture collision");
    return false;
  }

  // 5. Wall Collision (Must be fully inside a room)
  const roomsArray = data?.floorPlan?.rooms?.room || [];
  const isInsideRoom = roomsArray.some(room => {
    const p = room.position['@attributes'];
    const rx = parseFloat(p.x), ry = parseFloat(p.y), rw = parseFloat(p.width), rh = parseFloat(p.height);
    return nx >= rx && ny >= ry && nx + eW <= rx + rw && ny + eH <= ry + rh;
  });

  if (!isInsideRoom) {
    setStatusMessage("Error: Wall collision");
    return false;
  }

  // 6. Doorway Collision
  const doorRadius = 1.0; 
  const nearDoor = doors.some(door => {
    const closestX = Math.max(nx, Math.min(door.x, nx + eW));
    const closestY = Math.max(ny, Math.min(door.y, ny + eH));
    const dx = door.x - closestX;
    const dy = door.y - closestY;
    return (dx * dx) + (dy * dy) < (doorRadius * doorRadius);
  });

  if (nearDoor) {
    setStatusMessage("Error: Doorway blocked");
    return false;
  }

  setStatusMessage("Placement valid");
  return true;
};
  const handleMove = (key: string, nx: number, ny: number) => {
    const item = placed.find(p => p.key === key);
    if (!item) return;
    if (isValidPosition(nx, ny, item.w, item.h, key)) {
      setPlaced(prev => prev.map(p => p.key === key ? { ...p, x: nx, y: ny } : p));
    } else {
      setPlaced(prev => prev.filter(p => p.key !== key));
      setSelectedKey(null);
      Alert.alert("Collision!", `${statusMessage}. Item removed.`);
    }
  };

  function handleAddFurniture(item: any) {
    if (isValidPosition(1, 1, item.w, item.h, null)) {
      setPlaced(prev => [...prev, { ...item, x: 1, y: 1, rotation: 0, key: `${item.id}-${Date.now()}` }]);
    } else {
      Alert.alert("Blocked", "The starting area is blocked.");
    }
  }

  const loadNewFloorPlan = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
    if (!result.canceled) {
      const content = await FileSystem.readAsStringAsync(result.assets[0].uri);
      setData(JSON.parse(content));
      setPlaced([]);
    }
  };

  return loading ? (
    <ActivityIndicator size="large" style={{ flex: 1 }} />
  ) : (
    <View style={styles.container}>
      <View style={styles.sidebarContainer} pointerEvents="box-none">
        <FurniturePanel onAddFurniture={handleAddFurniture} selectedId={selectedKey} />
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
                key={item.key} 
                item={item} 
                onMove={handleMove} 
                isSelected={selectedKey === item.key} 
                onSelect={setSelectedKey} 
              />
            ))}
          </View>
        </View>
      </View>

      {/* FREE-FORM ROTATION SLIDER */}
      {selectedKey && (
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderLabel}>ROTATE</Text>
          <View {...rotationPan.panHandlers} style={styles.sliderTrack}>
            <View style={[
              styles.sliderHandle, 
              { top: `${((placed.find(p => p.key === selectedKey)?.rotation || 0) / 360) * 85}%` }
            ]} />
          </View>
          <Text style={styles.degreeText}>{placed.find(p => p.key === selectedKey)?.rotation || 0}°</Text>
          <TouchableOpacity 
            onPress={() => setPlaced(prev => prev.map(p => p.key === selectedKey ? {...p, rotation: 0} : p))}
            style={styles.resetBtn}
          >
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