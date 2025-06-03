import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Stage, Layer, Image as KonvaImage, Rect, Line, Circle } from 'react-konva';
import { 
  Layout, 
  Button, 
  List, 
  Input, 
  Card, 
  Space, 
  Tooltip, 
  message, 
  Modal, 
  Typography,
  Divider,
  Tag,
  Switch,
  Slider,
  Badge,
  Dropdown,
  Menu
} from 'antd';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  DragOutlined,
  BorderOutlined,
  UndoOutlined,
  RedoOutlined,
  DeleteOutlined,
  SaveOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  LockOutlined,
  UnlockOutlined,
  RobotOutlined,
  ClearOutlined,
  CopyOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Sider, Content } = Layout;
const { Text, Title } = Typography;
const { Search } = Input;

const AnnotateManual = () => {
  const { datasetId } = useParams();
  const [searchParams] = useSearchParams();
  const imageId = searchParams.get('imageId');
  const navigate = useNavigate();

  // State
  const [image, setImage] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [classes, setClasses] = useState([
    { id: 1, name: 'Good', color: '#52c41a' },
    { id: 2, name: 'Broken', color: '#ff4d4f' },
    { id: 3, name: 'Holes', color: '#1890ff' }
  ]);
  const [selectedClassId, setSelectedClassId] = useState(1);
  const [currentTool, setCurrentTool] = useState('drag'); // drag, bbox, polygon, smart-polygon, null
  const [isDrawing, setIsDrawing] = useState(false);
  const [newBox, setNewBox] = useState(null);
  const [newPolygon, setNewPolygon] = useState([]);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState(null);
  const [scale, setScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const [allImages, setAllImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoomLocked, setZoomLocked] = useState(false);
  const [lockedZoomValue, setLockedZoomValue] = useState(100);
  const [showClassSelector, setShowClassSelector] = useState(false);
  const [classFilter, setClassFilter] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [crosshairPos, setCrosshairPos] = useState(null);
  const [showAttributes, setShowAttributes] = useState(false);

  const stageRef = useRef();
  const transformerRef = useRef();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch (e.key.toLowerCase()) {
        case 'd':
          setCurrentTool('drag');
          break;
        case 'b':
          setCurrentTool('bbox');
          break;
        case 'p':
          setCurrentTool('polygon');
          break;
        case 's':
          setCurrentTool('smart-polygon');
          break;
        case 'n':
          setCurrentTool('null');
          break;
        case 'z':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
          }
          break;
        case 'delete':
        case 'backspace':
          if (selectedAnnotationId) {
            deleteSelectedAnnotation();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedAnnotationId, historyIndex]);

  // Load data on mount
  useEffect(() => {
    if (datasetId && imageId) {
      loadDatasetImages();
      loadImageAndAnnotations();
    }
  }, [datasetId, imageId]);

  // Auto-save when annotations change
  useEffect(() => {
    if (annotations.length > 0) {
      const autoSaveTimer = setTimeout(() => {
        saveAnnotations(false);
      }, 1000);
      return () => clearTimeout(autoSaveTimer);
    }
  }, [annotations]);

  // Add to history when annotations change
  useEffect(() => {
    if (annotations.length >= 0) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push([...annotations]);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  }, [annotations]);

  const loadDatasetImages = async () => {
    try {
      const response = await axios.get(`http://localhost:12000/api/v1/datasets/${datasetId}/images`);
      const images = response.data;
      setAllImages(images);
      const currentIndex = images.findIndex(img => img.id === imageId);
      setCurrentImageIndex(currentIndex >= 0 ? currentIndex : 0);
    } catch (error) {
      console.error('Error loading dataset images:', error);
    }
  };

  const loadImageAndAnnotations = async () => {
    try {
      const imageResponse = await axios.get(`http://localhost:12000/api/v1/datasets/images/${imageId}`);
      const imageInfo = imageResponse.data;
      setImageData(imageInfo);

      // Load image
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setImage(img);
        // Center and fit image
        const stage = stageRef.current;
        if (stage) {
          const containerWidth = stage.width();
          const containerHeight = stage.height();
          const newScale = Math.min(containerWidth / img.width, containerHeight / img.height) * 0.8;
          
          if (zoomLocked) {
            setScale(lockedZoomValue / 100);
          } else {
            setScale(newScale);
          }
          
          setStagePos({
            x: (containerWidth - img.width * (zoomLocked ? lockedZoomValue / 100 : newScale)) / 2,
            y: (containerHeight - img.height * (zoomLocked ? lockedZoomValue / 100 : newScale)) / 2
          });
        }
      };
      img.src = `http://localhost:12000${imageInfo.file_path}`;

      // Load annotations
      try {
        const annotationsResponse = await axios.get(`http://localhost:12000/api/v1/images/${imageId}/annotations`);
        const loadedAnnotations = annotationsResponse.data.map((ann, index) => ({
          id: `annotation-${index}`,
          type: 'bbox',
          classId: ann.class_id,
          x: ann.x,
          y: ann.y,
          width: ann.width,
          height: ann.height,
          visible: true
        }));
        setAnnotations(loadedAnnotations);
      } catch (error) {
        console.log('No existing annotations found');
        setAnnotations([]);
      }
    } catch (error) {
      console.error('Error loading image:', error);
      message.error('Failed to load image');
    }
  };

  const saveAnnotations = async (showMessage = true) => {
    try {
      setSaving(true);
      const annotationsData = annotations
        .filter(ann => ann.type === 'bbox')
        .map(ann => ({
          class_id: ann.classId,
          x: ann.x,
          y: ann.y,
          width: ann.width,
          height: ann.height
        }));

      await axios.post(`http://localhost:12000/api/v1/images/${imageId}/annotations`, {
        annotations: annotationsData
      });

      await axios.patch(`http://localhost:12000/api/v1/images/${imageId}`, {
        is_labeled: annotations.length > 0
      });

      if (showMessage) {
        message.success('Annotations saved successfully');
      }
    } catch (error) {
      console.error('Error saving annotations:', error);
      if (showMessage) {
        message.error('Failed to save annotations');
      }
    } finally {
      setSaving(false);
    }
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setAnnotations([...history[historyIndex - 1]]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setAnnotations([...history[historyIndex + 1]]);
    }
  };

  const repeatPrevious = () => {
    // This would copy annotations from the previous image
    message.info('Repeat Previous functionality - to be implemented');
  };

  // Drawing handlers
  const handleMouseDown = (e) => {
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    const transform = stage.getAbsoluteTransform().copy().invert();
    const localPos = transform.point(pointer);

    if (currentTool === 'bbox') {
      setIsDrawing(true);
      setNewBox({
        x: localPos.x,
        y: localPos.y,
        width: 0,
        height: 0
      });
    } else if (currentTool === 'polygon') {
      setNewPolygon(prev => [...prev, localPos.x, localPos.y]);
    }
  };

  const handleMouseMove = (e) => {
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    const transform = stage.getAbsoluteTransform().copy().invert();
    const localPos = transform.point(pointer);

    // Show crosshairs for drawing tools
    if (['bbox', 'polygon', 'smart-polygon'].includes(currentTool)) {
      setCrosshairPos(pointer);
    } else {
      setCrosshairPos(null);
    }

    if (!isDrawing || currentTool !== 'bbox') return;

    setNewBox(prev => ({
      ...prev,
      width: localPos.x - prev.x,
      height: localPos.y - prev.y
    }));
  };

  const handleMouseUp = () => {
    if (!isDrawing || currentTool !== 'bbox') return;

    if (newBox && Math.abs(newBox.width) > 10 && Math.abs(newBox.height) > 10) {
      const finalBox = {
        id: `annotation-${Date.now()}`,
        type: 'bbox',
        classId: selectedClassId,
        x: newBox.width < 0 ? newBox.x + newBox.width : newBox.x,
        y: newBox.height < 0 ? newBox.y + newBox.height : newBox.y,
        width: Math.abs(newBox.width),
        height: Math.abs(newBox.height),
        visible: true
      };
      setAnnotations(prev => [...prev, finalBox]);
      setShowClassSelector(true);
    }

    setIsDrawing(false);
    setNewBox(null);
    setCurrentTool('drag');
  };

  const handlePolygonComplete = () => {
    if (newPolygon.length >= 6) { // At least 3 points
      const finalPolygon = {
        id: `annotation-${Date.now()}`,
        type: 'polygon',
        classId: selectedClassId,
        points: newPolygon,
        visible: true
      };
      setAnnotations(prev => [...prev, finalPolygon]);
      setShowClassSelector(true);
    }
    setNewPolygon([]);
    setCurrentTool('drag');
  };

  const navigateToImage = (direction) => {
    const newIndex = direction === 'next' ? currentImageIndex + 1 : currentImageIndex - 1;
    if (newIndex >= 0 && newIndex < allImages.length) {
      const targetImage = allImages[newIndex];
      navigate(`/annotate/${datasetId}/manual?imageId=${targetImage.id}`);
    }
  };

  const deleteSelectedAnnotation = () => {
    if (selectedAnnotationId) {
      setAnnotations(prev => prev.filter(ann => ann.id !== selectedAnnotationId));
      setSelectedAnnotationId(null);
    }
  };

  const toggleAnnotationVisibility = (annotationId) => {
    setAnnotations(prev => prev.map(ann => 
      ann.id === annotationId ? { ...ann, visible: !ann.visible } : ann
    ));
  };

  const markAsNull = () => {
    setAnnotations([]);
    message.success('Image marked as null/background');
  };

  const labelAssist = () => {
    message.info('Label Assist (Auto-annotation) - to be implemented');
  };

  const createNewClass = () => {
    if (newClassName.trim()) {
      const newClass = {
        id: Math.max(...classes.map(c => c.id)) + 1,
        name: newClassName.trim(),
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`
      };
      setClasses(prev => [...prev, newClass]);
      setSelectedClassId(newClass.id);
      setNewClassName('');
      setClassFilter('');
      message.success(`Class "${newClass.name}" created`);
    }
  };

  const getClassById = (id) => classes.find(cls => cls.id === id);

  const filteredClasses = classes.filter(cls => 
    cls.name.toLowerCase().includes(classFilter.toLowerCase())
  );

  const tools = [
    { key: 'drag', icon: <DragOutlined />, label: 'Drag & Select', shortcut: 'D' },
    { key: 'bbox', icon: <BorderOutlined />, label: 'Bounding Box', shortcut: 'B' },
    { key: 'polygon', icon: <BorderOutlined style={{ transform: 'rotate(45deg)' }} />, label: 'Polygon', shortcut: 'P' },
    { key: 'smart-polygon', icon: <RobotOutlined />, label: 'Smart Polygon', shortcut: 'S' },
    { key: 'null', icon: <ClearOutlined />, label: 'Mark Null', shortcut: 'N' }
  ];

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#1a1a1a' }}>
      {/* Crosshairs */}
      {crosshairPos && (
        <div style={{
          position: 'absolute',
          left: crosshairPos.x,
          top: crosshairPos.y,
          width: '20px',
          height: '20px',
          border: '1px solid #fff',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 1000,
          transform: 'translate(-10px, -10px)'
        }} />
      )}

      {/* Top Header */}
      <div style={{
        background: '#2d2d2d',
        color: '#fff',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #404040'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Button 
            type="text" 
            icon={<ArrowLeftOutlined />}
            style={{ color: '#fff' }}
            onClick={() => navigate(`/annotate-progress/${datasetId}`)}
          >
            Back
          </Button>
          <Text style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>
            {imageData?.filename}
          </Text>
          <Button
            type="text"
            icon={<InfoCircleOutlined />}
            style={{ color: '#fff' }}
            onClick={() => setShowAttributes(!showAttributes)}
          >
            Info
          </Button>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Button 
            type="text" 
            icon={<ArrowLeftOutlined />}
            style={{ color: '#fff' }}
            onClick={() => navigateToImage('prev')}
            disabled={currentImageIndex <= 0}
          >
            Previous
          </Button>
          <Text style={{ color: '#fff' }}>
            {currentImageIndex + 1} / {allImages.length}
          </Text>
          <Button 
            type="text" 
            icon={<ArrowRightOutlined />}
            style={{ color: '#fff' }}
            onClick={() => navigateToImage('next')}
            disabled={currentImageIndex >= allImages.length - 1}
          >
            Next
          </Button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {saving ? (
            <Text style={{ color: '#1890ff', fontSize: '12px' }}>
              <SaveOutlined spin /> Saving...
            </Text>
          ) : (
            <Text style={{ color: '#52c41a', fontSize: '12px' }}>
              <CheckCircleOutlined /> Auto-saved
            </Text>
          )}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex' }}>
        {/* Left Sidebar */}
        <div style={{
          width: '320px',
          background: '#fff',
          borderRight: '1px solid #d9d9d9',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Tools */}
          <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
            <Text strong style={{ display: 'block', marginBottom: '12px' }}>Tools</Text>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {tools.map(tool => (
                <Tooltip key={tool.key} title={`${tool.label} (${tool.shortcut})`}>
                  <Button
                    type={currentTool === tool.key ? 'primary' : 'default'}
                    icon={tool.icon}
                    onClick={() => {
                      setCurrentTool(tool.key);
                      if (tool.key === 'null') markAsNull();
                    }}
                    size="small"
                    style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    {tool.shortcut}
                  </Button>
                </Tooltip>
              ))}
            </div>
            
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
              <Tooltip title="Undo (Ctrl+Z)">
                <Button
                  icon={<UndoOutlined />}
                  onClick={undo}
                  disabled={historyIndex <= 0}
                  size="small"
                />
              </Tooltip>
              <Tooltip title="Redo (Ctrl+Shift+Z)">
                <Button
                  icon={<RedoOutlined />}
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1}
                  size="small"
                />
              </Tooltip>
              <Tooltip title="Repeat Previous">
                <Button
                  icon={<CopyOutlined />}
                  onClick={repeatPrevious}
                  size="small"
                />
              </Tooltip>
              <Tooltip title="Label Assist">
                <Button
                  icon={<RobotOutlined />}
                  onClick={labelAssist}
                  size="small"
                />
              </Tooltip>
            </div>
          </div>

          {/* Class Selector */}
          <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
            <Text strong style={{ display: 'block', marginBottom: '12px' }}>Classes</Text>
            
            <Search
              placeholder="Filter or create class..."
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              onSearch={createNewClass}
              style={{ marginBottom: '12px' }}
              enterButton="Create"
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
              {filteredClasses.map(cls => (
                <div
                  key={cls.id}
                  onClick={() => setSelectedClassId(cls.id)}
                  style={{
                    padding: '8px 12px',
                    border: `2px solid ${selectedClassId === cls.id ? cls.color : '#d9d9d9'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: selectedClassId === cls.id ? `${cls.color}20` : '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: cls.color
                  }} />
                  <Text strong>{cls.name}</Text>
                </div>
              ))}
              
              {classFilter && !filteredClasses.some(cls => cls.name.toLowerCase() === classFilter.toLowerCase()) && (
                <div
                  onClick={() => {
                    setNewClassName(classFilter);
                    createNewClass();
                  }}
                  style={{
                    padding: '8px 12px',
                    border: '2px dashed #d9d9d9',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <PlusOutlined />
                  <Text>Create "{classFilter}"</Text>
                </div>
              )}
            </div>
          </div>

          {/* Annotations List */}
          <div style={{ flex: 1, padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <Text strong>Annotations ({annotations.length})</Text>
              <Button
                icon={<DeleteOutlined />}
                onClick={deleteSelectedAnnotation}
                disabled={!selectedAnnotationId}
                danger
                size="small"
              />
            </div>
            
            <List
              size="small"
              dataSource={annotations}
              renderItem={(ann) => {
                const cls = getClassById(ann.classId);
                return (
                  <List.Item
                    style={{
                      padding: '8px',
                      border: selectedAnnotationId === ann.id ? '2px solid #1890ff' : '1px solid #f0f0f0',
                      borderRadius: '4px',
                      marginBottom: '4px',
                      cursor: 'pointer',
                      opacity: ann.visible ? 1 : 0.5
                    }}
                    onClick={() => setSelectedAnnotationId(ann.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: cls?.color
                      }} />
                      <div style={{ flex: 1 }}>
                        <Text strong>{cls?.name}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                          {ann.type === 'bbox' ? `${Math.round(ann.width)} × ${Math.round(ann.height)}` : 'Polygon'}
                        </Text>
                      </div>
                      <Button
                        type="text"
                        icon={ann.visible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAnnotationVisibility(ann.id);
                        }}
                        size="small"
                      />
                    </div>
                  </List.Item>
                );
              }}
            />
          </div>

          {/* Image Attributes */}
          {showAttributes && imageData && (
            <div style={{ padding: '16px', borderTop: '1px solid #f0f0f0', background: '#fafafa' }}>
              <Text strong style={{ display: 'block', marginBottom: '8px' }}>Image Attributes</Text>
              <div style={{ fontSize: '12px' }}>
                <div>Filename: {imageData.filename}</div>
                <div>Size: {imageData.width || 'N/A'} × {imageData.height || 'N/A'}</div>
                <div>Format: {imageData.filename?.split('.').pop()?.toUpperCase() || 'N/A'}</div>
                <div>Created: {new Date(imageData.created_at).toLocaleDateString()}</div>
              </div>
            </div>
          )}
        </div>

        {/* Main Canvas Area */}
        <div style={{ flex: 1, position: 'relative', background: '#2a2a2a' }}>
          {/* Zoom Controls */}
          <div style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            zIndex: 1000,
            background: 'rgba(255,255,255,0.9)',
            borderRadius: '6px',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Button
              size="small"
              icon={<ZoomOutOutlined />}
              onClick={() => {
                const newScale = Math.max(0.1, scale - 0.1);
                setScale(newScale);
                if (zoomLocked) setLockedZoomValue(newScale * 100);
              }}
            />
            <Text style={{ minWidth: '50px', textAlign: 'center' }}>
              {Math.round(scale * 100)}%
            </Text>
            <Button
              size="small"
              icon={<ZoomInOutlined />}
              onClick={() => {
                const newScale = Math.min(3, scale + 0.1);
                setScale(newScale);
                if (zoomLocked) setLockedZoomValue(newScale * 100);
              }}
            />
            <Button
              size="small"
              type={zoomLocked ? 'primary' : 'default'}
              icon={zoomLocked ? <LockOutlined /> : <UnlockOutlined />}
              onClick={() => {
                setZoomLocked(!zoomLocked);
                if (!zoomLocked) setLockedZoomValue(scale * 100);
              }}
            />
          </div>

          {/* Canvas */}
          <Stage
            ref={stageRef}
            width={window.innerWidth - 320}
            height={window.innerHeight - 60}
            scaleX={scale}
            scaleY={scale}
            x={stagePos.x}
            y={stagePos.y}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            draggable={currentTool === 'drag'}
          >
            <Layer>
              {image && (
                <KonvaImage
                  image={image}
                  x={0}
                  y={0}
                />
              )}
              
              {/* Existing annotations */}
              {annotations.map(ann => {
                if (!ann.visible) return null;
                const cls = getClassById(ann.classId);
                
                if (ann.type === 'bbox') {
                  return (
                    <Rect
                      key={ann.id}
                      x={ann.x}
                      y={ann.y}
                      width={ann.width}
                      height={ann.height}
                      stroke={cls?.color}
                      strokeWidth={selectedAnnotationId === ann.id ? 3 : 2}
                      fill="transparent"
                      onClick={() => setSelectedAnnotationId(ann.id)}
                    />
                  );
                } else if (ann.type === 'polygon') {
                  return (
                    <Line
                      key={ann.id}
                      points={ann.points}
                      stroke={cls?.color}
                      strokeWidth={selectedAnnotationId === ann.id ? 3 : 2}
                      fill="transparent"
                      closed
                      onClick={() => setSelectedAnnotationId(ann.id)}
                    />
                  );
                }
                return null;
              })}

              {/* New box being drawn */}
              {newBox && (
                <Rect
                  x={newBox.width < 0 ? newBox.x + newBox.width : newBox.x}
                  y={newBox.height < 0 ? newBox.y + newBox.height : newBox.y}
                  width={Math.abs(newBox.width)}
                  height={Math.abs(newBox.height)}
                  stroke={getClassById(selectedClassId)?.color}
                  strokeWidth={2}
                  fill="transparent"
                  dash={[5, 5]}
                />
              )}

              {/* New polygon being drawn */}
              {newPolygon.length > 0 && (
                <>
                  <Line
                    points={newPolygon}
                    stroke={getClassById(selectedClassId)?.color}
                    strokeWidth={2}
                    fill="transparent"
                    dash={[5, 5]}
                  />
                  {/* Show polygon points */}
                  {Array.from({ length: newPolygon.length / 2 }).map((_, i) => (
                    <Circle
                      key={i}
                      x={newPolygon[i * 2]}
                      y={newPolygon[i * 2 + 1]}
                      radius={3}
                      fill={getClassById(selectedClassId)?.color}
                    />
                  ))}
                </>
              )}
            </Layer>
          </Stage>

          {/* Polygon completion button */}
          {newPolygon.length >= 6 && (
            <div style={{
              position: 'absolute',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1000
            }}>
              <Button
                type="primary"
                onClick={handlePolygonComplete}
                size="large"
              >
                Complete Polygon
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnotateManual;