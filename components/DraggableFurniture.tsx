import React, { useRef, useEffect } from 'react';
import { View, PanResponder, Animated } from 'react-native';

const GRID_UNIT = 19.2;    // MUST exactly match HomeScreen!
const DraggableFurniture = ({ item, onMove, isSelected, onSelect }) => {
  const pan = useRef(new Animated.ValueXY({ x: item.x * GRID_UNIT, y: item.y * GRID_UNIT })).current;
  const last = useRef({ x: item.x * GRID_UNIT, y: item.y * GRID_UNIT }).current;
  const lastTap = useRef<number>(0);

  useEffect(() => {
    const px = item.x * GRID_UNIT;
    const py = item.y * GRID_UNIT;
    pan.setValue({ x: 0, y: 0 });
    pan.setOffset({ x: px, y: py });
    last.x = px;
    last.y = py;
  }, [item.x, item.y]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (e, gesture) => {
        onSelect?.(item.key);
        const now = Date.now();
        if (now - lastTap.current < 300) {

        }
        lastTap.current = now;
        pan.setOffset({ x: last.x, y: last.y });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([
        null,
        { dx: pan.x, dy: pan.y },
      ], { useNativeDriver: false }),
      onPanResponderRelease: (e, gesture) => {
  pan.flattenOffset();
  
  // Convert pixels back to Grid Units accurately
  const finalX = last.x + gesture.dx;
  const finalY = last.y + gesture.dy;
  
  // Snap to the 0.5 grid
  const nx = Math.round(finalX / (GRID_UNIT / 2)) / 2;
  const ny = Math.round(finalY / (GRID_UNIT / 2)) / 2;

  // This triggers the handleMove in HomeScreen
  onMove?.(item.key, nx, ny);
  
  // Reset for next drag
  last.x = nx * GRID_UNIT;
  last.y = ny * GRID_UNIT;
  pan.setValue({ x: 0, y: 0 });
  pan.setOffset({ x: last.x, y: last.y });
},
      onPanResponderTerminationRequest: () => true,
      onShouldBlockNativeResponder: () => false,
    })
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: item.w * GRID_UNIT,
        height: item.h * GRID_UNIT,
        backgroundColor: item.color,
        borderRadius: 4,
        borderWidth: isSelected ? 2 : 1,
        borderColor: isSelected ? '#1976d2' : '#333',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: isSelected ? 10 : 1,
        transform: [
          { translateX: pan.x },
          { translateY: pan.y },
        ],
      }}
    />
  );
};

export default DraggableFurniture;
