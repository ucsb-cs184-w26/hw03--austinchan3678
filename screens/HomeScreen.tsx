import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, ActivityIndicator, Button, Text, TouchableOpacity, Alert } from 'react-native';
import DraggableFurniture from '../components/DraggableFurniture';
import FloorPlanSVG from '../components/FloorPlanSVG';
import FurniturePanel from '../components/FurniturePanel';

import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

const GRID_UNIT = 19.2;    // 80% of 24
const SVG_WIDTH = 384;     // 80% of 480
const SVG_HEIGHT = 268.8;  // 80% of 336

const HomeScreen = () => { 
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placed, setPlaced] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [statusMessage, setStatusMessage] = useState("Drag furniture to the map");
  const svgContainerRef = useRef(null);

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

  // DOORWAY LOGIC: Automatically generate door centers between adjacent rooms
  const doors = useMemo(() => {
    const doorPoints = [];
    const rooms = data?.floorPlan?.rooms?.room || [];
    
    rooms.forEach(room => {
      const r1 = room.position['@attributes'];
      const adjacents = Array.isArray(room.adjacentTo) ? room.adjacentTo : [room.adjacentTo];
      
      adjacents.forEach(adjId => {
        const adjRoom = rooms.find(r => r['@attributes'].id === adjId);
        if (!adjRoom) return;
        const r2 = adjRoom.position['@attributes'];

        const x1 = parseFloat(r1.x), y1 = parseFloat(r1.y), w1 = parseFloat(r1.width), h1 = parseFloat(r1.height);
        const x2 = parseFloat(r2.x), y2 = parseFloat(r2.y), w2 = parseFloat(r2.width), h2 = parseFloat(r2.height);

        let doorPos = null;
        if (x1 + w1 === x2) { // R1 is Left of R2
          const yStart = Math.max(y1, y2);
          const yEnd = Math.min(y1 + h1, y2 + h2);
          doorPos = { x: x2, y: (yStart + yEnd) / 2 };
        } else if (y1 + h1 === y2) { // R1 is Top of R2
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

  const isValidPosition = (nx, ny, itemW, itemH, currentKey) => {
    // 1. Boundary Check
    if (nx < 0 || ny < 0 || nx + itemW > 20 || ny + itemH > 14) {
      setStatusMessage("Error: Out of bounds");
      return false;
    }

    // 2. Furniture-on-Furniture Collision (AABB)
    const collision = placed.some(other => {
      if (other.key === currentKey) return false;
      return nx < other.x + other.w && nx + itemW > other.x && ny < other.y + other.h && ny + itemH > other.y;
    });
    if (collision) {
      setStatusMessage("Error: Furniture collision");
      return false;
    }

    // 3. Wall Collision (Must be fully inside a room)
    const roomsArray = data?.floorPlan?.rooms?.room || [];
    const isInsideRoom = roomsArray.some(room => {
      const p = room.position['@attributes'];
      const rx = parseFloat(p.x), ry = parseFloat(p.y), rw = parseFloat(p.width), rh = parseFloat(p.height);
      return nx >= rx && ny >= ry && nx + itemW <= rx + rw && ny + itemH <= ry + rh;
    });
    if (!isInsideRoom) {
      setStatusMessage("Error: Wall collision");
      return false;
    }

    // 4. IMPROVED: Doorway Sphere Collision (Circle vs Rectangle)
    const doorRadius = 1.0; 
    const nearDoor = doors.some(door => {
      // Find the closest point on the furniture rectangle to the door center
      const closestX = Math.max(nx, Math.min(door.x, nx + itemW));
      const closestY = Math.max(ny, Math.min(door.y, ny + itemH));

      // Calculate distance from door center to this closest point
      const dx = door.x - closestX;
      const dy = door.y - closestY;
      const distanceSquared = (dx * dx) + (dy * dy);
      
      return distanceSquared < (doorRadius * doorRadius);
    });

    if (nearDoor) {
      setStatusMessage("Error: Doorway blocked");
      return false;
    }

    setStatusMessage("Placement valid");
    return true;
  };

  const handleMove = (key, nx, ny) => {
    const item = placed.find(p => p.key === key);
    if (!item) return;

    if (isValidPosition(nx, ny, item.w, item.h, key)) {
      setPlaced(prev => prev.map(p => p.key === key ? { ...p, x: nx, y: ny } : p));
    } else {
      // FORCE DELETE: If isValidPosition returned false, remove it from the array
      setPlaced(prev => {
        const filtered = prev.filter(p => p.key !== key);
        console.log("Collision detected! Deleted item:", key); // Debug log
        return filtered;
      });
      Alert.alert("Collision!", `${statusMessage}. The item has been removed.`);
    }
  };

  function handleAddFurniture(item) {
    if (isValidPosition(1, 1, item.w, item.h, null)) {
      setPlaced(prev => [...prev, { ...item, x: 1, y: 1, key: `${item.id}-${Date.now()}` }]);
    } else {
      Alert.alert("Blocked", "Entrance (1,1) is blocked.");
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
    <ActivityIndicator />
  ) : (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <View style={{ position: 'absolute', width: 100, height: '100%', zIndex: 100 }} pointerEvents="box-none">
        <FurniturePanel onAddFurniture={handleAddFurniture} />
      </View>

      <View style={{ flex: 1, marginLeft: 100 }}>     
        <View style={{ paddingTop: 24, paddingLeft: 60, flexDirection: 'row', justifyContent: 'space-between', paddingRight: 40 }}>
          <View>
            <Text style={{ fontSize: 22, fontWeight: 'bold' }}>Floor Plan</Text>
            <Text style={{ fontSize: 15, color: statusMessage.startsWith('Error') ? 'red' : '#666' }}>{statusMessage}</Text>
          </View>
          <Button title="Load JSON" onPress={loadNewFloorPlan} />
        </View>

        <View style={{ flex: 1, alignItems: 'center', marginTop: 12 }}>
          <View style={{ width: SVG_WIDTH, height: SVG_HEIGHT, position: 'relative' }}>
            <FloorPlanSVG width={SVG_WIDTH} height={SVG_HEIGHT} rooms={data?.floorPlan?.rooms?.room || []} doors={doors} />
            {placed.map(item => (
              <DraggableFurniture key={item.key} item={item} onMove={handleMove} isSelected={selectedKey === item.key} onSelect={setSelectedKey} />
            ))}
          </View>
        </View>
      </View>

      <TouchableOpacity onPress={() => setPlaced([])} style={{ position: 'absolute', bottom: 32, right: 32, backgroundColor: '#ff5252', borderRadius: 28, padding: 14 }}>
        <Text style={{ color: 'white', fontWeight: 'bold' }}>Clear All</Text>
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreen;