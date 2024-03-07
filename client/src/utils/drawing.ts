import { io, Socket } from 'socket.io-client';

export function initializeDrawing(socket: Socket) {
  const canvas = document.getElementById('drawingCanvas') as HTMLCanvasElement;
  if (!canvas.getContext) {
    console.error('Canvas context not supported');
    return;
  }
  const context = canvas.getContext('2d')!;

  canvas.width = 800;
  canvas.height = 400;

  let painting = false;

  function startPosition(e: MouseEvent) {
    painting = true;
    const x = e.clientX - canvas.offsetLeft + window.scrollX;
    const y = e.clientY - canvas.offsetTop + window.scrollY;
    socket.emit('startDrawing', { x, y });
  }

  function draw(e: MouseEvent) {
    if (!painting) return;
    const x = e.clientX - canvas.offsetLeft + window.scrollX;
    const y = e.clientY - canvas.offsetTop + window.scrollY;

    socket.emit('drawing', { x, y });

    drawOnCanvas(x, y);
  }

  function drawOnCanvas(x: number, y: number) {
    context.lineTo(x, y);
    context.stroke();
    context.beginPath();
    context.moveTo(x, y);
  }

  function endPosition() {
    if (painting) {
      painting = false;
      socket.emit('endDrawing');
      context.beginPath();
    }
  }
  canvas.addEventListener('mousedown', startPosition);
  canvas.addEventListener('mouseup', endPosition);
  canvas.addEventListener('mousemove', draw);

  socket.on('startDrawing', data => {
    painting = true;
    context.moveTo(data.x, data.y);
    context.beginPath();
  });

  socket.on('drawing', data => {
    if (painting) {
      drawOnCanvas(data.x, data.y);
    }
  });

  socket.on('endDrawing', () => {
    painting = false;
    context.beginPath();
  });
}
