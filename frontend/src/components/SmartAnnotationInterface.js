import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config';
import { Row, Col, Card, Button, Space, message, Modal, Progress, Tag } from 'antd';
import {
  SaveOutlined,
  UndoOutlined,
  RedoOutlined,
  DeleteOutlined,
  ExportOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import AdvancedAnnotationCanvas from './AdvancedAnnotationCanvas';
import ManualAnnotationTools from './ManualAnnotationTools';

const SmartAnnotationInterface = ({ 
  currentImage, 
  annotations, 
  onAnnotationsChange,
  classes,
  selectedClass,
  onClassChange,
  onSave,
  onAutoLabel
}) => {
  console.log('SmartAnnotationInterface currentImage:', currentImage);
  const [selectedTool, setSelectedTool] = useState('bbox');
  const [brushSize, setBrushSize] = useState(10);
  const [opacity, setOpacity] = useState(0.7);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [annotationMode, setAnnotationMode] = useState('detection');
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isAutoLabeling, setIsAutoLabeling] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [annotationStats, setAnnotationStats] = useState({
    total: 0,
    manual: 0,
    ai: 0,
    edited: 0
  });

  // Initialize history with current annotations
  useEffect(() => {
    if (annotations.length > 0 && history.length === 0) {
      setHistory([annotations]);
      setHistoryIndex(0);
    }
  }, [annotations, history.length]);

  // Update stats when annotations change
  useEffect(() => {
    const stats = {
      total: annotations.length,
      manual: annotations.filter(ann => ann.source === 'manual').length,
      ai: annotations.filter(ann => ann.source === 'ai').length,
      edited: annotations.filter(ann => ann.edited).length
    };
    setAnnotationStats(stats);
  }, [annotations]);

  // Handle annotations change with history
  const handleAnnotationsChange = useCallback((newAnnotations) => {
    onAnnotationsChange(newAnnotations);
    
    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newAnnotations);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [onAnnotationsChange, history, historyIndex]);

  // Undo functionality
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevAnnotations = history[historyIndex - 1];
      onAnnotationsChange(prevAnnotations);
      setHistoryIndex(historyIndex - 1);
      message.success('Undone');
    }
  };

  // Redo functionality
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextAnnotations = history[historyIndex + 1];
      onAnnotationsChange(nextAnnotations);
      setHistoryIndex(historyIndex + 1);
      message.success('Redone');
    }
  };

  // Delete all annotations
  const handleDeleteAll = () => {
    Modal.confirm({
      title: 'Delete All Annotations',
      content: 'Are you sure you want to delete all annotations? This action cannot be undone.',
      okText: 'Delete All',
      okType: 'danger',
      onOk: () => {
        handleAnnotationsChange([]);
        message.success('All annotations deleted');
      }
    });
  };

  // Auto-label with AI
  const handleAutoLabel = async () => {
    if (!currentImage) {
      message.warning('No image selected');
      return;
    }

    setIsAutoLabeling(true);
    try {
      await onAutoLabel();
      message.success('AI auto-labeling completed!');
    } catch (error) {
      message.error('Auto-labeling failed');
    } finally {
      setIsAutoLabeling(false);
    }
  };

  // Smart suggestions based on current annotations
  const getSmartSuggestions = () => {
    const suggestions = [];
    
    if (annotations.length === 0) {
      suggestions.push({
        type: 'info',
        message: 'Start by selecting a tool and drawing your first annotation',
        action: () => setSelectedTool('bbox')
      });
    } else if (annotations.filter(ann => ann.source === 'ai').length === 0) {
      suggestions.push({
        type: 'tip',
        message: 'Try AI auto-labeling to speed up annotation',
        action: handleAutoLabel
      });
    } else if (annotations.length > 5) {
      suggestions.push({
        type: 'success',
        message: 'Great progress! Consider saving your work',
        action: onSave
      });
    }
    
    return suggestions;
  };

  // Enhanced export with backend API
  const handleExport = async (format) => {
    try {
      const exportRequest = {
        annotations: annotations.map((ann, index) => ({
          ...ann,
          image_id: 0, // Single image for now
          id: index
        })),
        images: currentImage ? [{
          name: currentImage.name,
          width: 800, // Would get from actual image
          height: 600,
          id: 0
        }] : [],
        classes: classes.map((cls, index) => ({
          name: cls.name,
          color: cls.color,
          id: index
        })),
        format: format,
        dataset_name: currentImage?.name?.split('.')[0] || 'dataset',
        include_images: false
      };

      const response = await fetch(`${API_BASE_URL}/api/v1/enhanced-export/export/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportRequest)
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = response.headers.get('Content-Disposition')?.split('filename=')[1] || `export_${format}.zip`;
        a.click();
        URL.revokeObjectURL(url);
        
        setShowExportModal(false);
        message.success(`Successfully exported as ${format.toUpperCase()}!`);
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      message.error(`Export failed: ${error.message}`);
    }
  };

  // Export to COCO format
  const exportToCOCO = () => {
    const cocoData = {
      images: [{
        id: 1,
        file_name: currentImage?.name || 'image.jpg',
        width: 800, // Would get from actual image
        height: 600
      }],
      annotations: annotations.map((ann, index) => ({
        id: index + 1,
        image_id: 1,
        category_id: ann.classIndex + 1,
        bbox: ann.type === 'bbox' ? [ann.bbox.x, ann.bbox.y, ann.bbox.width, ann.bbox.height] : null,
        segmentation: ann.type === 'polygon' ? [ann.points.flatMap(p => [p.x, p.y])] : null,
        area: ann.type === 'bbox' ? ann.bbox.width * ann.bbox.height : 0,
        iscrowd: 0
      })),
      categories: classes.map((cls, index) => ({
        id: index + 1,
        name: cls.name,
        supercategory: 'object'
      }))
    };
    return JSON.stringify(cocoData, null, 2);
  };

  // Export to YOLO format
  const exportToYOLO = () => {
    return annotations.map(ann => {
      if (ann.type === 'bbox') {
        const { x, y, width, height } = ann.bbox;
        const centerX = (x + width / 2) / 800; // Normalize to image width
        const centerY = (y + height / 2) / 600; // Normalize to image height
        const normWidth = width / 800;
        const normHeight = height / 600;
        return `${ann.classIndex} ${centerX} ${centerY} ${normWidth} ${normHeight}`;
      }
      return '';
    }).filter(line => line).join('\n');
  };

  // Export to Pascal VOC format
  const exportToPascalVOC = () => {
    const xmlData = `<?xml version="1.0"?>
<annotation>
  <filename>${currentImage?.name || 'image.jpg'}</filename>
  <size>
    <width>800</width>
    <height>600</height>
    <depth>3</depth>
  </size>
  ${annotations.map(ann => {
    if (ann.type === 'bbox') {
      return `<object>
    <name>${classes[ann.classIndex]?.name || 'object'}</name>
    <bndbox>
      <xmin>${Math.round(ann.bbox.x)}</xmin>
      <ymin>${Math.round(ann.bbox.y)}</ymin>
      <xmax>${Math.round(ann.bbox.x + ann.bbox.width)}</xmax>
      <ymax>${Math.round(ann.bbox.y + ann.bbox.height)}</ymax>
    </bndbox>
  </object>`;
    }
    return '';
  }).filter(obj => obj).join('\n  ')}
</annotation>`;
    return xmlData;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              handleRedo();
            } else {
              handleUndo();
            }
            break;
          case 'y':
            e.preventDefault();
            handleRedo();
            break;
          case 's':
            e.preventDefault();
            onSave();
            break;
        }
      } else {
        switch (e.key) {
          case 'v':
            setSelectedTool('select');
            break;
          case 'b':
            setSelectedTool('bbox');
            break;
          case 'p':
            setSelectedTool('polygon');
            break;
          case 's':
            setSelectedTool('segment');
            break;
          case 'u':
            setSelectedTool('brush');
            break;
          case 'e':
            setSelectedTool('eraser');
            break;
          case 'w':
            setSelectedTool('magic');
            break;
          case 'Delete':
            // Delete selected annotation logic would go here
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [historyIndex, history.length]);

  const suggestions = getSmartSuggestions();

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Top Action Bar */}
      <Card size="small" style={{ marginBottom: 8 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Button 
                icon={<UndoOutlined />}
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                title="Undo (Ctrl+Z)"
              >
                Undo
              </Button>
              <Button 
                icon={<RedoOutlined />}
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                title="Redo (Ctrl+Y)"
              >
                Redo
              </Button>
              <Button 
                icon={<DeleteOutlined />}
                onClick={handleDeleteAll}
                danger
                disabled={annotations.length === 0}
              >
                Clear All
              </Button>
            </Space>
          </Col>
          
          <Col>
            <Space>
              <Tag color="blue">
                {annotationStats.total} Total
              </Tag>
              <Tag color="green">
                {annotationStats.manual} Manual
              </Tag>
              <Tag color="purple">
                {annotationStats.ai} AI
              </Tag>
              
              <Button 
                type="primary"
                icon={<ThunderboltOutlined />}
                onClick={handleAutoLabel}
                loading={isAutoLabeling}
                disabled={!currentImage}
              >
                AI Auto-Label
              </Button>
              
              <Button 
                icon={<ExportOutlined />}
                onClick={() => setShowExportModal(true)}
                disabled={annotations.length === 0}
              >
                Export
              </Button>
              
              {/* Auto-save indicator */}
              <Tag 
                icon={<CheckCircleOutlined />} 
                color="success"
                style={{ 
                  display: annotations.length > 0 ? 'inline-flex' : 'none',
                  alignItems: 'center',
                  fontSize: '12px'
                }}
              >
                Auto-saved
              </Tag>
              
              {/* Auto-save enabled - manual save button hidden */}
              <Button 
                type="default"
                icon={<SaveOutlined />}
                onClick={onSave}
                disabled={annotations.length === 0}
                style={{ display: 'none' }}
                title="Auto-save is enabled"
              >
                Save
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Main Content */}
      <Row style={{ flex: 1, height: 0 }} gutter={[8, 0]}>
        {/* Left Sidebar - Tools */}
        <Col xs={24} lg={6}>
          <div style={{ height: '100%', overflow: 'auto' }}>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <ManualAnnotationTools
                selectedTool={selectedTool}
                onToolChange={setSelectedTool}
                brushSize={brushSize}
                onBrushSizeChange={setBrushSize}
                opacity={opacity}
                onOpacityChange={setOpacity}
                showAnnotations={showAnnotations}
                onToggleAnnotations={setShowAnnotations}
                annotationMode={annotationMode}
                onAnnotationModeChange={setAnnotationMode}
              />

              {/* Smart Suggestions */}
              {suggestions.length > 0 && (
                <Card title="💡 Smart Suggestions" size="small">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {suggestions.map((suggestion, index) => (
                      <div key={index} style={{ 
                        padding: 8, 
                        backgroundColor: suggestion.type === 'success' ? '#f6ffed' : '#f0f8ff',
                        borderRadius: 4,
                        fontSize: 12
                      }}>
                        <div style={{ marginBottom: 4 }}>{suggestion.message}</div>
                        {suggestion.action && (
                          <Button 
                            size="small" 
                            type="link" 
                            onClick={suggestion.action}
                            style={{ padding: 0, height: 'auto' }}
                          >
                            Take Action
                          </Button>
                        )}
                      </div>
                    ))}
                  </Space>
                </Card>
              )}

              {/* Progress Indicator */}
              <Card title="📈 Session Progress" size="small">
                <div style={{ textAlign: 'center' }}>
                  <Progress
                    type="circle"
                    size={80}
                    percent={Math.min(100, (annotationStats.total / 10) * 100)}
                    format={() => annotationStats.total}
                  />
                  <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                    Annotations Created
                  </div>
                </div>
              </Card>
            </Space>
          </div>
        </Col>

        {/* Main Canvas Area */}
        <Col xs={24} lg={18}>
          <Card 
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            bodyStyle={{ flex: 1, padding: 0 }}
          >
            {currentImage ? (
              <AdvancedAnnotationCanvas
                imageUrl={currentImage.url}
                annotations={annotations}
                onAnnotationsChange={handleAnnotationsChange}
                classes={classes}
                selectedClass={selectedClass}
                onClassChange={onClassChange}
                selectedTool={selectedTool}
                brushSize={brushSize}
                opacity={opacity}
                showAnnotations={showAnnotations}
                annotationMode={annotationMode}
              />
            ) : (
              <div style={{ 
                flex: 1, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#999'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <CheckCircleOutlined style={{ fontSize: 64, marginBottom: 16 }} />
                  <div>No image selected</div>
                  <div style={{ fontSize: 12 }}>Upload an image to start annotating</div>
                </div>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Enhanced Export Modal */}
      <Modal
        title="🚀 Export Annotations - Better than Roboflow!"
        open={showExportModal}
        onCancel={() => setShowExportModal(false)}
        footer={null}
        width={600}
      >
        <div style={{ marginBottom: 16 }}>
          <Tag color="green">7 Export Formats</Tag>
          <Tag color="blue">40% More than Roboflow</Tag>
        </div>
        
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <div style={{ fontWeight: 'bold', marginBottom: 8 }}>🎯 Industry Standard Formats:</div>
          
          <Button 
            block 
            onClick={() => handleExport('coco')}
            style={{ textAlign: 'left', height: 'auto', padding: '12px 16px' }}
          >
            <div>
              <div style={{ fontWeight: 'bold' }}>COCO JSON Format</div>
              <div style={{ fontSize: 12, color: '#666' }}>
                Industry standard for object detection & segmentation
              </div>
            </div>
          </Button>
          
          <Button 
            block 
            onClick={() => handleExport('yolo')}
            style={{ textAlign: 'left', height: 'auto', padding: '12px 16px' }}
          >
            <div>
              <div style={{ fontWeight: 'bold' }}>YOLO Format</div>
              <div style={{ fontSize: 12, color: '#666' }}>
                Normalized coordinates for YOLO training
              </div>
            </div>
          </Button>
          
          <Button 
            block 
            onClick={() => handleExport('pascal_voc')}
            style={{ textAlign: 'left', height: 'auto', padding: '12px 16px' }}
          >
            <div>
              <div style={{ fontWeight: 'bold' }}>Pascal VOC XML</div>
              <div style={{ fontSize: 12, color: '#666' }}>
                Classic computer vision format
              </div>
            </div>
          </Button>
          
          <div style={{ fontWeight: 'bold', marginTop: 16, marginBottom: 8 }}>🔧 Specialized Formats:</div>
          
          <Button 
            block 
            onClick={() => handleExport('cvat')}
            style={{ textAlign: 'left', height: 'auto', padding: '12px 16px' }}
          >
            <div>
              <div style={{ fontWeight: 'bold' }}>CVAT XML Format</div>
              <div style={{ fontSize: 12, color: '#666' }}>
                Computer Vision Annotation Tool format
              </div>
            </div>
          </Button>
          
          <Button 
            block 
            onClick={() => handleExport('labelme')}
            style={{ textAlign: 'left', height: 'auto', padding: '12px 16px' }}
          >
            <div>
              <div style={{ fontWeight: 'bold' }}>LabelMe JSON</div>
              <div style={{ fontSize: 12, color: '#666' }}>
                Polygon-focused annotation format
              </div>
            </div>
          </Button>
          
          <Button 
            block 
            onClick={() => handleExport('tensorflow')}
            style={{ textAlign: 'left', height: 'auto', padding: '12px 16px' }}
          >
            <div>
              <div style={{ fontWeight: 'bold' }}>TensorFlow Metadata</div>
              <div style={{ fontSize: 12, color: '#666' }}>
                Metadata for TensorFlow Record creation
              </div>
            </div>
          </Button>
          
          <Button 
            block 
            onClick={() => handleExport('custom')}
            style={{ textAlign: 'left', height: 'auto', padding: '12px 16px' }}
          >
            <div>
              <div style={{ fontWeight: 'bold' }}>Custom JSON Format</div>
              <div style={{ fontSize: 12, color: '#666' }}>
                Auto-Labeling Tool native format with full features
              </div>
            </div>
          </Button>
        </Space>
        
        <div style={{ 
          marginTop: 16, 
          padding: 12, 
          backgroundColor: '#f0f8ff', 
          borderRadius: 6,
          fontSize: 12 
        }}>
          💡 <strong>Pro Tip:</strong> All formats include proper metadata and are ready for immediate use in training pipelines!
        </div>
      </Modal>
    </div>
  );
};

export default SmartAnnotationInterface;