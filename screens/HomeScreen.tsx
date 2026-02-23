import React, { useEffect, useState, useRef } from 'react';
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
  const [selectedFurniture, setSelectedFurniture] = useState(null);
  const [placed, setPlaced] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [statusMessage, setStatusMessage] = useState("Place furniture on the map"); // Dynamic message
  const svgContainerRef = useRef(null);
  const [svgLayout, setSvgLayout] = useState({ x: 0, y: 0, width: SVG_WIDTH, height: SVG_HEIGHT });

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

  const loadNewFloorPlan = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      if (!result.canceled) {
        const content = await FileSystem.readAsStringAsync(result.assets[0].uri);
        setData(JSON.parse(content));
        setPlaced([]); 
        setStatusMessage("New floor plan loaded");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to load floor plan file.");
    }
  };

  const isValidPosition = (nx: number, ny: number, itemW: number, itemH: number, currentKey: string | null) => {
    // 1. Check Floor Boundaries
    if (nx < 0 || ny < 0 || nx + itemW > 20 || ny + itemH > 14) {
      setStatusMessage("Error: Out of floor boundaries");
      return false;
    }

    // 2. Collision with Other Furniture (AABB)
    const furnitureCollision = placed.some(other => {
      if (other.key === currentKey) return false;
      return (
        nx < other.x + other.w &&
        nx + itemW > other.x &&
        ny < other.y + other.h &&
        ny + itemH > other.y
      );
    });
    if (furnitureCollision) {
      setStatusMessage("Error: Colliding with other furniture");
      return false;
    }

    const roomsArray = data?.floorPlan?.rooms?.room || [];

    // 3. Doorway Protection
    const doorwayRadius = 1.2; 
    const isInDoorway = roomsArray.some(room => {
      const pos = room.position['@attributes'];
      const adjacents = Array.isArray(room.adjacentTo) ? room.adjacentTo : [room.adjacentTo];
      
      return adjacents.some(adjId => {
        const adjRoom = roomsArray.find(r => r['@attributes'].id === adjId);
        if (!adjRoom) return false;
        const adjPos = adjRoom.position['@attributes'];
        
        const doorX = (parseFloat(pos.x) + parseFloat(pos.width)/2 + parseFloat(adjPos.x) + parseFloat(adjPos.width)/2) / 2;
        const doorY = (parseFloat(pos.y) + parseFloat(pos.height)/2 + parseFloat(adjPos.y) + parseFloat(adjPos.height)/2) / 2;
        
        const dist = Math.sqrt(Math.pow(nx + itemW/2 - doorX, 2) + Math.pow(ny + itemH/2 - doorY, 2));
        return dist < doorwayRadius;
      });
    });
    if (isInDoorway) {
      setStatusMessage("Error: Cannot place in doorway");
      return false;
    }

    // 4. Wall Collision (Must be fully inside a room)
    const isInsideAnyRoom = roomsArray.some(room => {
      const rPos = room.position['@attributes'];
      const rx = parseFloat(rPos.x);
      const ry = parseFloat(rPos.y);
      const rw = parseFloat(rPos.width);
      const rh = parseFloat(rPos.height);

      return (
        nx >= rx &&
        ny >= ry &&
        nx + itemW <= rx + rw &&
        ny + itemH <= ry + rh
      );
    });

    if (!isInsideAnyRoom) {
      setStatusMessage("Error: Cannot place inside walls");
      return false;
    }

    setStatusMessage("Placement successful");
    return true;
  };

// Modified Move handler: Deletes the item if the move results in an error
  const handleMove = (key, nx, ny) => {
    const item = placed.find(p => p.key === key);
    if (!item) return;

    // Check if the new position is valid
    if (isValidPosition(nx, ny, item.w, item.h, key)) {
      // Valid: Update the position
      setPlaced(prev => prev.map(p => p.key === key ? { ...p, x: nx, y: ny } : p));
      setStatusMessage("Item moved");
    } else {
      // INVALID: Remove the item from the map entirely
      setPlaced(prev => prev.filter(p => p.key !== key));
      
      // Update the message to explain why it was deleted
      const errorDetail = statusMessage.startsWith("Error") ? statusMessage : "Collision detected";
      setStatusMessage(`${errorDetail} - Item Deleted`);
    }
  };

  // Modified Add handler: Cancels placement if the starting spot is blocked
  function handleAddFurniture(item) {
    // If the default 1,1 spot is blocked, we just don't add it
    if (isValidPosition(1, 1, item.w, item.h, null)) {
      setPlaced(prev => [...prev, { ...item, x: 1, y: 1, key: `${item.id}-${Date.now()}` }]);
      setStatusMessage("Item added at (1,1)");
    } else {
      // If blocked, no item is added (effectively deleted/cancelled)
      setStatusMessage("Error: Start position blocked. Item not added.");
      Alert.alert("Placement Blocked", "The starting area (top-left) is occupied or invalid.");
    }
  }

  const handleClearAll = () => {
    setPlaced([]);
    setStatusMessage("Map cleared");
  };
  return loading ? (
    <ActivityIndicator />
  ) : (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 100, zIndex: 100 }} pointerEvents="box-none">
        <FurniturePanel selectedId={selectedFurniture?.id} onAddFurniture={handleAddFurniture} />
      </View>

      <View style={{ flex: 1, marginLeft: 100 }}>     
        <View style={{ paddingTop: 24, paddingLeft: 60, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 40 }}>
          <View>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#222', marginBottom: 2 }}>Floor Plan</Text>
            {/* Dynamic Message Replacement */}
            <Text style={{ fontSize: 15, color: statusMessage.startsWith('Error') ? '#ff5252' : '#666', marginBottom: 8 }}>
              {statusMessage}
            </Text>
          </View>
          <Button title="Load JSON" onPress={loadNewFloorPlan} />
        </View>

        <View style={{ flex: 1, marginRight: 40, marginTop: 12, alignItems: 'center' }}>
          <View style={{ width: SVG_WIDTH, height: SVG_HEIGHT, position: 'relative' }} ref={svgContainerRef}>
            <FloorPlanSVG width={SVG_WIDTH} height={SVG_HEIGHT} rooms={data?.floorPlan?.rooms?.room || []} />
            {placed.map(item => (
              <DraggableFurniture key={item.key} item={item} onMove={handleMove} isSelected={selectedKey === item.key} onSelect={setSelectedKey} />
            ))}
          </View>
        </View>
      </View>

      <TouchableOpacity onPress={handleClearAll} style={{ position: 'absolute', bottom: 32, right: 32, backgroundColor: '#ff5252', borderRadius: 28, paddingVertical: 14, paddingHorizontal: 24, elevation: 4, zIndex: 200 }} activeOpacity={0.85}>
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Clear All</Text>
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreen;