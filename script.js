const canvas = document.getElementById('graphCanvas');
const ctx = canvas.getContext('2d');
const upload = document.getElementById('upload');
const findPathButton = document.getElementById('findPath');

let points = [];
let lines = [];

function drawGraph(points, lines, highlight = []) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  lines.forEach(line => {
    const { from, to, weight } = line;
    const startPoint = points.find(p => p.id === from);
    const endPoint = points.find(p => p.id === to);

    ctx.beginPath();
    ctx.moveTo(startPoint.x, startPoint.y);
    ctx.lineTo(endPoint.x, endPoint.y);

    ctx.strokeStyle = highlight.includes(line) ? 'yellow' : 'gray';
    ctx.lineWidth = highlight.includes(line) ? 3 : 1;
    ctx.stroke();

    const midX = (startPoint.x + endPoint.x) / 2;
    const midY = (startPoint.y + endPoint.y) / 2;
    ctx.fillStyle = 'black';
    ctx.fillText(weight, midX, midY);
  });

  points.forEach(point => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 10, 0, 2 * Math.PI);
    ctx.fillStyle = 'purple';
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.fillText(point.id, point.x - 5, point.y + 5);
  });
}

upload.addEventListener('change', function(event) {
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = function(e) {
    const parser = new DOMParser();
    const xml = parser.parseFromString(e.target.result, 'application/xml');
    parseGraphData(xml);
    drawGraph(points, lines);
  };

  reader.readAsText(file);
});

function parseGraphData(xml) {
  points = Array.from(xml.getElementsByTagName('point')).map(point => ({
    id: parseInt(point.getAttribute('id')),
    x: parseInt(point.getAttribute('x')),
    y: parseInt(point.getAttribute('y')),
  }));

  lines = Array.from(xml.getElementsByTagName('line')).map(line => ({
    from: parseInt(line.getAttribute('from')),
    to: parseInt(line.getAttribute('to')),
    weight: parseInt(line.getAttribute('weight')),
  }));
}

function dijkstra(start, end) {
  const distances = {};
  const visited = new Set();
  const previous = {};
  const queue = [];

  points.forEach(point => {
    distances[point.id] = Infinity;
    previous[point.id] = null;
  });

  distances[start] = 0;
  queue.push({ id: start, dist: 0 });

  while (queue.length > 0) {
    queue.sort((a, b) => a.dist - b.dist);
    const { id: current } = queue.shift();

    if (current === end) break;
    if (visited.has(current)) continue;
    visited.add(current);

    lines
      .filter(line => line.from === current || line.to === current)
      .forEach(line => {
        const neighbor = line.from === current ? line.to : line.from;
        const newDist = distances[current] + line.weight;

        if (newDist < distances[neighbor]) {
          distances[neighbor] = newDist;
          previous[neighbor] = current;
          queue.push({ id: neighbor, dist: newDist });
        }
      });
  }

  const path = [];
  let current = end;
  while (previous[current] !== null) {
    const from = previous[current];
    path.push(lines.find(line => (line.from === from && line.to === current) || 
                                  (line.from === current && line.to === from)));
    current = from;
  }
  return path.reverse();
}

findPathButton.addEventListener('click', function() {
  const start = parseInt(prompt('Введіть початкову вершину:'));
  const end = parseInt(prompt('Введіть кінцеву вершину:'));

  const path = dijkstra(start, end);
  drawGraph(points, lines, path);
});
