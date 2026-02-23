import React from 'react';
import Svg, { Rect, Line, Circle } from 'react-native-svg';

const GRID_SIZE = 20;
const GRID_UNIT = 24; 
const ORIGINAL_WIDTH = 480;
const ORIGINAL_HEIGHT = 336;

const FloorPlanSVG = ({ width = 480, height = 336, rooms = [], doors = [] }) => {
  const gridLines = [];
  for (let i = 0; i <= GRID_SIZE; i++) {
    gridLines.push(<Line key={`v-${i}`} x1={i * GRID_UNIT} y1={0} x2={i * GRID_UNIT} y2={ORIGINAL_HEIGHT} stroke="#e0e0e0" strokeWidth={1} />);
  }
  for (let j = 0; j <= GRID_SIZE; j++) {
    gridLines.push(<Line key={`h-${j}`} x1={0} y1={j * GRID_UNIT} x2={ORIGINAL_WIDTH} y2={j * GRID_UNIT} stroke="#e0e0e0" strokeWidth={1} />);
  }

  const roomColors = ['#f8bbd0', '#bbdefb', '#c8e6c9', '#ffe082', '#b2dfdb', '#d1c4e9'];

  return (
    <Svg width={width} height={height} viewBox="0 0 480 336">
      {gridLines}
      {rooms.map((room, idx) => {
        const p = room.position['@attributes'];
        return (
          <Rect
            key={room['@attributes'].id}
            x={parseInt(p.x) * GRID_UNIT} y={parseInt(p.y) * GRID_UNIT}
            width={parseInt(p.width) * GRID_UNIT} height={parseInt(p.height) * GRID_UNIT}
            fill={roomColors[idx % roomColors.length]} stroke="#888" strokeWidth={2} rx={6}
          />
        );
      })}
      {/* Visualizing doors as sphere-shaped markers */}
      {doors.map((door, idx) => (
        <Circle key={`door-${idx}`} cx={door.x * GRID_UNIT} cy={door.y * GRID_UNIT} r={1 * GRID_UNIT} fill="#795548" opacity={0.8} />
      ))}
    </Svg>
  );
};

export default FloorPlanSVG;