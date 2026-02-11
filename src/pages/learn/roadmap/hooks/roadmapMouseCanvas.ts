const [isDragging, setIsDragging] = useState(false);
const [startPos, setStartPos] = useState({ x: 0, y: 0 });

const handleMouseDown = (e: React.MouseEvent) => {
  setIsDragging(true);
  // Zapamiętujemy startową pozycję myszy MINUS aktualny offset pan
  setStartPos({
    x: e.clientX - pan.x,
    y: e.clientY - pan.y
  });
};

const handleMouseMove = (e: React.MouseEvent) => {
  if (!isDragging) return;

  // Obliczamy nową pozycję pan
  onPanChange({
    x: e.clientX - startPos.x,
    y: e.clientY - startPos.y
  });
};

const handleMouseUp = () => {
  setIsDragging(false);
};