import React, { useRef, useEffect, useState, useCallback } from 'react';
import { API_BASE_URL } from '../config';
import { Button, Space, Select, InputNumber, message, Tooltip, Card } from 'antd';
import {
  EditOutlined,
  BorderOutlined,
  HighlightOutlined,
  AimOutlined,
  UndoOutlined,
  RedoOutlined,
  DeleteOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  DragOutlined
} from '@ant-design/icons';

const { Option } = Select;

const AdvancedAnnotationCanvas = ({ 
  imageUrl, 
  annotations = [], 
  onAnnotationsChange,
  classes = [],
  selectedClass = null,
  onClassChange,
  selectedTool = 'select',
  brushSize = 10,
  opacity = 0.7,
  showAnnotationsDefault = true,
  annotationMode = 'detection'
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  // Sync tool with prop
  useEffect(() => {
    setTool(selectedTool);
  }, [selectedTool]);
  
  const [tool, setTool] = useState(selectedTool);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] = useState(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showAnnotations, setShowAnnotations] = useState(showAnnotationsDefault);
  const [polygonPoints, setPolygonPoints] = useState([]);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });

  // Colors for different classes
  const classColors = [
    '#ff4d4f', '#52c41a', '#1890ff', '#fa8c16', '#722ed1',
    '#eb2f96', '#13c2c2', '#a0d911', '#fadb14', '#f759ab'
  ];

  // Initialize canvas and load image
  useEffect(() => {
    if (!imageUrl) return;
    
    console.log(`Loading image from URL: ${imageUrl}`);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      console.log(`Image loaded! Dimensions: ${img.width}x${img.height}`);
      const container = containerRef.current;
      const containerWidth = container.clientWidth - 40; // padding
      const containerHeight = container.clientHeight - 40;
      
      // Calculate scale to fit image in container
      const scaleX = containerWidth / img.width;
      const scaleY = containerHeight / img.height;
      const initialScale = Math.min(scaleX, scaleY, 1);
      
      setScale(initialScale);
      setImageSize({ width: img.width, height: img.height });
      
      canvas.width = img.width * initialScale;
      canvas.height = img.height * initialScale;
      
      console.log('🖼️ Canvas setup:', {
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        containerWidth,
        containerHeight,
        imageWidth: img.width,
        imageHeight: img.height,
        initialScale
      });
      
      // Center the image
      setOffset({
        x: (containerWidth - canvas.width) / 2,
        y: (containerHeight - canvas.height) / 2
      });
      
      redrawCanvas();
    };

    img.onerror = (error) => {
      console.error('Failed to load image:', error);
      console.error('Image URL:', imageUrl);
    };
    
    img.src = imageUrl;
  }, [imageUrl]);

  // Redraw canvas with image and annotations
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw image
    if (imageUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Draw annotations if visible
        if (showAnnotations) {
          drawAnnotations(ctx);
        }
        
        // Draw current drawing
        if (currentAnnotation) {
          drawCurrentAnnotation(ctx);
        }
      };
      img.src = imageUrl;
    }
  }, [imageUrl, annotations, currentAnnotation, showAnnotations, selectedAnnotation]);

  // Draw all annotations
  const drawAnnotations = (ctx) => {
    annotations.forEach((annotation, index) => {
      const color = classColors[annotation.classIndex % classColors.length];
      const isSelected = selectedAnnotation === index;
      
      ctx.strokeStyle = isSelected ? '#ff4d4f' : color;
      ctx.fillStyle = color + '20'; // 20% opacity
      ctx.lineWidth = isSelected ? 3 : 2;
      
      if (annotation.type === 'bbox') {
        drawBoundingBox(ctx, annotation.bbox);
      } else if (annotation.type === 'polygon') {
        drawPolygon(ctx, annotation.points);
      }
      
      // Draw class label
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
    
    // Draw points
    points.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x * scale, point.y * scale, 4, 0, 2 * Math.PI);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fill();
    });
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
    }
    
    // Background
    ctx.fillStyle = color;
    const textWidth = ctx.measureText(label).width;
    ctx.fillRect(x, y - 20, textWidth + 10, 20);
    
    // Text
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.fillText(label, x + 5, y - 8);
  };

  // Draw current annotation being created
  const drawCurrentAnnotation = (ctx) => {
    if (!currentAnnotation) return;
    
    const color = selectedClass !== null ? classColors[selectedClass % classColors.length] : '#1890ff';
    ctx.strokeStyle = color;
    ctx.fillStyle = color + '20';
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
    console.log('🖱️ Mouse down event:', { tool, selectedClass, e });
    const pos = getMousePos(e);
    console.log('📍 Mouse position:', pos);
    
    if (tool === 'pan') {
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }
    
    if (tool === 'select') {
      // Check if clicking on existing annotation
      const clickedAnnotation = findAnnotationAtPoint(pos);
      setSelectedAnnotation(clickedAnnotation);
      return;
    }
    
    if (selectedClass === null || selectedClass === undefined) {
      console.log('❌ No class selected:', selectedClass);
      message.warning('Please select a class first');
      return;
    }
    
    if (tool === 'bbox') {
      console.log('✅ Creating bbox annotation');
      setIsDrawing(true);
      setCurrentAnnotation({
        type: 'bbox',
        bbox: { x: pos.x, y: pos.y, width: 0, height: 0 },
        classIndex: selectedClass
      });
      console.log('Set isDrawing to true and currentAnnotation');
    } else if (tool === 'polygon') {
      if (!currentAnnotation) {
        // Start new polygon
        setCurrentAnnotation({
          type: 'polygon',
          points: [pos],
          classIndex: selectedClass
        });
        setPolygonPoints([pos]);
      } else {
        // Add point to existing polygon
        const newPoints = [...polygonPoints, pos];
        setPolygonPoints(newPoints);
        setCurrentAnnotation({
          ...currentAnnotation,
          points: newPoints
        });
      }
    } else if (tool === 'segment') {
      // Click-to-segment functionality
      handleClickToSegment(pos);
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
    
    if (!isDrawing || !currentAnnotation) return;
    
    const pos = getMousePos(e);
    
    if (tool === 'bbox') {
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
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }
    
    if (isDrawing && currentAnnotation && tool === 'bbox') {
      // Finish bounding box
      if (currentAnnotation.bbox.width > 5 && currentAnnotation.bbox.height > 5) {
        addAnnotation(currentAnnotation);
      }
      setCurrentAnnotation(null);
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

  // Delete selected annotation
  const deleteSelectedAnnotation = () => {
    if (selectedAnnotation !== null) {
      const newAnnotations = annotations.filter((_, index) => index !== selectedAnnotation);
      onAnnotationsChange(newAnnotations);
      setSelectedAnnotation(null);
      
      // Add to history
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newAnnotations);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  };

  // Undo/Redo
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      onAnnotationsChange(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      onAnnotationsChange(history[historyIndex + 1]);
    }
  };

  // Click-to-segment using AI
  const handleClickToSegment = async (point) => {
    try {
      message.loading('Generating segment...', 0);
      
      // Call SAM or similar segmentation API
      const response = await fetch(`${API_BASE_URL}/api/segment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imageUrl,
          point: point,
          class_index: selectedClass
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        const annotation = {
          type: 'polygon',
          points: result.polygon_points,
          classIndex: selectedClass,
          confidence: result.confidence
        };
        addAnnotation(annotation);
        message.destroy();
        message.success('Segment generated successfully!');
      } else {
        throw new Error('Segmentation failed');
      }
    } catch (error) {
      message.destroy();
      message.error('Failed to generate segment');
      console.error('Segmentation error:', error);
    }
  };

  // Zoom functions
  const zoomIn = () => {
    setScale(prev => Math.min(prev * 1.2, 5));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev / 1.2, 0.1));
  };

  const resetZoom = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  // Redraw when scale or annotations change
  useEffect(() => {
    if (canvasRef.current && imageUrl) {
      const canvas = canvasRef.current;
      canvas.width = imageSize.width * scale;
      canvas.height = imageSize.height * scale;
      redrawCanvas();
    }
  }, [scale, annotations, redrawCanvas, imageSize]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <Card size="small" style={{ marginBottom: 8 }}>
        <Space wrap>
          {/* Tool Selection */}
          <Space>
            <Tooltip title="Select Tool">
              <Button 
                type={tool === 'select' ? 'primary' : 'default'}
                icon={<DragOutlined />}
                onClick={() => setTool('select')}
              />
            </Tooltip>
            <Tooltip title="Bounding Box">
              <Button 
                type={tool === 'bbox' ? 'primary' : 'default'}
                icon={<BorderOutlined />}
                onClick={() => setTool('bbox')}
              />
            </Tooltip>
            <Tooltip title="Polygon">
              <Button 
                type={tool === 'polygon' ? 'primary' : 'default'}
                icon={<EditOutlined />}
                onClick={() => setTool('polygon')}
              />
            </Tooltip>
            <Tooltip title="Click to Segment (AI)">
              <Button 
                type={tool === 'segment' ? 'primary' : 'default'}
                icon={<AimOutlined />}
                onClick={() => setTool('segment')}
              />
            </Tooltip>
            <Tooltip title="Pan">
              <Button 
                type={tool === 'pan' ? 'primary' : 'default'}
                icon={<HighlightOutlined />}
                onClick={() => setTool('pan')}
              />
            </Tooltip>
          </Space>

          {/* Actions */}
          <Space>
            <Tooltip title="Undo">
              <Button 
                icon={<UndoOutlined />}
                onClick={undo}
                disabled={historyIndex <= 0}
              />
            </Tooltip>
            <Tooltip title="Redo">
              <Button 
                icon={<RedoOutlined />}
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
              />
            </Tooltip>
            <Tooltip title="Delete Selected">
              <Button 
                icon={<DeleteOutlined />}
                onClick={deleteSelectedAnnotation}
                disabled={selectedAnnotation === null}
                danger
              />
            </Tooltip>
          </Space>

          {/* View Controls */}
          <Space>
            <Tooltip title="Toggle Annotations">
              <Button 
                icon={showAnnotations ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                onClick={() => setShowAnnotations(!showAnnotations)}
              />
            </Tooltip>
            <Tooltip title="Zoom In">
              <Button icon={<ZoomInOutlined />} onClick={zoomIn} />
            </Tooltip>
            <Tooltip title="Zoom Out">
              <Button icon={<ZoomOutOutlined />} onClick={zoomOut} />
            </Tooltip>
            <InputNumber
              value={Math.round(scale * 100)}
              min={10}
              max={500}
              formatter={value => `${value}%`}
              parser={value => value.replace('%', '')}
              onChange={value => setScale(value / 100)}
              style={{ width: 80 }}
            />
          </Space>

          {/* Class Selection */}
          <Select
            placeholder="Select class"
            value={selectedClass}
            onChange={onClassChange}
            style={{ width: 150 }}
          >
            {classes.map((cls, index) => (
              <Option key={index} value={index}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div 
                    style={{
                      width: 12,
                      height: 12,
                      backgroundColor: classColors[index % classColors.length],
                      marginRight: 8,
                      borderRadius: 2
                    }}
                  />
                  {cls.name}
                </div>
              </Option>
            ))}
          </Select>
        </Space>
      </Card>

      {/* Canvas Container */}
      <div 
        ref={containerRef}
        style={{ 
          flex: 1, 
          overflow: 'hidden', 
          position: 'relative',
          border: '1px solid #d9d9d9',
          borderRadius: 6,
          backgroundColor: '#fafafa'
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            left: offset.x,
            top: offset.y,
            cursor: tool === 'pan' ? 'grab' : tool === 'select' ? 'default' : 'crosshair'
          }}
          onClick={(e) => alert('Canvas clicked!')}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onDoubleClick={handleDoubleClick}
        />
      </div>

      {/* Status Bar */}
      <div style={{ 
        padding: '8px 12px', 
        backgroundColor: '#f5f5f5', 
        borderTop: '1px solid #d9d9d9',
        fontSize: 12,
        color: '#666'
      }}>
        <Space>
          <span>Tool: {tool}</span>
          <span>|</span>
          <span>Annotations: {annotations.length}</span>
          <span>|</span>
          <span>Zoom: {Math.round(scale * 100)}%</span>
          {selectedAnnotation !== null && (
            <>
              <span>|</span>
              <span>Selected: {annotations[selectedAnnotation]?.type}</span>
            </>
          )}
          {tool === 'polygon' && polygonPoints.length > 0 && (
            <>
              <span>|</span>
              <span>Points: {polygonPoints.length} (double-click to finish)</span>
            </>
          )}
        </Space>
      </div>
    </div>
  );
};

export default AdvancedAnnotationCanvas;