import { useState, useRef, useEffect } from 'react';
import { PanResponder, Alert } from 'react-native';
import { validatePosition } from '../utils/geometryUtils';
import { FurnitureItem, Door } from '../types';

export const useFurnitureManager = (floorPlanData: any, doors: Door[]) => {
  const [placed, setPlaced] = useState<FurnitureItem[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("Drag furniture to the map");
  
  const selectedKeyRef = useRef<string | null>(null);
  useEffect(() => { selectedKeyRef.current = selectedKey; }, [selectedKey]);

  const addFurniture = (template: any) => {
    const newItem = { ...template, x: 1, y: 1, rotation: 0, key: `${template.id}-${Date.now()}` };
    const validation = validatePosition(1, 1, newItem, placed, floorPlanData, doors);
    
    if (validation.isValid) {
      setPlaced(prev => [...prev, newItem]);
    } else {
      Alert.alert("Blocked", "The starting area is blocked.");
    }
  };

  const moveFurniture = (key: string, nx: number, ny: number) => {
    const item = placed.find(p => p.key === key);
    if (!item) return;
    
    const validation = validatePosition(nx, ny, item, placed, floorPlanData, doors);
    setStatusMessage(validation.message);

    if (validation.isValid) {
      setPlaced(prev => prev.map(p => p.key === key ? { ...p, x: nx, y: ny } : p));
    } else {
      setPlaced(prev => prev.filter(p => p.key !== key));
      setSelectedKey(null);
      Alert.alert("Collision!", `${validation.message}. Item removed.`);
    }
  };

  const rotationPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (!selectedKeyRef.current) return;
        setPlaced(prev => prev.map(p => {
          if (p.key === selectedKeyRef.current) {
            let newAngle = ((p.rotation + gestureState.dy * 0.5) % 360 + 360) % 360;
            return { ...p, rotation: Math.round(newAngle) };
          }
          return p;
        }));
      },
    })
  ).current;

  return { 
    placed, setPlaced, 
    selectedKey, setSelectedKey, 
    statusMessage, setStatusMessage,
    addFurniture, moveFurniture, 
    rotationPan 
  };
};