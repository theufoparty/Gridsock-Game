export function initializeDrawing() {
  const canvas = document.getElementById('drawingCanvas') as HTMLCanvasElement;
  if (!canvas.getContext) {
    console.error('Canvas context not supported');
    return;
  }
  const context = canvas.getContext('2d')!;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  let painting = false;

  function startPosition(e: MouseEvent) {
    painting = true;
    context.beginPath();
    context.moveTo(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop);
    draw(e);
  }

  function endPosition() {
    painting = false;
    // This ensures the current path is closed when the mouse is lifted,
    // so that a new path will start on the next mouse down.
    context.closePath();
  }

  function draw(e: MouseEvent) {
    if (!painting) return;
    context.lineTo(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop);
    context.strokeStyle = 'black';
    context.lineWidth = 5;
    context.lineCap = 'round';
    context.stroke();
    context.beginPath();
    context.moveTo(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop);
  }

  canvas.addEventListener('mousedown', startPosition);
  canvas.addEventListener('mouseup', endPosition);
  canvas.addEventListener('mousemove', draw);
}
