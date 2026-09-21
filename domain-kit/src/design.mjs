import { number, integer, text } from './validation.mjs';
export function calibrate({ a, b, knownMeters }) {
  for(const p of [a,b]) { number(p.x, 'x', -1e6, 1e6); number(p.y, 'y', -1e6, 1e6); }
  number(knownMeters, 'knownMeters', 0.001, 10000);
  const pixels = Math.hypot(a.x-b.x, a.y-b.y);
  if(pixels < 1) throw new Error('CALIBRATION_POINTS_TOO_CLOSE');
  return { metersPerPixel: knownMeters / pixels, confirmed: true };
}
// Hỗ trợ phòng chữ nhật theo mét. Chưa phải editor polygon/tường/cửa/cầu thang.
export function roomAreas(rooms, floorBounds) {
  if(!Array.isArray(rooms) || !rooms.length) throw new Error('ROOMS_REQUIRED');
  const ids = new Set(), checked = [];
  for(const room of rooms) {
    text(room.id, 'room.id'); text(room.name, 'room.name');
    if(ids.has(room.id)) throw new Error('DUPLICATE_ROOM'); ids.add(room.id);
    integer(room.floor, 'floor', 0, 100);
    number(room.x, 'x'); number(room.y, 'y'); number(room.width, 'width', 0.01, 1000); number(room.depth, 'depth', 0.01, 1000);
    const bound = floorBounds[room.floor];
    if(!bound) throw new Error('MISSING_FLOOR');
    number(bound.width, 'floor.width', 0.01, 1000); number(bound.depth, 'floor.depth', 0.01, 1000);
    if(room.x + room.width > bound.width || room.y + room.depth > bound.depth) throw new Error('ROOM_OUTSIDE_FLOOR');
    if(checked.some(r=> r.floor===room.floor && r.x<room.x+room.width && r.x+r.width>room.x && r.y<room.y+room.depth && r.y+r.depth>room.y)) throw new Error('ROOM_OVERLAP');
    checked.push(room);
  }
  return checked.map(r=>({...r, netArea: r.width*r.depth}));
}

export function rankTemplates(templates, requirements) {
  number(requirements.width,'width',0.01); number(requirements.depth,'depth',0.01);
  integer(requirements.bedrooms,'bedrooms',0,50); integer(requirements.availableCapital,'availableCapital');
  return templates.filter(t=>t.width<=requirements.width && t.depth<=requirements.depth && t.bedrooms>=requirements.bedrooms)
    .map(t=>({...t, withinBudget:t.estimatedCost<=requirements.availableCapital,
      reasons:[t.estimatedCost<=requirements.availableCapital?'WITHIN_SCENARIO_BUDGET':'OVER_SCENARIO_BUDGET', 'FITS_RECTANGULAR_PLOT'],
      estimateKind:'template_assumption'}))
    .sort((a,b)=>Number(b.withinBudget)-Number(a.withinBudget) || a.estimatedCost-b.estimatedCost);
}
