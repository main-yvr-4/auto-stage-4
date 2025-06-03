import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Layout, 
  Button, 
  Typography, 
  Card, 
  List, 
  Input, 
  Tag, 
  Space, 
  Divider, 
  message, 
  Tabs,
  Tooltip,
  Spin,
  Select,
  Modal,
  Badge,
  Switch,
  Slider,
  Popover,
  ColorPicker
} from 'antd';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  PlusOutlined,
  DeleteOutlined,
  UndoOutlined,
  RedoOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  DragOutlined,
  BorderOutlined,
  SaveOutlined,
  CheckCircleOutlined,
  SelectOutlined,
  ExpandOutlined,
  BgColorsOutlined,
  LockOutlined,
  UnlockOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  ClearOutlined,
  CopyOutlined,
  HistoryOutlined,
  CommentOutlined,
  InfoCircleOutlined,
  ToolOutlined,
  AimOutlined
} from '@ant-design/icons';
import { Stage, Layer, Image as KonvaImage, Rect, Transformer, Line, Circle, Text as KonvaText } from 'react-konva';
import axios from 'axios';

const { Sider, Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

// Tool types matching Roboflow
const TOOLS = {
  SELECT: 'select', // Drag and Select (D)
  BBOX: 'bbox',     // Bounding Box (B)
  POLYGON: 'polygon', // Polygon (P)
  SMART_POLYGON: 'smart_polygon', // Smart Polygon (S)
  MARK_NULL: 'mark_null' // Mark Null (N)
};

// Default classes with colors
const DEFAULT_CLASSES = [
  { name: 'Good', color: '#52c41a' },
  { name: 'Broken', color: '#ff4d4f' },
  { name: 'Holes', color: '#faad14' }
];

const AnnotateManualEnhanced = () => {
  const { datasetId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const imageId = searchParams.get('imageId');

  // Refs
  const stageRef = useRef();
  const transformerRef = useRef();
  const imageRef = useRef();

  // Core state
  const [imageInfo, setImageInfo] = useState(null);
  const [konvaImage, setKonvaImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Tool state
  const [currentTool, setCurrentTool] = useState(TOOLS.SELECT);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showCrosshairs, setShowCrosshairs] = useState(false);

  // Annotation state
  const [annotations, setAnnotations] = useState([]);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState(null);
  const [classes, setClasses] = useState(DEFAULT_CLASSES);
  const [selectedClass, setSelectedClass] = useState(DEFAULT_CLASSES[0]);

  // Drawing state
  const [currentPath, setCurrentPath] = useState([]);
  const [tempAnnotation, setTempAnnotation] = useState(null);

  // UI state
  const [zoom, setZoom] = useState(1);
  const [zoomLocked, setZoomLocked] = useState(false);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState('classes');
  const [showClassSelector, setShowClassSelector] = useState(false);
  const [newClassName, setNewClassName] = useState('');

  // History state
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // Navigation state
  const [allImages, setAllImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Load image and dataset
  useEffect(() => {
    if (imageId && datasetId) {
      loadImage();
      loadDatasetImages();
    }
  }, [imageId, datasetId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch (e.key.toLowerCase()) {
        case 'd':
          setCurrentTool(TOOLS.SELECT);
          setShowCrosshairs(false);
          break;
        case 'b':
          setCurrentTool(TOOLS.BBOX);
          setShowCrosshairs(true);
          break;
        case 'p':
          setCurrentTool(TOOLS.POLYGON);
          setShowCrosshairs(true);
          break;
        case 's':
          setCurrentTool(TOOLS.SMART_POLYGON);
          setShowCrosshairs(true);
          break;
        case 'n':
          setCurrentTool(TOOLS.MARK_NULL);
          markAsNull();
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
            deleteAnnotation(selectedAnnotationId);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedAnnotationId]);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled) return;
    
    const autoSaveTimer = setTimeout(() => {
      if (annotations.length > 0) {
        saveAnnotations(false); // Silent save
      }
    }, 2000);

    return () => clearTimeout(autoSaveTimer);
  }, [annotations, autoSaveEnabled]);

  const loadImage = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:12000/api/v1/datasets/images/${imageId}`);
      setImageInfo(response.data);
      
      // Load Konva image
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setKonvaImage(img);
        // Fit image to canvas
        const stage = stageRef.current;
        if (stage) {
          const containerWidth = stage.width();
          const containerHeight = stage.height();
          const scale = Math.min(containerWidth / img.width, containerHeight / img.height) * 0.8;
          setZoom(scale);
          setStagePos({
            x: (containerWidth - img.width * scale) / 2,
            y: (containerHeight - img.height * scale) / 2
          });
        }
      };
      img.src = `http://localhost:12000${response.data.file_path}`;
      
      // Load existing annotations
      if (response.data.annotations) {
        setAnnotations(response.data.annotations);
        addToHistory(response.data.annotations);
      }
    } catch (error) {
      console.error('Error loading image:', error);
      message.error('Failed to load image');
    } finally {
      setLoading(false);
    }
  };

  const loadDatasetImages = async () => {
    try {
      const response = await axios.get(`http://localhost:12000/api/v1/datasets/${datasetId}/images`);
      setAllImages(response.data);
      const currentIndex = response.data.findIndex(img => img.id === imageId);
      setCurrentImageIndex(currentIndex);
    } catch (error) {
      console.error('Error loading dataset images:', error);
    }
  };

  // History management
  const addToHistory = (newAnnotations) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newAnnotations]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setAnnotations([...history[newIndex]]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setAnnotations([...history[newIndex]]);
    }
  };

  // Tool handlers
  const handleStageMouseDown = (e) => {
    if (currentTool === TOOLS.SELECT) {
      // Check if clicking on annotation
      const clickedOnEmpty = e.target === e.target.getStage();
      if (clickedOnEmpty) {
        setSelectedAnnotationId(null);
      }
      return;
    }

    if (currentTool === TOOLS.BBOX) {
      startBoundingBox(e);
    } else if (currentTool === TOOLS.POLYGON) {
      addPolygonPoint(e);
    }
  };

  const startBoundingBox = (e) => {
    const pos = e.target.getStage().getPointerPosition();
    const stageAttrs = e.target.getStage().attrs;
    const x = (pos.x - stageAttrs.x) / stageAttrs.scaleX;
    const y = (pos.y - stageAttrs.y) / stageAttrs.scaleY;

    const newAnnotation = {
      id: Date.now().toString(),
      type: 'bbox',
      x,
      y,
      width: 0,
      height: 0,
      class: selectedClass.name,
      color: selectedClass.color,
      visible: true
    };

    setTempAnnotation(newAnnotation);
    setIsDrawing(true);
  };

  const handleStageMouseMove = (e) => {
    if (!isDrawing || !tempAnnotation) return;

    const pos = e.target.getStage().getPointerPosition();
    const stageAttrs = e.target.getStage().attrs;
    const x = (pos.x - stageAttrs.x) / stageAttrs.scaleX;
    const y = (pos.y - stageAttrs.y) / stageAttrs.scaleY;

    if (tempAnnotation.type === 'bbox') {
      const newWidth = x - tempAnnotation.x;
      const newHeight = y - tempAnnotation.y;
      
      setTempAnnotation({
        ...tempAnnotation,
        width: newWidth,
        height: newHeight
      });
    }
  };

  const handleStageMouseUp = () => {
    if (!isDrawing || !tempAnnotation) return;

    if (tempAnnotation.type === 'bbox' && 
        Math.abs(tempAnnotation.width) > 5 && 
        Math.abs(tempAnnotation.height) > 5) {
      
      // Normalize bbox
      const normalizedAnnotation = {
        ...tempAnnotation,
        x: tempAnnotation.width < 0 ? tempAnnotation.x + tempAnnotation.width : tempAnnotation.x,
        y: tempAnnotation.height < 0 ? tempAnnotation.y + tempAnnotation.height : tempAnnotation.y,
        width: Math.abs(tempAnnotation.width),
        height: Math.abs(tempAnnotation.height)
      };

      const newAnnotations = [...annotations, normalizedAnnotation];
      setAnnotations(newAnnotations);
      addToHistory(newAnnotations);
      setShowClassSelector(true);
      setSelectedAnnotationId(normalizedAnnotation.id);
    }

    setIsDrawing(false);
    setTempAnnotation(null);
  };

  // Class management
  const addClass = () => {
    if (!newClassName.trim()) return;
    
    const newClass = {
      name: newClassName.trim(),
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`
    };
    
    setClasses([...classes, newClass]);
    setNewClassName('');
    message.success(`Class "${newClass.name}" added`);
  };

  const deleteClass = (className) => {
    setClasses(classes.filter(c => c.name !== className));
    // Remove annotations with this class
    const newAnnotations = annotations.filter(a => a.class !== className);
    setAnnotations(newAnnotations);
    addToHistory(newAnnotations);
  };

  // Annotation management
  const deleteAnnotation = (annotationId) => {
    const newAnnotations = annotations.filter(a => a.id !== annotationId);
    setAnnotations(newAnnotations);
    addToHistory(newAnnotations);
    setSelectedAnnotationId(null);
  };

  const toggleAnnotationVisibility = (annotationId) => {
    const newAnnotations = annotations.map(a => 
      a.id === annotationId ? { ...a, visible: !a.visible } : a
    );
    setAnnotations(newAnnotations);
  };

  const markAsNull = () => {
    Modal.confirm({
      title: 'Mark as Null',
      content: 'This will clear all annotations and mark the image as background/null. Continue?',
      onOk: () => {
        setAnnotations([]);
        addToHistory([]);
        saveAnnotations(true);
        message.success('Image marked as null');
      }
    });
  };

  // Zoom controls
  const handleZoomIn = () => {
    const newZoom = Math.min(zoom * 1.2, 5);
    setZoom(newZoom);
    if (!zoomLocked) {
      const stage = stageRef.current;
      stage.scale({ x: newZoom, y: newZoom });
    }
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom / 1.2, 0.1);
    setZoom(newZoom);
    if (!zoomLocked) {
      const stage = stageRef.current;
      stage.scale({ x: newZoom, y: newZoom });
    }
  };

  const resetZoom = () => {
    setZoom(1);
    setStagePos({ x: 0, y: 0 });
    const stage = stageRef.current;
    stage.scale({ x: 1, y: 1 });
    stage.position({ x: 0, y: 0 });
  };

  // Save annotations
  const saveAnnotations = async (showMessage = true) => {
    try {
      setSaving(true);
      await axios.patch(`http://localhost:12000/api/v1/datasets/images/${imageId}`, {
        annotations,
        is_labeled: annotations.length > 0
      });
      
      if (showMessage) {
        message.success('Annotations saved successfully');
      }
    } catch (error) {
      console.error('Error saving annotations:', error);
      message.error('Failed to save annotations');
    } finally {
      setSaving(false);
    }
  };

  // Navigation
  const navigateToImage = (index) => {
    if (index >= 0 && index < allImages.length) {
      const newImageId = allImages[index].id;
      navigate(`/annotate/${datasetId}/manual?imageId=${newImageId}`);
    }
  };

  const goToPreviousImage = () => {
    navigateToImage(currentImageIndex - 1);
  };

  const goToNextImage = () => {
    navigateToImage(currentImageIndex + 1);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Layout style={{ height: '100vh', background: '#f0f2f5' }}>
      {/* Navigation Header */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '60px',
        background: 'rgba(0, 0, 0, 0.8)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        color: 'white'
      }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(`/annotate-progress/${datasetId}`)}
          style={{ background: 'transparent', border: 'none', color: 'white' }}
        />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Text style={{ color: 'white', fontSize: '16px' }}>
            {currentImageIndex + 1} / {allImages.length}
          </Text>
          <Button 
            onClick={goToPreviousImage}
            disabled={currentImageIndex === 0}
            style={{ background: 'transparent', border: '1px solid white', color: 'white' }}
          >
            ← Previous
          </Button>
          <Button 
            onClick={goToNextImage}
            disabled={currentImageIndex === allImages.length - 1}
            style={{ background: 'transparent', border: '1px solid white', color: 'white' }}
          >
            Next →
          </Button>
        </div>
        
        <Text style={{ color: 'white', fontSize: '14px' }}>
          {imageInfo?.filename}
        </Text>
      </div>

      {/* Main Layout */}
      <Layout style={{ marginTop: '60px' }}>
        {/* Left Sidebar - Classes & Tools */}
        <Sider width={320} style={{ background: '#fff', borderRight: '1px solid #d9d9d9' }}>
          <div style={{ padding: '16px' }}>
            <Title level={4} style={{ margin: '0 0 16px 0' }}>
              Classes & Annotations
            </Title>
            
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={[
                {
                  key: 'classes',
                  label: 'Classes',
                  children: (
                    <div>
                      <Button 
                        type="dashed" 
                        icon={<PlusOutlined />} 
                        onClick={() => setShowClassSelector(true)}
                        block
                        style={{ marginBottom: '16px' }}
                      >
                        Add New Class
                      </Button>
                      
                      <List
                        dataSource={classes}
                        renderItem={(cls) => (
                          <List.Item
                            style={{ 
                              padding: '8px 12px',
                              border: selectedClass.name === cls.name ? `2px solid ${cls.color}` : '1px solid #f0f0f0',
                              borderRadius: '6px',
                              marginBottom: '8px',
                              cursor: 'pointer',
                              background: selectedClass.name === cls.name ? `${cls.color}10` : 'white'
                            }}
                            onClick={() => setSelectedClass(cls)}
                            actions={[
                              <Button 
                                type="text" 
                                size="small" 
                                icon={<DeleteOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteClass(cls.name);
                                }}
                              />
                            ]}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div 
                                style={{ 
                                  width: '16px', 
                                  height: '16px', 
                                  background: cls.color, 
                                  borderRadius: '3px' 
                                }} 
                              />
                              <Text strong>{cls.name}</Text>
                            </div>
                          </List.Item>
                        )}
                      />
                    </div>
                  )
                },
                {
                  key: 'history',
                  label: 'History',
                  children: (
                    <div>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Text type="secondary">Annotation History</Text>
                        <div>History: {historyIndex + 1} / {history.length}</div>
                        <Space>
                          <Button 
                            icon={<UndoOutlined />} 
                            onClick={undo}
                            disabled={historyIndex <= 0}
                            size="small"
                          >
                            Undo
                          </Button>
                          <Button 
                            icon={<RedoOutlined />} 
                            onClick={redo}
                            disabled={historyIndex >= history.length - 1}
                            size="small"
                          >
                            Redo
                          </Button>
                        </Space>
                      </Space>
                    </div>
                  )
                },
                {
                  key: 'comments',
                  label: 'Comments',
                  children: (
                    <div>
                      <TextArea 
                        placeholder="Add comments about this image..."
                        rows={4}
                        style={{ marginBottom: '12px' }}
                      />
                      <Button type="primary" size="small">
                        Add Comment
                      </Button>
                    </div>
                  )
                }
              ]}
            />
          </div>
        </Sider>

        {/* Center - Canvas Area */}
        <Content style={{ position: 'relative', background: '#2f2f2f' }}>
          {/* Tool Toolbar */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            zIndex: 100,
            background: 'white',
            borderRadius: '12px',
            padding: '12px 16px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            display: 'flex',
            gap: '8px',
            border: '1px solid #e0e0e0'
          }}>
            <Tooltip title="Drag and Select (D)" placement="bottom">
              <Button
                size="large"
                type={currentTool === TOOLS.SELECT ? 'primary' : 'default'}
                icon={<DragOutlined />}
                onClick={() => {
                  setCurrentTool(TOOLS.SELECT);
                  setShowCrosshairs(false);
                }}
                style={{ 
                  minWidth: '80px',
                  height: '40px',
                  fontSize: '14px',
                  fontWeight: currentTool === TOOLS.SELECT ? 'bold' : 'normal'
                }}
              >
                Drag
              </Button>
            </Tooltip>
            
            <Tooltip title="Bounding Box (B)" placement="bottom">
              <Button
                size="large"
                type={currentTool === TOOLS.BBOX ? 'primary' : 'default'}
                icon={<BorderOutlined />}
                onClick={() => {
                  setCurrentTool(TOOLS.BBOX);
                  setShowCrosshairs(true);
                }}
                style={{ 
                  minWidth: '80px',
                  height: '40px',
                  fontSize: '14px',
                  fontWeight: currentTool === TOOLS.BBOX ? 'bold' : 'normal'
                }}
              >
                Box
              </Button>
            </Tooltip>
            
            <Tooltip title="Polygon (P)" placement="bottom">
              <Button
                size="large"
                type={currentTool === TOOLS.POLYGON ? 'primary' : 'default'}
                icon={<ExpandOutlined />}
                onClick={() => {
                  setCurrentTool(TOOLS.POLYGON);
                  setShowCrosshairs(true);
                }}
                style={{ 
                  minWidth: '80px',
                  height: '40px',
                  fontSize: '14px',
                  fontWeight: currentTool === TOOLS.POLYGON ? 'bold' : 'normal'
                }}
              >
                Polygon
              </Button>
            </Tooltip>
            
            <Tooltip title="Smart Polygon (S)" placement="bottom">
              <Button
                size="large"
                type={currentTool === TOOLS.SMART_POLYGON ? 'primary' : 'default'}
                icon={<AimOutlined />}
                onClick={() => {
                  setCurrentTool(TOOLS.SMART_POLYGON);
                  setShowCrosshairs(true);
                }}
                style={{ 
                  minWidth: '80px',
                  height: '40px',
                  fontSize: '14px',
                  fontWeight: currentTool === TOOLS.SMART_POLYGON ? 'bold' : 'normal'
                }}
              >
                Smart
              </Button>
            </Tooltip>
            
            <Divider type="vertical" style={{ margin: '0 8px', height: '40px' }} />
            
            <Tooltip title="Zoom In" placement="bottom">
              <Button 
                size="large"
                icon={<ZoomInOutlined />} 
                onClick={handleZoomIn}
                style={{ height: '40px', minWidth: '40px' }}
              />
            </Tooltip>
            
            <Tooltip title="Zoom Out" placement="bottom">
              <Button 
                size="large"
                icon={<ZoomOutOutlined />} 
                onClick={handleZoomOut}
                style={{ height: '40px', minWidth: '40px' }}
              />
            </Tooltip>
            
            <Tooltip title="Reset Zoom" placement="bottom">
              <Button 
                size="large"
                icon={<ToolOutlined />} 
                onClick={resetZoom}
                style={{ height: '40px', minWidth: '40px' }}
              />
            </Tooltip>
            
            <Divider type="vertical" style={{ margin: '0 8px', height: '40px' }} />
            
            <Tooltip title="Mark as Null (N)" placement="bottom">
              <Button 
                size="large"
                icon={<ClearOutlined />} 
                onClick={markAsNull}
                style={{ 
                  height: '40px', 
                  minWidth: '80px',
                  fontSize: '14px'
                }}
                danger
              >
                Null
              </Button>
            </Tooltip>
            
            <div style={{ 
              padding: '8px 12px', 
              fontSize: '14px', 
              color: '#666',
              background: '#f5f5f5',
              borderRadius: '6px',
              minWidth: '60px',
              textAlign: 'center',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold'
            }}>
              {Math.round(zoom * 100)}%
            </div>
          </div>

          {/* Zoom Lock & Additional Controls */}
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            zIndex: 100,
            background: 'white',
            borderRadius: '8px',
            padding: '12px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            border: '1px solid #e0e0e0'
          }}>
            <Space direction="vertical" size="small">
              <Space>
                <Switch 
                  checked={zoomLocked}
                  onChange={setZoomLocked}
                  size="small"
                />
                <Text style={{ fontSize: '12px', fontWeight: '500' }}>
                  {zoomLocked ? <LockOutlined /> : <UnlockOutlined />} Zoom Lock
                </Text>
              </Space>
              <Space>
                <Switch 
                  checked={autoSaveEnabled}
                  onChange={setAutoSaveEnabled}
                  size="small"
                />
                <Text style={{ fontSize: '12px', fontWeight: '500' }}>
                  <SaveOutlined /> Auto-save
                </Text>
              </Space>
            </Space>
          </div>

          {/* Canvas */}
          <Stage
            ref={stageRef}
            width={window.innerWidth - 320 - 200}
            height={window.innerHeight - 60}
            scaleX={zoom}
            scaleY={zoom}
            x={stagePos.x}
            y={stagePos.y}
            onMouseDown={handleStageMouseDown}
            onMouseMove={handleStageMouseMove}
            onMouseUp={handleStageMouseUp}
            style={{ 
              cursor: showCrosshairs ? 'crosshair' : 'default',
              background: '#2f2f2f'
            }}
          >
            <Layer>
              {/* Image */}
              {konvaImage && (
                <KonvaImage
                  ref={imageRef}
                  image={konvaImage}
                  x={0}
                  y={0}
                />
              )}
              
              {/* Existing Annotations */}
              {annotations.map((annotation) => (
                <React.Fragment key={annotation.id}>
                  {annotation.type === 'bbox' && annotation.visible && (
                    <>
                      <Rect
                        x={annotation.x}
                        y={annotation.y}
                        width={annotation.width}
                        height={annotation.height}
                        stroke={annotation.color}
                        strokeWidth={2}
                        fill={`${annotation.color}20`}
                        onClick={() => setSelectedAnnotationId(annotation.id)}
                      />
                      <KonvaText
                        x={annotation.x}
                        y={annotation.y - 20}
                        text={annotation.class}
                        fontSize={14}
                        fill={annotation.color}
                        fontStyle="bold"
                      />
                    </>
                  )}
                </React.Fragment>
              ))}
              
              {/* Temporary Annotation */}
              {tempAnnotation && tempAnnotation.type === 'bbox' && (
                <Rect
                  x={tempAnnotation.x}
                  y={tempAnnotation.y}
                  width={tempAnnotation.width}
                  height={tempAnnotation.height}
                  stroke={tempAnnotation.color}
                  strokeWidth={2}
                  fill={`${tempAnnotation.color}20`}
                  dash={[5, 5]}
                />
              )}
              
              {/* Transformer for selected annotation */}
              <Transformer
                ref={transformerRef}
                boundBoxFunc={(oldBox, newBox) => {
                  // Limit resize
                  if (newBox.width < 5 || newBox.height < 5) {
                    return oldBox;
                  }
                  return newBox;
                }}
              />
            </Layer>
          </Stage>
        </Content>

        {/* Right Sidebar - Tools & Actions */}
        <Sider width={200} style={{ background: '#fff', borderLeft: '1px solid #d9d9d9' }}>
          <div style={{ padding: '16px' }}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {/* Annotation List */}
              <Card size="small" title="Annotations">
                <List
                  size="small"
                  dataSource={annotations}
                  renderItem={(annotation, index) => (
                    <List.Item
                      style={{ 
                        padding: '4px 8px',
                        background: selectedAnnotationId === annotation.id ? '#f0f0f0' : 'transparent',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                      onClick={() => setSelectedAnnotationId(annotation.id)}
                      actions={[
                        <Button
                          type="text"
                          size="small"
                          icon={annotation.visible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleAnnotationVisibility(annotation.id);
                          }}
                        />,
                        <Button
                          type="text"
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAnnotation(annotation.id);
                          }}
                        />
                      ]}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div 
                          style={{ 
                            width: '12px', 
                            height: '12px', 
                            background: annotation.color, 
                            borderRadius: '2px' 
                          }} 
                        />
                        <Text style={{ fontSize: '12px' }}>{annotation.class}</Text>
                      </div>
                    </List.Item>
                  )}
                />
              </Card>

              {/* Actions */}
              <Space direction="vertical" style={{ width: '100%' }}>
                <Tooltip title="Undo (Ctrl+Z)">
                  <Button 
                    icon={<UndoOutlined />} 
                    onClick={undo}
                    disabled={historyIndex <= 0}
                    block
                  />
                </Tooltip>
                
                <Tooltip title="Redo (Ctrl+Shift+Z)">
                  <Button 
                    icon={<RedoOutlined />} 
                    onClick={redo}
                    disabled={historyIndex >= history.length - 1}
                    block
                  />
                </Tooltip>
                
                <Divider style={{ margin: '8px 0' }} />
                
                <Tooltip title="Delete Selected (Delete)">
                  <Button 
                    icon={<DeleteOutlined />} 
                    onClick={() => selectedAnnotationId && deleteAnnotation(selectedAnnotationId)}
                    disabled={!selectedAnnotationId}
                    block
                  />
                </Tooltip>
                
                <Tooltip title="Mark as Null (N)">
                  <Button 
                    icon={<ClearOutlined />} 
                    onClick={markAsNull}
                    block
                  />
                </Tooltip>
                
                <Divider style={{ margin: '8px 0' }} />
                
                <Tooltip title={`Auto-save: ${autoSaveEnabled ? 'ON' : 'OFF'}`}>
                  <Button 
                    icon={<SaveOutlined />} 
                    onClick={() => saveAnnotations(true)}
                    loading={saving}
                    type="primary"
                    block
                  >
                    Save
                  </Button>
                </Tooltip>
                
                <div style={{ 
                  padding: '4px', 
                  textAlign: 'center', 
                  fontSize: '10px',
                  color: autoSaveEnabled ? '#52c41a' : '#999'
                }}>
                  {saving ? (
                    'Saving...'
                  ) : autoSaveEnabled ? (
                    'Auto-save ON'
                  ) : (
                    'Auto-save OFF'
                  )}
                </div>
              </Space>
            </Space>
          </div>
        </Sider>
      </Layout>

      {/* Class Selector Modal */}
      <Modal
        title="Add New Class"
        open={showClassSelector}
        onOk={addClass}
        onCancel={() => {
          setShowClassSelector(false);
          setNewClassName('');
        }}
        okText="Add Class"
        cancelText="Cancel"
      >
        <Input
          placeholder="Enter class name"
          value={newClassName}
          onChange={(e) => setNewClassName(e.target.value)}
          onPressEnter={addClass}
          autoFocus
        />
      </Modal>
    </Layout>
  );
};

export default AnnotateManualEnhanced;