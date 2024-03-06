export function initializeDrawing() {
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
    context.beginPath();
    context.moveTo(e.clientX - canvas.offsetLeft + window.scrollX, e.clientY - canvas.offsetTop + window.scrollY);
    draw(e);
  }

  function draw(e: MouseEvent) {
    if (!painting) return;
    context.lineTo(e.clientX - canvas.offsetLeft + window.scrollX, e.clientY - canvas.offsetTop + window.scrollY);
    context.stroke();
  }

  function endPosition() {
    painting = false;
  }

  canvas.addEventListener('mousedown', startPosition);
  canvas.addEventListener('mouseup', endPosition);
  canvas.addEventListener('mousemove', draw);
}
