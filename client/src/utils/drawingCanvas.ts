import { Socket } from 'socket.io-client';

const drawingCanvas = document.getElementById('drawingCanvas') as HTMLCanvasElement;
const clearCanvasButton = document.getElementById('clearCanvasButton');

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

  drawingCanvas.width = 600;
  drawingCanvas.height = 300;

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

  function clearCanvas(): void {
    context.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    socket.emit('clearCanvas');
  }

  function setupClearCanvasButton(): void {
    if (clearCanvasButton !== null) {
      clearCanvasButton.addEventListener('click', clearCanvas);
    }
  }

  function handleStartDrawing(data: any): void {
    context.moveTo(data.x, data.y);
    context.beginPath();
  }

  function handleDrawing(data: any): void {
    drawOnCanvas(data.x, data.y);
  }

  function handleEndDrawing(): void {
    context.beginPath();
  }

  function handleClearCanvas(): void {
    context.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
  }

  socket.on('startDrawing', handleStartDrawing);
  socket.on('drawing', handleDrawing);
  socket.on('endDrawing', handleEndDrawing);
  socket.on('clearCanvas', handleClearCanvas);

  drawingCanvas.addEventListener('mousedown', startDrawingPosition);
  drawingCanvas.addEventListener('mouseup', endDrawingPosition);
  drawingCanvas.addEventListener('mousemove', draw);

  setupClearCanvasButton();
}

export { initializeDrawing };
