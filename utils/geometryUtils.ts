import { FurnitureItem, Door } from '../types';

export const validatePosition = (nx: number, ny: number, item: FurnitureItem, placed: FurnitureItem[], data: any, doors: Door[]) => {
  const is90Rotated = Math.round((item.rotation || 0) / 90) % 2 !== 0;
  const eW = is90Rotated ? item.h : item.w;
  const eH = is90Rotated ? item.w : item.h;

  if (nx < 0 || ny < 0 || nx + eW > 20 || ny + eH > 14) 
    return { isValid: false, message: "Error: Out of bounds" };

  const collision = placed.some(other => 
    other.key !== item.key && nx < other.x + other.w && nx + eW > other.x && ny < other.y + other.h && ny + eH > other.y
  );
  if (collision) return { isValid: false, message: "Error: Furniture collision" };

  const rooms = data?.floorPlan?.rooms?.room || [];
  const inside = rooms.some((r: any) => {
    const p = r.position['@attributes'];
    return nx >= parseFloat(p.x) && ny >= parseFloat(p.y) && nx + eW <= parseFloat(p.x) + parseFloat(p.width) && ny + eH <= parseFloat(p.y) + parseFloat(p.height);
  });
  if (!inside) return { isValid: false, message: "Error: Wall collision" };

  const doorRadius = 1.0; 
  const nearDoor = doors.some(door => {
    const closestX = Math.max(nx, Math.min(door.x, nx + eW));
    const closestY = Math.max(ny, Math.min(door.y, ny + eH));
    const dx = door.x - closestX;
    const dy = door.y - closestY;
    return (dx * dx) + (dy * dy) < (doorRadius * doorRadius);
  });
  if (nearDoor) return { isValid: false, message: "Error: Doorway blocked" };

  return { isValid: true, message: "Placement valid" };
};

export const calculateDoors = (data: any): Door[] => {
  const doorPoints: Door[] = [];
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
      if (x1 + w1 === x2) doorPos = { x: x2, y: (Math.max(y1, y2) + Math.min(y1 + h1, y2 + h2)) / 2 };
      else if (y1 + h1 === y2) doorPos = { x: (Math.max(x1, x2) + Math.min(x1 + w1, x2 + w2)) / 2, y: y2 };

      if (doorPos && !doorPoints.find(d => d.x === doorPos.x && d.y === doorPos.y)) doorPoints.push(doorPos);
    });
  });
  return doorPoints;
};