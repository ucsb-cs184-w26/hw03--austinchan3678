import React, { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator, Button } from 'react-native';
import DraggableFurniture from '../components/DraggableFurniture';
import FloorPlanSVG from '../components/FloorPlanSVG';
import FurniturePanel from '../components/FurniturePanel';

const GRID_UNIT = 24;
const SVG_WIDTH = 480;
const SVG_HEIGHT = 336;

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
          disableScroll={false}
          onAddFurniture={handleAddFurniture}
        />
      </View>

      {/* Main floor plan area */}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
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
        <Button title="Clear All" onPress={handleClearAll} />
      </View>

      {/* All drag/preview UI removed. Only click-to-add remains. */}
    </View>
  );
};

export default HomeScreen