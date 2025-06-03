import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Layout, 
  Button, 
  List, 
  Typography, 
  Tooltip, 
  message,
  Modal,
  Input,
  ColorPicker,
  Space
} from 'antd';
import {
  DragOutlined,
  BorderOutlined,
  ExpandOutlined,
  AimOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  UndoOutlined,
  RedoOutlined,
  DeleteOutlined,
  ClearOutlined,
  SaveOutlined,
  PlusOutlined,
  ToolOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { Stage, Layer, Rect, Image as KonvaImage, Text as KonvaText, Transformer } from 'react-konva';

const { Sider, Content } = Layout;
const { Text, Title } = Typography;

// Tool constants
const TOOLS = {
  SELECT: 'select',
  BBOX: 'bbox',
  POLYGON: 'polygon',
  SMART_POLYGON: 'smart_polygon',
  MARK_NULL: 'mark_null'
};

const ManualLabeling = () => {
  console.log('ManualLabeling component loaded');
  const { datasetId } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const imageId = searchParams.get('imageId');
  console.log('URL params:', { datasetId, imageId });
  const navigate = useNavigate();
  
  // State management
  const [currentTool, setCurrentTool] = useState(TOOLS.BBOX);
  const [imageList, setImageList] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoom, setZoom] = useState(0.76);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [annotations, setAnnotations] = useState([]);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState(null);
  const [tempAnnotation, setTempAnnotation] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showCrosshairs, setShowCrosshairs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [konvaImage, setKonvaImage] = useState(null);
  const [imageData, setImageData] = useState(null);
  
  // Classes
  const [classes, setClasses] = useState([
    { name: 'Good', color: '#52c41a' },
    { name: 'Broken', color: '#ff4d4f' },
    { name: 'Holes', color: '#faad14' }
  ]);
  const [selectedClass, setSelectedClass] = useState(classes[0]);
  const [showClassSelector, setShowClassSelector] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassColor, setNewClassColor] = useState('#1890ff');
  
  // History
  const [history, setHistory] = useState([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  // Refs
  const stageRef = useRef();
  const imageRef = useRef();
  const transformerRef = useRef();

  // Load image list
  useEffect(() => {
    const loadImageList = async () => {
      try {
        console.log('Loading image list for dataset:', datasetId);
        const response = await fetch(`/api/v1/datasets/${datasetId}/images?skip=0&limit=1000`);
        const data = await response.json();
        console.log('Image list loaded:', data.images);
        setImageList(data.images);
        
        // Find current image index
        const currentIndex = data.images.findIndex(img => img.id === imageId);
        console.log('Current image index:', currentIndex, 'for imageId:', imageId);
        setCurrentImageIndex(currentIndex >= 0 ? currentIndex : 0);
      } catch (error) {
        console.error('Error loading image list:', error);
        message.error('Failed to load image list');
      }
    };

    if (datasetId) {
      loadImageList();
    }
  }, [datasetId, imageId]);

  // Load image
  useEffect(() => {
    const loadImage = async () => {
      console.log('loadImage function called with datasetId:', datasetId, 'imageId:', imageId);
      try {
        const response = await fetch(`/api/v1/datasets/images/${imageId}`);
        const data = await response.json();
        setImageData(data);
        
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          console.log('Image loaded successfully:', img.src);
          setKonvaImage(img);
          // Center image
          const stage = stageRef.current;
          if (stage) {
            const stageWidth = stage.width();
            const stageHeight = stage.height();
            setStagePos({
              x: (stageWidth - img.width * zoom) / 2,
              y: (stageHeight - img.height * zoom) / 2
            });
          }
        };
        img.onerror = (error) => {
          console.error('Image failed to load:', img.src, error);
        };
        const imageSrc = data.file_path || `/api/v1/datasets/${datasetId}/images/${imageId}/file`;
        console.log('Loading image from:', imageSrc);
        img.src = imageSrc;
      } catch (error) {
        console.error('Error loading image:', error);
        message.error('Failed to load image');
      }
    };

    if (datasetId && imageId) {
      loadImage();
    }
  }, [datasetId, imageId, zoom]);

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
          markAsNull();
          break;
        case 'delete':
        case 'backspace':
          if (selectedAnnotationId) {
            deleteAnnotation(selectedAnnotationId);
          }
          break;
      }
      
      if (e.ctrlKey || e.metaKey) {
        if (e.shiftKey && e.key === 'Z') {
          e.preventDefault();
          redo();
        } else if (e.key === 'z') {
          e.preventDefault();
          undo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedAnnotationId]);

  // Navigation functions
  const handlePreviousImage = () => {
    if (currentImageIndex > 0 && imageList.length > 0) {
      const prevImage = imageList[currentImageIndex - 1];
      navigate(`/annotate/${datasetId}/manual?imageId=${prevImage.id}`);
    }
  };

  const handleNextImage = () => {
    console.log('NEXT BUTTON CLICKED - UPDATED VERSION!', { currentImageIndex, imageListLength: imageList.length });
    if (currentImageIndex < imageList.length - 1 && imageList.length > 0) {
      const nextImage = imageList[currentImageIndex + 1];
      console.log('Navigating to next image:', nextImage.id);
      navigate(`/annotate/${datasetId}/manual?imageId=${nextImage.id}`);
    } else {
      console.log('Cannot navigate: at last image or no images loaded');
    }
  };

  // Canvas event handlers
  const handleStageMouseDown = (e) => {
    if (currentTool === TOOLS.SELECT) return;
    
    if (currentTool === TOOLS.BBOX) {
      const pos = e.target.getStage().getPointerPosition();
      const stageAttrs = e.target.getStage().attrs;
      const x = (pos.x - stageAttrs.x) / stageAttrs.scaleX;
      const y = (pos.y - stageAttrs.y) / stageAttrs.scaleY;
      
      setIsDrawing(true);
      setTempAnnotation({
        id: Date.now(),
        type: 'bbox',
        x: x,
        y: y,
        width: 0,
        height: 0,
        class: selectedClass.name,
        color: selectedClass.color,
        visible: true
      });
    }
  };

  const handleStageMouseMove = (e) => {
    if (!isDrawing || currentTool !== TOOLS.BBOX) return;
    
    const pos = e.target.getStage().getPointerPosition();
    const stageAttrs = e.target.getStage().attrs;
    const x = (pos.x - stageAttrs.x) / stageAttrs.scaleX;
    const y = (pos.y - stageAttrs.y) / stageAttrs.scaleY;
    
    setTempAnnotation(prev => ({
      ...prev,
      width: x - prev.x,
      height: y - prev.y
    }));
  };

  const handleStageMouseUp = () => {
    if (!isDrawing || !tempAnnotation) return;
    
    if (Math.abs(tempAnnotation.width) > 5 && Math.abs(tempAnnotation.height) > 5) {
      const newAnnotation = {
        ...tempAnnotation,
        width: Math.abs(tempAnnotation.width),
        height: Math.abs(tempAnnotation.height),
        x: tempAnnotation.width < 0 ? tempAnnotation.x + tempAnnotation.width : tempAnnotation.x,
        y: tempAnnotation.height < 0 ? tempAnnotation.y + tempAnnotation.height : tempAnnotation.y
      };
      
      addToHistory([...annotations, newAnnotation]);
      setAnnotations(prev => [...prev, newAnnotation]);
      message.success(`Added ${selectedClass.name} annotation`);
    }
    
    setIsDrawing(false);
    setTempAnnotation(null);
  };

  // Zoom functions
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.1));
  const resetZoom = () => setZoom(1);

  // History functions
  const addToHistory = (newAnnotations) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newAnnotations);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setAnnotations(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setAnnotations(history[historyIndex + 1]);
    }
  };

  // Annotation functions
  const deleteAnnotation = (id) => {
    const newAnnotations = annotations.filter(ann => ann.id !== id);
    addToHistory(newAnnotations);
    setAnnotations(newAnnotations);
    setSelectedAnnotationId(null);
  };

  const markAsNull = () => {
    Modal.confirm({
      title: 'Mark as Null',
      content: 'This will mark the image as having no objects to annotate. Continue?',
      onOk: () => {
        // Save null annotation
        message.success('Image marked as null');
      }
    });
  };

  // Class functions
  const addClass = () => {
    if (!newClassName.trim()) return;
    
    const newClass = {
      name: newClassName.trim(),
      color: typeof newClassColor === 'string' ? newClassColor : newClassColor.toHexString()
    };
    
    setClasses(prev => [...prev, newClass]);
    setNewClassName('');
    setNewClassColor('#1890ff');
    setShowClassSelector(false);
    message.success(`Added class: ${newClass.name}`);
  };

  const deleteClass = (className) => {
    setClasses(prev => prev.filter(cls => cls.name !== className));
    if (selectedClass.name === className) {
      setSelectedClass(classes[0]);
    }
  };

  // Save function
  const saveAnnotations = async () => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      message.success('Annotations saved successfully');
    } catch (error) {
      message.error('Failed to save annotations');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ height: '100vh', background: '#f0f0f0' }}>
      {/* Top Navigation */}
      <div style={{
        height: '60px',
        background: 'white',
        borderBottom: '1px solid #d9d9d9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Tooltip title="Back to Progress">
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate(`/annotate-progress/${datasetId}`)}
              style={{ 
                background: '#f0f0f0',
                border: '1px solid #d9d9d9',
                borderRadius: '6px',
                fontSize: '14px',
                height: '36px',
                paddingLeft: '12px',
                paddingRight: '16px'
              }}
            >
              Back
            </Button>
          </Tooltip>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Text strong style={{ fontSize: '16px' }}>
              {imageList.length > 0 ? `${currentImageIndex + 1} / ${imageList.length}` : '1 / 3'}
            </Text>
            <Button 
              size="small" 
              disabled={currentImageIndex <= 0 || imageList.length === 0}
              onClick={handlePreviousImage}
              style={{ marginLeft: '8px' }}
            >
              ← Previous
            </Button>
            <Button 
              size="small" 
              disabled={currentImageIndex >= imageList.length - 1 || imageList.length === 0}
              onClick={handleNextImage}
              style={{ marginLeft: '8px' }}
            >
              Next →
            </Button>
          </div>
        </div>
        <Text strong>{imageData?.filename || 'Loading...'}</Text>
      </div>

      {/* Main Layout */}
      <Layout style={{ marginTop: '60px', height: 'calc(100vh - 60px)' }}>
        {/* Left Sidebar - Compact Classes */}
        <Sider width={200} style={{ background: '#fff', borderRight: '1px solid #d9d9d9' }}>
          <div style={{ padding: '12px' }}>
            <Title level={5} style={{ margin: '0 0 12px 0', fontSize: '14px' }}>
              Classes
            </Title>
            
            <Button 
              type="dashed" 
              icon={<PlusOutlined />} 
              onClick={() => setShowClassSelector(true)}
              block
              size="small"
              style={{ marginBottom: '12px' }}
            >
              Add Class
            </Button>
            
            <List
              size="small"
              dataSource={classes}
              renderItem={(cls) => (
                <List.Item
                  style={{ 
                    padding: '6px 8px',
                    border: selectedClass.name === cls.name ? `2px solid ${cls.color}` : '1px solid #f0f0f0',
                    borderRadius: '4px',
                    marginBottom: '6px',
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div 
                      style={{ 
                        width: '12px', 
                        height: '12px', 
                        background: cls.color, 
                        borderRadius: '2px' 
                      }} 
                    />
                    <Text style={{ fontSize: '12px' }}>{cls.name}</Text>
                  </div>
                </List.Item>
              )}
            />
          </div>
        </Sider>

        {/* Center - Large Canvas Area */}
        <Content style={{ position: 'relative', background: '#2f2f2f' }}>
          <Stage
            ref={stageRef}
            width={window.innerWidth - 200 - 80}
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
                  if (newBox.width < 5 || newBox.height < 5) {
                    return oldBox;
                  }
                  return newBox;
                }}
              />
            </Layer>
          </Stage>
        </Content>

        {/* Right Sidebar - Vertical Toolbar */}
        <Sider width={80} style={{ background: '#2c3e50', borderLeft: '1px solid #34495e' }}>
          <div style={{ 
            padding: '20px 0', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            gap: '12px',
            height: '100%'
          }}>
            {/* Tool Buttons */}
            <Tooltip title="Drag and Select (D)" placement="left">
              <Button
                size="large"
                type={currentTool === TOOLS.SELECT ? 'primary' : 'default'}
                icon={<DragOutlined />}
                onClick={() => {
                  setCurrentTool(TOOLS.SELECT);
                  setShowCrosshairs(false);
                }}
                style={{ 
                  width: '50px',
                  height: '50px',
                  borderRadius: '8px',
                  background: currentTool === TOOLS.SELECT ? '#1890ff' : '#34495e',
                  border: 'none',
                  color: 'white'
                }}
              />
            </Tooltip>
            
            <Tooltip title="Bounding Box (B)" placement="left">
              <Button
                size="large"
                type={currentTool === TOOLS.BBOX ? 'primary' : 'default'}
                icon={<BorderOutlined />}
                onClick={() => {
                  setCurrentTool(TOOLS.BBOX);
                  setShowCrosshairs(true);
                }}
                style={{ 
                  width: '50px',
                  height: '50px',
                  borderRadius: '8px',
                  background: currentTool === TOOLS.BBOX ? '#1890ff' : '#34495e',
                  border: 'none',
                  color: 'white'
                }}
              />
            </Tooltip>
            
            <Tooltip title="Polygon (P)" placement="left">
              <Button
                size="large"
                type={currentTool === TOOLS.POLYGON ? 'primary' : 'default'}
                icon={<ExpandOutlined />}
                onClick={() => {
                  setCurrentTool(TOOLS.POLYGON);
                  setShowCrosshairs(true);
                }}
                style={{ 
                  width: '50px',
                  height: '50px',
                  borderRadius: '8px',
                  background: currentTool === TOOLS.POLYGON ? '#1890ff' : '#34495e',
                  border: 'none',
                  color: 'white'
                }}
              />
            </Tooltip>
            
            <Tooltip title="Smart Polygon (S)" placement="left">
              <Button
                size="large"
                type={currentTool === TOOLS.SMART_POLYGON ? 'primary' : 'default'}
                icon={<AimOutlined />}
                onClick={() => {
                  setCurrentTool(TOOLS.SMART_POLYGON);
                  setShowCrosshairs(true);
                }}
                style={{ 
                  width: '50px',
                  height: '50px',
                  borderRadius: '8px',
                  background: currentTool === TOOLS.SMART_POLYGON ? '#1890ff' : '#34495e',
                  border: 'none',
                  color: 'white'
                }}
              />
            </Tooltip>
            
            <div style={{ width: '40px', height: '1px', background: '#34495e', margin: '8px 0' }} />
            
            <Tooltip title="Zoom In" placement="left">
              <Button 
                size="large"
                icon={<ZoomInOutlined />} 
                onClick={handleZoomIn}
                style={{ 
                  width: '50px',
                  height: '50px',
                  borderRadius: '8px',
                  background: '#34495e',
                  border: 'none',
                  color: 'white'
                }}
              />
            </Tooltip>
            
            <Tooltip title="Zoom Out" placement="left">
              <Button 
                size="large"
                icon={<ZoomOutOutlined />} 
                onClick={handleZoomOut}
                style={{ 
                  width: '50px',
                  height: '50px',
                  borderRadius: '8px',
                  background: '#34495e',
                  border: 'none',
                  color: 'white'
                }}
              />
            </Tooltip>
            
            <Tooltip title="Reset Zoom" placement="left">
              <Button 
                size="large"
                icon={<ToolOutlined />} 
                onClick={resetZoom}
                style={{ 
                  width: '50px',
                  height: '50px',
                  borderRadius: '8px',
                  background: '#34495e',
                  border: 'none',
                  color: 'white'
                }}
              />
            </Tooltip>
            
            <div style={{ width: '40px', height: '1px', background: '#34495e', margin: '8px 0' }} />
            
            <Tooltip title="Undo (Ctrl+Z)" placement="left">
              <Button 
                size="large"
                icon={<UndoOutlined />} 
                onClick={undo}
                disabled={historyIndex <= 0}
                style={{ 
                  width: '50px',
                  height: '50px',
                  borderRadius: '8px',
                  background: historyIndex <= 0 ? '#2c3e50' : '#34495e',
                  border: 'none',
                  color: historyIndex <= 0 ? '#7f8c8d' : 'white'
                }}
              />
            </Tooltip>
            
            <Tooltip title="Redo (Ctrl+Shift+Z)" placement="left">
              <Button 
                size="large"
                icon={<RedoOutlined />} 
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                style={{ 
                  width: '50px',
                  height: '50px',
                  borderRadius: '8px',
                  background: historyIndex >= history.length - 1 ? '#2c3e50' : '#34495e',
                  border: 'none',
                  color: historyIndex >= history.length - 1 ? '#7f8c8d' : 'white'
                }}
              />
            </Tooltip>
            
            <div style={{ width: '40px', height: '1px', background: '#34495e', margin: '8px 0' }} />
            
            <Tooltip title="Delete Selected (Delete)" placement="left">
              <Button 
                size="large"
                icon={<DeleteOutlined />} 
                onClick={() => selectedAnnotationId && deleteAnnotation(selectedAnnotationId)}
                disabled={!selectedAnnotationId}
                style={{ 
                  width: '50px',
                  height: '50px',
                  borderRadius: '8px',
                  background: !selectedAnnotationId ? '#2c3e50' : '#e74c3c',
                  border: 'none',
                  color: !selectedAnnotationId ? '#7f8c8d' : 'white'
                }}
              />
            </Tooltip>
            
            <Tooltip title="Mark as Null (N)" placement="left">
              <Button 
                size="large"
                icon={<ClearOutlined />} 
                onClick={markAsNull}
                style={{ 
                  width: '50px',
                  height: '50px',
                  borderRadius: '8px',
                  background: '#e67e22',
                  border: 'none',
                  color: 'white'
                }}
              />
            </Tooltip>
            
            <div style={{ flex: 1 }} />
            
            <Tooltip title="Save Annotations" placement="left">
              <Button 
                size="large"
                icon={<SaveOutlined />} 
                onClick={saveAnnotations}
                loading={saving}
                style={{ 
                  width: '50px',
                  height: '50px',
                  borderRadius: '8px',
                  background: '#27ae60',
                  border: 'none',
                  color: 'white'
                }}
              />
            </Tooltip>
            
            {/* Zoom Display */}
            <div style={{ 
              color: 'white', 
              fontSize: '10px', 
              textAlign: 'center',
              background: '#34495e',
              padding: '4px 8px',
              borderRadius: '4px',
              minWidth: '50px'
            }}>
              {Math.round(zoom * 100)}%
            </div>
          </div>
        </Sider>
      </Layout>

      {/* Add Class Modal */}
      <Modal
        title="Add New Class"
        open={showClassSelector}
        onOk={addClass}
        onCancel={() => setShowClassSelector(false)}
        okText="Add Class"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text>Class Name:</Text>
            <Input
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              placeholder="Enter class name"
              onPressEnter={addClass}
            />
          </div>
          <div>
            <Text>Color:</Text>
            <ColorPicker
              value={newClassColor}
              onChange={setNewClassColor}
              showText
            />
          </div>
        </Space>
      </Modal>
    </div>
  );
};

export default ManualLabeling;