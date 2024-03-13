import { Socket } from 'socket.io-client';
import { removeAndAddNewClassOnTwoElements } from './helperfunctions';

const drawingCanvas = document.getElementById('drawingCanvas') as HTMLCanvasElement;
const clearCanvasButton = document.getElementById('clearCanvasButton');
const erasePanel = document.getElementById('erasePanel');

/**
 * Initializes drawing functionality on a canvas element, enabling real-time collaboration using web sockets.
 * @param {Socket} socket - The Socket.io client instance for real-time communication.
 */
function initializeDrawing(socket: Socket): void {
  if (!drawingCanvas.getContext) {
    console.error('Canvas context not supported');
    return;
  }

  /**
   * Click events on either draw button or erase button
   * Switches between selected and inactive states for styling
   * Sets isErasing state
   * @param {Event} e
   * @returns void
   */
  function handleClickOnDrawOptionButtons(e: Event) {
    const drawButton = document.getElementById('drawButton');
    const eraseButton = document.getElementById('eraseButton');
    const target = e.target as HTMLElement;
    if (target.tagName !== 'BUTTON') return;
    if (target.id === 'drawButton') {
      isErasing = false;
      removeAndAddNewClassOnTwoElements(eraseButton, target, 'inactive', 'selected');
      drawingCanvas.style.cursor = 'crosshair';
    } else if (target.id === 'eraseButton') {
      isErasing = true;
      drawingCanvas.style.cursor = "url('../../assets/icons/eraserTwo.svg'), auto";
      removeAndAddNewClassOnTwoElements(target, drawButton, 'selected', 'inactive');
    }
  }

  const context = drawingCanvas.getContext('2d')!;
  drawingCanvas.style.cursor = 'crosshair';
  let isPainting = false;
  let isErasing = false;

  drawingCanvas.width = 580;
  drawingCanvas.height = 480;

  function startDrawingPosition(event: MouseEvent): void {
    isPainting = true;
    draw(event);
  }

  function draw(event: MouseEvent): void {
    if (!isPainting) return;
    const x = event.clientX - drawingCanvas.offsetLeft + window.scrollX;
    const y = event.clientY - drawingCanvas.offsetTop + window.scrollY;

    socket.emit('drawing', { x, y, isErasing });

    drawOnCanvas(x, y, isErasing);
  }

  function drawOnCanvas(x: number, y: number, isErasing: boolean): void {
    if (isErasing) {
      context.lineWidth = 60;
      context.globalCompositeOperation = 'destination-out';
      drawingCanvas.style.cursor = "url('../../assets/icons/eraserTwo.svg'), auto";
    } else {
      context.lineWidth = 3;
      context.globalCompositeOperation = 'source-over';
      drawingCanvas.style.cursor = 'crosshair';
    }
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
    drawOnCanvas(data.x, data.y, data.isErasing);
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
  erasePanel?.addEventListener('click', handleClickOnDrawOptionButtons);

  setupClearCanvasButton();
}

export { initializeDrawing };
