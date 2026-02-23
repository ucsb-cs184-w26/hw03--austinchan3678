import React from 'react';
import Svg, { Rect, Line } from 'react-native-svg';

// FloorPlanSVG renders the grid and rooms using SVG
const GRID_SIZE = 20;
const GRID_UNIT = 24; // px per unit


const FloorPlanSVG = ({ width = 480, height = 336, rooms = [], doors = [] }) => {
  // Draw grid lines
  const gridLines = [];
  for (let i = 0; i <= GRID_SIZE; i++) {
    gridLines.push(
      <Line
        key={`v-${i}`}
        x1={i * GRID_UNIT}
        y1={0}
        x2={i * GRID_UNIT}
        y2={height}
        stroke="#e0e0e0"
        strokeWidth={1}
      />
    );
  }
  for (let j = 0; j <= GRID_SIZE; j++) {
    gridLines.push(
      <Line
        key={`h-${j}`}
        x1={0}
        y1={j * GRID_UNIT}
        x2={width}
        y2={j * GRID_UNIT}
        stroke="#e0e0e0"
        strokeWidth={1}
      />
    );
  }

  // Color palette for rooms
  const roomColors = ['#f8bbd0', '#bbdefb', '#c8e6c9', '#ffe082', '#b2dfdb', '#d1c4e9'];

  // Render doors (for demo, draw lines between adjacent rooms)
  const doorLines = [];
  rooms.forEach((room, idx) => {
    const pos = room.position['@attributes'];
    const centerX = (parseInt(pos.x) + parseInt(pos.width) / 2) * GRID_UNIT;
    const centerY = (parseInt(pos.y) + parseInt(pos.height) / 2) * GRID_UNIT;
    if (room.adjacentTo) {
      const adjacents = Array.isArray(room.adjacentTo) ? room.adjacentTo : [room.adjacentTo];
      adjacents.forEach(adjId => {
        const adjRoom = rooms.find(r => r['@attributes'].id === adjId);
        if (adjRoom) {
          const adjPos = adjRoom.position['@attributes'];
          const adjCenterX = (parseInt(adjPos.x) + parseInt(adjPos.width) / 2) * GRID_UNIT;
          const adjCenterY = (parseInt(adjPos.y) + parseInt(adjPos.height) / 2) * GRID_UNIT;
          doorLines.push(
            <Line
              key={`door-${room['@attributes'].id}-${adjId}`}
              x1={centerX}
              y1={centerY}
              x2={adjCenterX}
              y2={adjCenterY}
              stroke="#795548"
              strokeWidth={4}
              strokeDasharray="8,4"
            />
          );
        }
      });
    }
  });

  return (
    <Svg width={width} height={height}>
      {/* Grid */}
      {gridLines}
      {/* Rooms */}
      {rooms.map((room, idx) => {
        const pos = room.position['@attributes'];
        return (
          <Rect
            key={room['@attributes'].id}
            x={parseInt(pos.x) * GRID_UNIT}
            y={parseInt(pos.y) * GRID_UNIT}
            width={parseInt(pos.width) * GRID_UNIT}
            height={parseInt(pos.height) * GRID_UNIT}
            fill={roomColors[idx % roomColors.length]}
            stroke="#888"
            strokeWidth={2}
            rx={6}
          />
        );
      })}
    </Svg>
  );
};

export default FloorPlanSVG;
