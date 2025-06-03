import React, { useRef, useEffect, useState, useCallback } from 'react';
import { API_BASE_URL } from '../config';
import { message } from 'antd';

const EnhancedAnnotationCanvas = ({ 
  imageUrl, 
  annotations = [], 
  onAnnotationsChange,
  classes = [],
  selectedClass = null,
  tool = 'select',
  brushSize = 10,
  opacity = 0.7,
  showAnnotations = true
}) => {
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const containerRef = useRef(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] = useState(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [polygonPoints, setPolygonPoints] = useState([]);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [brushPath, setBrushPath] = useState([]);
  const [magicWandTolerance, setMagicWandTolerance] = useState(30);

  // Colors for different classes
  const classColors = [
    '#ff4d4f', '#52c41a', '#1890ff', '#fa8c16', '#722ed1',
    '#eb2f96', '#13c2c2', '#a0d911', '#fadb14', '#f759ab'
  ];

  // Initialize canvas and load image
  useEffect(() => {
    if (!imageUrl) return;

    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const overlayCtx = overlayCanvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      const container = containerRef.current;
      const containerWidth = container.clientWidth - 40;
      const containerHeight = container.clientHeight - 40;
      
      const scaleX = containerWidth / img.width;
      const scaleY = containerHeight / img.height;
      const initialScale = Math.min(scaleX, scaleY, 1);
      
      setScale(initialScale);
      setImageSize({ width: img.width, height: img.height });
      
      canvas.width = img.width * initialScale;
      canvas.height = img.height * initialScale;
      overlayCanvas.width = canvas.width;
      overlayCanvas.height = canvas.height;
      
      setOffset({
        x: (containerWidth - canvas.width) / 2,
        y: (containerHeight - canvas.height) / 2
      });
      
      redrawCanvas();
    };
    
    img.src = imageUrl;
  }, [imageUrl]);

  // Redraw main canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (imageUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        if (showAnnotations) {
          drawAnnotations(ctx);
        }
      };
      img.src = imageUrl;
    }
  }, [imageUrl, annotations, showAnnotations, selectedAnnotation]);

  // Redraw overlay canvas for current drawing
  const redrawOverlay = useCallback(() => {
    const overlayCanvas = overlayCanvasRef.current;
    if (!overlayCanvas) return;
    
    const ctx = overlayCanvas.getContext('2d');
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    
    if (currentAnnotation) {
      drawCurrentAnnotation(ctx);
    }
    
    if (brushPath.length > 0 && (tool === 'brush' || tool === 'eraser')) {
      drawBrushPath(ctx);
    }
  }, [currentAnnotation, brushPath, tool]);

  // Draw all annotations
  const drawAnnotations = (ctx) => {
    annotations.forEach((annotation, index) => {
      const color = classColors[annotation.classIndex % classColors.length];
      const isSelected = selectedAnnotation === index;
      
      ctx.globalAlpha = opacity;
      ctx.strokeStyle = isSelected ? '#ff4d4f' : color;
      ctx.fillStyle = color + '40';
      ctx.lineWidth = isSelected ? 3 : 2;
      
      if (annotation.type === 'bbox') {
        drawBoundingBox(ctx, annotation.bbox);
      } else if (annotation.type === 'polygon') {
        drawPolygon(ctx, annotation.points);
      } else if (annotation.type === 'mask') {
        drawMask(ctx, annotation.mask, color);
      }
      
      ctx.globalAlpha = 1;
      drawClassLabel(ctx, annotation, color);
    });
  };

  // Draw bounding box
  const drawBoundingBox = (ctx, bbox) => {
    const { x, y, width, height } = bbox;
    ctx.strokeRect(x * scale, y * scale, width * scale, height * scale);
    ctx.fillRect(x * scale, y * scale, width * scale, height * scale);
  };

  // Draw polygon
  const drawPolygon = (ctx, points) => {
    if (points.length < 2) return;
    
    ctx.beginPath();
    ctx.moveTo(points[0].x * scale, points[0].y * scale);
    
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x * scale, points[i].y * scale);
    }
    
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
    
    // Draw control points
    if (selectedAnnotation !== null) {
      points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x * scale, point.y * scale, 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }
  };

  // Draw mask (for brush tool)
  const drawMask = (ctx, mask, color) => {
    ctx.fillStyle = color + '60';
    mask.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x * scale, point.y * scale, point.size * scale, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  // Draw current annotation being created
  const drawCurrentAnnotation = (ctx) => {
    if (!currentAnnotation) return;
    
    const color = selectedClass !== null ? classColors[selectedClass % classColors.length] : '#1890ff';
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = color;
    ctx.fillStyle = color + '40';
    ctx.lineWidth = 2;
    
    if (currentAnnotation.type === 'bbox' && currentAnnotation.bbox) {
      drawBoundingBox(ctx, currentAnnotation.bbox);
    } else if (currentAnnotation.type === 'polygon' && polygonPoints.length > 0) {
      // Draw polygon in progress
      ctx.beginPath();
      ctx.moveTo(polygonPoints[0].x * scale, polygonPoints[0].y * scale);
      
      for (let i = 1; i < polygonPoints.length; i++) {
        ctx.lineTo(polygonPoints[i].x * scale, polygonPoints[i].y * scale);
      }
      
      ctx.stroke();
      
      // Draw points
      polygonPoints.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x * scale, point.y * scale, 4, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
      });
    }
    
    ctx.globalAlpha = 1;
  };

  // Draw brush path
  const drawBrushPath = (ctx) => {
    if (brushPath.length === 0) return;
    
    const color = tool === 'eraser' ? '#ffffff' : 
                  (selectedClass !== null ? classColors[selectedClass % classColors.length] : '#1890ff');
    
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize * scale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    if (brushPath.length === 1) {
      // Single point
      ctx.arc(brushPath[0].x * scale, brushPath[0].y * scale, (brushSize * scale) / 2, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      // Path
      ctx.moveTo(brushPath[0].x * scale, brushPath[0].y * scale);
      for (let i = 1; i < brushPath.length; i++) {
        ctx.lineTo(brushPath[i].x * scale, brushPath[i].y * scale);
      }
      ctx.stroke();
    }
    
    ctx.globalCompositeOperation = 'source-over';
  };

  // Draw class label
  const drawClassLabel = (ctx, annotation, color) => {
    const className = classes[annotation.classIndex]?.name || `Class ${annotation.classIndex}`;
    const confidence = annotation.confidence ? ` (${(annotation.confidence * 100).toFixed(1)}%)` : '';
    const label = className + confidence;
    
    let x, y;
    if (annotation.type === 'bbox') {
      x = annotation.bbox.x * scale;
      y = annotation.bbox.y * scale - 5;
    } else if (annotation.type === 'polygon' && annotation.points.length > 0) {
      x = annotation.points[0].x * scale;
      y = annotation.points[0].y * scale - 5;
    } else if (annotation.type === 'mask' && annotation.mask.length > 0) {
      x = annotation.mask[0].x * scale;
      y = annotation.mask[0].y * scale - 5;
    }
    
    if (x !== undefined && y !== undefined) {
      ctx.fillStyle = color;
      const textWidth = ctx.measureText(label).width;
      ctx.fillRect(x, y - 20, textWidth + 10, 20);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.fillText(label, x + 5, y - 8);
    }
  };

  // Get mouse position relative to canvas
  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale
    };
  };

  // Mouse event handlers
  const handleMouseDown = (e) => {
    const pos = getMousePos(e);
    
    if (tool === 'pan' || (e.button === 1)) { // Middle mouse button for pan
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }
    
    if (tool === 'select') {
      const clickedAnnotation = findAnnotationAtPoint(pos);
      setSelectedAnnotation(clickedAnnotation);
      return;
    }
    
    if (!selectedClass && tool !== 'select' && tool !== 'eraser') {
      message.warning('Please select a class first');
      return;
    }
    
    setIsDrawing(true);
    
    if (tool === 'bbox') {
      setCurrentAnnotation({
        type: 'bbox',
        bbox: { x: pos.x, y: pos.y, width: 0, height: 0 },
        classIndex: selectedClass
      });
    } else if (tool === 'polygon') {
      if (!currentAnnotation) {
        setCurrentAnnotation({
          type: 'polygon',
          points: [pos],
          classIndex: selectedClass
        });
        setPolygonPoints([pos]);
      } else {
        const newPoints = [...polygonPoints, pos];
        setPolygonPoints(newPoints);
        setCurrentAnnotation({
          ...currentAnnotation,
          points: newPoints
        });
      }
      setIsDrawing(false); // Polygon doesn't use continuous drawing
    } else if (tool === 'segment') {
      handleClickToSegment(pos);
      setIsDrawing(false);
    } else if (tool === 'brush' || tool === 'eraser') {
      setBrushPath([pos]);
    } else if (tool === 'magic') {
      handleMagicWand(pos);
      setIsDrawing(false);
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      const deltaX = e.clientX - lastPanPoint.x;
      const deltaY = e.clientY - lastPanPoint.y;
      
      setOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }
    
    if (!isDrawing) return;
    
    const pos = getMousePos(e);
    
    if (tool === 'bbox' && currentAnnotation) {
      const startX = currentAnnotation.bbox.x;
      const startY = currentAnnotation.bbox.y;
      
      setCurrentAnnotation({
        ...currentAnnotation,
        bbox: {
          x: Math.min(startX, pos.x),
          y: Math.min(startY, pos.y),
          width: Math.abs(pos.x - startX),
          height: Math.abs(pos.y - startY)
        }
      });
    } else if (tool === 'brush' || tool === 'eraser') {
      setBrushPath(prev => [...prev, pos]);
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }
    
    if (isDrawing) {
      if (tool === 'bbox' && currentAnnotation) {
        if (currentAnnotation.bbox.width > 5 && currentAnnotation.bbox.height > 5) {
          addAnnotation(currentAnnotation);
        }
        setCurrentAnnotation(null);
      } else if (tool === 'brush' || tool === 'eraser') {
        if (brushPath.length > 0) {
          if (tool === 'brush') {
            const annotation = {
              type: 'mask',
              mask: brushPath.map(point => ({ ...point, size: brushSize })),
              classIndex: selectedClass
            };
            addAnnotation(annotation);
          } else {
            // Eraser - remove parts of existing annotations
            eraseFromAnnotations(brushPath);
          }
          setBrushPath([]);
        }
      }
      setIsDrawing(false);
    }
  };

  // Double click to finish polygon
  const handleDoubleClick = () => {
    if (tool === 'polygon' && polygonPoints.length >= 3) {
      const annotation = {
        type: 'polygon',
        points: polygonPoints,
        classIndex: selectedClass
      };
      addAnnotation(annotation);
      setCurrentAnnotation(null);
      setPolygonPoints([]);
    }
  };

  // Click-to-segment using AI
  const handleClickToSegment = async (point) => {
    try {
      message.loading('Generating AI segment...', 0);
      
      const response = await fetch(`${API_BASE_URL}/api/segment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imageUrl,
          point: point,
          class_index: selectedClass,
          model_type: 'hybrid'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        const annotation = {
          type: 'polygon',
          points: result.polygon_points,
          classIndex: selectedClass,
          confidence: result.confidence,
          source: 'ai'
        };
        addAnnotation(annotation);
        message.destroy();
        message.success('AI segment generated successfully!');
      } else {
        throw new Error('Segmentation failed');
      }
    } catch (error) {
      message.destroy();
      message.error('Failed to generate AI segment');
      console.error('Segmentation error:', error);
    }
  };

  // Magic wand tool
  const handleMagicWand = async (point) => {
    try {
      message.loading('Selecting similar regions...', 0);
      
      // Simulate magic wand selection
      setTimeout(() => {
        const annotation = {
          type: 'polygon',
          points: generateMagicWandSelection(point),
          classIndex: selectedClass,
          source: 'magic_wand'
        };
        addAnnotation(annotation);
        message.destroy();
        message.success('Region selected!');
      }, 500);
      
    } catch (error) {
      message.destroy();
      message.error('Magic wand selection failed');
    }
  };

  // Generate magic wand selection (mock)
  const generateMagicWandSelection = (center) => {
    const points = [];
    const numPoints = 8;
    const radius = 50;
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (2 * Math.PI * i) / numPoints;
      const x = center.x + radius * Math.cos(angle);
      const y = center.y + radius * Math.sin(angle);
      points.push({ x, y });
    }
    
    return points;
  };

  // Find annotation at point
  const findAnnotationAtPoint = (point) => {
    for (let i = annotations.length - 1; i >= 0; i--) {
      const annotation = annotations[i];
      
      if (annotation.type === 'bbox') {
        const { x, y, width, height } = annotation.bbox;
        if (point.x >= x && point.x <= x + width && 
            point.y >= y && point.y <= y + height) {
          return i;
        }
      } else if (annotation.type === 'polygon') {
        if (isPointInPolygon(point, annotation.points)) {
          return i;
        }
      }
    }
    return null;
  };

  // Point in polygon test
  const isPointInPolygon = (point, polygon) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      if (((polygon[i].y > point.y) !== (polygon[j].y > point.y)) &&
          (point.x < (polygon[j].x - polygon[i].x) * (point.y - polygon[i].y) / (polygon[j].y - polygon[i].y) + polygon[i].x)) {
        inside = !inside;
      }
    }
    return inside;
  };

  // Add annotation to list
  const addAnnotation = (annotation) => {
    const newAnnotations = [...annotations, annotation];
    onAnnotationsChange(newAnnotations);
    
    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newAnnotations);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Erase from annotations
  const eraseFromAnnotations = (erasePath) => {
    // Implementation for erasing parts of annotations
    // This would modify existing annotations by removing overlapping areas
    console.log('Erasing from annotations:', erasePath);
  };

  // Redraw when dependencies change
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  useEffect(() => {
    redrawOverlay();
  }, [redrawOverlay]);

  return (
    <div 
      ref={containerRef}
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#f5f5f5'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          left: offset.x,
          top: offset.y,
          cursor: getCursor()
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onContextMenu={(e) => e.preventDefault()}
      />
      <canvas
        ref={overlayCanvasRef}
        style={{
          position: 'absolute',
          left: offset.x,
          top: offset.y,
          pointerEvents: 'none'
        }}
      />
    </div>
  );

  function getCursor() {
    switch (tool) {
      case 'select': return 'default';
      case 'bbox': return 'crosshair';
      case 'polygon': return 'crosshair';
      case 'segment': return 'crosshair';
      case 'brush': return 'crosshair';
      case 'eraser': return 'crosshair';
      case 'magic': return 'crosshair';
      case 'pan': return 'grab';
      default: return 'default';
    }
  }
};

export default EnhancedAnnotationCanvas;