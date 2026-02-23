import React, { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator, Button, Text, TouchableOpacity } from 'react-native';
import DraggableFurniture from '../components/DraggableFurniture';
import FloorPlanSVG from '../components/FloorPlanSVG';
import FurniturePanel from '../components/FurniturePanel';

const GRID_UNIT = 19.2;    // 80% of 24
const SVG_WIDTH = 384;     // 80% of 480
const SVG_HEIGHT = 268.8;  // 80% of 336

const HomeScreen = () => { 
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFurniture, setSelectedFurniture] = useState(null);
  const [placed, setPlaced] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
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

  // Move handler
  const handleMove = (key, nx, ny) => {
    setPlaced(prev => prev.map(item => item.key === key ? { ...item, x: nx, y: ny } : item));
  };

  // Clear all furniture
  const handleClearAll = () => {
    setPlaced([]);
  };

  // Add furniture at default position (top-left)
  function handleAddFurniture(item) {
    setPlaced(prev => [
      ...prev,
      {
        ...item,
        x: 1,
        y: 1,
        key: `${item.id}-${Date.now()}`,
      },
    ]);
  }


  return loading ? (
    <ActivityIndicator />
  ) : (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      {/* Left-side vertical furniture panel */}
      <View
        style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 100, zIndex: 100 }}
        pointerEvents="box-none"
      >
        <FurniturePanel
          selectedId={selectedFurniture?.id}
          onAddFurniture={handleAddFurniture}
        />
      </View>

      {/* Main floor plan area */}
      <View style={{ flex: 1, marginLeft: 100 }}>     
        {/* 1. Title Area (Anchored to top left) */}
        <View style={{ paddingTop: 24, paddingLeft: 60 }}>
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#222', marginBottom: 2 }}>Floor Plan</Text>
          <Text style={{ fontSize: 15, color: '#666', marginBottom: 8 }}>test</Text>
        </View>

        {/* 2. Map Area (Centered in all remaining space) */}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <View
            style={{ width: SVG_WIDTH, height: SVG_HEIGHT, position: 'relative' }}
            ref={svgContainerRef}
            onLayout={e => {
              const { x, y, width, height } = e.nativeEvent.layout;
              setSvgLayout({ x, y, width, height });
            }}
          >
            <FloorPlanSVG
              width={SVG_WIDTH}
              height={SVG_HEIGHT}
              rooms={data?.floorPlan?.rooms?.room || []}
            />
            {/* Render placed furniture as draggable, rotatable, deletable */}
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

    {/* Floating Clear All button in bottom right */}
    <TouchableOpacity
      onPress={handleClearAll}
      style={{
        position: 'absolute',
        bottom: 32,
        right: 32,
        backgroundColor: '#ff5252',
        borderRadius: 28,
        paddingVertical: 14,
        paddingHorizontal: 24,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        zIndex: 200,
      }}
      activeOpacity={0.85}
    >
      <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Clear All</Text>
    </TouchableOpacity>
  </View>
  );
};

export default HomeScreen