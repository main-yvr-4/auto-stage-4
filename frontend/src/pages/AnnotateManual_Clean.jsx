import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Stage, Layer, Image as KonvaImage, Rect, Transformer } from 'react-konva';
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
  Tag
} from 'antd';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  SelectOutlined,
  BorderOutlined,
  UndoOutlined,
  RedoOutlined,
  DeleteOutlined,
  SaveOutlined,
  PlusOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Sider, Content } = Layout;
const { Text } = Typography;

const AnnotateManual = () => {
  const { datasetId } = useParams();
  const [searchParams] = useSearchParams();
  const imageId = searchParams.get('imageId');
  const navigate = useNavigate();

  // State
  const [image, setImage] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [classes, setClasses] = useState([
    { id: 1, name: 'Good', color: '#52c41a' },
    { id: 2, name: 'Broken', color: '#ff4d4f' },
    { id: 3, name: 'Holes', color: '#1890ff' }
  ]);
  const [selectedClassId, setSelectedClassId] = useState(1);
  const [currentTool, setCurrentTool] = useState('select');
  const [isDrawing, setIsDrawing] = useState(false);
  const [newBox, setNewBox] = useState(null);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState(null);
  const [scale, setScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const [allImages, setAllImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const stageRef = useRef();
  const transformerRef = useRef();

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
          const scale = Math.min(containerWidth / img.width, containerHeight / img.height) * 0.8;
          setScale(scale);
          setStagePos({
            x: (containerWidth - img.width * scale) / 2,
            y: (containerHeight - img.height * scale) / 2
          });
        }
      };
      img.src = `http://localhost:12000${imageInfo.file_path}`;

      // Load annotations
      try {
        const annotationsResponse = await axios.get(`http://localhost:12000/api/v1/images/${imageId}/annotations`);
        const loadedAnnotations = annotationsResponse.data.map((ann, index) => ({
          id: `annotation-${index}`,
          classId: ann.class_id,
          x: ann.x,
          y: ann.y,
          width: ann.width,
          height: ann.height
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
      const annotationsData = annotations.map(ann => ({
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
        is_labeled: true
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

  // Drawing handlers
  const handleMouseDown = (e) => {
    if (currentTool !== 'draw') return;
    
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    const transform = stage.getAbsoluteTransform().copy().invert();
    const localPos = transform.point(pointer);

    setIsDrawing(true);
    setNewBox({
      x: localPos.x,
      y: localPos.y,
      width: 0,
      height: 0
    });
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || currentTool !== 'draw') return;

    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    const transform = stage.getAbsoluteTransform().copy().invert();
    const localPos = transform.point(pointer);

    setNewBox(prev => ({
      ...prev,
      width: localPos.x - prev.x,
      height: localPos.y - prev.y
    }));
  };

  const handleMouseUp = () => {
    if (!isDrawing || currentTool !== 'draw') return;

    if (newBox && Math.abs(newBox.width) > 10 && Math.abs(newBox.height) > 10) {
      const finalBox = {
        id: `annotation-${Date.now()}`,
        classId: selectedClassId,
        x: newBox.width < 0 ? newBox.x + newBox.width : newBox.x,
        y: newBox.height < 0 ? newBox.y + newBox.height : newBox.y,
        width: Math.abs(newBox.width),
        height: Math.abs(newBox.height)
      };
      setAnnotations(prev => [...prev, finalBox]);
    }

    setIsDrawing(false);
    setNewBox(null);
    setCurrentTool('select');
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

  const getClassById = (id) => classes.find(cls => cls.id === id);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#1a1a1a' }}>
      {/* Top Header - Roboflow Style */}
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
          width: '280px',
          background: '#fff',
          borderRight: '1px solid #d9d9d9',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Tools */}
          <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
            <Text strong style={{ display: 'block', marginBottom: '12px' }}>Tools</Text>
            <Space>
              <Button
                type={currentTool === 'select' ? 'primary' : 'default'}
                icon={<SelectOutlined />}
                onClick={() => setCurrentTool('select')}
                size="small"
              >
                Select
              </Button>
              <Button
                type={currentTool === 'draw' ? 'primary' : 'default'}
                icon={<BorderOutlined />}
                onClick={() => setCurrentTool('draw')}
                size="small"
              >
                Draw
              </Button>
            </Space>
          </div>

          {/* Classes */}
          <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
            <Text strong style={{ display: 'block', marginBottom: '12px' }}>Classes</Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {classes.map(cls => (
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
            </div>
          </div>

          {/* Annotations List */}
          <div style={{ flex: 1, padding: '16px' }}>
            <Text strong style={{ display: 'block', marginBottom: '12px' }}>
              Annotations ({annotations.length})
            </Text>
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
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedAnnotationId(ann.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: cls?.color
                      }} />
                      <div>
                        <Text strong>{cls?.name}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                          {Math.round(ann.width)} × {Math.round(ann.height)}
                        </Text>
                      </div>
                    </div>
                  </List.Item>
                );
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ padding: '16px', borderTop: '1px solid #f0f0f0' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                icon={<DeleteOutlined />}
                onClick={deleteSelectedAnnotation}
                disabled={!selectedAnnotationId}
                danger
                block
              >
                Delete Selected
              </Button>
            </Space>
          </div>
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
              onClick={() => setScale(prev => Math.max(0.1, prev - 0.1))}
            />
            <Text style={{ minWidth: '50px', textAlign: 'center' }}>
              {Math.round(scale * 100)}%
            </Text>
            <Button
              size="small"
              icon={<ZoomInOutlined />}
              onClick={() => setScale(prev => Math.min(3, prev + 0.1))}
            />
          </div>

          {/* Canvas */}
          <Stage
            ref={stageRef}
            width={window.innerWidth - 280}
            height={window.innerHeight - 60}
            scaleX={scale}
            scaleY={scale}
            x={stagePos.x}
            y={stagePos.y}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            draggable={currentTool === 'select'}
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
                const cls = getClassById(ann.classId);
                return (
                  <Rect
                    key={ann.id}
                    x={ann.x}
                    y={ann.y}
                    width={ann.width}
                    height={ann.height}
                    stroke={cls?.color}
                    strokeWidth={2}
                    fill="transparent"
                    onClick={() => setSelectedAnnotationId(ann.id)}
                  />
                );
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
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
  );
};

export default AnnotateManual;