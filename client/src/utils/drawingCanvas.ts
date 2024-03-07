import { Socket } from 'socket.io-client';

const drawingCanvas = document.getElementById('drawingCanvas') as HTMLCanvasElement;

/**
 * Initializes drawing functionality on a canvas element, enabling real-time collaboration using web sockets.
 * @param {Socket} socket - The Socket.io client instance for real-time communication.
 */
function initializeDrawing(socket: Socket): void {
  if (!drawingCanvas.getContext) {
    console.error('Canvas context not supported');
    return;
  }

  const context = drawingCanvas.getContext('2d')!;
  let isPainting = false;

  drawingCanvas.width = 800;
  drawingCanvas.height = 400;

  function startDrawingPosition(event: MouseEvent): void {
    isPainting = true;
    draw(event);
  }

  function draw(event: MouseEvent): void {
    if (!isPainting) return;
    const x = event.clientX - drawingCanvas.offsetLeft + window.scrollX;
    const y = event.clientY - drawingCanvas.offsetTop + window.scrollY;

    socket.emit('drawing', { x, y });

    drawOnCanvas(x, y);
  }

  function drawOnCanvas(x: number, y: number): void {
    context.lineTo(x, y);
    context.stroke();
    context.beginPath();
    context.moveTo(x, y);
  }

  function endDrawingPosition(): void {
    if (!isPainting) return;
    isPainting = false;
    socket.emit('endDrawing');
    context.beginPath();
  }

  socket.on('startDrawing', data => {
    context.moveTo(data.x, data.y);
    context.beginPath();
  });

  socket.on('drawing', data => {
    drawOnCanvas(data.x, data.y);
  });

  socket.on('endDrawing', () => {
    context.beginPath();
  });

  drawingCanvas.addEventListener('mousedown', startDrawingPosition);
  drawingCanvas.addEventListener('mouseup', endDrawingPosition);
  drawingCanvas.addEventListener('mousemove', draw);
}

export { initializeDrawing };
